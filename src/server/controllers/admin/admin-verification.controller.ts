import { Request, Response, NextFunction } from 'express';
import { adminVerificationService } from '../../services/admin/admin-verification.service.js';

export class AdminVerificationController {
  async listVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        classification,
        type,
        confidence,
        search,
        from,
        to,
      } = req.query;

      const result = await adminVerificationService.listVerifications({
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        status: status as any,
        classification: classification as any,
        type: type as any,
        confidence: confidence as any,
        search: search as string,
        from: from as string,
        to: to as string,
      });

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getVerificationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const verification = await adminVerificationService.getVerificationById(id);
      res.status(200).json({
        status: 'success',
        data: { verification },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const admin = (req as any).user;
      const reason = req.body?.reason;

      await adminVerificationService.deleteVerification(id, {
        adminId: admin.id || admin._id,
        adminEmail: admin.email,
        adminName: admin.name || admin.full_name,
        reason,
      });

      res.status(200).json({
        status: 'success',
        message: 'Verification record successfully purged and logged.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminVerificationController = new AdminVerificationController();
