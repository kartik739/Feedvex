import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../utils/logger';

/**
 * Search request validation schema.
 *
 * Why Zod for API validation? TypeScript only checks types at compile time.
 * Zod validates at runtime - essential for API endpoints where anyone can
 * send anything. Users get clear error messages like "query must be at least
 * 1 character" instead of a generic 400.
 */
export const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty').max(500, 'Query too long'),
  page: z.number().int().min(1).max(1000).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(10),
  filters: z
    .object({
      subreddit: z.string().max(100).optional(),
      dateFrom: z.coerce.date().optional(),
      dateTo: z.coerce.date().optional(),
      sortBy: z.enum(['relevance', 'date', 'score']).optional().default('relevance'),
    })
    .optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * Creates a validation middleware for a given Zod schema.
 * Returns HTTP 400 with detailed field errors on validation failure.
 * Strips unexpected fields to prevent injection.
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      logger.debug('Request validation failed', {
        path: req.path,
        errors,
        requestId: (req as any).requestId,
      });

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    // Replace body with validated (and stripped) data
    req.body = result.data;
    next();
  };
}
