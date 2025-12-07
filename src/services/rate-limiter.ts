/**
 * Configuration for RateLimiter
 */
export interface RateLimiterConfig {
  requestsPerWindow?: number; // Maximum requests per time window
  windowSeconds?: number; // Time window in seconds
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

/**
 * Request record for sliding window
 */
interface RequestRecord {
  timestamp: number;
}

/**
 * RateLimiter controls request rate to prevent abuse
 * Implements requirements 9.1-9.5 for rate limiting
 * 
 * Note: This is an in-memory implementation using sliding window algorithm.
 * For production with multiple instances, use Redis.
 */
export class RateLimiter {
  private config: RateLimiterConfig;
  private requests: Map<string, RequestRecord[]>; // clientId -> request timestamps

  constructor(config: RateLimiterConfig = {}) {
    this.config = {
      requestsPerWindow: 100,
      windowSeconds: 60,
      ...config,
    };
    this.requests = new Map();
  }

  /**
   * Cleans up expired requests from the sliding window
   * @param clientId Client identifier
   * @param now Current timestamp
   */
  private cleanupExpiredRequests(clientId: string, now: number): void {
    const windowMs = this.config.windowSeconds! * 1000;
    const cutoffTime = now - windowMs;

    const clientRequests = this.requests.get(clientId);
    if (!clientRequests) {
      return;
    }

    // Remove requests older than the window
    const validRequests = clientRequests.filter(
      (record) => record.timestamp > cutoffTime
    );

    if (validRequests.length === 0) {
      this.requests.delete(clientId);
    } else {
      this.requests.set(clientId, validRequests);
    }
  }

  /**
   * Records a request for a client
   * Requirement 9.1: Track request counts per client identifier within a time window
   * @param clientId Client identifier (e.g., IP address, API key)
   */
  recordRequest(clientId: string): void {
    const now = Date.now();

    // Clean up expired requests first
    this.cleanupExpiredRequests(clientId, now);

    // Add new request
    const clientRequests = this.requests.get(clientId) || [];
    clientRequests.push({ timestamp: now });
    this.requests.set(clientId, clientRequests);
  }

  /**
   * Checks if a client has exceeded the rate limit
   * Requirements 9.1, 9.2, 9.3, 9.4, 9.5: Track requests, reject when exceeded, return retry-after
   * @param clientId Client identifier
   * @returns Rate limit check result
   */
  checkRateLimit(clientId: string): RateLimitResult {
    const now = Date.now();

    // Clean up expired requests
    this.cleanupExpiredRequests(clientId, now);

    const clientRequests = this.requests.get(clientId) || [];
    const requestCount = clientRequests.length;
    const limit = this.config.requestsPerWindow!;

    // Calculate remaining quota
    const remaining = Math.max(0, limit - requestCount);

    // Calculate reset time (end of current window)
    const windowMs = this.config.windowSeconds! * 1000;
    let resetTime: Date;

    if (clientRequests.length > 0) {
      // Reset time is when the oldest request expires
      const oldestRequest = clientRequests[0].timestamp;
      resetTime = new Date(oldestRequest + windowMs);
    } else {
      // No requests yet, reset time is end of current window
      resetTime = new Date(now + windowMs);
    }

    // Requirement 9.2: Reject request when limit exceeded
    // Requirement 9.5: Use sliding window algorithm to prevent burst traffic
    const allowed = requestCount < limit;

    return {
      allowed,
      remaining,
      resetTime,
    };
  }

  /**
   * Gets remaining quota for a client
   * Requirement 9.4: Support configurable limits per time window
   * @param clientId Client identifier
   * @returns Remaining requests in current window
   */
  getRemainingQuota(clientId: string): number {
    const now = Date.now();
    this.cleanupExpiredRequests(clientId, now);

    const clientRequests = this.requests.get(clientId) || [];
    const limit = this.config.requestsPerWindow!;
    return Math.max(0, limit - clientRequests.length);
  }

  /**
   * Clears all rate limit data for a client
   * @param clientId Client identifier
   */
  clearClient(clientId: string): void {
    this.requests.delete(clientId);
  }

  /**
   * Clears all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Gets statistics for monitoring
   */
  getStats(): {
    totalClients: number;
    totalRequests: number;
  } {
    let totalRequests = 0;
    for (const requests of this.requests.values()) {
      totalRequests += requests.length;
    }

    return {
      totalClients: this.requests.size,
      totalRequests,
    };
  }
}
