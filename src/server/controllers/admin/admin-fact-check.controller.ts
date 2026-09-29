import { Request, Response, NextFunction } from 'express';
import { adminFactCheckService } from '../../services/admin/admin-fact-check.service.js';
import {
  createFactCheckSchema,
  factCheckQuerySchema,
  updateFactCheckSchema,
} from '../../validators/admin/fact-check.validator.js';

export class AdminFactCheckController {
  async listFactChecks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = factCheckQuerySchema.parse(req.query);
      const result = await adminFactCheckService.listFactChecks(options as any);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getFactCheckById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const factCheck = await adminFactCheckService.getFactCheckById(id);
      res.status(200).json({
        status: 'success',
        data: { factCheck },
      });
    } catch (err) {
      next(err);
    }
  }

  async createFactCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createFactCheckSchema.parse(req.body);
      const admin = (req as any).user;

      const factCheck = await adminFactCheckService.createFactCheck(body as any, {
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name || admin.full_name,
      });

      res.status(201).json({
        status: 'success',
        message: 'Fact-check article created and published.',
        data: { factCheck },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateFactCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateFactCheckSchema.parse(req.body);
      const admin = (req as any).user;

      const factCheck = await adminFactCheckService.updateFactCheck(id, body as any, {
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: 'Fact-check article updated successfully.',
        data: { factCheck },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteFactCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const admin = (req as any).user;

      await adminFactCheckService.deleteFactCheck(id, {
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: 'Fact-check record deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminFactCheckController = new AdminFactCheckController();
