import { Router, Request, Response, NextFunction } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { aiGenerateSchema } from '../validators/ai.validator.js';

export const aiRoutes = Router();

// Capability / status check endpoint
aiRoutes.get('/status', (req: Request, res: Response) => aiController.getStatus(req, res));

// Protected content generation endpoint
aiRoutes.post(
  '/generate',
  (req: Request, res: Response, next: NextFunction) => authenticate(req, res, next),
  validateBody(aiGenerateSchema),
  (req: Request, res: Response, next: NextFunction) => aiController.generateContent(req, res, next)
);
