import { Response } from 'express';

export interface ApiResponsePayload<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200,
    pagination?: { total: number; page: number; limit: number; totalPages: number }
  ): Response {
    const payload: ApiResponsePayload<T> = {
      success: true,
      message,
      ...(data !== undefined ? { data } : {}),
      ...(pagination ? { pagination } : {}),
    };
    return res.status(statusCode).json(payload);
  }

  static created<T>(res: Response, message: string, data?: T): Response {
    return ApiResponse.success(res, message, data, 201);
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors: any[] = []
  ): Response {
    const payload: ApiResponsePayload = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : [message],
    };
    return res.status(statusCode).json(payload);
  }
}
