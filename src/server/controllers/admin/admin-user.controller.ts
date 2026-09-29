import { Request, Response, NextFunction } from 'express';
import { adminUserService } from '../../services/admin/admin-user.service.js';
import {
  adminUserQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from '../../validators/admin/user.validator.js';

export class AdminUserController {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = adminUserQuerySchema.parse(req.query);
      const result = await adminUserService.listUsers(options as any);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const details = await adminUserService.getUserDetails(id);
      res.status(200).json({
        status: 'success',
        data: details,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateUserStatusSchema.parse(req.body);
      const admin = (req as any).user;

      const updatedUser = await adminUserService.updateUserStatus(id, {
        status: body.status,
        reason: body.reason,
        adminId: admin.id || admin._id,
        adminEmail: admin.email,
        adminName: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: `User status successfully updated to ${body.status}`,
        data: { user: updatedUser },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateUserRoleSchema.parse(req.body);
      const admin = (req as any).user;

      const updatedUser = await adminUserService.updateUserRole(id, {
        role: body.role,
        reason: body.reason,
        adminId: admin.id || admin._id,
        adminEmail: admin.email,
        adminName: admin.name || admin.full_name,
      });

      res.status(200).json({
        status: 'success',
        message: `User role successfully updated to ${body.role}`,
        data: { user: updatedUser },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const admin = (req as any).user;
      const reason = req.body?.reason;

      await adminUserService.deleteUser(id, {
        adminId: admin.id || admin._id,
        adminEmail: admin.email,
        adminName: admin.name || admin.full_name,
        reason,
      });

      res.status(200).json({
        status: 'success',
        message: 'User successfully deactivated and audit record archived.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminUserController = new AdminUserController();
