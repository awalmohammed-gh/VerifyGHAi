import { Router, Request, Response, NextFunction } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const reportRoutes = Router();

reportRoutes.use((req: Request, res: Response, next: NextFunction) => authenticate(req, res, next));

reportRoutes.get('/', (req: Request, res: Response, next: NextFunction) =>
  reportController.getUserReports(req, res, next)
);

reportRoutes.get('/:id', (req: Request, res: Response, next: NextFunction) =>
  reportController.getReportById(req, res, next)
);

reportRoutes.post('/:verificationId', (req: Request, res: Response, next: NextFunction) =>
  reportController.createReport(req, res, next)
);

reportRoutes.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  reportController.deleteReport(req, res, next)
);
