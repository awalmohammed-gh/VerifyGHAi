import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/response.js';
import { env } from '../config/environment.js';
import { uploadConfig } from '../config/upload.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // 1. Multer Upload Size & Storage Errors
  if (
    err instanceof multer.MulterError ||
    err?.name === 'MulterError' ||
    err?.code === 'LIMIT_FILE_SIZE' ||
    err?.code === 'MULTER_LIMIT_FILE_SIZE'
  ) {
    if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'MULTER_LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'FILE_TOO_LARGE',
        message: `File size exceeds the maximum limit of ${uploadConfig.MAX_UPLOAD_SIZE_MB}MB.`,
      });
    }

    return res.status(400).json({
      success: false,
      error: err.code || 'UPLOAD_ERROR',
      message: err.message || 'File upload validation error.',
    });
  }

  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any[] = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors.length > 0 ? err.errors : [err.message];
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 422;
    message = 'Database validation error';
    errors = Object.values(err.errors || {}).map((e: any) => e.message);
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
    errors = [message];
  } else if (err.code === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account or record with that ${field} already exists.`;
    errors = [message];
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature.';
    errors = [message];
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please sign in again.';
    errors = [message];
  } else if (err.status && typeof err.status === 'number') {
    statusCode = err.status;
    message = err.message || 'Error processing request';
    errors = [message];
  } else {
    // Unhandled exception
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
    message = env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : (err.message || 'Internal Server Error');
    errors = [message];
  }

  return ApiResponse.error(res, message, statusCode, errors);
}

export function notFoundHandler(req: Request, res: Response): Response {
  return ApiResponse.error(
    res,
    `API route '${req.method} ${req.originalUrl}' not found.`,
    404,
    [`Endpoint not found`]
  );
}
