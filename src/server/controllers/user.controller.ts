import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/response.js';

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await userService.getProfile(userId);
      return ApiResponse.success(res, 'User profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await userService.updateProfile(userId, req.body);
      return ApiResponse.success(res, 'User profile updated successfully', { user });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
