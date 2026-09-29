import { z } from 'zod';

export const verifyNewsSchema = z.object({
  queryOrUrl: z
    .string({
      message: 'queryOrUrl must be a valid text string',
    })
    .trim()
    .min(3, 'queryOrUrl must be at least 3 characters long')
    .max(5000, 'queryOrUrl must not exceed 5000 characters'),
});

export type VerifyNewsInput = z.infer<typeof verifyNewsSchema>;
