import { z } from 'zod';

export const createSourceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  domain: z.string().min(3, 'Domain must be at least 3 characters').toLowerCase(),
  description: z.string().optional(),
  credibilityScore: z.number().min(0).max(100).default(50),
  status: z.enum(['VERIFIED', 'TRUSTED', 'UNKNOWN', 'SUSPICIOUS', 'UNRELIABLE']).default('UNKNOWN'),
  verificationStatus: z.string().optional(),
  reason: z.string().optional(),
});

export const updateSourceSchema = z.object({
  name: z.string().min(2).optional(),
  domain: z.string().min(3).toLowerCase().optional(),
  description: z.string().optional(),
  credibilityScore: z.number().min(0).max(100).optional(),
  status: z.enum(['VERIFIED', 'TRUSTED', 'UNKNOWN', 'SUSPICIOUS', 'UNRELIABLE']).optional(),
  verificationStatus: z.string().optional(),
  reason: z.string().optional(),
});

export const sourceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['VERIFIED', 'TRUSTED', 'UNKNOWN', 'SUSPICIOUS', 'UNRELIABLE']).optional(),
});
