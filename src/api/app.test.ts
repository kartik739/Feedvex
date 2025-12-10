import request from 'supertest';
import { Express } from 'express';
import { createApp } from './app';
import { QueryProcessor } from '../services/query-processor';
import { AutocompleteService } from '../services/autocomplete';
import { RateLimiter } from '../services/rate-limiter';
import { AnalyticsService } from '../services/analytics';
import { DocumentStore } from '../services/document-store';
import { Indexer } from '../services/indexer';
import { TextProcessor } from '../services/text-processor';
import { Ranker } from '../services/ranker';
import { Document } from '../models/document';

describe('API Application', () => {
  let app: Express;
  let queryProcessor: QueryProcessor;
  let autocompleteService: AutocompleteService;
  let rateLimiter: RateLimiter;
  let analyticsService: AnalyticsService;
  let documentStore: DocumentStore;
  let indexer: Indexer;

  beforeEach(() => {
    // Set up services
    documentStore = new DocumentStore();
    indexer = new Indexer();
    const textProcessor = new TextProcessor();
    const ranker = new Ranker({}, indexer, documentStore);
    queryProcessor = new QueryProcessor({}, textProcessor, indexer, ranker, documentStore);
    autocompleteService = new AutocompleteService();
    rateLimiter = new RateLimiter({ requestsPerWindow: 100, windowSeconds: 60 });
    analyticsService = new AnalyticsService();

    // Create app
    app = createApp(
      queryProcessor,
      autocompleteService,
      rateLimiter,
      analyticsService,
      documentStore,
      indexer,
      { enableLogging: false }
    );

    // Add some test data
    const testDoc: Document = {
      id: 'doc-1',
      type: 'post',
      title: 'Test Post',
      content: 'This is a test post about machine learning',
      url: 'https://reddit.com/test',
      author: 'testuser',
      subreddit: 'test',
      redditScore: 10,
      commentCount: 5,
      createdUtc: new Date(),
      collectedAt: new Date(),
      processed: false,
    };

    documentStore.store(testDoc);
    const processed = textProcessor.processDocument(testDoc);
    indexer.indexDocument(processed);
    autocompleteService.addTerm('machine', 10);
    autocompleteService.addTerm('learning', 8);
  });

  describe('POST /api/v1/search', () => {
    it('should return search results for valid query', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .send({ query: 'machine learning', page: 1, pageSize: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('pageSize', 10);
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .send({ query: '', page: 1, pageSize: 10 })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_QUERY');
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .send({ page: 1, pageSize: 10 })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_QUERY');
    });

    it('should return 400 for invalid page number', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .send({ query: 'test', page: 0, pageSize: 10 })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PAGE');
    });

    it('should return 400 for invalid page size', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .send({ query: 'test', page: 1, pageSize: 200 })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PAGE_SIZE');
    });

    it('should use default values for page and pageSize', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .send({ query: 'test' })
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(10);
    });
  });

  describe('GET /api/v1/autocomplete', () => {
    it('should return suggestions for valid prefix', async () => {
      const response = await request(app)
        .get('/api/v1/autocomplete')
        .query({ prefix: 'mach' })
        .expect(200);

      expect(response.body).toHaveProperty('suggestions');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    it('should return 400 for empty prefix', async () => {
      const response = await request(app)
        .get('/api/v1/autocomplete')
        .query({ prefix: '' })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PREFIX');
    });

    it('should return 400 for missing prefix', async () => {
      const response = await request(app)
        .get('/api/v1/autocomplete')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PREFIX');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/autocomplete')
        .query({ prefix: 'ma', limit: 5 })
        .expect(200);

      expect(response.body.suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/v1/autocomplete')
        .query({ prefix: 'test', limit: 100 })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_LIMIT');
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('components');
      expect(response.body.components).toHaveProperty('documentStore');
      expect(response.body.components).toHaveProperty('index');
    });

    it('should include component details', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.components.documentStore.status).toBe('healthy');
      expect(response.body.components.index.status).toBe('healthy');
      expect(typeof response.body.components.documentStore.totalDocuments).toBe('number');
    });
  });

  describe('GET /api/v1/stats', () => {
    it('should return system statistics', async () => {
      const response = await request(app)
        .get('/api/v1/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalDocuments');
      expect(response.body).toHaveProperty('totalQueries');
      expect(response.body).toHaveProperty('documentsByType');
      expect(response.body).toHaveProperty('subreddits');
    });

    it('should include analytics metrics', async () => {
      const response = await request(app)
        .get('/api/v1/stats')
        .expect(200);

      expect(response.body).toHaveProperty('overallCTR');
      expect(response.body).toHaveProperty('uniqueQueries');
      expect(response.body).toHaveProperty('responseTimeStats');
      expect(response.body).toHaveProperty('popularQueries');
    });
  });

  describe('POST /api/v1/click', () => {
    it('should log click events', async () => {
      const response = await request(app)
        .post('/api/v1/click')
        .send({ query: 'test', docId: 'doc-1', position: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/click')
        .send({ query: 'test' })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('Rate limiting', () => {
    it('should enforce rate limits', async () => {
      const limiter = new RateLimiter({ requestsPerWindow: 2, windowSeconds: 60 });
      const limitedApp = createApp(
        queryProcessor,
        autocompleteService,
        limiter,
        analyticsService,
        documentStore,
        indexer,
        { enableLogging: false }
      );

      // First two requests should succeed
      await request(limitedApp).get('/api/v1/health').expect(200);
      await request(limitedApp).get('/api/v1/health').expect(200);

      // Third request should be rate limited
      const response = await request(limitedApp).get('/api/v1/health').expect(429);
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/unknown')
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should include request ID in error responses', async () => {
      const response = await request(app)
        .post('/api/v1/search')
        .send({ query: '' })
        .expect(400);

      expect(response.body.error).toHaveProperty('requestId');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
