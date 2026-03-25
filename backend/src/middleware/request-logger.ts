import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Request logging middleware.
 *
 * Generates a unique request ID (UUID v4) for every request.
 * Includes it in the X-Request-ID response header so clients
 * can reference it when reporting issues.
 *
 * Every log entry for that request includes the requestId,
 * making it easy to trace a request through the entire system.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = generateUUID();
  const startTime = Date.now();

  // Attach to request for use in route handlers
  (req as any).requestId = requestId;

  // Include in response headers for client-side tracing
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const clerkUser = (req as any).clerkUser;

    logger.info('HTTP request', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: clerkUser?.id,
      ip: req.ip,
    });
  });

  next();
}
