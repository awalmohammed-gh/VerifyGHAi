import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// 1. Initialize dotenv configuration
dotenv.config();

// 2. Preprocess and clean environment variables (strip spurious key= prefixes or trailing spaces)
function preprocessEnv(rawEnv: NodeJS.ProcessEnv): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawEnv)) {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      const match = trimmed.match(/^[A-Za-z0-9_]+=(.*)$/);
      cleaned[key] = match && match[1] ? match[1].trim() : trimmed;
    } else {
      cleaned[key] = val;
    }
  }

  // Cross-reference AI keys if one is set but not the other
  if (!cleaned.AI_API_KEY && cleaned.GEMINI_API_KEY) {
    cleaned.AI_API_KEY = cleaned.GEMINI_API_KEY;
  }
  if (!cleaned.GEMINI_API_KEY && cleaned.AI_API_KEY) {
    cleaned.GEMINI_API_KEY = cleaned.AI_API_KEY;
  }

  // Cross-reference Search API keys and engine IDs
  const searchKey = cleaned.SEARCH_API_KEY || cleaned.GOOGLE_CUSTOM_SEARCH_API_KEY || cleaned.GOOGLE_SEARCH_API_KEY;
  if (searchKey) {
    cleaned.SEARCH_API_KEY = searchKey;
    cleaned.GOOGLE_CUSTOM_SEARCH_API_KEY = searchKey;
    cleaned.GOOGLE_SEARCH_API_KEY = searchKey;
  }

  const engineId = cleaned.SEARCH_ENGINE_ID || cleaned.GOOGLE_SEARCH_ENGINE_ID || cleaned.GOOGLE_CSE_ID;
  if (engineId) {
    cleaned.SEARCH_ENGINE_ID = engineId;
    cleaned.GOOGLE_SEARCH_ENGINE_ID = engineId;
  }

  return cleaned;
}

const cleanedEnv = preprocessEnv(process.env);

// 3. Define strict Zod validation schema for VerifAI GH
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  APP_URL: z.string().default('http://localhost:3000'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/verifai_db'),
  JWT_SECRET: z.string().default('c8f5e1b9a2d4763e0fa8c3d1b7e49265f01a3b8c7d6e5f4a9b2c1d0e8f7a6b5c'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('7a9b2c1d0e8f7a6b5cc8f5e1b9a2d4763e0fa8c3d1b7e49265f01a3b8c7d6e5f'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE: z.coerce.number().default(10485760), // 10MB in bytes
  ADMIN_SETUP_KEY: z
    .string()
    .min(8, 'ADMIN_SETUP_KEY must be at least 8 characters long')
    .default('dion0244'),
  RATE_LIMIT: z.coerce.number().default(100),
  AI_API_KEY: z
    .string()
    .default(cleanedEnv.AI_API_KEY || cleanedEnv.GEMINI_API_KEY || 'unconfigured_key'),
  GEMINI_API_KEY: z
    .string()
    .default(cleanedEnv.GEMINI_API_KEY || cleanedEnv.AI_API_KEY || 'unconfigured_key'),
  AI_API_URL: z.string().default('https://generativelanguage.googleapis.com'),
  AI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.70),
  GOOGLE_CUSTOM_SEARCH_API_KEY: z.string().default(''),
  GOOGLE_SEARCH_API_KEY: z.string().default(''),
  GOOGLE_SEARCH_ENGINE_ID: z.string().default(''),
  SEARCH_API_KEY: z.string().default(''),
  SEARCH_ENGINE_ID: z.string().default(''),
  SEARCH_API_URL: z.string().default('https://www.googleapis.com/customsearch/v1'),
});

export type EnvConfig = z.infer<typeof envSchema>;

// 4. Type-safe verified environment configuration parsed at boot
export const env: EnvConfig = envSchema.parse(cleanedEnv);

// 5. Auto-create staging folder UPLOAD_DIR on startup
export function initializeUploadDirectory(): string {
  try {
    const targetDir = path.isAbsolute(env.UPLOAD_DIR)
      ? env.UPLOAD_DIR
      : path.resolve(process.cwd(), env.UPLOAD_DIR);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`[EnvConfig] Staging upload directory initialized at: ${targetDir}`);
    }
    return targetDir;
  } catch (err: any) {
    console.error(`[EnvConfig] Warning initializing UPLOAD_DIR (${env.UPLOAD_DIR}):`, err?.message);
    const fallbackDir = path.join('/tmp', 'verifai-uploads');
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return fallbackDir;
    } catch {
      return env.UPLOAD_DIR;
    }
  }
}

// Automatically ensure staging directory is created on boot
initializeUploadDirectory();
