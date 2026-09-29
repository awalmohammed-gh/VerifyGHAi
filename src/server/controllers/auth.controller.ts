import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { ApiResponse } from '../utils/response.js';
import { getRefreshTokenCookieOptions, REFRESH_COOKIE_NAME } from '../utils/jwt.js';

export class AuthController {
  /**
   * Admin Registration Endpoint: POST /api/auth/admin/register
   * Requires valid adminSecretKey
   */
  async registerAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.registerAdmin({
        name: req.body.name || req.body.fullName,
        email: req.body.email,
        password: req.body.password,
        adminSecretKey: req.body.adminSecretKey || req.body.setupKey || req.body.secretKey,
        organization: req.body.organization,
        roleTitle: req.body.roleTitle,
        phone: req.body.phone,
      });

      // Set HTTP-only cookie for refresh token
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

      return ApiResponse.created(res, 'Administrator account successfully initialized and saved to database', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin Login Endpoint: POST /api/admin/login or /api/auth/admin/login
   */
  async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);

      if (user.role !== 'ADMIN' || user.email.toLowerCase().trim() !== 'dion12@gmail.com') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Administrative credentials required for this portal.',
          message: 'Access restricted to authorized administrator (dion12@gmail.com) only.',
        });
      }

      // Set secure HTTP-only refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

      return ApiResponse.success(res, 'Administrator successfully authenticated', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);

      // Set HTTP-only cookie for refresh token
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

      return ApiResponse.created(res, 'User account successfully registered', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);

      // Set secure HTTP-only refresh cookie
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

      return ApiResponse.success(res, 'User successfully authenticated', {
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      res.clearCookie('verifai_access_token', { path: '/' });

      return ApiResponse.success(res, 'User successfully logged out');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await userService.getProfile(userId);
      return ApiResponse.success(res, 'Current user profile retrieved', { user });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await userService.updateProfile(userId, req.body);
      return ApiResponse.success(res, 'Profile updated successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      await authService.changePassword(userId, req.body);
      return ApiResponse.success(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
