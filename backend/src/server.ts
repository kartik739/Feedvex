import dotenv from 'dotenv';
dotenv.config();

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
import { UpstashCache } from './services/upstash-cache';
import { HealthChecker } from './services/health-checker';
import { GracefulShutdown } from './services/graceful-shutdown';
import { ResendEmailService } from './services/resend-email';
import { ClerkWebhookHandler } from './services/clerk-webhook-handler';
import { RedditOAuthClient } from './services/reddit-oauth-client';
import { initSentry } from './services/sentry';
import { logger } from './utils/logger';

async function startServer() {
  try {
    const config = loadConfig();

    // Initialize Sentry early for error tracking
    initSentry(config.sentry.dsn, config.nodeEnv);

    logger.info('Starting FeedVex server', { env: config.nodeEnv, port: config.port });

    // Initialize cloud services
    const upstashCache = new UpstashCache(config.redis.url);
    const { ClerkAuthMiddleware } = await import('./services/clerk-auth');
    const clerkAuth = new ClerkAuthMiddleware(config.clerk.secretKey);
    const emailService = new ResendEmailService(config.resend.apiKey);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const webhookHandler = new ClerkWebhookHandler(emailService, config.clerk.webhookSecret);
    const redditClient = new RedditOAuthClient(
      config.reddit.clientId,
      config.reddit.clientSecret,
      config.reddit.userAgent
    );

    // Authenticate Reddit OAuth client
    await redditClient.authenticate();

    // Initialize database services
    const textProcessor = new TextProcessor();

    let documentStore: DocumentStore;
    let indexer: Indexer;
    if (config.database.url) {
      logger.info('Connecting to PostgreSQL database...', {
        url: config.database.url.split('@')[1],
      });
      const { PostgresClient } = await import('./services/postgres-client');
      const { PostgresDocumentStore } = await import('./services/postgres-document-store');
      const pgClient = new PostgresClient({ connectionString: config.database.url });
      await pgClient.initialize();
      const pgDocStore = new PostgresDocumentStore(pgClient);
await pgDocStore.initialize();

      logger.info('Hydrating in-memory store from PostgreSQL...');
      documentStore = new DocumentStore({ maxDocuments: 100000 });
      const allDocs = await pgDocStore.getAll();
      await documentStore.storeMany(allDocs);
      logger.info(`Hydrated ${allDocs.length} documents into memory.`);

      indexer = new Indexer({ autoPersist: true, pgClient });
      await indexer.load(); // Load state from Postgres
    } else {
      logger.warn('No DATABASE_URL configured, falling back to fully in-memory document store.');
      documentStore = new DocumentStore({ maxDocuments: 100000 });
      indexer = new Indexer({ autoPersist: true });

      // Seed sample data for development so search works immediately
      logger.info('Seeding sample data for development...');
      const samplePosts = [
        {
          id: 'dev1',
          title: 'Introduction to TypeScript: A Comprehensive Guide',
          content:
            'TypeScript is a strongly typed programming language built on JavaScript. It adds optional static typing to catch errors early in development.',
          subreddit: 'programming',
          author: 'ts_fan',
          score: 1500,
          numComments: 145,
        },
        {
          id: 'dev2',
          title: 'React vs Vue: Which Framework Should You Choose?',
          content:
            'Comparing React and Vue.js for modern web development. React has a larger ecosystem while Vue has a gentler learning curve.',
          subreddit: 'webdev',
          author: 'framework_dev',
          score: 2300,
          numComments: 278,
        },
        {
          id: 'dev3',
          title: 'Machine Learning Basics with Python and PyTorch',
          content:
            'Learn machine learning fundamentals using Python. Covers neural networks, supervised learning, and popular libraries like TensorFlow and PyTorch.',
          subreddit: 'machinelearning',
          author: 'ml_researcher',
          score: 4200,
          numComments: 312,
        },
        {
          id: 'dev4',
          title: 'Docker Best Practices for Production',
          content:
            'Essential Docker practices including multi-stage builds, security hardening, and performance optimization for production environments.',
          subreddit: 'devops',
          author: 'container_guru',
          score: 3100,
          numComments: 267,
        },
        {
          id: 'dev5',
          title: 'Understanding JavaScript Closures and Scope',
          content:
            'Deep dive into JavaScript closures, lexical scope, and how the prototype chain works. Practical examples for modern JS development.',
          subreddit: 'javascript',
          author: 'js_wizard',
          score: 1890,
          numComments: 134,
        },
        {
          id: 'dev6',
          title: 'GraphQL vs REST: Modern API Design Patterns',
          content:
            'Comparing GraphQL and REST API design. When to use each approach and real-world trade-offs in production API development.',
          subreddit: 'programming',
          author: 'api_architect',
          score: 2750,
          numComments: 391,
        },
        {
          id: 'dev7',
          title: 'CSS Grid and Flexbox: Complete Layout Guide',
          content:
            'Master CSS Grid and Flexbox with practical examples. Build responsive layouts that work across all modern browsers.',
          subreddit: 'webdev',
          author: 'css_master',
          score: 1560,
          numComments: 228,
        },
        {
          id: 'dev8',
          title: 'Node.js Performance Optimization and Clustering',
          content:
            'Improve Node.js application performance with clustering, caching strategies, worker threads, and async patterns at scale.',
          subreddit: 'node',
          author: 'perf_ninja',
          score: 1980,
          numComments: 452,
        },
        {
          id: 'dev9',
          title: 'Git Branching Strategies for Modern Teams',
          content:
            'Explore Git Flow, GitHub Flow, and trunk-based development — practical strategies for effective team collaboration and CI/CD.',
          subreddit: 'programming',
          author: 'git_guru',
          score: 3420,
          numComments: 289,
        },
        {
          id: 'dev10',
          title: 'PostgreSQL Indexing and Query Optimization',
          content:
            'Understanding database indexes and query planning. Covers B-tree, GIN, and partial indexes for high-performance PostgreSQL queries.',
          subreddit: 'database',
          author: 'db_expert',
          score: 2670,
          numComments: 173,
        },
        {
          id: 'dev11',
          title: 'Rust Programming Language: Systems Development',
          content:
            'Rust guarantees memory safety without garbage collection. Learn ownership, borrowing, and lifetimes for safe systems programming.',
          subreddit: 'rust',
          author: 'rustacean',
          score: 5100,
          numComments: 421,
        },
        {
          id: 'dev12',
          title: 'Python Async Programming with asyncio',
          content:
            'Complete guide to Python asynchronous programming. Covers coroutines, event loops, async/await syntax and real-world async patterns.',
          subreddit: 'python',
          author: 'async_pythonista',
          score: 2100,
          numComments: 198,
        },
      ];
      for (const post of samplePosts) {
        const doc: import('./models/document').Document = {
          id: post.id,
          type: 'post',
          title: post.title,
          content: post.content,
          url: `https://reddit.com/r/${post.subreddit}/${post.id}`,
          author: post.author,
          subreddit: post.subreddit,
          redditScore: post.score,
          commentCount: post.numComments,
          createdUtc: new Date(),
          collectedAt: new Date(),
          processed: false,
        };
        await documentStore.store(doc);
        const processedDoc = textProcessor.processDocument(doc);
        indexer.indexDocument(processedDoc);
      }
      logger.info(`Seeded ${samplePosts.length} sample documents into in-memory store.`);

      // ── Live Reddit Ingestion ──────────────────────────────────────────
      // Pull real posts from Reddit public API immediately, then refresh every 6h
      const { RedditCollector } = await import('./services/reddit-collector');
      const subreddits = (
        process.env.REDDIT_SUBREDDITS ||
        'programming,javascript,python,webdev,machinelearning,devops,rust'
      ).split(',');
      const maxPosts = parseInt(process.env.MAX_POSTS_PER_SUBREDDIT || '25', 10);

      const collector = new RedditCollector(
        {
          userAgent: process.env.REDDIT_USER_AGENT || 'FeedVex/1.0.0 (open-source search engine)',
          subreddits,
          maxPostsPerSubreddit: maxPosts,
          concurrentRequests: 3,
        },
        documentStore
      );

      const runIngestion = async () => {
        try {
          logger.info('Starting Reddit data ingestion...', { subreddits, maxPosts });
          const result = await collector.runCollectionCycle();
          // Index every newly collected document
          const allDocs = documentStore.getAll();
          let indexed = 0;
          for (const doc of allDocs) {
            if (!doc.processed) {
              const processedDoc = textProcessor.processDocument(doc);
              indexer.indexDocument(processedDoc);
              // Mark as processed
              await documentStore.store({ ...doc, processed: true });
              indexed++;
            }
          }
          logger.info(`Reddit ingestion complete`, {
            collected: result.documentsCollected,
            indexed,
            errors: result.errors.length,
          });
        } catch (err) {
          logger.warn('Reddit ingestion failed (using seed data as fallback)', {
            error: String(err),
          });
        }
      };

      // Run immediately, then every 6 hours
      runIngestion();
      setInterval(runIngestion, 6 * 60 * 60 * 1000);
    }

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
    const searchHistoryService = new SearchHistoryService({ maxEntriesPerUser: 100 });

    const queryProcessor = new QueryProcessor(
      { defaultPageSize: 10, maxPageSize: 100, snippetContextLength: 50, enableCache: false },
      textProcessor,
      indexer,
      ranker,
      documentStore,
      queryCache
    );

    // Health checker wires up all dependencies
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const healthChecker = new HealthChecker(undefined, upstashCache, redditClient);

    // Create Express app
    const app = createApp(
      queryProcessor,
      autocompleteService,
      rateLimiter,
      analyticsService,
      documentStore,
      indexer,
      clerkAuth,
      searchHistoryService,
      {
        port: config.port,
        corsOrigins: config.cors.origins.split(','),
        enableLogging: true,
      }
    );

    const server = app.listen(config.port, () => {
      logger.info('Server started', {
        port: config.port,
        env: config.nodeEnv,
        clerk: clerkAuth ? 'enabled' : 'disabled',
        cache: upstashCache.isConfigured() ? 'Upstash' : 'disabled',
        email: emailService.isConfigured() ? 'Resend' : 'disabled',
      });
      console.log(`\n🚀 FeedVex running at http://localhost:${config.port}`);
      console.log(`📊 Health: http://localhost:${config.port}/api/v1/health`);
      console.log(`📈 Metrics: http://localhost:${config.port}/api/v1/metrics\n`);
    });

    // WebSocket stats
    const wsStatsService = new WebSocketStatsService(analyticsService, documentStore, indexer, {
      updateInterval: 5000,
      enableHeartbeat: true,
      heartbeatInterval: 30000,
    });
    wsStatsService.initialize(server, '/ws/stats');

    // Graceful shutdown
    const gracefulShutdown = new GracefulShutdown(server, undefined, upstashCache);
    gracefulShutdown.register();

    // Setup Trigger.dev Background Jobs if configured
    if (config.trigger.apiKey) {
      const { TriggerClient } = await import('@trigger.dev/sdk');
      const triggerClient = new TriggerClient({
        id: 'feedvex-backend',
        apiKey: config.trigger.apiKey,
      });
      const { registerRedditCollectionJob } = await import('./jobs/reddit-collection-job');

      const { RedditCollector } = await import('./services/reddit-collector');
      const collector = new RedditCollector(
        {
          userAgent: config.reddit.userAgent,
          subreddits: config.reddit.subreddits,
          maxPostsPerSubreddit: config.reddit.maxPostsPerSubreddit,
        },
        documentStore
      );

      registerRedditCollectionJob(triggerClient, {
        popularQueries: ['programming', 'technology'],
        onCollect: async () => {
          const res = await collector.runCollectionCycle();
          return { postsCollected: res.documentsCollected };
        },
        onInvalidateCache: async () => {}, // Cache naturally invalidates via TTL
      });
    } else {
      logger.info(
        'Trigger.dev skipped. Standalone collector daemon will handle background scraping.'
      );
    }
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();
