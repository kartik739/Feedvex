import { loadConfig } from './config';
import { createApp } from './api/app';
import { QueryProcessor } from './services/query-processor';
import { AutocompleteService } from './services/autocomplete';
import { RateLimiter } from './services/rate-limiter';
import { AnalyticsService } from './services/analytics';
import { DocumentStore } from './services/document-store';
import { Indexer } from './services/indexer';
import { TextProcessor } from './services/text-processor';
import { Ranker } from './services/ranker';
import { QueryCache } from './services/query-cache';
import { logger } from './utils/logger';

async function startServer() {
  try {
    // Load configuration
    const config = loadConfig();
    logger.info('Configuration loaded', { env: config.nodeEnv, port: config.port });

    // Note: Using in-memory storage for now
    // PostgreSQL and Redis connections are optional for development
    logger.info('Starting with in-memory storage (no database required)');

    // Initialize services with in-memory implementations
    const textProcessor = new TextProcessor();
    const indexer = new Indexer({
      indexPath: './data/index.json',
      autoPersist: false,
    });

    const documentStore = new DocumentStore({
      maxDocuments: 100000,
    });

    const ranker = new Ranker(
      {
        algorithm: config.ranking.algorithm as 'tfidf' | 'bm25',
        bm25K1: config.ranking.bm25K1,
        bm25B: config.ranking.bm25B,
        textWeight: config.ranking.textWeight,
        recencyWeight: config.ranking.recencyWeight,
        popularityWeight: config.ranking.popularityWeight,
        engagementWeight: config.ranking.engagementWeight,
        recencyDecayDays: config.ranking.recencyDecayDays,
      },
      indexer,
      documentStore
    );

    const queryCache = new QueryCache();
    const analyticsService = new AnalyticsService();
    const autocompleteService = new AutocompleteService();
    const rateLimiter = new RateLimiter();

    // Auth service disabled - requires database
    // const authService = new AuthService(mockPool, config.security.jwtSecret, '7d');
    const authService = null as any; // Disabled for in-memory mode

    const queryProcessor = new QueryProcessor(
      {
        defaultPageSize: 10,
        maxPageSize: 100,
        snippetContextLength: 50,
        enableCache: false, // Disable cache since no Redis
      },
      textProcessor,
      indexer,
      ranker,
      documentStore,
      queryCache
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
        note: 'Using in-memory storage - data will not persist',
      });
      console.log(`\n🚀 Server running at http://localhost:${config.port}`);
      console.log(`📝 API docs: http://localhost:${config.port}/api/v1/health`);
      console.log(`⚠️  Note: Using in-memory storage (no database required)\n`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      server.close(() => {
        logger.info('HTTP server closed');
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
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    console.error('\n❌ Server startup failed:');
    console.error(error);
    process.exit(1);
  }
}

// Start the server
startServer();
