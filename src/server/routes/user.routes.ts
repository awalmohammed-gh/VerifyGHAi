import { Router, Request, Response, NextFunction } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';

export const userRoutes = Router();

userRoutes.get('/me', (req: Request, res: Response, next: NextFunction) => authenticate(req, res, next), (req: Request, res: Response, next: NextFunction) =>
  userController.getMe(req, res, next)
);

userRoutes.put(
  '/me',
  (req: Request, res: Response, next: NextFunction) => authenticate(req, res, next),
  validateBody(updateProfileSchema),
  (req: Request, res: Response, next: NextFunction) => userController.updateMe(req, res, next)
);
