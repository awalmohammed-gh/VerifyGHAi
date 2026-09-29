import { Request, Response, NextFunction } from 'express';
import { adminDashboardService } from '../../services/admin/admin-dashboard.service.js';

export class AdminDashboardController {
  async getDashboardOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminDashboardService.getDashboardStats();
      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminDashboardController = new AdminDashboardController();
