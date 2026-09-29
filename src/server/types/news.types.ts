export type AuthenticityRating = 'VERIFIED_TRUE' | 'LIKELY_FAKE' | 'MISLEADING' | 'UNVERIFIED';

export interface NewsVerificationResult {
  authenticityRating: AuthenticityRating;
  confidenceScore: number;
  summary: string;
  credibleSources: string[];
  warning?: string | null;
  searchGroundingUsed: boolean;
  queryOrUrl: string;
  analyzedAt: string;
  metadata?: {
    modelUsed: string;
    searchQueries?: string[];
    groundingSourcesFound: number;
    confidenceThreshold: number;
    meetsThreshold: boolean;
  };
}
