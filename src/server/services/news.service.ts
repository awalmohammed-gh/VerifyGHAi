import { getGoogleGenAIClient, resolveAIModel, isAIConfigured, evaluateConfidence } from '../config/gemini.js';
import { env } from '../config/environment.js';
import { AuthenticityRating, NewsVerificationResult } from '../types/news.types.js';
import { searchService } from './search.service.js';

export class NewsVerificationService {
  /**
   * Verifies news claims or article URLs using Google Gemini with Search Grounding
   */
  async verifyNews(queryOrUrl: string): Promise<NewsVerificationResult> {
    const cleanedInput = queryOrUrl.trim();
    const startTime = new Date().toISOString();

    if (!cleanedInput) {
      return {
        authenticityRating: 'UNVERIFIED',
        confidenceScore: 0.0,
        summary: 'No claim or URL was provided for verification.',
        credibleSources: [],
        warning: 'Please provide a valid news headline, factual statement, or article URL.',
        searchGroundingUsed: false,
        queryOrUrl: '',
        analyzedAt: startTime,
      };
    }

    // If Gemini AI is configured, execute Search Grounding via @google/genai
    if (isAIConfigured()) {
      try {
        const client = getGoogleGenAIClient();

        const prompt = `You are an expert investigative fact-checker and senior news integrity analyst.
Your task is to verify the following news claim or article URL in real time using Google Search Grounding:

Claim / URL:
"${cleanedInput}"

Instructions:
1. Cross-reference the claim or article URL against reputable, global news outlets and recognized fact-checking organizations (e.g., Reuters, AP News, BBC, AFP, Snopes, FactCheck.org, PolitiFact, Ghana News Agency, Dubawa, GhanaFact, etc.).
2. Determine the authenticity rating strictly as one of:
   - "VERIFIED_TRUE": If the claim is explicitly corroborated by primary authoritative sources, reputable global news agencies, or confirmed official press releases.
   - "LIKELY_FAKE": If reputable fact-checkers, credible news agencies, or official authorities have explicitly debunked, refuted, or proved this claim false/fabricated.
   - "MISLEADING": If the claim contains partial truths mixed with false context, altered headlines, manipulated dates, or out-of-context quotes.
   - "UNVERIFIED": If there is NO credible coverage found, unconfirmed rumors, or insufficient verifiable data in public records. Do NOT hallucinate facts or assume it is true without verified coverage.
3. Compute a confidenceScore between 0.0 and 1.0 reflecting how confident the assessment is based strictly on search findings and source reputability.
4. Provide a concise 2-3 sentence verdict summary explaining why the news is real, fake, misleading, or unverified.
5. Provide credibleSources: an array of verified news and fact-checking source URLs found during search grounding that directly support this verdict.

Return ONLY a JSON object in this exact schema:
{
  "authenticityRating": "VERIFIED_TRUE" | "LIKELY_FAKE" | "MISLEADING" | "UNVERIFIED",
  "confidenceScore": number,
  "summary": "2-3 concise sentences explaining the verdict.",
  "credibleSources": ["https://..."]
}`;

        // Model priority: Default to gemini-3.7-flash, with automatic fallback if unavailable
        const candidateModels = [
          resolveAIModel('gemini-3.7-flash'),
          'gemini-3.7-flash',
          'gemini-3.1-flash-lite',
          'gemini-flash-latest',
        ];

        // Deduplicate models
        const uniqueModels = Array.from(new Set(candidateModels));
        let response: any = null;
        let selectedModel = uniqueModels[0];
        let lastError: Error | null = null;

        for (const modelName of uniqueModels) {
          try {
            response = await client.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                tools: [{ googleSearch: {} }],
              },
            });
            selectedModel = modelName;
            if (response && response.text) {
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[NewsVerificationService] Model ${modelName} with search failed, attempting without tools:`, modelErr.message);
            try {
              response = await client.models.generateContent({
                model: modelName,
                contents: prompt,
              });
              selectedModel = modelName;
              if (response && response.text) {
                break;
              }
            } catch (innerModelErr: any) {
              lastError = innerModelErr;
            }
          }
        }

        if (response && response.text) {
          const rawText = response.text.trim();
          const candidate = response.candidates?.[0];
          const groundingMetadata = candidate?.groundingMetadata;

          // Parse JSON output from Gemini
          const parsed = this.extractJson(rawText);

          // Extract URLs from Google Search Grounding metadata
          const groundingUrls: string[] = [];
          if (Array.isArray(groundingMetadata?.groundingChunks)) {
            for (const chunk of groundingMetadata.groundingChunks) {
              if (chunk.web?.uri && typeof chunk.web.uri === 'string') {
                groundingUrls.push(chunk.web.uri);
              }
            }
          }

          // Combine model-reported sources and grounding metadata URLs
          const reportedSources: string[] = Array.isArray(parsed?.credibleSources)
            ? parsed.credibleSources.filter((s: any) => typeof s === 'string' && s.startsWith('http'))
            : [];

          // Also scan rawText for any URLs if needed
          const textUrls = this.extractUrlsFromText(rawText);

          const allSources = Array.from(
            new Set([...reportedSources, ...groundingUrls, ...textUrls])
          );

          // Normalize authenticity rating
          let rating: AuthenticityRating = this.normalizeRating(parsed?.authenticityRating);

          // Parse and normalize confidence score
          let confidence = typeof parsed?.confidenceScore === 'number'
            ? Math.min(1.0, Math.max(0.0, parsed.confidenceScore))
            : (allSources.length > 0 ? 0.85 : 0.4);

          let summary = parsed?.summary?.trim() || '';

          // If no coverage found or model states unverified
          let warning: string | null = null;
          if (allSources.length === 0 && rating !== 'VERIFIED_TRUE' && rating !== 'LIKELY_FAKE') {
            rating = 'UNVERIFIED';
            warning = 'No matching or corroborating coverage was found across reputable fact-checking or news organizations. Proceed with caution.';
            if (!summary) {
              summary = 'No verified reporting or official records could be found regarding this claim across global and regional news outlets.';
            }
          }

          const thresholdEval = evaluateConfidence(confidence);
          if (!thresholdEval.meetsThreshold && !warning) {
            warning = thresholdEval.warning || `Confidence score (${(confidence * 100).toFixed(0)}%) is below the required verification threshold.`;
          }

          return {
            authenticityRating: rating,
            confidenceScore: Math.round(confidence * 100) / 100,
            summary: summary || `Analysis completed for: "${cleanedInput.substring(0, 100)}"`,
            credibleSources: allSources,
            warning: warning || null,
            searchGroundingUsed: true,
            queryOrUrl: cleanedInput,
            analyzedAt: new Date().toISOString(),
            metadata: {
              modelUsed: selectedModel,
              searchQueries: groundingMetadata?.webSearchQueries || [],
              groundingSourcesFound: allSources.length,
              confidenceThreshold: env.AI_CONFIDENCE_THRESHOLD,
              meetsThreshold: thresholdEval.meetsThreshold,
            },
          };
        }

        if (lastError) {
          console.warn('[NewsVerificationService] Search Grounding exhausted models, falling back:', lastError.message);
        }
      } catch (err: any) {
        console.error('[NewsVerificationService] Gemini Search Grounding error:', err);
      }
    }

    // Contextual Fallback if Gemini or Search Grounding is unavailable
    return this.fallbackVerification(cleanedInput, startTime);
  }

  /**
   * Fallback verification when external AI grounding is unavailable or returns no coverage
   */
  private async fallbackVerification(queryOrUrl: string, startTime: string): Promise<NewsVerificationResult> {
    try {
      const searchResults = await searchService.getSearchResults(queryOrUrl);
      const credibleSources = searchResults.map((r) => r.url).filter(Boolean);

      if (credibleSources.length === 0) {
        return {
          authenticityRating: 'UNVERIFIED',
          confidenceScore: 0.3,
          summary: `No matching coverage found across verified journalism and fact-checking records for "${queryOrUrl.substring(0, 80)}".`,
          credibleSources: [],
          warning: 'No matching or corroborating coverage was found across reputable fact-checking or news organizations. Proceed with caution.',
          searchGroundingUsed: false,
          queryOrUrl,
          analyzedAt: startTime,
          metadata: {
            modelUsed: 'rule-based-fallback',
            groundingSourcesFound: 0,
            confidenceThreshold: env.AI_CONFIDENCE_THRESHOLD,
            meetsThreshold: false,
          },
        };
      }

      return {
        authenticityRating: 'UNVERIFIED',
        confidenceScore: 0.5,
        summary: `Retrieved ${credibleSources.length} contextual news archive reference(s). Insufficient real-time verification data to confirm or refute conclusively.`,
        credibleSources,
        warning: 'Verification based on contextual news archive retrieval. Primary source corroboration advised.',
        searchGroundingUsed: false,
        queryOrUrl,
        analyzedAt: startTime,
        metadata: {
          modelUsed: 'contextual-archive-fallback',
          groundingSourcesFound: credibleSources.length,
          confidenceThreshold: env.AI_CONFIDENCE_THRESHOLD,
          meetsThreshold: false,
        },
      };
    } catch (err) {
      return {
        authenticityRating: 'UNVERIFIED',
        confidenceScore: 0.2,
        summary: 'Unable to cross-reference news claims against external registries at this time.',
        credibleSources: [],
        warning: 'No matching or corroborating coverage was found across reputable fact-checking or news organizations. Proceed with caution.',
        searchGroundingUsed: false,
        queryOrUrl,
        analyzedAt: startTime,
      };
    }
  }

  private normalizeRating(val: string | undefined): AuthenticityRating {
    if (!val) return 'UNVERIFIED';
    const upper = val.toUpperCase().trim().replace(/[\s-]/g, '_');

    if (upper === 'VERIFIED_TRUE' || upper === 'TRUE' || upper === 'REAL' || upper === 'VERIFIED' || upper === 'AUTHENTIC') {
      return 'VERIFIED_TRUE';
    }
    if (upper === 'LIKELY_FAKE' || upper === 'FAKE' || upper === 'FALSE' || upper === 'FABRICATED' || upper === 'HOAX') {
      return 'LIKELY_FAKE';
    }
    if (upper === 'MISLEADING' || upper === 'SUSPICIOUS' || upper === 'PARTIALLY_TRUE' || upper === 'OUT_OF_CONTEXT') {
      return 'MISLEADING';
    }
    return 'UNVERIFIED';
  }

  private extractJson(text: string): any {
    try {
      // 1. Direct parse
      return JSON.parse(text);
    } catch {
      // 2. Parse markdown code fence ```json ... ```
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match && match[1]) {
        try {
          return JSON.parse(match[1].trim());
        } catch {
          // ignore
        }
      }

      // 3. Find bracketed JSON block { ... }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        } catch {
          // ignore
        }
      }
    }
    return null;
  }

  private extractUrlsFromText(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s"',;)\]>]+/gi;
    const matches = text.match(urlRegex) || [];
    return matches.filter((u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    });
  }
}

export const newsVerificationService = new NewsVerificationService();
export const newsService = newsVerificationService;
