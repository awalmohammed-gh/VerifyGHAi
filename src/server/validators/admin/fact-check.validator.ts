import { z } from 'zod';

export const createFactCheckSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  claim: z.string().min(5, 'Claim must be at least 5 characters'),
  classification: z.enum(['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED']),
  summary: z.string().min(10, 'Summary must be at least 10 characters'),
  evidence: z.array(z.any()).optional().default([]),
  sources: z.array(z.any()).optional().default([]),
  publishedDate: z.string().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).default('PUBLISHED'),
});

export const updateFactCheckSchema = z.object({
  title: z.string().min(5).optional(),
  claim: z.string().min(5).optional(),
  classification: z.enum(['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED']).optional(),
  summary: z.string().min(10).optional(),
  evidence: z.array(z.any()).optional(),
  sources: z.array(z.any()).optional(),
  publishedDate: z.string().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
});

export const factCheckQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  classification: z.enum(['VERIFIED', 'TRUSTED', 'SUSPICIOUS', 'FAKE', 'UNVERIFIED']).optional(),
  status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
