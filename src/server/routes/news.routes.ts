import { Router, Request, Response, NextFunction } from 'express';
import { newsController } from '../controllers/news.controller.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { verifyNewsSchema } from '../validators/news.validator.js';

export const newsRoutes = Router();

// Capability / status check endpoint
newsRoutes.get('/status', (req: Request, res: Response) =>
  newsController.getStatus(req, res)
);

// News verification endpoint with Search Grounding: POST /api/news/verify
newsRoutes.post(
  '/verify',
  validateBody(verifyNewsSchema),
  (req: Request, res: Response, next: NextFunction) =>
    newsController.verifyNews(req, res, next)
);
