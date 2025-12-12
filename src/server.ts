import { Pool } from 'pg';
import { createClient } from 'redis';
import { loadConfig } from './config';
import { createApp } from './api/app';
import { QueryProcessor } from './services/query-processor';
import { AutocompleteService } from './services/autocomplete';
import { RateLimiter } from './services/rate-limiter';
import { AnalyticsService } from './services/analytics';
import { DocumentStore } from './services/document-store';
import { Indexer } from './services/indexer';
import { AuthService } from './services/auth';
import { TextProcessor } from './services/text-processor';
import { Ranker } from './services/ranker';
import { QueryCache } from './services/query-cache';
import { logger } from './utils/logger';

async function startServer() {
  try {
    // Load configuration
    const config = loadConfig();
    logger.info('Configuration loaded', { env: config.nodeEnv, port: config.port });

    // Initialize PostgreSQL connection pool
    const pgPool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test database connection
    try {
      await pgPool.query('SELECT NOW()');
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed', { error });
      throw error;
    }

    // Initialize Redis client
    const redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err }));
    redisClient.on('connect', () => logger.info('Redis connected'));

    await redisClient.connect();

    // Initialize services
    const textProcessor = new TextProcessor();
    const indexer = new Indexer(textProcessor);
    const ranker = new Ranker(indexer, {
      algorithm: config.ranking.algorithm as 'tfidf' | 'bm25',
      bm25K1: config.ranking.bm25K1,
      bm25B: config.ranking.bm25B,
      recencyWeight: config.ranking.recencyWeight,
      popularityWeight: config.ranking.popularityWeight,
      engagementWeight: config.ranking.engagementWeight,
      relevanceWeight: config.ranking.relevanceWeight,
    });

    const queryCache = new QueryCache(redisClient, config.cache.ttlSeconds);
    const documentStore = new DocumentStore(pgPool);
    const analyticsService = new AnalyticsService(pgPool);
    const autocompleteService = new AutocompleteService();
    const rateLimiter = new RateLimiter(
      redisClient,
      config.rateLimit.windowMs,
      config.rateLimit.maxRequests
    );
    const authService = new AuthService(
      pgPool,
      config.security?.jwtSecret || 'default-secret-change-in-production',
      '7d'
    );

    const queryProcessor = new QueryProcessor(
      textProcessor,
      indexer,
      ranker,
      documentStore,
      queryCache,
      analyticsService,
      autocompleteService
    );

    // Create Express app
    const app = createApp(
      queryProcessor,
      autocompleteService,
      rateLimiter,
      analyticsService,
      documentStore,
      indexer,
      authService,
      {
        port: config.port,
        corsOrigins: config.cors?.origins?.split(',') || ['*'],
        enableLogging: true,
      }
    );

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server started`, {
        port: config.port,
        env: config.nodeEnv,
        url: `http://localhost:${config.port}`,
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await redisClient.quit();
          logger.info('Redis connection closed');
        } catch (error) {
          logger.error('Error closing Redis', { error });
        }

        try {
          await pgPool.end();
          logger.info('Database connection closed');
        } catch (error) {
          logger.error('Error closing database', { error });
        }

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
