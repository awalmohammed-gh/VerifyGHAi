import jwt from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/environment.js';

export interface JwtTokenPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
  email: string;
}

export const REFRESH_COOKIE_NAME = 'verifai_refresh_token';

export function generateAccessToken(payload: JwtTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function generateRefreshToken(payload: JwtTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): JwtTokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtTokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtTokenPayload;
  } catch {
    return null;
  }
}

export function getRefreshTokenCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
}
