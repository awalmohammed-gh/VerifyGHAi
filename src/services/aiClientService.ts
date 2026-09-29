import { apiClient } from './api.js';

export interface AIGenerateRequestOptions {
  prompt: string;
  stream?: boolean;
  model?: string;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  fileData?: {
    mimeType: string;
    base64: string;
  };
  searchGrounding?: boolean;
}

export interface AIGenerateResponseData {
  text: string;
  model: string;
  finishReason: string;
  confidenceScore: number;
  confidenceEvaluation: {
    meetsThreshold: boolean;
    threshold: number;
    warning?: string;
  };
  searchGrounding?: {
    enabled: boolean;
    sources: Array<{ title: string; uri: string }>;
    searchQueries: string[];
  };
  usageMetadata?: any;
}

export interface AIStatusResponseData {
  configured: boolean;
  model: string;
  apiEndpoint: string;
  confidenceThreshold: number;
  maxUploadSizeBytes: number;
  maxUploadSizeMB: string;
  searchGroundingAvailable: boolean;
  tier: string;
}

export const aiClientService = {
  /**
   * Performs synchronous AI generation via POST /api/ai/generate
   */
  async generateContent(options: AIGenerateRequestOptions): Promise<AIGenerateResponseData> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: AIGenerateResponseData;
    }>('/ai/generate', {
      ...options,
      stream: false,
    });

    return response.data.data;
  },

  /**
   * Fetches AI service status and configured model
   */
  async getStatus(): Promise<AIStatusResponseData> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: AIStatusResponseData;
    }>('/ai/status');

    return response.data.data;
  },

  /**
   * Performs streaming AI generation via Server-Sent Events (SSE)
   */
  async streamContent(
    options: AIGenerateRequestOptions,
    callbacks: {
      onChunk: (chunk: string, accumulatedText: string) => void;
      onComplete: (totalText: string) => void;
      onError: (error: Error) => void;
    }
  ): Promise<() => void> {
    const token = localStorage.getItem('verifai_auth_token');
    const controller = new AbortController();

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...options,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const jsonErr = await response.json();
          if (jsonErr.message) errMessage = jsonErr.message;
        } catch {
          // ignore non-json error
        }
        throw new Error(errMessage);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser/environment.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      const readLoop = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataContent = trimmed.replace('data: ', '').trim();
                if (dataContent === '[DONE]') {
                  callbacks.onComplete(accumulatedText);
                  return;
                }

                try {
                  const parsed = JSON.parse(dataContent);
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                  if (parsed.chunk) {
                    accumulatedText += parsed.chunk;
                    callbacks.onChunk(parsed.chunk, accumulatedText);
                  }
                  if (parsed.done) {
                    callbacks.onComplete(accumulatedText);
                    return;
                  }
                } catch (e: any) {
                  // If JSON parse fails or custom error thrown
                  if (e.message && !e.message.includes('JSON')) {
                    throw e;
                  }
                }
              }
            }
          }

          callbacks.onComplete(accumulatedText);
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            callbacks.onError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      };

      readLoop();
    } catch (err: any) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }

    return () => {
      controller.abort();
    };
  },
};
