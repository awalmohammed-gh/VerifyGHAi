import { z } from 'zod';

export const createReviewSchema = z.object({
  finalClassification: z.enum(['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED']),
  finalCredibilityScore: z.number().min(0).max(100, {
    message: 'Credibility score must be between 0 and 100',
  }),
  reviewReason: z.string().min(5, {
    message: 'Review reason must be at least 5 characters long',
  }),
  reviewNotes: z.string().optional(),
  reviewStatus: z.enum(['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED']).default('COMPLETED'),
});

export const updateReviewSchema = z.object({
  finalClassification: z.enum(['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED']).optional(),
  finalCredibilityScore: z.number().min(0).max(100).optional(),
  reviewReason: z.string().min(5).optional(),
  reviewNotes: z.string().optional(),
  reviewStatus: z.enum(['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED']).optional(),
  assignedReviewerId: z.string().optional(),
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  search: z.string().optional(),
});
