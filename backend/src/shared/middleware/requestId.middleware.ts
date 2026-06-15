import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Use incoming request ID or generate a new UUID
  const headerName = 'x-request-id';
  const requestId = (req.headers[headerName] as string) || crypto.randomUUID();

  // Set request header
  req.headers[headerName] = requestId;

  // Set response header
  res.setHeader(headerName, requestId);

  next();
}
