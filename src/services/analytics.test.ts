import { AnalyticsService } from './analytics';

describe('AnalyticsService', () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService();
  });

  describe('logQuery', () => {
    it('should log a query event', () => {
      analytics.logQuery('test query', 10, 50);

      const stats = analytics.getQueryStats('test query');
      expect(stats.totalSearches).toBe(1);
      expect(stats.averageLatencyMs).toBe(50);
      expect(stats.averageResultCount).toBe(10);
    });

    it('should handle multiple queries', () => {
      analytics.logQuery('query1', 5, 30);
      analytics.logQuery('query2', 10, 40);
      analytics.logQuery('query1', 8, 35);

      const stats1 = analytics.getQueryStats('query1');
      expect(stats1.totalSearches).toBe(2);
      expect(stats1.averageLatencyMs).toBe(32.5);
      expect(stats1.averageResultCount).toBe(6.5);

      const stats2 = analytics.getQueryStats('query2');
      expect(stats2.totalSearches).toBe(1);
    });
  });

  describe('logClick', () => {
    it('should log a click event', () => {
      analytics.logQuery('test query', 10, 50);
      analytics.logClick('test query', 'doc-1', 0);

      const stats = analytics.getQueryStats('test query');
      expect(stats.totalClicks).toBe(1);
      expect(stats.averageClickPosition).toBe(0);
    });

    it('should track multiple clicks', () => {
      analytics.logQuery('test query', 10, 50);
      analytics.logClick('test query', 'doc-1', 0);
      analytics.logClick('test query', 'doc-2', 2);
      analytics.logClick('test query', 'doc-3', 4);

      const stats = analytics.getQueryStats('test query');
      expect(stats.totalClicks).toBe(3);
      expect(stats.averageClickPosition).toBe(2); // (0 + 2 + 4) / 3
    });
  });

  describe('calculateCTR', () => {
    it('should calculate click-through rate correctly', () => {
      // 2 searches, 1 click = 50% CTR
      analytics.logQuery('test query', 10, 50);
      analytics.logQuery('test query', 10, 50);
      analytics.logClick('test query', 'doc-1', 0);

      const ctr = analytics.calculateCTR('test query');
      expect(ctr).toBe(0.5);
    });

    it('should return 0 CTR when no searches', () => {
      const ctr = analytics.calculateCTR('non-existent query');
      expect(ctr).toBe(0);
    });

    it('should return 0 CTR when no clicks', () => {
      analytics.logQuery('test query', 10, 50);
      const ctr = analytics.calculateCTR('test query');
      expect(ctr).toBe(0);
    });

    it('should handle 100% CTR', () => {
      analytics.logQuery('test query', 10, 50);
      analytics.logClick('test query', 'doc-1', 0);

      const ctr = analytics.calculateCTR('test query');
      expect(ctr).toBe(1.0);
    });
  });

  describe('getQueryStats', () => {
    it('should return complete statistics for a query', () => {
      analytics.logQuery('test query', 10, 50);
      analytics.logQuery('test query', 15, 60);
      analytics.logClick('test query', 'doc-1', 0);
      analytics.logClick('test query', 'doc-2', 2);

      const stats = analytics.getQueryStats('test query');

      expect(stats.query).toBe('test query');
      expect(stats.totalSearches).toBe(2);
      expect(stats.totalClicks).toBe(2);
      expect(stats.clickThroughRate).toBe(1.0); // 2 clicks / 2 searches
      expect(stats.averageLatencyMs).toBe(55); // (50 + 60) / 2
      expect(stats.averageResultCount).toBe(12.5); // (10 + 15) / 2
      expect(stats.averageClickPosition).toBe(1); // (0 + 2) / 2
    });

    it('should return zero stats for non-existent query', () => {
      const stats = analytics.getQueryStats('non-existent');

      expect(stats.totalSearches).toBe(0);
      expect(stats.totalClicks).toBe(0);
      expect(stats.clickThroughRate).toBe(0);
      expect(stats.averageLatencyMs).toBe(0);
      expect(stats.averageResultCount).toBe(0);
      expect(stats.averageClickPosition).toBe(0);
    });
  });

  describe('getPopularQueries', () => {
    it('should return queries sorted by frequency', () => {
      analytics.logQuery('query1', 10, 50);
      analytics.logQuery('query2', 10, 50);
      analytics.logQuery('query1', 10, 50);
      analytics.logQuery('query3', 10, 50);
      analytics.logQuery('query1', 10, 50);
      analytics.logQuery('query2', 10, 50);

      const popular = analytics.getPopularQueries(3);

      expect(popular.length).toBe(3);
      expect(popular[0].query).toBe('query1');
      expect(popular[0].count).toBe(3);
      expect(popular[1].query).toBe('query2');
      expect(popular[1].count).toBe(2);
      expect(popular[2].query).toBe('query3');
      expect(popular[2].count).toBe(1);
    });

    it('should respect the limit parameter', () => {
      analytics.logQuery('query1', 10, 50);
      analytics.logQuery('query2', 10, 50);
      analytics.logQuery('query3', 10, 50);

      const popular = analytics.getPopularQueries(2);
      expect(popular.length).toBe(2);
    });

    it('should return empty array when no queries', () => {
      const popular = analytics.getPopularQueries(10);
      expect(popular).toEqual([]);
    });
  });

  describe('getResponseTimeStats', () => {
    it('should calculate response time statistics', () => {
      // Add queries with known latencies
      const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      latencies.forEach((latency) => {
        analytics.logQuery('test', 10, latency);
      });

      const stats = analytics.getResponseTimeStats();

      expect(stats.min).toBe(10);
      expect(stats.max).toBe(100);
      expect(stats.mean).toBe(55); // Average of 10-100
      expect(stats.median).toBe(50);
      expect(stats.p95).toBeGreaterThanOrEqual(90);
      expect(stats.p99).toBeGreaterThanOrEqual(95);
    });

    it('should return zero stats when no queries', () => {
      const stats = analytics.getResponseTimeStats();

      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.p99).toBe(0);
    });

    it('should handle single query', () => {
      analytics.logQuery('test', 10, 50);

      const stats = analytics.getResponseTimeStats();

      expect(stats.min).toBe(50);
      expect(stats.max).toBe(50);
      expect(stats.mean).toBe(50);
      expect(stats.median).toBe(50);
      expect(stats.p95).toBe(50);
      expect(stats.p99).toBe(50);
    });
  });

  describe('getOverallMetrics', () => {
    it('should return comprehensive metrics', () => {
      analytics.logQuery('query1', 10, 50);
      analytics.logQuery('query2', 15, 60);
      analytics.logQuery('query1', 12, 55);
      analytics.logClick('query1', 'doc-1', 0);

      const metrics = analytics.getOverallMetrics();

      expect(metrics.totalQueries).toBe(3);
      expect(metrics.totalClicks).toBe(1);
      expect(metrics.overallCTR).toBeCloseTo(0.333, 2); // 1 click / 3 queries
      expect(metrics.uniqueQueries).toBe(2);
      expect(metrics.responseTimeStats).toBeDefined();
      expect(metrics.popularQueries).toBeDefined();
      expect(metrics.popularQueries.length).toBeGreaterThan(0);
    });

    it('should handle empty analytics', () => {
      const metrics = analytics.getOverallMetrics();

      expect(metrics.totalQueries).toBe(0);
      expect(metrics.totalClicks).toBe(0);
      expect(metrics.overallCTR).toBe(0);
      expect(metrics.uniqueQueries).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all analytics data', () => {
      analytics.logQuery('test', 10, 50);
      analytics.logClick('test', 'doc-1', 0);

      analytics.clear();

      const metrics = analytics.getOverallMetrics();
      expect(metrics.totalQueries).toBe(0);
      expect(metrics.totalClicks).toBe(0);
    });
  });

  describe('event capacity limits', () => {
    it('should not exceed max events for queries', () => {
      const smallAnalytics = new AnalyticsService({ maxEvents: 5 });

      // Log more than max events
      for (let i = 0; i < 10; i++) {
        smallAnalytics.logQuery(`query${i}`, 10, 50);
      }

      const metrics = smallAnalytics.getOverallMetrics();
      expect(metrics.totalQueries).toBe(5); // Should only keep last 5
    });

    it('should not exceed max events for clicks', () => {
      const smallAnalytics = new AnalyticsService({ maxEvents: 5 });

      // Log more than max events
      for (let i = 0; i < 10; i++) {
        smallAnalytics.logClick(`query${i}`, `doc-${i}`, i);
      }

      const metrics = smallAnalytics.getOverallMetrics();
      expect(metrics.totalClicks).toBe(5); // Should only keep last 5
    });
  });
});
