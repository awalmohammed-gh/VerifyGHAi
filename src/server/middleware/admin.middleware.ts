import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware strictly guaranteeing the authenticated user possesses the ADMIN role.
 * Must be mounted after the authentication middleware.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as any).user;

  if (!user) {
    return next(ApiError.unauthorized('Authentication required to access administrative resources.'));
  }

  const isWhitelistedAdmin =
    user.role === 'ADMIN' &&
    user.email?.toLowerCase().trim() === 'dion12@gmail.com';

  if (!isWhitelistedAdmin) {
    return next(
      ApiError.forbidden(
        'Access denied. Administrative privileges are strictly restricted to authorized personnel (dion12@gmail.com).'
      )
    );
  }

  next();
}
