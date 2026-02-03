import { PostgresClient } from './postgres-client';
import { UpstashCache } from './upstash-cache';
import { RedditOAuthClient } from './reddit-oauth-client';
import { logger } from '../utils/logger';

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  details?: Record<string, any>;
  error?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    redditApi: ComponentHealth;
  };
}

/**
 * HealthChecker - verifies all dependencies are working.
 *
 * Why comprehensive health checks? Railway uses the /health endpoint to
 * decide if the service is working. If any critical dependency is down,
 * we return 503 so Railway can restart or alert. We also include response
 * times to help diagnose performance issues.
 *
 * Results are cached for 5 seconds to prevent overloading dependencies
 * when Railway checks every 30 seconds.
 */
export class HealthChecker {
  private lastResult: HealthCheckResult | null = null;
  private lastCheckTime = 0;
  private readonly cacheTtlMs = 5_000;

  constructor(
    private db?: PostgresClient,
    private cache?: UpstashCache,
    private reddit?: RedditOAuthClient
  ) {}

  async check(): Promise<HealthCheckResult> {
    // Return cached result if fresh
    if (this.lastResult && Date.now() - this.lastCheckTime < this.cacheTtlMs) {
      return this.lastResult;
    }

    const [database, redis, memory, redditApi] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkRedditApi(),
    ]);

    const allUp = [database, redis].every((c) => c.status === 'up');
    const anyDown = [database, redis].some((c) => c.status === 'down');

    const result: HealthCheckResult = {
      status: anyDown ? 'unhealthy' : allUp ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      components: { database, redis, memory, redditApi },
    };

    this.lastResult = result;
    this.lastCheckTime = Date.now();
    return result;
  }

  async checkDatabase(): Promise<ComponentHealth> {
    if (!this.db) {
      return { status: 'degraded', details: { note: 'using in-memory store' } };
    }

    const start = Date.now();
    try {
      const health = await this.db.healthCheck();
      return {
        status: health.healthy ? 'up' : 'down',
        responseTime: Date.now() - start,
        details: { provider: 'Railway', ...health.details },
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async checkRedis(): Promise<ComponentHealth> {
    if (!this.cache?.isConfigured()) {
      return { status: 'degraded', details: { note: 'cache not configured' } };
    }

    const start = Date.now();
    try {
      const ok = await this.cache.healthCheck();
      return {
        status: ok ? 'up' : 'down',
        responseTime: Date.now() - start,
        details: { provider: 'Upstash' },
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  checkMemory(): ComponentHealth {
    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const totalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const pct = Math.round((usedMB / totalMB) * 100);

    return {
      status: pct > 90 ? 'degraded' : 'up',
      details: { usedMB, totalMB, percentage: pct },
    };
  }

  async checkRedditApi(): Promise<ComponentHealth> {
    if (!this.reddit?.isConfigured()) {
      return { status: 'degraded', details: { note: 'Reddit OAuth not configured' } };
    }

    const status = this.reddit.getRateLimitStatus();
    return {
      status: 'up',
      details: {
        rateLimitRemaining: status.remaining,
        rateLimitLimit: status.limit,
      },
    };
  }
}
