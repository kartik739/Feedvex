import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({ requestsPerWindow: 3, windowSeconds: 1 });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const result1 = rateLimiter.checkRateLimit('client1');
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(3);

      rateLimiter.recordRequest('client1');

      const result2 = rateLimiter.checkRateLimit('client1');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(2);
    });

    it('should reject requests when limit exceeded', () => {
      // Make 3 requests (at limit)
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');

      const result = rateLimiter.checkRateLimit('client1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track requests per client separately', () => {
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');

      const result1 = rateLimiter.checkRateLimit('client1');
      expect(result1.allowed).toBe(false);

      const result2 = rateLimiter.checkRateLimit('client2');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should return reset time', () => {
      rateLimiter.recordRequest('client1');

      const result = rateLimiter.checkRateLimit('client1');
      expect(result.resetTime).toBeInstanceOf(Date);
      expect(result.resetTime.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('recordRequest', () => {
    it('should track request count', () => {
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');

      const result = rateLimiter.checkRateLimit('client1');
      expect(result.remaining).toBe(1);
    });

    it('should handle multiple clients', () => {
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client2');
      rateLimiter.recordRequest('client1');

      const result1 = rateLimiter.checkRateLimit('client1');
      expect(result1.remaining).toBe(1);

      const result2 = rateLimiter.checkRateLimit('client2');
      expect(result2.remaining).toBe(2);
    });
  });

  describe('sliding window', () => {
    it('should allow requests after window expires', async () => {
      // Fill up the limit
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');

      const result1 = rateLimiter.checkRateLimit('client1');
      expect(result1.allowed).toBe(false);

      // Wait for window to expire (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result2 = rateLimiter.checkRateLimit('client1');
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should prevent burst traffic at window boundaries', async () => {
      // Make 2 requests
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');

      // Wait 0.5 seconds (half window)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Make 1 more request (total 3, at limit)
      rateLimiter.recordRequest('client1');

      const result = rateLimiter.checkRateLimit('client1');
      expect(result.allowed).toBe(false);

      // Even though we're at the "boundary", the sliding window
      // should still enforce the limit
    });

    it('should gradually allow more requests as window slides', async () => {
      // Fill up the limit
      rateLimiter.recordRequest('client1');
      await new Promise((resolve) => setTimeout(resolve, 100));

      rateLimiter.recordRequest('client1');
      await new Promise((resolve) => setTimeout(resolve, 100));

      rateLimiter.recordRequest('client1');

      // At limit
      const result1 = rateLimiter.checkRateLimit('client1');
      expect(result1.allowed).toBe(false);

      // Wait for first request to expire (1 second + buffer from first request)
      await new Promise((resolve) => setTimeout(resolve, 900));

      // First request should have expired, allowing more
      const result2 = rateLimiter.checkRateLimit('client1');
      expect(result2.allowed).toBe(true);
      // Could be 1 or 2 depending on exact timing
      expect(result2.remaining).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRemainingQuota', () => {
    it('should return remaining requests', () => {
      expect(rateLimiter.getRemainingQuota('client1')).toBe(3);

      rateLimiter.recordRequest('client1');
      expect(rateLimiter.getRemainingQuota('client1')).toBe(2);

      rateLimiter.recordRequest('client1');
      expect(rateLimiter.getRemainingQuota('client1')).toBe(1);

      rateLimiter.recordRequest('client1');
      expect(rateLimiter.getRemainingQuota('client1')).toBe(0);
    });
  });

  describe('clearClient', () => {
    it('should clear rate limit data for a client', () => {
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');

      rateLimiter.clearClient('client1');

      const result = rateLimiter.checkRateLimit('client1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
    });

    it('should not affect other clients', () => {
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client2');

      rateLimiter.clearClient('client1');

      const result1 = rateLimiter.checkRateLimit('client1');
      expect(result1.remaining).toBe(3);

      const result2 = rateLimiter.checkRateLimit('client2');
      expect(result2.remaining).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should clear all rate limit data', () => {
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client2');

      rateLimiter.clearAll();

      const result1 = rateLimiter.checkRateLimit('client1');
      expect(result1.remaining).toBe(3);

      const result2 = rateLimiter.checkRateLimit('client2');
      expect(result2.remaining).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client1');
      rateLimiter.recordRequest('client2');

      const stats = rateLimiter.getStats();
      expect(stats.totalClients).toBe(2);
      expect(stats.totalRequests).toBe(3);
    });

    it('should return zero for empty limiter', () => {
      const stats = rateLimiter.getStats();
      expect(stats.totalClients).toBe(0);
      expect(stats.totalRequests).toBe(0);
    });
  });
});
