import { RedditCollector, RedditConfig } from './reddit-collector';
import { DocumentStore } from './document-store';
import { Document } from '../models/document';

describe('RedditCollector', () => {
  let collector: RedditCollector;
  let documentStore: DocumentStore;
  let config: RedditConfig;

  beforeEach(() => {
    documentStore = new DocumentStore();
    config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      userAgent: 'test-user-agent',
      subreddits: ['test', 'programming'],
      maxPostsPerSubreddit: 10,
      concurrentRequests: 2,
    };
    collector = new RedditCollector(config, documentStore);
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(collector).toBeDefined();
    });

    it('should use default values for optional config', () => {
      const minimalConfig: RedditConfig = {
        clientId: 'test',
        clientSecret: 'test',
        userAgent: 'test',
        subreddits: ['test'],
      };
      const minimalCollector = new RedditCollector(minimalConfig, documentStore);
      expect(minimalCollector).toBeDefined();
    });
  });

  describe('collectPosts', () => {
    it('should return empty array (stub implementation)', async () => {
      const posts = await collector.collectPosts('test', 10);
      expect(posts).toEqual([]);
    });
  });

  describe('collectComments', () => {
    it('should return empty array (stub implementation)', async () => {
      const comments = await collector.collectComments('test-post-id');
      expect(comments).toEqual([]);
    });
  });

  describe('runCollectionCycle', () => {
    it('should complete collection cycle successfully', async () => {
      const result = await collector.runCollectionCycle();

      expect(result).toBeDefined();
      expect(result.documentsCollected).toBe(0); // Stub returns no documents
      expect(result.errors).toEqual([]);
      expect(result.subredditsProcessed).toEqual(['test', 'programming']);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.endTime.getTime()).toBeGreaterThanOrEqual(result.startTime.getTime());
    });

    it('should handle errors gracefully', async () => {
      // Override collectPosts to throw an error
      jest.spyOn(collector as any, 'collectPosts').mockRejectedValue(new Error('API error'));

      const result = await collector.runCollectionCycle();

      expect(result.documentsCollected).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('API error');
    });
  });

  describe('scheduleCollection', () => {
    it('should schedule collection at specified interval', () => {
      jest.useFakeTimers();
      const runCollectionCycleSpy = jest.spyOn(collector, 'runCollectionCycle');

      const intervalMs = 1000;
      const timerId = collector.scheduleCollection(intervalMs);

      expect(timerId).toBeDefined();

      // Fast-forward time
      jest.advanceTimersByTime(intervalMs);
      expect(runCollectionCycleSpy).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(intervalMs);
      expect(runCollectionCycleSpy).toHaveBeenCalledTimes(2);

      clearInterval(timerId);
      jest.useRealTimers();
    });
  });

  describe('duplicate detection', () => {
    it('should not process duplicate documents', async () => {
      const mockDoc: Document = {
        id: 'doc-1',
        type: 'post',
        title: 'Test Post',
        content: 'Test content',
        url: 'https://reddit.com/test',
        author: 'testuser',
        subreddit: 'test',
        redditScore: 10,
        commentCount: 5,
        createdUtc: new Date(),
        collectedAt: new Date(),
        processed: false,
      };

      // Mock collectPosts to return the same document twice
      jest.spyOn(collector as any, 'collectPosts').mockResolvedValue([mockDoc, mockDoc]);

      const result = await collector.runCollectionCycle();

      // Should only process the document once due to duplicate detection
      expect(result.documentsCollected).toBe(1);
    });
  });

  describe('retry logic', () => {
    it('should retry on failure with exponential backoff', async () => {
      // Create a new collector for this test to avoid circuit breaker state
      const freshCollector = new RedditCollector(
        {
          clientId: 'test',
          clientSecret: 'test',
          userAgent: 'test',
          subreddits: ['test'],
        },
        documentStore
      );

      // Test the withRetry method directly
      let attempts = 0;
      const mockFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await (freshCollector as any).withRetry(mockFn, 'Test operation');

      expect(attempts).toBe(3);
      expect(result).toBe('success');
    });

    it('should fail after max retry attempts', async () => {
      // Create a new collector for this test to avoid circuit breaker state
      const freshCollector = new RedditCollector(
        {
          clientId: 'test',
          clientSecret: 'test',
          userAgent: 'test',
          subreddits: ['test'],
        },
        documentStore
      );

      const mockFn = async () => {
        throw new Error('Persistent failure');
      };

      await expect((freshCollector as any).withRetry(mockFn, 'Test operation')).rejects.toThrow(
        'failed after 3 attempts'
      );
    });
  });

  describe('rate limit handling', () => {
    it('should detect rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded (429)');
      const normalError = new Error('Some other error');

      expect((collector as any).isRateLimitError(rateLimitError)).toBe(true);
      expect((collector as any).isRateLimitError(normalError)).toBe(false);
      expect((collector as any).isRateLimitError(new Error('Too many requests'))).toBe(true);
      expect((collector as any).isRateLimitError(new Error('RATE LIMIT'))).toBe(true);
    });
  });
});
