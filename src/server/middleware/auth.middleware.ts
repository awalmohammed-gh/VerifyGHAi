import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { UserRole } from '../types/user.types.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';
import { isDatabaseConnected } from '../config/database.js';
import { UserModel } from '../models/User.js';
import { userStore } from '../db/userStore.js';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.verifai_access_token) {
      // 2. Check HTTP-only cookie
      token = req.cookies.verifai_access_token;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication token required. Please sign in.');
    }

    // 3. Verify JWT
    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
      throw ApiError.unauthorized('Invalid or expired authentication token. Please sign in again.');
    }

    // 4. Find user in database or fallback store safely
    let user: any = null;

    if (isDatabaseConnected()) {
      try {
        let dbUser = null;
        if (mongoose.isValidObjectId(payload.userId)) {
          dbUser = await UserModel.findById(payload.userId);
        } else if (payload.email) {
          dbUser = await UserModel.findOne({ email: payload.email.trim().toLowerCase() });
        }
        if (dbUser) {
          user = dbUser.toSafeObject();
        }
      } catch (err) {
        console.warn('[Auth Middleware] Database user lookup failed, checking fallback store:', err);
      }
    }

    if (!user) {
      let storeUser = await userStore.findById(payload.userId);
      if (!storeUser && payload.email) {
        storeUser = await userStore.findByEmail(payload.email);
      }
      if (storeUser) {
        user = {
          id: storeUser.id,
          name: storeUser.full_name,
          full_name: storeUser.full_name,
          email: storeUser.email,
          role: storeUser.role,
          status: storeUser.status,
          organization: storeUser.organization,
          roleTitle: storeUser.role_title,
          role_title: storeUser.role_title,
          bio: storeUser.bio,
          phone: storeUser.phone,
          createdAt: storeUser.created_at,
          created_at: storeUser.created_at,
          updatedAt: storeUser.updated_at,
          updated_at: storeUser.updated_at,
        };
      }
    }

    if (!user) {
      throw ApiError.unauthorized('User associated with this token no longer exists.');
    }

    // 5. Check user status
    if (user.status === 'SUSPENDED') {
      throw ApiError.forbidden('Your account has been suspended. Please contact administrative support.');
    }

    // 6. Attach to request
    (req as any).user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware: attaches user if valid token exists,
 * otherwise provides a fallback guest user context without rejecting.
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.verifai_access_token) {
      token = req.cookies.verifai_access_token;
    }

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload && payload.userId) {
        let user: any = null;
        if (isDatabaseConnected()) {
          try {
            let dbUser = null;
            if (mongoose.isValidObjectId(payload.userId)) {
              dbUser = await UserModel.findById(payload.userId);
            } else if (payload.email) {
              dbUser = await UserModel.findOne({ email: payload.email.trim().toLowerCase() });
            }
            if (dbUser) user = dbUser.toSafeObject();
          } catch {
            // ignore DB lookup errors
          }
        }
        if (!user) {
          let storeUser = await userStore.findById(payload.userId);
          if (!storeUser && payload.email) {
            storeUser = await userStore.findByEmail(payload.email);
          }
          if (storeUser) {
            user = {
              id: storeUser.id,
              name: storeUser.full_name,
              full_name: storeUser.full_name,
              email: storeUser.email,
              role: storeUser.role,
              status: storeUser.status,
            };
          }
        }
        if (user) {
          (req as any).user = user;
          return next();
        }
      }
    }

    // Default guest session for unauthenticated visitors
    (req as any).user = {
      id: 'guest_user_anon',
      name: 'Guest Citizen',
      email: 'guest@verifai.gh',
      role: 'USER',
      status: 'ACTIVE',
    };
    next();
  } catch {
    (req as any).user = {
      id: 'guest_user_anon',
      name: 'Guest Citizen',
      email: 'guest@verifai.gh',
      role: 'USER',
      status: 'ACTIVE',
    };
    next();
  }
}

/**
 * Role-aware authorization middleware foundation
 */
export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(user.role)) {
      return next(
        ApiError.forbidden(
          `Access restricted. Requires one of following roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
}
