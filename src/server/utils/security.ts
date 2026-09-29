import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { JWTPayload, UserRecord, SanitizedUser } from '../types/index.js';

// Fallback secrets for local development with strong production overrides
const JWT_SECRET = process.env.JWT_SECRET || 'verifai_gh_dev_jwt_super_secret_key_2026_x92!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'verifai_gh_dev_refresh_super_secret_key_2026_y83!';

const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token lasting 7 days
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 900 seconds

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Synchronous hash generator for seed data initialization
 */
export function hashPasswordSync(plainText: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(plainText, salt);
}

/**
 * Securely compares a plaintext password against the stored bcrypt hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generates a signed JWT Access Token containing { userId, role, email }
 */
export function generateAccessToken(user: { id: string; role: 'USER' | 'ADMIN'; email: string }): string {
  const payload: JWTPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generates a signed JWT Refresh Token
 */
export function generateRefreshToken(user: { id: string; role: 'USER' | 'ADMIN'; email: string }): string {
  const payload: JWTPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verifies and decodes an access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Verifies and decodes a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Strips sensitive fields (like password_hash and refresh_tokens) from user records
 */
export function sanitizeUser(user: UserRecord): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    name: user.name || user.full_name,
    role: user.role,
    status: user.status,
    bio: user.bio,
    organization: user.organization,
    role_title: user.role_title,
    roleTitle: user.role_title,
    phone: user.phone,
    avatar_url: user.avatar_url,
    profileImage: user.avatar_url,
    created_at: user.created_at,
    createdAt: user.created_at,
    updated_at: user.updated_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Cookie options for storing the Refresh Token securely in HTTP-only cookies
 */
export const REFRESH_COOKIE_NAME = 'verifai_refresh_token';

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Inaccessible to client JS (prevents XSS theft)
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF mitigation
    path: '/api/auth', // Scoped only to auth endpoints
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
}
