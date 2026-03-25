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
import { ClerkAuthMiddleware } from './services/clerk-auth';
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
    const clerkAuth = new ClerkAuthMiddleware(config.clerk.secretKey);
    const emailService = new ResendEmailService(config.resend.apiKey);
    const webhookHandler = new ClerkWebhookHandler(emailService, config.clerk.webhookSecret);
    const redditClient = new RedditOAuthClient(
      config.reddit.clientId,
      config.reddit.clientSecret,
      config.reddit.userAgent
    );

    // Authenticate Reddit OAuth client
    await redditClient.authenticate();

    // Initialize in-memory services (fallback when DB not configured)
    const textProcessor = new TextProcessor();
    const indexer = new Indexer({ indexPath: './data/index.json', autoPersist: false });
    const documentStore = new DocumentStore({ maxDocuments: 100000 });
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

    const { AuthServiceMemory } = await import('./services/auth-memory');
    const authService = new AuthServiceMemory(config.security.jwtSecret, '7d');

    const queryProcessor = new QueryProcessor(
      { defaultPageSize: 10, maxPageSize: 100, snippetContextLength: 50, enableCache: false },
      textProcessor,
      indexer,
      ranker,
      documentStore,
      queryCache
    );

    // Health checker wires up all dependencies
    const healthChecker = new HealthChecker(undefined, upstashCache, redditClient);

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

    // Initial Reddit collection after 30s
    setTimeout(async () => {
      try {
        const { RedditCollector } = await import('./services/reddit-collector');
        const collector = new RedditCollector(
          { userAgent: config.reddit.userAgent, subreddits: config.reddit.subreddits, maxPostsPerSubreddit: config.reddit.maxPostsPerSubreddit },
          documentStore
        );
        const result = await collector.runCollectionCycle();
        logger.info('Initial collection complete', { documentsCollected: result.documentsCollected });
      } catch (error) {
        logger.error('Initial collection failed', { error });
      }
    }, 30000);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();
