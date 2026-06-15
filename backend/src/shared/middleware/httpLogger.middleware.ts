import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';

export function httpLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startTime = process.hrtime();
  const { method, url } = req;
  const requestId = req.headers['x-request-id'] || 'unknown';

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const statusCode = res.statusCode;

    // Log using structured Pino logger
    logger.info(
      {
        requestId,
        method,
        url,
        statusCode,
        durationMs: parseFloat(timeInMs),
      },
      `${method} ${url} ${statusCode} - ${timeInMs}ms`,
    );
  });

  next();
}
