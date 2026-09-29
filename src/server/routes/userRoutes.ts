import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../validators/authValidators.js';
import { userStore } from '../db/userStore.js';
import {
  hashPassword,
  comparePassword,
  sanitizeUser,
  getRefreshTokenCookieOptions,
  REFRESH_COOKIE_NAME,
} from '../utils/security.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const userRouter = Router();

// Apply requireAuth to all user account routes
userRouter.use(requireAuth);

/**
 * GET /api/user/profile
 * Fetches the currently authenticated user/admin details
 */
userRouter.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await userStore.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.status(200).json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

/**
 * PUT /api/user/profile
 * Updates name, bio, organization, role_title, phone, and personal details
 */
userRouter.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validated = updateProfileSchema.parse(req.body);

    const updatedUser = await userStore.update(req.user.id, {
      full_name: validated.full_name,
      bio: validated.bio,
      organization: validated.organization,
      role_title: validated.role_title,
      phone: validated.phone,
      avatar_url: validated.avatar_url,
    });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

/**
 * PUT /api/user/change-password
 * Verifies current password before hashing and saving the new password
 */
userRouter.put('/change-password', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validated = changePasswordSchema.parse(req.body);

    const user = await userStore.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Verify current password with bcrypt
    const isCurrentPasswordCorrect = await comparePassword(
      validated.current_password,
      user.password_hash
    );

    if (!isCurrentPasswordCorrect) {
      res.status(400).json({
        error: 'Current password provided is incorrect.',
        code: 'INVALID_CURRENT_PASSWORD',
      });
      return;
    }

    // Prevent re-using identical password
    const isSamePassword = await comparePassword(validated.new_password, user.password_hash);
    if (isSamePassword) {
      res.status(400).json({
        error: 'New password cannot be identical to the current password.',
        code: 'PASSWORD_REUSE_FORBIDDEN',
      });
      return;
    }

    // Hash new password securely with bcrypt
    const new_password_hash = await hashPassword(validated.new_password);

    // Save hashed password & invalidate existing refresh tokens for security
    await userStore.update(user.id, {
      password_hash: new_password_hash,
      refresh_tokens: [],
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again on other devices.',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

/**
 * DELETE /api/user/account
 * Secure endpoint requiring password verification before permanently deleting the user's account
 */
userRouter.delete('/account', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const validated = deleteAccountSchema.parse(req.body);

    const user = await userStore.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    // Verify password before allowing permanent deletion
    const isPasswordCorrect = await comparePassword(validated.password, user.password_hash);
    if (!isPasswordCorrect) {
      res.status(400).json({
        error: 'Invalid password. Password confirmation is strictly required to delete account.',
        code: 'INVALID_PASSWORD_CONFIRMATION',
      });
      return;
    }

    // Permanently remove user record from store
    await userStore.delete(user.id);

    // Clear HTTP-only cookie
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Your account and personal data have been permanently deleted.',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});
