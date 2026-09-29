import { Request, Response, NextFunction } from 'express';
import { adminSourceService } from '../../services/admin/admin-source.service.js';
import {
  createSourceSchema,
  sourceQuerySchema,
  updateSourceSchema,
} from '../../validators/admin/source.validator.js';

export class AdminSourceController {
  async listSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = sourceQuerySchema.parse(req.query);
      const result = await adminSourceService.listSources(options as any);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSourceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const source = await adminSourceService.getSourceById(id);
      res.status(200).json({
        status: 'success',
        data: { source },
      });
    } catch (err) {
      next(err);
    }
  }

  async createSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = createSourceSchema.parse(req.body);
      const admin = (req as any).user;

      const source = await adminSourceService.createSource(body as any, {
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name || admin.full_name,
      });

      res.status(201).json({
        status: 'success',
        message: 'Source registry entry created successfully.',
        data: { source },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateSourceSchema.parse(req.body);
      const admin = (req as any).user;

      const source = await adminSourceService.updateSource(id, body as any, {
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: 'Source registry entry updated successfully.',
        data: { source },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteSource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const admin = (req as any).user;

      await adminSourceService.deleteSource(id, {
        id: admin.id || admin._id,
        email: admin.email,
        name: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: 'Source registry entry removed successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminSourceController = new AdminSourceController();
