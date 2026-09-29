export class ApiError extends Error {
  public statusCode: number;
  public errors: any[];
  public isOperational: boolean;

  constructor(statusCode: number, message: string, errors: any[] = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', errors: any[] = []): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized access', errors: any[] = []): ApiError {
    return new ApiError(401, message, errors);
  }

  static forbidden(message = 'Forbidden access. Permission denied.', errors: any[] = []): ApiError {
    return new ApiError(403, message, errors);
  }

  static notFound(message = 'Resource not found', errors: any[] = []): ApiError {
    return new ApiError(404, message, errors);
  }

  static conflict(message = 'Resource conflict', errors: any[] = []): ApiError {
    return new ApiError(409, message, errors);
  }

  static unprocessable(message = 'Validation failed', errors: any[] = []): ApiError {
    return new ApiError(422, message, errors);
  }

  static tooManyRequests(message = 'Too many requests, please try again later', errors: any[] = []): ApiError {
    return new ApiError(429, message, errors);
  }

  static internal(message = 'Internal server error occurred', errors: any[] = []): ApiError {
    return new ApiError(500, message, errors, false);
  }
}
