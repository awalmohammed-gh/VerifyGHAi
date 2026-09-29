import { Router, Request, Response, NextFunction } from 'express';
import { statisticsController } from '../controllers/statistics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const statisticsRoutes = Router();

statisticsRoutes.use((req: Request, res: Response, next: NextFunction) => authenticate(req, res, next));

statisticsRoutes.get('/', (req: Request, res: Response, next: NextFunction) =>
  statisticsController.getStatistics(req, res, next)
);

statisticsRoutes.get('/statistics', (req: Request, res: Response, next: NextFunction) =>
  statisticsController.getStatistics(req, res, next)
);

statisticsRoutes.get('/stats', (req: Request, res: Response, next: NextFunction) =>
  statisticsController.getStatistics(req, res, next)
);

statisticsRoutes.get('/statistics/stream', (req: Request, res: Response) =>
  statisticsController.streamStatistics(req, res)
);

statisticsRoutes.get('/stats/stream', (req: Request, res: Response) =>
  statisticsController.streamStatistics(req, res)
);
