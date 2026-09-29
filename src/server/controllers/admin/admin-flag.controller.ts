import { Request, Response, NextFunction } from 'express';
import { adminFlagService } from '../../services/admin/admin-flag.service.js';
import {
  flagQuerySchema,
  updateFlagSchema,
} from '../../validators/admin/flag.validator.js';

export class AdminFlagController {
  async listFlags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = flagQuerySchema.parse(req.query);
      const result = await adminFlagService.getFlags(options as any);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getFlagById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const flag = await adminFlagService.getFlagById(id);
      res.status(200).json({
        status: 'success',
        data: { flag },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateFlagStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateFlagSchema.parse(req.body);
      const admin = (req as any).user;

      const flag = await adminFlagService.updateFlagStatus(id, {
        status: body.status,
        resolutionNotes: body.resolutionNotes,
        adminId: admin.id || admin._id,
        adminEmail: admin.email,
        adminName: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: `Content flag status updated to ${body.status}`,
        data: { flag },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminFlagController = new AdminFlagController();
