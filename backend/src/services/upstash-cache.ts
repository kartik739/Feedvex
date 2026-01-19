import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

export interface SearchResults {
  results: any[];
  totalCount: number;
  page: number;
  pageSize: number;
  query: string;
}

/**
 * UpstashCache - serverless Redis caching for search results and rate limiting.
 *
 * Why Upstash over self-hosted Redis? Upstash is serverless - no connection
 * pooling needed, global edge caching, and a generous free tier (10K commands/day).
 * We don't have to manage any infrastructure.
 */
export class UpstashCache {
  private client: Redis | null = null;
  private readonly ttlSeconds = 300; // 5 minutes

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.client = Redis.fromEnv();
        logger.info('Upstash Redis client initialized');
      } catch {
        // fromEnv() needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
        // Fall back to URL-based init if those aren't set
        try {
          this.client = new Redis({ url: redisUrl, token: '' });
        } catch (err) {
          logger.warn('Upstash Redis init failed - cache disabled', { err });
        }
      }
    } else {
      logger.warn('REDIS_URL not set - cache disabled');
    }
  }

  /**
   * Generates a consistent cache key for a search query.
   * Format: search:{query}:{page}:{pageSize}
   */
  private cacheKey(query: string, page: number, pageSize: number): string {
    return `search:${query.toLowerCase().trim()}:${page}:${pageSize}`;
  }

  /**
   * Gets cached search results. Returns null on cache miss or error.
   */
  async get(query: string, page: number, pageSize: number): Promise<SearchResults | null> {
    if (!this.client) return null;

    try {
      const key = this.cacheKey(query, page, pageSize);
      const data = await this.client.get<SearchResults>(key);
      if (data) {
        logger.debug('Cache hit', { key });
        return data;
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      // Graceful degradation - cache failure should never break search
      logger.warn('Cache get failed - falling back to DB', { error });
      return null;
    }
  }

  /**
   * Stores search results in cache with TTL.
   */
  async set(query: string, page: number, pageSize: number, results: SearchResults): Promise<void> {
    if (!this.client) return;

    try {
      const key = this.cacheKey(query, page, pageSize);
      await this.client.setex(key, this.ttlSeconds, results);
      logger.debug('Cache set', { key, ttl: this.ttlSeconds });
    } catch (error) {
      logger.warn('Cache set failed', { error });
    }
  }

  /**
   * Invalidates all cache entries matching a pattern.
   */
  async invalidate(pattern: string): Promise<number> {
    if (!this.client) return 0;

    try {
      const keys = await this.client.keys(`search:${pattern}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug('Cache invalidated', { pattern, count: keys.length });
      }
      return keys.length;
    } catch (error) {
      logger.warn('Cache invalidation failed', { error });
      return 0;
    }
  }

  /**
   * Increments request count for rate limiting. Returns new count.
   */
  async incrementRequestCount(ip: string, windowMs: number): Promise<number> {
    if (!this.client) return 0;

    try {
      const key = `ratelimit:${ip}`;
      const count = await this.client.incr(key);
      if (count === 1) {
        // Set expiry on first increment
        await this.client.pexpire(key, windowMs);
      }
      return count;
    } catch (error) {
      logger.warn('Rate limit increment failed', { error });
      return 0;
    }
  }

  /**
   * Gets current request count for an IP.
   */
  async getRequestCount(ip: string): Promise<number> {
    if (!this.client) return 0;

    try {
      const count = await this.client.get<number>(`ratelimit:${ip}`);
      return count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Health check - pings Upstash.
   */
  async healthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}
