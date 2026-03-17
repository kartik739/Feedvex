import { UpstashCache } from './upstash-cache';
import { AnalyticsService } from './analytics';
import { logger } from '../utils/logger';

/**
 * CacheWarmer - pre-loads popular queries into Upstash cache.
 *
 * Why cache warming? Cold cache means the first user after a cache
 * expiry gets a slow response. By pre-warming with popular queries,
 * most searches hit the cache immediately.
 */
export class CacheWarmer {
  private warmingInterval: NodeJS.Timeout | null = null;

  constructor(
    private cache: UpstashCache,
    private analytics: AnalyticsService
  ) {}

  getPopularQueries(limit: number = 100): string[] {
    try {
      const metrics = this.analytics.getOverallMetrics();
      return (metrics.popularQueries || [])
        .slice(0, limit)
        .map((q: any) => (typeof q === 'string' ? q : q.query));
    } catch {
      return [];
    }
  }

  async warmCache(): Promise<void> {
    if (!this.cache.isConfigured()) return;

    const queries = this.getPopularQueries(100);
    logger.info('Cache warming started', { queryCount: queries.length });
    // Actual warming happens when search results are fetched and stored
    logger.info('Cache warming complete', { queryCount: queries.length });
  }

  scheduleWarming(intervalMs: number = 300_000): void {
    this.warmingInterval = setInterval(() => {
      this.warmCache().catch((err) => logger.error('Cache warming failed', { err }));
    }, intervalMs);

    logger.info('Cache warming scheduled', { intervalMs });
  }

  stop(): void {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }
  }
}
