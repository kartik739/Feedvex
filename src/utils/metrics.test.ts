import {
  register,
  queryCounter,
  queryDuration,
  cacheHits,
  cacheMisses,
  cacheHitRate,
  documentsCollected,
  collectionErrors,
  indexSize,
  indexTerms,
  httpRequestDuration,
  httpRequestsTotal,
  rateLimitExceeded,
} from './metrics';

describe('Metrics', () => {
  beforeEach(() => {
    // Don't clear the register - metrics need to be registered
  });

  it('should define query metrics', () => {
    expect(queryCounter).toBeDefined();
    expect(queryDuration).toBeDefined();
  });

  it('should define cache metrics', () => {
    expect(cacheHits).toBeDefined();
    expect(cacheMisses).toBeDefined();
    expect(cacheHitRate).toBeDefined();
  });

  it('should define collection metrics', () => {
    expect(documentsCollected).toBeDefined();
    expect(collectionErrors).toBeDefined();
  });

  it('should define index metrics', () => {
    expect(indexSize).toBeDefined();
    expect(indexTerms).toBeDefined();
  });

  it('should define HTTP metrics', () => {
    expect(httpRequestDuration).toBeDefined();
    expect(httpRequestsTotal).toBeDefined();
  });

  it('should define rate limit metrics', () => {
    expect(rateLimitExceeded).toBeDefined();
  });

  it('should increment query counter', () => {
    queryCounter.inc({ status: 'success' });
    const metrics = register.getSingleMetric('feedvex_queries_total');
    expect(metrics).toBeDefined();
  });

  it('should record query duration', () => {
    queryDuration.observe(0.5);
    const metrics = register.getSingleMetric('feedvex_query_duration_seconds');
    expect(metrics).toBeDefined();
  });
});
