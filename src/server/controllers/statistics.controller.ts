import { Request, Response, NextFunction } from 'express';
import { statisticsService } from '../services/statistics.service.js';
import { statsEventBus } from '../services/verificationStats.service.js';
import { ApiResponse } from '../utils/response.js';

export class StatisticsController {
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const timeframe = (req.query.timeframe as string) || '30d';
      const statistics = await statisticsService.getUserStatistics(userId, timeframe);
      return ApiResponse.success(res, 'User verification statistics retrieved successfully', {
        statistics,
        ...statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  async streamStatistics(req: Request, res: Response) {
    const userId = (req as any).user?.id || (req as any).user?._id;
    const timeframe = (req.query.timeframe as string) || '30d';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const pushStats = async () => {
      try {
        const stats = await statisticsService.getUserStatistics(userId, timeframe);
        res.write(`data: ${JSON.stringify(stats)}\n\n`);
      } catch (err) {
        console.warn('[StatisticsController] SSE push failed:', err);
      }
    };

    // Initial push
    await pushStats();

    // Event-driven reactive push
    const onStatsUpdate = (_meta: any) => {
      pushStats();
    };
    statsEventBus.on('stats:updated', onStatsUpdate);

    // Fallback heartbeat interval
    const interval = setInterval(pushStats, 10000);

    req.on('close', () => {
      statsEventBus.off('stats:updated', onStatsUpdate);
      clearInterval(interval);
      res.end();
    });
  }
}

export const statisticsController = new StatisticsController();
