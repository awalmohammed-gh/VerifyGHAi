import { z } from 'zod';

// Registration validator - defaults to 'USER' role
export const registerSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address format')
    .max(255, 'Email is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters'),
  organization: z.string().trim().max(100).optional(),
  role_title: z.string().trim().max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(30).optional(),
});

// Standard user login validator
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Admin login validator
export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid administrative email format'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

// Profile update validator
export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .optional(),
  bio: z.string().trim().max(500, 'Bio cannot exceed 500 characters').optional(),
  organization: z.string().trim().max(100, 'Organization cannot exceed 100 characters').optional(),
  role_title: z.string().trim().max(100, 'Role title cannot exceed 100 characters').optional(),
  phone: z.string().trim().max(30, 'Phone number is too long').optional(),
  avatar_url: z.string().trim().max(2000).optional(),
});

// Change password validator
export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'New password must be at least 8 characters long')
      .max(128, 'New password must not exceed 128 characters'),
    confirm_password: z
      .string()
      .min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'New password and confirmation do not match',
    path: ['confirm_password'],
  });

// Account deletion validator
export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required to confirm account deletion'),
  confirm_phrase: z.string().optional(),
});

// Refresh token validator
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
