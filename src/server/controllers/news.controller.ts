import { Request, Response, NextFunction } from 'express';
import { newsVerificationService } from '../services/news.service.js';
import { ApiResponse } from '../utils/response.js';
import { ApiError } from '../utils/apiError.js';

export class NewsController {
  /**
   * Endpoint: POST /api/news/verify
   * Accepts { queryOrUrl: string }
   * Cross-references claims/articles against reputable sources via Google Search Grounding
   */
  async verifyNews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryOrUrl =
        req.body.queryOrUrl ||
        req.body.query ||
        req.body.url ||
        req.body.content ||
        req.body.text;

      if (!queryOrUrl || typeof queryOrUrl !== 'string' || !queryOrUrl.trim()) {
        throw ApiError.badRequest(
          'Missing required field: "queryOrUrl". Please provide a news headline, claim statement, or article URL.'
        );
      }

      const result = await newsVerificationService.verifyNews(queryOrUrl.trim());

      ApiResponse.success(res, 'News verification analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint: GET /api/news/status
   */
  async getStatus(_req: Request, res: Response): Promise<void> {
    ApiResponse.success(res, 'News verification service is operational', {
      service: 'Google Gemini Search Grounding News Fact-Checker',
      status: 'ONLINE',
      supportedRatings: ['VERIFIED_TRUE', 'LIKELY_FAKE', 'MISLEADING', 'UNVERIFIED'],
      groundingEngine: 'Google Search Grounding via @google/genai',
    });
  }
}

export const newsController = new NewsController();
