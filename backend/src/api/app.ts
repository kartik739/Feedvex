import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { QueryProcessor } from '../services/query-processor';
import { AutocompleteService } from '../services/autocomplete';
import { RateLimiter } from '../services/rate-limiter';
import { AnalyticsService } from '../services/analytics';
import { DocumentStore } from '../services/document-store';
import { Indexer } from '../services/indexer';
import { ClerkAuthMiddleware } from '../services/clerk-auth';
import { SearchHistoryService } from '../services/search-history';
import { Document } from '../models/document';
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
  clerkAuth: ClerkAuthMiddleware,
  searchHistoryService: SearchHistoryService,
  config: ApiConfig = {}
): Express {
  const app = express();

  // CORS Hardening
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && (!config.corsOrigins || config.corsOrigins.includes('*'))) {
    logger.warn(
      'SECURITY WARNING: CORS is misconfigured for production. Wildcard (*) origin is not recommended but allowed for initial setup.'
    );
  }

  app.use(
    cors({
      origin: config.corsOrigins || '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true,
      optionsSuccessStatus: 200,
    })
  );

  // Helmet Hardening - Re-enable CSP with strict directives
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.tailwindcss.com',
            'https://*.clerk.accounts.dev',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: [
            "'self'",
            'data:',
            'https://images.unsplash.com',
            'https://lh3.googleusercontent.com',
          ],
          connectSrc: ["'self'", 'https://cdn.tailwindcss.com', 'https://*.clerk.accounts.dev'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
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

  // Clerk handles /register, /login, and /profile completely on the frontend.
  // The backend only needs to trust the JWT.

  // GET /api/v1/auth/me endpoint (get current user)
  app.get('/api/v1/auth/me', clerkAuth.requireAuth, async (req: Request, res: Response) => {
    res.json({ user: (req as any).clerkUser });
  });

  // POST /api/v1/search endpoint (Requirement 13.1, 13.6, 16.2)
  app.post('/api/v1/search', clerkAuth.optionalAuth, async (req: Request, res: Response) => {
    try {
      const { query, page = 1, pageSize = 10, filters } = req.body;

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

      if (query.length > 200) {
        return res.status(400).json({
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Search query exceeds maximum length of 200 characters.',
            details: { field: 'query', length: query.length },
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

      // Requirement 18.2: Validate and parse filters
      let parsedFilters;
      if (filters) {
        parsedFilters = {
          subreddit: filters.subreddit,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
          sortBy: filters.sortBy || 'relevance',
        };

        // Validate sortBy
        if (
          parsedFilters.sortBy &&
          !['relevance', 'date', 'score'].includes(parsedFilters.sortBy)
        ) {
          return res.status(400).json({
            error: {
              code: 'INVALID_SORT',
              message: 'Sort must be one of: relevance, date, score',
              details: { field: 'filters.sortBy', value: parsedFilters.sortBy },
              requestId: (req as any).requestId,
            },
          } as ErrorResponse);
        }
      }

      // Process query
      const startTime = Date.now();
      const results = await queryProcessor.processQuery(query, page, pageSize, parsedFilters);
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

      // Requirement 18.3: Store search history for authenticated users
      try {
        const userId = await getUserIdFromToken(req.headers.authorization);
        if (userId) {
          searchHistoryService.addEntry(userId, query, results.totalCount);
        }
      } catch (error) {
        // History service unavailable - log and continue
        logger.warn('Failed to store search history', {
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

  // GET /api/v1/documents/:id endpoint
  app.get('/api/v1/documents/:id', async (req: Request, res: Response) => {
    try {
      const doc = documentStore.getById(req.params.id as string);
      if (!doc) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found in index',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }
      res.json({ document: doc });
    } catch (error) {
      logger.error('Document fetch error', { error, requestId: (req as any).requestId });
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
  app.get('/api/v1/autocomplete', clerkAuth.requireAuth, async (req: Request, res: Response) => {
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

      if (prefix.length > 50) {
        return res.status(400).json({
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Prefix exceeds maximum length of 50 characters.',
            details: { field: 'prefix', length: prefix.length },
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
        averageSearchLatency: analyticsMetrics.responseTimeStats?.mean || 0,
        responseTimeStats: analyticsMetrics.responseTimeStats,
        popularQueries: analyticsMetrics.popularQueries,
        uptime: process.uptime(),
        documentsByType: {
          posts: docStats.postCount,
          comments: docStats.commentCount,
        },
        subreddits: docStats.subreddits,
        documentsBySubreddit: docStats.documentsBySubreddit,
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

  // Helper function to extract user ID from auth token
  const getUserIdFromToken = async (authHeader: string | undefined): Promise<string | null> => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    try {
      const user = await clerkAuth.verifyToken(token);
      return user?.id || null;
    } catch (error) {
      return null;
    }
  };

  // GET /api/v1/history endpoint - Retrieve user's search history
  // Requirement 18.3: Retrieve history endpoint
  app.get('/api/v1/history', async (req: Request, res: Response) => {
    try {
      const userId = await getUserIdFromToken(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Valid authorization token required',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be between 1 and 100',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      const history = searchHistoryService.getHistory(userId, limit);
      res.json({ history });
    } catch (error) {
      logger.error('History retrieval error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // DELETE /api/v1/history/:entryId endpoint - Delete specific history entry
  // Requirement 18.3: Delete history endpoint
  app.delete('/api/v1/history/:entryId', async (req: Request, res: Response) => {
    try {
      const userId = await getUserIdFromToken(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Valid authorization token required',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      const { entryId } = req.params;

      if (!entryId) {
        return res.status(400).json({
          error: {
            code: 'INVALID_ENTRY_ID',
            message: 'Entry ID is required',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      // Ensure entryId is a string (Express may parse as array)
      const entryIdStr = Array.isArray(entryId) ? entryId[0] : entryId;
      const deleted = searchHistoryService.deleteEntry(userId, entryIdStr);

      if (!deleted) {
        return res.status(404).json({
          error: {
            code: 'ENTRY_NOT_FOUND',
            message: 'History entry not found',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      res.json({ success: true });
    } catch (error) {
      logger.error('History deletion error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // DELETE /api/v1/history endpoint - Clear all history for user
  // Requirement 18.3: Delete history endpoint
  app.delete('/api/v1/history', async (req: Request, res: Response) => {
    try {
      const userId = await getUserIdFromToken(req.headers.authorization);

      if (!userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Valid authorization token required',
            requestId: (req as any).requestId,
          },
        } as ErrorResponse);
      }

      const deletedCount = searchHistoryService.clearHistory(userId);
      res.json({ success: true, deletedCount });
    } catch (error) {
      logger.error('History clear error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // POST /api/v1/seed endpoint - Add test data (development only)
  app.post('/api/v1/seed', async (req: Request, res: Response) => {
    try {
      const { TextProcessor } = await import('../services/text-processor');
      const textProcessor = new TextProcessor();

      const samplePosts = [
        {
          id: 'test1',
          title: 'Introduction to TypeScript: A Comprehensive Guide',
          content:
            'TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing to the language, which can help catch errors early in development.',
          url: 'https://reddit.com/r/programming/test1',
          subreddit: 'programming',
          author: 'test_user_1',
          redditScore: 150,
          commentCount: 45,
          createdAt: new Date('2024-12-10'),
        },
        {
          id: 'test2',
          title: 'React vs Vue: Which Framework Should You Choose?',
          content:
            'Comparing React and Vue.js frameworks for modern web development. Both have their strengths and are excellent choices for building user interfaces.',
          url: 'https://reddit.com/r/webdev/test2',
          subreddit: 'webdev',
          author: 'test_user_2',
          redditScore: 230,
          commentCount: 78,
          createdAt: new Date('2024-12-12'),
        },
        {
          id: 'test3',
          title: 'Machine Learning Basics: Getting Started with Python',
          content:
            'Learn the fundamentals of machine learning using Python. This guide covers supervised learning, neural networks, and popular libraries like scikit-learn and TensorFlow.',
          url: 'https://reddit.com/r/machinelearning/test3',
          subreddit: 'machinelearning',
          author: 'test_user_3',
          redditScore: 420,
          commentCount: 156,
          createdAt: new Date('2024-12-15'),
        },
      ];

      // Process and index sample posts
      for (const post of samplePosts) {
        const doc: Document = {
          id: post.id,
          title: post.title,
          content: post.content,
          url: post.url,
          subreddit: post.subreddit,
          author: post.author,
          redditScore: post.redditScore,
          commentCount: post.commentCount,
          createdUtc: post.createdAt,
          collectedAt: new Date(),
          processed: false,
          type: 'post',
        };

        await documentStore.store(doc);
        const processed = textProcessor.processDocument(doc);
        indexer.indexDocument(processed);
      }

      res.json({
        success: true,
        message: `Seeded ${samplePosts.length} documents`,
        count: samplePosts.length,
      });
    } catch (error) {
      logger.error('Seed error', { error, requestId: (req as any).requestId });
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while seeding data',
          requestId: (req as any).requestId,
        },
      } as ErrorResponse);
    }
  });

  // POST /api/v1/seed/bulk - Bulk seed documents from external sources
  app.post('/api/v1/seed/bulk', async (req: Request, res: Response) => {
    try {
      const { documents } = req.body;

      if (!Array.isArray(documents) || documents.length === 0) {
        return res.status(400).json({
          error: { code: 'INVALID_INPUT', message: 'documents array required' },
        });
      }

      const { TextProcessor } = await import('../services/text-processor');
      const textProcessor = new TextProcessor();
      let seeded = 0;

      for (const doc of documents) {
        if (!doc.id || !doc.title) continue;

        const document: Document = {
          id: doc.id,
          title: doc.title,
          content: doc.content || doc.title,
          url: doc.url || '',
          subreddit: doc.subreddit || '',
          author: doc.author || '',
          redditScore: doc.redditScore || 0,
          commentCount: doc.commentCount || 0,
          createdUtc: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          collectedAt: new Date(),
          processed: false,
          type: 'post',
        };

        await documentStore.store(document);
        const processed = textProcessor.processDocument(document);
        indexer.indexDocument(processed);
        seeded++;
      }

      res.json({ success: true, seeded, total: documents.length });
    } catch (error) {
      logger.error('Bulk seed error', { error });
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Bulk seed failed' } });
    }
  });

  // Global error handler (Requirement 13.5, 16.11)
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      requestId: (req as any).requestId,
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
