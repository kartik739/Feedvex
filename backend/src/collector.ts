import { loadConfig } from './config/index';
import { RedditCollector } from './services/reddit-collector';
import { PostgresClient } from './services/postgres-client';
import { PostgresDocumentStore } from './services/postgres-document-store';
import { DocumentStore } from './services/document-store';
import { logger } from './utils/logger';

async function startCollector() {
  const config = loadConfig();
  logger.info('Starting standalone Feedvex Collector daemon');

  let documentStore;
  if (config.database.url) {
    logger.info('Connecting Collector to PostgreSQL database...');
    const pgClient = new PostgresClient({ connectionString: config.database.url });
    await pgClient.initialize();
    
    const pgDocStore = new PostgresDocumentStore(pgClient);
    logger.info('Hydrating in-memory store from PostgreSQL...');
    documentStore = new DocumentStore({ maxDocuments: 100000 });
    const allDocs = await pgDocStore.getAll();
    await documentStore.storeMany(allDocs);
  } else {
    logger.warn('No DATABASE_URL configured, Collector falling back to in-memory store (WARNING: DATA WILL NOT PERSIST TO API)');
    documentStore = new DocumentStore({ maxDocuments: 100000 });
  }

  const collector = new RedditCollector({
    clientId: config.reddit.clientId,
    clientSecret: config.reddit.clientSecret,
    userAgent: config.reddit.userAgent || 'FeedvexCollector/1.0',
    subreddits: config.reddit.subreddits,
    maxPostsPerSubreddit: config.reddit.maxPostsPerSubreddit,
  }, documentStore);

  // Interval from config, or default 6 hours
  const intervalHours = config.reddit.collectionIntervalHours || 6;
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  // Run immediately on boot
  logger.info('Running initial collection cycle on boot...');
  try {
    await collector.runCollectionCycle();
  } catch (error) {
    logger.error('Failed initial collection cycle', { error });
  }

  // Schedule the interval
  collector.scheduleCollection(intervalMs);
  
  // Keep process alive gracefully
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down collector...');
    process.exit(0);
  });
}

startCollector().catch((err) => {
  logger.error('Fatal error in collector daemon', { error: err });
  process.exit(1);
});
