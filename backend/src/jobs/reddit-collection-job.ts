import { logger } from '../utils/logger';

export interface JobContext {
  popularQueries: string[];
  onCollect: (query: string) => Promise<{ postsCollected: number }>;
  onInvalidateCache: (query: string) => Promise<void>;
}

/**
 * Reddit collection background job for Trigger.dev.
 *
 * Why Trigger.dev over node-cron? Trigger.dev gives us a monitoring
 * dashboard, automatic retries, and doesn't require keeping a server
 * running 24/7 just for cron jobs. 100K task runs/month free.
 */
export async function runRedditCollectionJob(ctx: JobContext): Promise<void> {
  const queries = ctx.popularQueries.slice(0, 20);
  logger.info('Reddit collection job started', { queryCount: queries.length });

  let totalCollected = 0;
  const errors: string[] = [];

  for (const query of queries) {
    try {
      const result = await ctx.onCollect(query);
      totalCollected += result.postsCollected;
      await ctx.onInvalidateCache(query);
      logger.debug('Collected for query', { query, posts: result.postsCollected });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${query}: ${msg}`);
      logger.error('Collection failed for query', { query, error });
    }
  }

  logger.info('Reddit collection job complete', { totalCollected, errors: errors.length });

  if (errors.length > 0) {
    throw new Error(`Collection failed for ${errors.length} queries`);
  }
}

export function registerRedditCollectionJob(triggerClient: any, ctx: JobContext): void {
  if (!triggerClient) {
    logger.warn('Trigger.dev not configured - scheduled jobs disabled');
    return;
  }

  try {
    triggerClient.defineJob({
      id: 'reddit-collection',
      name: 'Reddit Data Collection',
      version: '1.0.0',
      trigger: { type: 'schedule', cron: '0 * * * *' },
      run: async () => runRedditCollectionJob(ctx),
    });
    logger.info('Trigger.dev reddit-collection job registered');
  } catch (error) {
    logger.warn('Failed to register Trigger.dev job', { error });
  }
}
