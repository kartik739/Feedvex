import { UpstashCache } from './upstash-cache';
import { logger } from '../utils/logger';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

/**
 * UpstashRateLimiter - IP-based rate limiting using Upstash Redis.
 *
 * Why Upstash for rate limiting? We use Redis INCR with TTL to count
 * requests per IP per time window. This is atomic and works across
 * multiple server instances. Falls back to allowing requests if
 * Upstash is unavailable (fail open for availability).
 */
export class UpstashRateLimiter {
  private readonly windowMs = 60_000; // 1 minute
  private readonly maxRequests = 100;

  constructor(private cache: UpstashCache) {}

  async checkLimit(ip: string): Promise<RateLimitResult> {
    if (!this.cache.isConfigured()) {
      // No cache - allow all requests in dev mode
      return { allowed: true, remaining: this.maxRequests, resetTime: new Date() };
    }

    try {
      const count = await this.cache.incrementRequestCount(ip, this.windowMs);
      const remaining = Math.max(0, this.maxRequests - count);
      const resetTime = new Date(Date.now() + this.windowMs);

      if (count > this.maxRequests) {
        logger.warn('Rate limit exceeded', { ip, count });
        return { allowed: false, remaining: 0, resetTime };
      }

      return { allowed: true, remaining, resetTime };
    } catch (error) {
      // Fail open - don't block requests if rate limiter errors
      logger.warn('Rate limiter error - allowing request', { error });
      return { allowed: true, remaining: this.maxRequests, resetTime: new Date() };
    }
  }
}
