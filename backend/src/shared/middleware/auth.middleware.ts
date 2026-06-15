import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt.js';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided. Please log in first.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token, env.ACCESS_TOKEN_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error) {
    next(new AppError('Your session has expired or is invalid. Please log in again.', 401, 'UNAUTHORIZED'));
  }
}
