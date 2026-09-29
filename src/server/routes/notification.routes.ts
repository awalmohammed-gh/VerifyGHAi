import { Router, Request, Response, NextFunction } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const notificationRoutes = Router();

notificationRoutes.use((req: Request, res: Response, next: NextFunction) => authenticate(req, res, next));

notificationRoutes.get('/', (req: Request, res: Response, next: NextFunction) =>
  notificationController.getNotifications(req, res, next)
);

notificationRoutes.patch('/:id/read', (req: Request, res: Response, next: NextFunction) =>
  notificationController.markAsRead(req, res, next)
);

notificationRoutes.patch('/read-all', (req: Request, res: Response, next: NextFunction) =>
  notificationController.markAllAsRead(req, res, next)
);

notificationRoutes.patch('/mark-all-read', (req: Request, res: Response, next: NextFunction) =>
  notificationController.markAllAsRead(req, res, next)
);
