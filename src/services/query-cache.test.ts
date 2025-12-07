import { QueryCache } from './query-cache';
import { SearchResults } from './query-processor';

describe('QueryCache', () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache({ ttlSeconds: 1, maxSize: 3 });
  });

  const createMockResults = (query: string): SearchResults => ({
    results: [
      {
        docId: 'doc1',
        title: 'Test',
        url: 'http://example.com',
        snippet: 'test snippet',
        score: 1.0,
        metadata: {
          author: 'user1',
          subreddit: 'test',
          redditScore: 10,
          commentCount: 5,
          createdUtc: new Date(),
        },
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 10,
    queryTimeMs: 10,
  });

  describe('get and set', () => {
    it('should store and retrieve cached results', () => {
      const results = createMockResults('test query');
      cache.set('test query', 1, 10, results);

      const cached = cache.get('test query', 1, 10);
      expect(cached).toEqual(results);
    });

    it('should return undefined for non-existent cache entry', () => {
      const cached = cache.get('nonexistent', 1, 10);
      expect(cached).toBeUndefined();
    });

    it('should differentiate between different query parameters', () => {
      const results1 = createMockResults('query1');
      const results2 = createMockResults('query2');

      cache.set('query1', 1, 10, results1);
      cache.set('query2', 1, 10, results2);

      expect(cache.get('query1', 1, 10)).toEqual(results1);
      expect(cache.get('query2', 1, 10)).toEqual(results2);
    });

    it('should differentiate between different page numbers', () => {
      const results1 = createMockResults('query');
      const results2 = createMockResults('query');

      cache.set('query', 1, 10, results1);
      cache.set('query', 2, 10, results2);

      expect(cache.get('query', 1, 10)).toEqual(results1);
      expect(cache.get('query', 2, 10)).toEqual(results2);
    });

    it('should differentiate between different page sizes', () => {
      const results1 = createMockResults('query');
      const results2 = createMockResults('query');

      cache.set('query', 1, 10, results1);
      cache.set('query', 1, 20, results2);

      expect(cache.get('query', 1, 10)).toEqual(results1);
      expect(cache.get('query', 1, 20)).toEqual(results2);
    });
  });

  describe('TTL expiration', () => {
    it('should return undefined for expired entries', async () => {
      const results = createMockResults('test query');
      cache.set('test query', 1, 10, results);

      // Wait for TTL to expire (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const cached = cache.get('test query', 1, 10);
      expect(cached).toBeUndefined();
    });

    it('should return valid entries before expiration', () => {
      const results = createMockResults('test query');
      cache.set('test query', 1, 10, results);

      const cached = cache.get('test query', 1, 10);
      expect(cached).toEqual(results);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when at capacity', () => {
      const results1 = createMockResults('query1');
      const results2 = createMockResults('query2');
      const results3 = createMockResults('query3');
      const results4 = createMockResults('query4');

      // Fill cache to capacity (3 entries)
      cache.set('query1', 1, 10, results1);
      cache.set('query2', 1, 10, results2);
      cache.set('query3', 1, 10, results3);

      // Add 4th entry, should evict query1 (least recently used)
      cache.set('query4', 1, 10, results4);

      expect(cache.get('query1', 1, 10)).toBeUndefined();
      expect(cache.get('query2', 1, 10)).toEqual(results2);
      expect(cache.get('query3', 1, 10)).toEqual(results3);
      expect(cache.get('query4', 1, 10)).toEqual(results4);
    });

    it('should update access order on get', () => {
      const results1 = createMockResults('query1');
      const results2 = createMockResults('query2');
      const results3 = createMockResults('query3');
      const results4 = createMockResults('query4');

      cache.set('query1', 1, 10, results1);
      cache.set('query2', 1, 10, results2);
      cache.set('query3', 1, 10, results3);

      // Access query1 to make it most recently used
      cache.get('query1', 1, 10);

      // Add 4th entry, should evict query2 (now least recently used)
      cache.set('query4', 1, 10, results4);

      expect(cache.get('query1', 1, 10)).toEqual(results1);
      expect(cache.get('query2', 1, 10)).toBeUndefined();
      expect(cache.get('query3', 1, 10)).toEqual(results3);
      expect(cache.get('query4', 1, 10)).toEqual(results4);
    });
  });

  describe('invalidate', () => {
    it('should invalidate all cache entries', () => {
      const results1 = createMockResults('query1');
      const results2 = createMockResults('query2');

      cache.set('query1', 1, 10, results1);
      cache.set('query2', 1, 10, results2);

      cache.invalidate('*');

      expect(cache.get('query1', 1, 10)).toBeUndefined();
      expect(cache.get('query2', 1, 10)).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      const results1 = createMockResults('query1');
      const results2 = createMockResults('query2');

      cache.set('query1', 1, 10, results1);
      cache.set('query2', 1, 10, results2);

      cache.clear();

      expect(cache.get('query1', 1, 10)).toBeUndefined();
      expect(cache.get('query2', 1, 10)).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should track cache hits and misses', () => {
      const results = createMockResults('query');
      cache.set('query', 1, 10, results);

      // Hit
      cache.get('query', 1, 10);
      
      // Miss
      cache.get('nonexistent', 1, 10);

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.size).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      const results = createMockResults('query');
      cache.set('query', 1, 10, results);

      // 3 hits
      cache.get('query', 1, 10);
      cache.get('query', 1, 10);
      cache.get('query', 1, 10);
      
      // 1 miss
      cache.get('nonexistent', 1, 10);

      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.75);
    });

    it('should handle zero total requests', () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset statistics', () => {
      const results = createMockResults('query');
      cache.set('query', 1, 10, results);

      cache.get('query', 1, 10);
      cache.get('nonexistent', 1, 10);

      cache.resetStats();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });
});
