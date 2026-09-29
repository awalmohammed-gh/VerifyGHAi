import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
  reason: z.string().optional(),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.preprocess((val) => (val === 'ALL' || val === '' ? undefined : val), z.enum(['ACTIVE', 'SUSPENDED']).optional()),
  role: z.preprocess((val) => (val === 'ALL' || val === '' ? undefined : val), z.enum(['USER', 'ADMIN']).optional()),
  sort: z.string().optional(),
});
