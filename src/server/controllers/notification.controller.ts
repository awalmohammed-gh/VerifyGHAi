import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/response.js';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notifications = await notificationService.getUserNotifications(userId);
      return ApiResponse.success(res, 'Notifications retrieved successfully', {
        notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notificationId = req.params.id;
      await notificationService.markAsRead(notificationId, userId);
      return ApiResponse.success(res, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const count = await notificationService.markAllAsRead(userId);
      return ApiResponse.success(res, `${count} notifications marked as read`);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
