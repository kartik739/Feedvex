import { RedditOAuthClient, RedditPost } from './reddit-oauth-client';
import { logger } from '../utils/logger';

export interface CollectionResult {
  postsCollected: number;
  timeElapsed: number;
  errors: string[];
}

/**
 * OnDemandCollector - triggers Reddit collection when users search.
 * 
 * Strategy: When a user searches, check if we have fresh data (< 1 hour old).
 * If not, collect in the background and return existing results immediately.
 * This keeps search fast while keeping data fresh.
 */
export class OnDemandCollector {
  private lastCollected: Map<string, Date> = new Map();
  private inProgress: Set<string> = new Set();
  private readonly staleThresholdMs = 60 * 60 * 1000; // 1 hour

  constructor(private redditClient: RedditOAuthClient) {}

  /**
   * Checks if we need to collect fresh data for a query.
   */
  shouldCollect(query: string): boolean {
    const lastTime = this.lastCollected.get(query);
    if (!lastTime) return true;
    return Date.now() - lastTime.getTime() > this.staleThresholdMs;
  }

  /**
   * Collects posts for a query, deduplicating concurrent requests.
   */
  async collectForQuery(query: string): Promise<CollectionResult> {
    // Deduplicate: if already collecting for this query, skip
    if (this.inProgress.has(query)) {
      logger.debug('Collection already in progress for query', { query });
      return { postsCollected: 0, timeElapsed: 0, errors: ['already in progress'] };
    }

    this.inProgress.add(query);
    const start = Date.now();

    try {
      const posts = await this.redditClient.collectFromAll(query, { maxPosts: 100 });
      this.lastCollected.set(query, new Date());

      logger.info('On-demand collection complete', {
        query,
        postsCollected: posts.length,
        timeElapsed: Date.now() - start,
      });

      return {
        postsCollected: posts.length,
        timeElapsed: Date.now() - start,
        errors: [],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('On-demand collection failed', { query, error });
      return { postsCollected: 0, timeElapsed: Date.now() - start, errors: [msg] };
    } finally {
      this.inProgress.delete(query);
    }
  }

  /**
   * Triggers collection in the background without blocking.
   */
  collectInBackground(query: string): void {
    if (!this.shouldCollect(query)) return;

    this.collectForQuery(query).catch((error) => {
      logger.error('Background collection failed', { query, error });
    });
  }
}
