import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { QueryProcessor } from '../services/query-processor';
import { AutocompleteService } from '../services/autocomplete';
import { RateLimiter } from '../services/rate-limiter';
import { AnalyticsService } from '../services/analytics';
import { DocumentStore } from '../services/document-store';
import { Indexer } from '../services/indexer';
import { register } from '../utils/metrics';
import { logger } from '../utils/logger';
import { correlationContext } from '../utils/correlation';

/**
 * Configuration for the API server
 */
export interface ApiConfig {
  port?: number;
  corsOrigins?: string[];
  enableLogging?: boolean;
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId?: string;
  };
}

/**
 * Creates and configures the Express application
 * Implements requirements 13.1-13.7, 16.1-16.11
 */
export function createApp(
  queryProcessor: QueryProcessor,
  autocompleteService: AutocompleteService,
  rateLimiter: RateLimiter,
  analyticsService: AnalyticsService,
  documentStore: DocumentStore,
  indexer: Indexer,
  config: ApiConfig = {}
): Express {
  const app = express();

  // Requirement 13.7: Set up middleware
  app.use(helmet()); // Security headers
  app.use(cors({
    origin: config.corsOrigins || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '1mb' })); // Body parser with size limit

  // Request logging middleware (Requirement 16.4, 16.6)
  if (config.enableLogging !== false) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = correlationContext.generateId();
      
      // Store request ID for error handling and correlation
      (req as any).requestId = requestId;
      correlationContext.setId(requestId);

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('HTTP request', {
          correlationId: requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${duration}ms`,
        });
      });

      next();
    });
  } else {
    // Even without logging, we need to set requestId for error responses
    app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = correlationContext.generateId();
      (req as any).requestId = requestId;
      correlationContext.setId(requestId);
      next();
    });
  }

  // Rate limiting middleware (Requirement 9.2, 9.3, 16.9)
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const result = await rateLimiter.checkRateLimit(clientId);

    if (!result.allowed) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            retryAfter: result.resetTime,
          },
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }

    // Record the request
    rateLimiter.recordRequest(clientId);

    next();
  });

  // GET /api/v1/metrics endpoint (Requirement 16.1, 16.2, 16.7)
  app.get('/api/v1/metrics', async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (error) {
      logger.error('Metrics error', { error });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while retrieving metrics',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // POST /api/v1/search endpoint (Requirement 13.1, 13.6, 16.2)
  app.post('/api/v1/search', async (req: Request, res: Response) => {
    try {
      const { query, page = 1, pageSize = 10 } = req.body;

      // Requirement 13.4: Validate input
      if (!query || typeof query !== 'string' || query.trim() === '') {
        return res.status(400).json({
          error: {
            code: 'INVALID_QUERY',
            message: 'Query must be a non-empty string',
            details: { field: 'query' },
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      if (typeof page !== 'number' || page < 1) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PAGE',
            message: 'Page must be a positive number',
            details: { field: 'page', value: page },
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
        return res.status(400).json({
          error: {
            code: 'INVALID_PAGE_SIZE',
            message: 'Page size must be between 1 and 100',
            details: { field: 'pageSize', value: pageSize },
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      // Process query
      const startTime = Date.now();
      const results = await queryProcessor.processQuery(query, page, pageSize);
      const latency = Date.now() - startTime;

      // Log analytics (Requirement 18.4: Handle analytics service failures gracefully)
      try {
        analyticsService.logQuery(query, results.totalCount, latency);
      } catch (error) {
        // Analytics unavailable - log and continue
        logger.warn('Failed to log analytics', { 
          error: error instanceof Error ? error.message : String(error),
          correlationId: (req as any).requestId,
        });
      }

      // Requirement 13.6: Return JSON response
      res.json(results);
    } catch (error) {
      // Requirement 13.5: Handle internal errors
      logger.error('Search error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while processing your request',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // GET /api/v1/autocomplete endpoint (Requirement 13.2, 13.6, 16.5)
  app.get('/api/v1/autocomplete', async (req: Request, res: Response) => {
    try {
      const { prefix, limit = 10 } = req.query;

      // Validate input
      if (!prefix || typeof prefix !== 'string' || prefix.trim() === '') {
        return res.status(400).json({
          error: {
            code: 'INVALID_PREFIX',
            message: 'Prefix must be a non-empty string',
            details: { field: 'prefix' },
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 50',
            details: { field: 'limit', value: limit },
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      const suggestions = autocompleteService.getSuggestions(prefix, limitNum);
      res.json({ suggestions });
    } catch (error) {
      logger.error('Autocomplete error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while processing your request',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // GET /api/v1/health endpoint (Requirement 13.3, 14.4, 16.6, 18.3)
  app.get('/api/v1/health', async (req: Request, res: Response) => {
    try {
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      const health: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        timestamp: string;
        components: {
          documentStore: {
            status: 'healthy' | 'unhealthy';
            totalDocuments: number;
          };
          index: {
            status: 'healthy' | 'unhealthy';
            totalDocuments: number;
            totalTerms: number;
          };
          cache: {
            status: 'healthy' | 'unhealthy';
          };
        };
      } = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        components: {
          documentStore: {
            status: 'healthy',
            totalDocuments: 0,
          },
          index: {
            status: 'healthy',
            totalDocuments: 0,
            totalTerms: 0,
          },
          cache: {
            status: 'healthy',
          },
        },
      };

      // Check document store (Requirement 18.3: Return 503 when database unavailable)
      try {
        health.components.documentStore.totalDocuments = documentStore.getTotalDocuments();
      } catch (error) {
        health.components.documentStore.status = 'unhealthy';
        overallStatus = 'unhealthy';
        logger.error('Document store health check failed', { error });
      }

      // Check index
      try {
        health.components.index.totalDocuments = indexer.getTotalDocuments();
        health.components.index.totalTerms = indexer.getStats().totalTerms;
      } catch (error) {
        health.components.index.status = 'unhealthy';
        overallStatus = 'degraded';
        logger.error('Index health check failed', { error });
      }

      health.status = overallStatus;

      // Return 503 if unhealthy (database unavailable)
      if (overallStatus === 'unhealthy') {
        return res.status(503).json(health);
      }

      res.json(health);
    } catch (error) {
      logger.error('Health check error', { error });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });

  // GET /api/v1/stats endpoint (Requirement 11.5, 16.8)
  app.get('/api/v1/stats', async (req: Request, res: Response) => {
    try {
      const docStats = documentStore.getStats();
      const analyticsMetrics = analyticsService.getOverallMetrics();

      const stats = {
        totalDocuments: docStats.totalDocuments,
        totalQueries: analyticsMetrics.totalQueries,
        totalClicks: analyticsMetrics.totalClicks,
        overallCTR: analyticsMetrics.overallCTR,
        uniqueQueries: analyticsMetrics.uniqueQueries,
        responseTimeStats: analyticsMetrics.responseTimeStats,
        popularQueries: analyticsMetrics.popularQueries,
        documentsByType: {
          posts: docStats.postCount,
          comments: docStats.commentCount,
        },
        subreddits: docStats.subreddits,
      };

      res.json(stats);
    } catch (error) {
      logger.error('Stats error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while retrieving statistics',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // POST /api/v1/click endpoint (for analytics)
  app.post('/api/v1/click', async (req: Request, res: Response) => {
    try {
      const { query, docId, position } = req.body;

      if (!query || !docId || typeof position !== 'number') {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'Query, docId, and position are required',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      // Requirement 18.4: Handle analytics service failures gracefully
      try {
        analyticsService.logClick(query, docId, position);
      } catch (error) {
        // Analytics unavailable - log but return success to client
        logger.warn('Failed to log click', { 
          error: error instanceof Error ? error.message : String(error),
          correlationId: (req as any).requestId,
        });
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('Click logging error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`,
        requestId: (req as any).requestId,
      },
    } as ErrorResponse);
  });

  // Global error handler (Requirement 13.5, 16.11)
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error', { 
      error: err.message, 
      stack: err.stack,
      requestId: (req as any).requestId 
    });
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: (req as any).requestId,
      },
    } as ErrorResponse);
  });

  return app;
}
