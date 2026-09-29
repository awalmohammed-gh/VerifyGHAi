import { z } from 'zod';

export const updateFlagSchema = z.object({
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED']),
  resolutionNotes: z.string().optional(),
});

export const flagQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED']).optional(),
  reason: z.enum([
    'INCORRECT_RESULT',
    'MISLEADING_INFORMATION',
    'INSUFFICIENT_EVIDENCE',
    'WRONG_SOURCE',
    'OTHER',
  ]).optional(),
  verificationId: z.string().optional(),
  search: z.string().optional(),
});
