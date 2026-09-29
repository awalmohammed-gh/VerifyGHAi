import { Router, Request, Response, NextFunction } from 'express';
import { verificationController } from '../controllers/verification.controller.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware.js';
import { uploadScreenshot } from '../middleware/upload.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { verificationRateLimiter } from '../middleware/rateLimiter.js';
import {
  createVerificationSchema,
  verificationQuerySchema,
} from '../validators/verification.validator.js';
import { ApiResponse } from '../utils/response.js';

export const verificationRoutes = Router();

// Status check
verificationRoutes.get('/status', (_req: Request, res: Response) => {
  return ApiResponse.success(res, 'Verification service is operational', {
    service: 'VerifAI Verification Engine',
    status: 'ONLINE',
    supportedTypes: ['TEXT', 'ARTICLE_URL', 'SCREENSHOT'],
  });
});

// Dedicated article analysis route supporting multimodal text, URLs, images and PDFs
const uploadFlexible = (req: Request, res: Response, next: NextFunction) => {
  uploadScreenshot.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
    { name: 'document', maxCount: 1 },
    { name: 'screenshot', maxCount: 1 },
  ])(req, res, (err: any) => {
    if (err) return next(err);
    if (req.files) {
      const filesMap = req.files as Record<string, Express.Multer.File[]>;
      const matched =
        filesMap['image']?.[0] ||
        filesMap['file']?.[0] ||
        filesMap['document']?.[0] ||
        filesMap['screenshot']?.[0];
      if (matched) {
        req.file = matched;
      }
    }
    next();
  });
};

verificationRoutes.post(
  '/analyze',
  verificationRateLimiter,
  optionalAuthenticate,
  uploadFlexible,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.verifyContent(req, res, next)
);

// Dedicated search sources endpoint for cross-referencing
verificationRoutes.post('/search-sources', verificationRateLimiter, (req: Request, res: Response) =>
  verificationController.searchSources(req, res)
);

// Primary verification endpoints supporting multimodal text, URLs, base64 data, and images
const handleVerificationPost = [
  verificationRateLimiter,
  optionalAuthenticate,
  uploadFlexible,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.verifyContent(req, res, next),
];

verificationRoutes.post('/', ...handleVerificationPost);
verificationRoutes.post('/verify', ...handleVerificationPost);
verificationRoutes.post('/scan', ...handleVerificationPost);
verificationRoutes.post('/text', ...handleVerificationPost);
verificationRoutes.post('/url', ...handleVerificationPost);
verificationRoutes.post('/image', ...handleVerificationPost);

// Get current user's verification history (requires auth)
verificationRoutes.get(
  '/me',
  authenticate,
  validateQuery(verificationQuerySchema),
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.getUserVerifications(req, res, next)
);

// Get verification history (authenticated user's claim checks or public/guest fallback)
verificationRoutes.get(
  '/',
  optionalAuthenticate,
  validateQuery(verificationQuerySchema),
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.getUserVerifications(req, res, next)
);

// Get verification by ID (optional auth so shared results can be inspected)
verificationRoutes.get(
  '/:id',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.getVerificationById(req, res, next)
);

// Verification Result Discussion & Additional Context Comments
verificationRoutes.get(
  '/:id/comments',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.getComments(req, res, next)
);

verificationRoutes.post(
  '/:id/comments',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.addComment(req, res, next)
);

verificationRoutes.post(
  '/:id/comments/:commentId/like',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.toggleCommentLike(req, res, next)
);

verificationRoutes.post(
  '/:id/comments/:commentId/replies',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.addCommentReply(req, res, next)
);

verificationRoutes.delete(
  '/:id/comments/:commentId',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.deleteComment(req, res, next)
);

// Report Incorrect Verdict / Flag Inaccurate Assessment (supports optional auth or authenticated user)
verificationRoutes.post(
  '/:id/report-verdict',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.reportIncorrectVerdict(req, res, next)
);

verificationRoutes.post(
  '/:id/flag',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.reportIncorrectVerdict(req, res, next)
);

verificationRoutes.post(
  '/:id/dispute',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.reportIncorrectVerdict(req, res, next)
);

verificationRoutes.post(
  '/report-verdict',
  optionalAuthenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.reportIncorrectVerdict(req, res, next)
);

// Delete verification (requires auth)
verificationRoutes.delete(
  '/:id',
  authenticate,
  (req: Request, res: Response, next: NextFunction) =>
    verificationController.deleteVerification(req, res, next)
);
