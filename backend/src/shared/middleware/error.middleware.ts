import { Request, Response, NextFunction } from 'express';
import { AppError, NotFoundError } from '../errors/AppError.js';
import { logger } from '../logger.js';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'] || 'unknown';

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      requestId,
    });
    return;
  }

  // Unexpected error — log full stack, return generic message
  logger.error({ err, requestId }, 'Unhandled error');
  res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const err = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(err);
}
