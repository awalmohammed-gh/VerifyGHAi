import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  adminRegisterSchema,
  changePasswordSchema,
} from '../validators/auth.validator.js';
import { updateProfileSchema } from '../validators/user.validator.js';

export const authRoutes = Router();

// 1. Admin Registration: POST /api/auth/admin/register
authRoutes.post(
  '/admin/register',
  authRateLimiter,
  validateBody(adminRegisterSchema),
  (req: Request, res: Response, next: NextFunction) => authController.registerAdmin(req, res, next)
);
authRoutes.post(
  '/admin-register',
  authRateLimiter,
  validateBody(adminRegisterSchema),
  (req: Request, res: Response, next: NextFunction) => authController.registerAdmin(req, res, next)
);

// 2. Admin Login: POST /api/auth/admin/login
authRoutes.post(
  '/admin/login',
  authRateLimiter,
  validateBody(loginSchema),
  (req: Request, res: Response, next: NextFunction) => authController.adminLogin(req, res, next)
);
authRoutes.post(
  '/admin-login',
  authRateLimiter,
  validateBody(loginSchema),
  (req: Request, res: Response, next: NextFunction) => authController.adminLogin(req, res, next)
);

// 3. User Registration: POST /api/auth/register
authRoutes.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  (req: Request, res: Response, next: NextFunction) => authController.register(req, res, next)
);

// 4. User / General Login: POST /api/auth/login
authRoutes.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next)
);

authRoutes.post('/logout', (req: Request, res: Response, next: NextFunction) =>
  authController.logout(req, res, next)
);

authRoutes.get(
  '/me',
  (req: Request, res: Response, next: NextFunction) => authenticate(req, res, next),
  (req: Request, res: Response, next: NextFunction) => authController.getMe(req, res, next)
);

authRoutes.put(
  '/profile',
  (req: Request, res: Response, next: NextFunction) => authenticate(req, res, next),
  validateBody(updateProfileSchema),
  (req: Request, res: Response, next: NextFunction) => authController.updateProfile(req, res, next)
);

authRoutes.put(
  '/change-password',
  (req: Request, res: Response, next: NextFunction) => authenticate(req, res, next),
  validateBody(changePasswordSchema),
  (req: Request, res: Response, next: NextFunction) => authController.changePassword(req, res, next)
);
