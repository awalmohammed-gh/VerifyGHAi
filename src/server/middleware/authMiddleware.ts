import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, sanitizeUser } from '../utils/security.js';
import { userStore } from '../db/userStore.js';
import { SanitizedUser, UserRole } from '../types/index.js';

// Extend Express Request interface to include the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: SanitizedUser;
    }
  }
}

/**
 * requireAuth Middleware
 * 1. Extracts JWT from Authorization header (Bearer <token>) or auth cookies
 * 2. Verifies token validity and signature
 * 3. Fetches user from store and checks active status
 * 4. Attaches sanitized user to `req.user`
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized: Authentication token is required',
        code: 'AUTH_TOKEN_MISSING',
      });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      res.status(401).json({
        error: 'Unauthorized: Invalid or expired authentication token',
        code: 'AUTH_TOKEN_INVALID',
      });
      return;
    }

    const user = await userStore.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized: User account no longer exists',
        code: 'AUTH_USER_NOT_FOUND',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        error: 'Forbidden: This account has been suspended by an administrator',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    // Attach user to request
    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    console.error('requireAuth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
}

/**
 * requireAdmin Middleware
 * 1. Assumes requireAuth has already run (or runs sanity check)
 * 2. Strictly verifies that req.user.role === 'ADMIN'
 * 3. Returns immediate 403 Forbidden if not an admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized: Authentication required before admin role evaluation',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  const isWhitelistedAdmin =
    req.user.role === 'ADMIN' &&
    req.user.email?.toLowerCase().trim() === 'dion12@gmail.com';

  if (!isWhitelistedAdmin) {
    res.status(403).json({
      error: 'Forbidden: Administrative clearance restricted to authorized administrator (dion12@gmail.com).',
      code: 'ADMIN_ROLE_REQUIRED',
      requiredRole: 'ADMIN',
      userRole: req.user.role,
    });
    return;
  }

  next();
}
