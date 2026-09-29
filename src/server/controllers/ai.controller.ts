import { Request, Response, NextFunction } from 'express';
import { getGoogleGenAIClient, resolveAIModel, evaluateConfidence, isAIConfigured } from '../config/gemini.js';
import { env } from '../config/environment.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/response.js';
import { AIGenerateInput } from '../validators/ai.validator.js';

export class AIController {
  /**
   * Generates AI content with paid-tier throughput and streaming support
   * Route: POST /api/ai/generate
   */
  async generateContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: AIGenerateInput = req.body;
      const {
        prompt,
        stream = false,
        model: requestedModel,
        systemInstruction,
        temperature,
        topP,
        topK,
        fileData,
        searchGrounding = false,
      } = input;

      // 1. File size verification against MAX_UPLOAD_SIZE
      if (fileData && fileData.base64) {
        // Calculate raw byte size from Base64 string
        const byteLength = Buffer.byteLength(fileData.base64, 'base64');
        if (byteLength > env.MAX_UPLOAD_SIZE) {
          const maxMB = (env.MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(2);
          const actualMB = (byteLength / (1024 * 1024)).toFixed(2);
          throw ApiError.badRequest(
            `Uploaded file size (${actualMB} MB) exceeds the maximum allowed upload limit of ${maxMB} MB.`,
            [
              {
                field: 'fileData',
                maxAllowedBytes: env.MAX_UPLOAD_SIZE,
                actualBytes: byteLength,
              },
            ]
          );
        }
      }

      // 2. Initialize Paid-Tier Google GenAI Client
      const ai = getGoogleGenAIClient();
      const modelName = resolveAIModel(requestedModel);

      // 3. Assemble generation contents
      let contents: any;
      if (fileData && fileData.base64 && fileData.mimeType) {
        contents = {
          parts: [
            {
              inlineData: {
                data: fileData.base64,
                mimeType: fileData.mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        };
      } else {
        contents = prompt;
      }

      // 4. Assemble configuration
      const config: Record<string, any> = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (typeof temperature === 'number') {
        config.temperature = temperature;
      }
      if (typeof topP === 'number') {
        config.topP = topP;
      }
      if (typeof topK === 'number') {
        config.topK = topK;
      }

      // 5. Search Grounding tool configuration
      if (searchGrounding || env.SEARCH_API_KEY) {
        config.tools = [{ googleSearch: {} }];
      }

      // 6. Handle Streaming vs Synchronous Response
      if (stream) {
        // SSE (Server-Sent Events) setup
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        let isClientConnected = true;
        req.on('close', () => {
          isClientConnected = false;
        });

        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            ...(Object.keys(config).length > 0 ? { config } : {}),
          });

          let accumulatedText = '';

          for await (const chunk of responseStream) {
            if (!isClientConnected) break;

            const chunkText = chunk.text || '';
            accumulatedText += chunkText;

            const payload = {
              chunk: chunkText,
              done: false,
            };
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          }

          if (isClientConnected) {
            const finalPayload = {
              chunk: '',
              done: true,
              totalLength: accumulatedText.length,
              model: modelName,
            };
            res.write(`data: ${JSON.stringify(finalPayload)}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          }
        } catch (streamError: any) {
          console.error('[AIController] Streaming generation error:', streamError);
          if (isClientConnected) {
            const errorPayload = {
              error: streamError.message || 'Stream generation failed',
              done: true,
            };
            res.write(`data: ${JSON.stringify(errorPayload)}\n\n`);
            res.end();
          }
        }
        return;
      }

      // 7. Synchronous High-Throughput Request
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });

      const responseText = response.text || '';
      const candidate = response.candidates?.[0];
      const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
      const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries;

      // Extract confidence estimate or grounding corroboration
      let confidenceScore = 0.85; // Default high baseline for direct generation
      if (groundingChunks && groundingChunks.length > 0) {
        confidenceScore = Math.min(0.98, 0.75 + groundingChunks.length * 0.05);
      }

      const confidenceEvaluation = evaluateConfidence(confidenceScore);

      ApiResponse.success(res, 'AI content generated successfully', {
        text: responseText,
        model: modelName,
        finishReason: candidate?.finishReason || 'STOP',
        confidenceScore,
        confidenceEvaluation,
        searchGrounding: {
          enabled: !!(searchGrounding || env.SEARCH_API_KEY),
          sources: groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title || 'Web Source',
            uri: chunk.web?.uri || '',
          })) || [],
          searchQueries: webSearchQueries || [],
        },
        usageMetadata: response.usageMetadata || null,
      });
      return;
    } catch (error: any) {
      console.error('[AIController] Generation error:', error);

      // Handle specific Google GenAI error patterns
      const errorMessage = error?.message || '';
      if (
        errorMessage.includes('API_KEY_INVALID') ||
        errorMessage.includes('API key not valid') ||
        errorMessage.includes('UNAUTHENTICATED')
      ) {
        return next(
          ApiError.unauthorized('Invalid Google Gemini API key. Please check your AI_API_KEY configuration.')
        );
      }

      if (
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('Quota exceeded') ||
        errorMessage.includes('rate limit')
      ) {
        return next(
          ApiError.tooManyRequests(
            'Google Gemini API rate limit or quota exceeded. Please try again shortly.'
          )
        );
      }

      if (errorMessage.includes('not found') || errorMessage.includes('is not supported')) {
        return next(
          ApiError.badRequest(
            `Requested model is unsupported or not accessible with current credentials: ${errorMessage}`
          )
        );
      }

      return next(error);
    }
  }

  /**
   * Health and capability status endpoint
   * Route: GET /api/ai/status
   */
  async getStatus(_req: Request, res: Response): Promise<Response> {
    const configured = isAIConfigured();
    const model = env.AI_MODEL;
    const maxUploadMB = (env.MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(2);

    return ApiResponse.success(res, 'AI Service status retrieved', {
      configured,
      model,
      apiEndpoint: env.AI_API_URL,
      confidenceThreshold: env.AI_CONFIDENCE_THRESHOLD,
      maxUploadSizeBytes: env.MAX_UPLOAD_SIZE,
      maxUploadSizeMB: `${maxUploadMB} MB`,
      searchGroundingAvailable: !!(env.SEARCH_API_KEY || configured),
      tier: 'Paid Tier Enabled (High Concurrency & Throughput)',
    });
  }
}

export const aiController = new AIController();
