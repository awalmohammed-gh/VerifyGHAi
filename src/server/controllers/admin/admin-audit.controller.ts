import { Request, Response, NextFunction } from 'express';
import { adminAuditService } from '../../services/admin/admin-audit.service.js';
import { auditQuerySchema } from '../../validators/admin/alert.validator.js';

export class AdminAuditController {
  async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = auditQuerySchema.parse(req.query);
      const result = await adminAuditService.getAuditLogs(options as any);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const log = await adminAuditService.getAuditLogById(id);
      res.status(200).json({
        status: 'success',
        data: { log },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminAuditController = new AdminAuditController();
