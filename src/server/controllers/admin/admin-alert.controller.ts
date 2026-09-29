import { Request, Response, NextFunction } from 'express';
import { adminAlertService } from '../../services/admin/admin-alert.service.js';
import {
  alertQuerySchema,
  updateAlertSchema,
} from '../../validators/admin/alert.validator.js';

export class AdminAlertController {
  async listAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = alertQuerySchema.parse(req.query);
      const result = await adminAlertService.getAlerts(options as any);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAlertById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const alert = await adminAlertService.getAlertById(id);
      res.status(200).json({
        status: 'success',
        data: { alert },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateAlertStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateAlertSchema.parse(req.body);
      const admin = (req as any).user;

      const alert = await adminAlertService.updateAlertStatus(id, {
        status: body.status,
        resolutionNotes: body.resolutionNotes,
        adminId: admin.id || admin._id,
        adminEmail: admin.email,
        adminName: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: `Alert status updated to ${body.status}`,
        data: { alert },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminAlertController = new AdminAlertController();
