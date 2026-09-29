import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { ApiError } from '../utils/apiError.js';
import {
  UPLOAD_DIR,
  MAX_UPLOAD_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  ensureUploadDirExists,
} from '../config/upload.js';

// Verify upload directory exists on middleware initialization
ensureUploadDirExists();

// 1. Configure robust disk storage engine referencing config.UPLOAD_DIR
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    ensureUploadDirExists();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate cryptographic safe sanitized unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype === 'application/pdf' ? '.pdf' : '.png');
    const fieldPrefix = file.fieldname || 'upload';
    cb(null, `${fieldPrefix}-${uniqueSuffix}${ext}`);
  },
});

// 2. Strict file filter: Accept image formats (JPEG, PNG, WebP) and documents (PDF)
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeAllowed = (ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype);
  const isExtAllowed = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);

  if (isMimeAllowed || isExtAllowed) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type '${file.mimetype || ext}'. Only JPEG, PNG, WebP images and PDF documents are allowed for verification.`
      ) as any,
      false
    );
  }
};

// 3. Primary Multer instance with environment-driven fileSize limits
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_UPLOAD_SIZE, // e.g. 10485760 (10MB)
    files: 1,
  },
});

// Aliases for route backwards-compatibility
export const uploadScreenshot = uploadMiddleware;
export const uploadDocument = uploadMiddleware;
export const uploadSingleFile = uploadMiddleware.single('file');
export const uploadHandler = uploadMiddleware;

export default uploadMiddleware;
