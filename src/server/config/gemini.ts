import { GoogleGenAI } from '@google/genai';
import { env } from './environment.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Global singleton reference for Google GenAI client
 * Initialized with Paid-Tier throughput optimization
 */
let globalGenAIClient: GoogleGenAI | null = null;

/**
 * Lazily retrieves or initializes the Google GenAI SDK client
 * Uses process.env.AI_API_KEY (with fallback to GEMINI_API_KEY)
 */
export function getGoogleGenAIClient(): GoogleGenAI {
  const apiKey = env.AI_API_KEY || env.GEMINI_API_KEY;

  if (!apiKey) {
    throw ApiError.internal(
      'AI_API_KEY is not configured on the server. Please set AI_API_KEY in your environment configuration.'
    );
  }

  if (!globalGenAIClient) {
    globalGenAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return globalGenAIClient;
}

/**
 * Validates if the AI service has a configured API key
 */
export function isAIConfigured(): boolean {
  return !!(env.AI_API_KEY || env.GEMINI_API_KEY);
}

/**
 * Resolves the target AI model according to configuration and paid tier specifications
 */
export function resolveAIModel(requestedModel?: string): string {
  let modelCandidate = (requestedModel && requestedModel.trim()) || env.AI_MODEL || 'gemini-3.7-flash';
  // Map any legacy or deprecated 2.5/2.0/1.5 models to gemini-3.7-flash
  if (
    modelCandidate.includes('2.5') ||
    modelCandidate.includes('2.0') ||
    modelCandidate.includes('1.5') ||
    modelCandidate.includes('3.6')
  ) {
    modelCandidate = 'gemini-3.7-flash';
  }
  return modelCandidate;
}

/**
 * Checks if output meets the configured confidence threshold
 */
export function evaluateConfidence(
  confidenceScore: number
): { meetsThreshold: boolean; threshold: number; warning?: string } {
  const threshold = env.AI_CONFIDENCE_THRESHOLD;
  const meetsThreshold = confidenceScore >= threshold;

  return {
    meetsThreshold,
    threshold,
    warning: meetsThreshold
      ? undefined
      : `AI confidence score (${(confidenceScore * 100).toFixed(1)}%) is below the configured threshold of ${(threshold * 100).toFixed(1)}%. Output may require human verification.`,
  };
}
