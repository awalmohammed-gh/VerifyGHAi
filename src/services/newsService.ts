import { apiClient } from './api.js';

export type AuthenticityRating = 'VERIFIED_TRUE' | 'LIKELY_FAKE' | 'MISLEADING' | 'UNVERIFIED';

export interface NewsVerificationResponse {
  authenticityRating: AuthenticityRating;
  confidenceScore: number;
  summary: string;
  credibleSources: string[];
  warning?: string | null;
  searchGroundingUsed: boolean;
  queryOrUrl: string;
  analyzedAt: string;
  metadata?: {
    modelUsed?: string;
    searchQueries?: string[];
    groundingSourcesFound?: number;
    confidenceThreshold?: number;
    meetsThreshold?: boolean;
  };
}

export const newsService = {
  /**
   * Verify news authenticity via Google Gemini with Search Grounding
   * POST /api/news/verify
   */
  async verifyNews(queryOrUrl: string): Promise<NewsVerificationResponse> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: NewsVerificationResponse;
    }>('/news/verify', {
      queryOrUrl,
    });

    return response.data.data;
  },

  /**
   * Get news verification service status
   * GET /api/news/status
   */
  async getStatus(): Promise<{
    service: string;
    status: string;
    supportedRatings: string[];
    groundingEngine: string;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      data: {
        service: string;
        status: string;
        supportedRatings: string[];
        groundingEngine: string;
      };
    }>('/news/status');

    return response.data.data;
  },
};
