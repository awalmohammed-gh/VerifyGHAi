import path from 'path';
import fs from 'fs';
import { env } from '../../config/env.js';

// 1. Resolve target upload directory from validated environment
export const UPLOAD_DIR: string = env.UPLOAD_DIR
  ? path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.resolve(process.cwd(), env.UPLOAD_DIR)
  : path.join(process.cwd(), 'uploads');

// 2. Resolve maximum upload size (bytes) from validated environment
export const MAX_UPLOAD_SIZE: number = env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_MB: number = Math.round(MAX_UPLOAD_SIZE / (1024 * 1024));

// 3. Permitted MIME types and file extensions for verification workflows
export const ALLOWED_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
] as const;

export const ALLOWED_EXTENSIONS: readonly string[] = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
] as const;

export const uploadConfig = {
  UPLOAD_DIR,
  MAX_UPLOAD_SIZE,
  MAX_UPLOAD_SIZE_MB,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
};

/**
 * Ensures the target upload storage directory exists on application startup.
 * Creates nested parent directories recursively if necessary.
 */
export function ensureUploadDirExists(): string {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      console.log(`[UploadConfig] Created upload directory at: ${UPLOAD_DIR}`);
    }
    return UPLOAD_DIR;
  } catch (err: any) {
    console.error(`[UploadConfig] Warning: Failed to verify/create upload directory (${UPLOAD_DIR}):`, err?.message);
    const fallbackDir = path.join('/tmp', 'verifai-uploads');
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return fallbackDir;
    } catch {
      return UPLOAD_DIR;
    }
  }
}

export default uploadConfig;

