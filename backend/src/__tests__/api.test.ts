import request from 'supertest';
import { createApp } from '../api/app';

// Mock dependencies
const mockQueryProcessor = { processQuery: jest.fn() } as any;
const mockAutocompleteService = { getSuggestions: jest.fn() } as any;
const mockRateLimiter = { checkRateLimit: jest.fn().mockResolvedValue({ allowed: true }), recordRequest: jest.fn() } as any;
const mockAnalyticsService = { logQuery: jest.fn(), logClick: jest.fn(), getOverallMetrics: jest.fn() } as any;
const mockDocumentStore = { getById: jest.fn(), getTotalDocuments: jest.fn(), getStats: jest.fn(), store: jest.fn() } as any;
const mockIndexer = { getTotalDocuments: jest.fn(), getStats: jest.fn(), indexDocument: jest.fn() } as any;
const mockClerkAuth = { requireAuth: jest.fn((req, res, next) => next()), verifyToken: jest.fn() } as any;
const mockSearchHistoryService = { getHistory: jest.fn(), deleteEntry: jest.fn(), clearHistory: jest.fn(), addEntry: jest.fn() } as any;

const app = createApp(
  mockQueryProcessor,
  mockAutocompleteService,
  mockRateLimiter,
  mockAnalyticsService,
  mockDocumentStore,
  mockIndexer,
  mockClerkAuth,
  mockSearchHistoryService,
  { enableLogging: false }
);

describe('API Endpoints Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/v1/health should return 200 health status', async () => {
    mockDocumentStore.getTotalDocuments.mockReturnValue(123);
    mockIndexer.getTotalDocuments.mockReturnValue(123);
    mockIndexer.getStats.mockReturnValue({ totalTerms: 50 });

    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/v1/metrics should return metrics', async () => {
    const res = await request(app).get('/api/v1/metrics');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/search should return results for valid query', async () => {
    mockQueryProcessor.processQuery.mockResolvedValue({ items: [], totalCount: 0 });
    const res = await request(app).post('/api/v1/search').send({ query: 'test', page: 1, pageSize: 10 });
    expect(res.status).toBe(200);
    expect(mockQueryProcessor.processQuery).toHaveBeenCalled();
  });

  it('POST /api/v1/search should return 400 for empty query', async () => {
    const res = await request(app).post('/api/v1/search').send({ query: '' });
    expect(res.status).toBe(400);
  });

  it('GET /api/v1/documents/:id should return document if exists', async () => {
    mockDocumentStore.getById.mockReturnValue({ id: 'test', title: 'Test Doc' });
    const res = await request(app).get('/api/v1/documents/test');
    expect(res.status).toBe(200);
    expect(res.body.document.id).toBe('test');
  });

  it('GET /api/v1/documents/:id should return 404 if not found', async () => {
    mockDocumentStore.getById.mockReturnValue(undefined);
    const res = await request(app).get('/api/v1/documents/missing');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/autocomplete should return suggestions', async () => {
    mockAutocompleteService.getSuggestions.mockReturnValue(['test1', 'test2']);
    const res = await request(app).get('/api/v1/autocomplete?prefix=te');
    expect(res.status).toBe(200);
    expect(res.body.suggestions).toEqual(['test1', 'test2']);
  });

  it('GET /api/v1/stats should return stats', async () => {
    mockDocumentStore.getStats.mockReturnValue({ totalDocuments: 10, postCount: 5, commentCount: 5 });
    mockAnalyticsService.getOverallMetrics.mockReturnValue({ totalQueries: 0, totalClicks: 0, overallCTR: 0, uniqueQueries: 0 });
    const res = await request(app).get('/api/v1/stats');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/click should log click and return 200', async () => {
    const res = await request(app).post('/api/v1/click').send({ query: 'test', docId: '1', position: 1 });
    expect(res.status).toBe(200);
    expect(mockAnalyticsService.logClick).toHaveBeenCalled();
  });

  it('GET /api/v1/history should require valid token (401 when missing)', async () => {
    // Note: requireAuth is bypassed by our mock, but getUserIdFromToken still fails if no auth header
    const res = await request(app).get('/api/v1/history');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/history should return history if token provided', async () => {
    mockClerkAuth.verifyToken.mockResolvedValue({ id: 'user123' });
    mockSearchHistoryService.getHistory.mockReturnValue([]);
    const res = await request(app).get('/api/v1/history').set('Authorization', 'Bearer fake-token');
    expect(res.status).toBe(200);
  });

  it('DELETE /api/v1/history should clear history', async () => {
    mockClerkAuth.verifyToken.mockResolvedValue({ id: 'user123' });
    mockSearchHistoryService.clearHistory.mockReturnValue(5);
    const res = await request(app).delete('/api/v1/history').set('Authorization', 'Bearer fake-token');
    expect(res.status).toBe(200);
    expect(res.body.deletedCount).toBe(5);
  });
  
  it('DELETE /api/v1/history/:entryId should delete specific entry', async () => {
    mockClerkAuth.verifyToken.mockResolvedValue({ id: 'user123' });
    mockSearchHistoryService.deleteEntry.mockReturnValue(true);
    const res = await request(app).delete('/api/v1/history/entry1').set('Authorization', 'Bearer fake-token');
    expect(res.status).toBe(200);
  });
});
