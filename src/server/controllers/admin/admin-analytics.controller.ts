import { Request, Response, NextFunction } from 'express';
import { adminAnalyticsService } from '../../services/admin/admin-analytics.service.js';

export class AdminAnalyticsController {
  async getPlatformAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeframe = (req.query.timeframe as string) || '30d';
      const analytics = await adminAnalyticsService.getPlatformAnalytics(timeframe);
      res.status(200).json({
        status: 'success',
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAIPerformanceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const timeframe = (req.query.timeframe as string) || '30d';
      const analytics = await adminAnalyticsService.getAIPerformanceAnalytics(timeframe);
      res.status(200).json({
        status: 'success',
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Real-time Server-Sent Events (SSE) stream for live analytics updates
   */
  async streamPlatformAnalytics(req: Request, res: Response): Promise<void> {
    const timeframe = (req.query.timeframe as string) || '30d';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Initial push
    try {
      const initialData = await adminAnalyticsService.getPlatformAnalytics(timeframe);
      res.write(`data: ${JSON.stringify(initialData)}\n\n`);
    } catch (err) {
      console.warn('[AdminAnalyticsController] Initial SSE push failed:', err);
    }

    // Periodic push every 8 seconds for live dashboard updates
    const interval = setInterval(async () => {
      try {
        const data = await adminAnalyticsService.getPlatformAnalytics(timeframe);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.warn('[AdminAnalyticsController] SSE interval push failed:', err);
      }
    }, 8000);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  }
}

export const adminAnalyticsController = new AdminAnalyticsController();
