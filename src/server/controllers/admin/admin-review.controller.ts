import { Request, Response, NextFunction } from 'express';
import { adminReviewService } from '../../services/admin/admin-review.service.js';
import {
  createReviewSchema,
  reviewQuerySchema,
  updateReviewSchema,
} from '../../validators/admin/review.validator.js';

export class AdminReviewController {
  async getReviewQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = reviewQuerySchema.parse(req.query);
      const result = await adminReviewService.getReviewQueue(options as any);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getReviewById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const reviewItem = await adminReviewService.getReviewById(id);
      res.status(200).json({
        status: 'success',
        data: { item: reviewItem },
      });
    } catch (err) {
      next(err);
    }
  }

  async submitReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { verificationId } = req.params;
      const body = createReviewSchema.parse(req.body);
      const admin = (req as any).user;

      const result = await adminReviewService.submitReview(
        verificationId,
        body as any,
        {
          id: admin.id || admin._id,
          email: admin.email,
          name: admin.name || admin.full_name,
        }
      );

      res.status(200).json({
        status: 'success',
        message: 'Human review decision recorded successfully.',
        data: { verification: result },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const body = updateReviewSchema.parse(req.body);
      const admin = (req as any).user;

      const result = await adminReviewService.updateReview(
        id,
        body as any,
        {
          id: admin.id || admin._id,
          email: admin.email,
          name: admin.name || admin.full_name,
        }
      );

      res.status(200).json({
        status: 'success',
        message: 'Review update applied successfully.',
        data: { verification: result },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminReviewController = new AdminReviewController();
