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
import { WebSocketStatsService } from './services/websocket-stats';
import { SearchHistoryService } from './services/search-history';
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
    const searchHistoryService = new SearchHistoryService({
      maxEntriesPerUser: 100,
    });

    // Auth service - using in-memory implementation
    const { AuthServiceMemory } = await import('./services/auth-memory');
    const authService = new AuthServiceMemory(config.security.jwtSecret, '7d');

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
      searchHistoryService,
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
      console.log(`🔌 WebSocket stats: ws://localhost:${config.port}/ws/stats`);
      console.log(`⚠️  Note: Using in-memory storage (no database required)\n`);
    });

    // Initialize WebSocket stats service
    const wsStatsService = new WebSocketStatsService(
      analyticsService,
      documentStore,
      indexer,
      {
        updateInterval: 5000, // Update every 5 seconds
        enableHeartbeat: true,
        heartbeatInterval: 30000, // Heartbeat every 30 seconds
      }
    );
    wsStatsService.initialize(server, '/ws/stats');

    // Initialize Reddit collector and schedule data collection
    const { RedditCollector } = await import('./services/reddit-collector');
    
    const redditCollector = new RedditCollector(
      {
        userAgent: 'FeedVex/1.0.0 (Reddit Search Engine)',
        subreddits: config.reddit.subreddits,
        maxPostsPerSubreddit: config.reddit.maxPostsPerSubreddit,
      },
      documentStore
    );

    // Schedule collection every 6 hours (configurable)
    const collectionInterval = config.reddit.collectionIntervalHours * 60 * 60 * 1000;
    const collectionTimer = redditCollector.scheduleCollection(collectionInterval);

    // Run initial collection after 30 seconds
    setTimeout(async () => {
      try {
        logger.info('Running initial Reddit collection...');
        const result = await redditCollector.runCollectionCycle();
        
        // Index collected documents
        const docs = documentStore.getAll();
        for (const doc of docs) {
          if (!doc.processed) {
            const processed = textProcessor.processDocument(doc);
            indexer.indexDocument(processed);
            await documentStore.update(doc.id, { processed: true });
          }
        }
        
        logger.info('Initial collection complete', {
          documentsCollected: result.documentsCollected,
          subreddits: result.subredditsProcessed.length,
        });
      } catch (error) {
        logger.error('Initial collection failed', { error });
      }
    }, 30000);

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      // Stop scheduled collection
      clearInterval(collectionTimer);

      // Shutdown WebSocket service first
      wsStatsService.shutdown();

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
