import rateLimit from 'express-rate-limit';
import { env } from '../config/environment.js';

/**
 * Strict rate limiter for authentication endpoints to prevent brute-force attacks.
 * Configured per 15-minute window per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Math.max(15, Math.floor(env.RATE_LIMIT / 5)), // Limit per window (default 20)
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again in 15 minutes to protect account security.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Dedicated rate limiter for verification and scanning endpoints (/api/verify, /api/verification, /api/analyze).
 * Enforces configured RATE_LIMIT (e.g. 100 requests per 15-minute window) to prevent scraping and API abuse.
 */
export const verificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.RATE_LIMIT || 100, // E.g. 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: `Too many verification requests. You have reached the limit of ${env.RATE_LIMIT || 100} requests per 15-minute window.`,
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * General API rate limiter for standard operations.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.max(150, env.RATE_LIMIT * 2),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'GENERAL_RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP address. Please slow down and try again shortly.',
    code: 'GENERAL_RATE_LIMIT_EXCEEDED',
  },
});

export const rateLimiter = generalApiLimiter;
