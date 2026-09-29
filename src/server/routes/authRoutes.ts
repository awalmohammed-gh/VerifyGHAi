import { Router, Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  registerSchema,
  loginSchema,
  adminLoginSchema,
} from '../validators/authValidators.js';
import { userStore } from '../db/userStore.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  sanitizeUser,
  getRefreshTokenCookieOptions,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_EXPIRY_SECONDS,
} from '../utils/security.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Public registration endpoint - defaults new signups to the 'USER' role
 */
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    // Check if email is already registered
    const existing = await userStore.findByEmail(validated.email);
    if (existing) {
      res.status(409).json({
        error: 'An account with this email address already exists.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
      return;
    }

    // Securely hash password with bcrypt (12 rounds)
    const password_hash = await hashPassword(validated.password);

    // Create user with forced 'USER' role for public signups
    const newUser = await userStore.create({
      full_name: validated.full_name,
      email: validated.email,
      password_hash,
      role: 'USER', // Strict default to USER
      organization: validated.organization,
      role_title: validated.role_title,
      bio: validated.bio,
      phone: validated.phone,
    });

    // Generate JWT access & refresh tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Save refresh token in user store
    await userStore.addRefreshToken(newUser.id, refreshToken);

    // Set secure HTTP-only refresh cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

    res.status(201).json({
      message: 'Account registered successfully.',
      user: sanitizeUser(newUser),
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to process user registration.' });
  }
});

/**
 * POST /api/auth/login
 * Standard user authentication endpoint
 */
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await userStore.findByEmail(validated.email);
    if (!user) {
      // Generic error message to prevent account enumeration
      res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        error: 'This account has been suspended by an administrator.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    // Compare plaintext password against bcrypt hash
    const isPasswordValid = await comparePassword(validated.password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await userStore.addRefreshToken(user.id, refreshToken);

    // Set secure HTTP-only cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      message: 'Login successful.',
      user: sanitizeUser(user),
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to process login.' });
  }
});

/**
 * POST /api/auth/admin/login
 * Dedicated administrative login endpoint
 * Strictly verifies credentials and asserts user.role === 'ADMIN'.
 * Rejects non-admin credentials with a 403 Forbidden error immediately.
 */
authRouter.post('/admin/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = adminLoginSchema.parse(req.body);

    const user = await userStore.findByEmail(validated.email);
    if (!user) {
      res.status(401).json({
        error: 'Invalid administrative credentials.',
        code: 'INVALID_ADMIN_CREDENTIALS',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        error: 'Administrative account has been suspended.',
        code: 'ADMIN_ACCOUNT_SUSPENDED',
      });
      return;
    }

    // Verify bcrypt password hash
    const isPasswordValid = await comparePassword(validated.password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        error: 'Invalid administrative credentials.',
        code: 'INVALID_ADMIN_CREDENTIALS',
      });
      return;
    }

    // STRICT CHECK: Verify that the account has role === 'ADMIN' and is dion12@gmail.com
    if (user.role !== 'ADMIN' || user.email.toLowerCase().trim() !== 'dion12@gmail.com') {
      res.status(403).json({
        error: 'Forbidden: Access denied. Administrative access is restricted to authorized personnel (dion12@gmail.com).',
        code: 'ADMIN_CLEARANCE_REQUIRED',
        userRole: user.role,
      });
      return;
    }

    // Issue tokens for validated administrator
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await userStore.addRefreshToken(user.id, refreshToken);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      message: 'Admin authentication successful.',
      user: sanitizeUser(user),
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
      return;
    }
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Failed to process administrative login.' });
  }
});

/**
 * POST /api/auth/refresh
 * Rotates refresh token and issues a new access token
 */
authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const tokenFromCookie = req.cookies ? req.cookies[REFRESH_COOKIE_NAME] : undefined;
    const tokenFromBody = req.body ? req.body.refreshToken : undefined;
    const token = tokenFromCookie || tokenFromBody;

    if (!token) {
      res.status(401).json({
        error: 'Refresh token required.',
        code: 'REFRESH_TOKEN_MISSING',
      });
      return;
    }

    const payload = verifyRefreshToken(token);
    if (!payload || !payload.userId) {
      res.status(401).json({
        error: 'Invalid or expired refresh token.',
        code: 'REFRESH_TOKEN_INVALID',
      });
      return;
    }

    const user = await userStore.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        error: 'User not found.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }

    // Verify token exists in user's active session list
    if (!user.refresh_tokens.includes(token)) {
      await userStore.clearAllRefreshTokens(user.id);
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshTokenCookieOptions());
      res.status(401).json({
        error: 'Security alert: Invalid refresh session. Please log in again.',
        code: 'TOKEN_REUSE_DETECTED',
      });
      return;
    }

    // Rotate refresh token
    await userStore.removeRefreshToken(user.id, token);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await userStore.addRefreshToken(user.id, newRefreshToken);

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshTokenCookieOptions());

    res.status(200).json({
      accessToken: newAccessToken,
      expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token.' });
  }
});

/**
 * POST /api/auth/logout
 * Clears active refresh tokens and cookie
 */
authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies ? req.cookies[REFRESH_COOKIE_NAME] : undefined;
    if (token) {
      const payload = verifyRefreshToken(token);
      if (payload?.userId) {
        await userStore.removeRefreshToken(payload.userId, token);
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to process logout.' });
  }
});

/**
 * GET /api/auth/me
 * Helper to fetch current session info
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});
