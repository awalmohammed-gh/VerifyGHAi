import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  profileImage: z.string().optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  organization: z.string().max(150).optional(),
  roleTitle: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
});
