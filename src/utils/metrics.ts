import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

// Query metrics
export const queryCounter = new Counter({
  name: 'feedvex_queries_total',
  help: 'Total number of search queries',
  labelNames: ['status'],
  registers: [register],
});

export const queryDuration = new Histogram({
  name: 'feedvex_query_duration_seconds',
  help: 'Query processing duration in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'feedvex_cache_hits_total',
  help: 'Total number of cache hits',
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'feedvex_cache_misses_total',
  help: 'Total number of cache misses',
  registers: [register],
});

export const cacheHitRate = new Gauge({
  name: 'feedvex_cache_hit_rate',
  help: 'Cache hit rate (0-1)',
  registers: [register],
});

// Collection metrics
export const documentsCollected = new Counter({
  name: 'feedvex_documents_collected_total',
  help: 'Total number of documents collected',
  labelNames: ['source'],
  registers: [register],
});

export const collectionErrors = new Counter({
  name: 'feedvex_collection_errors_total',
  help: 'Total number of collection errors',
  labelNames: ['source', 'error_type'],
  registers: [register],
});

// Index metrics
export const indexSize = new Gauge({
  name: 'feedvex_index_size',
  help: 'Number of documents in the index',
  registers: [register],
});

export const indexTerms = new Gauge({
  name: 'feedvex_index_terms',
  help: 'Number of unique terms in the index',
  registers: [register],
});

// API metrics
export const httpRequestDuration = new Histogram({
  name: 'feedvex_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'feedvex_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Rate limiting metrics
export const rateLimitExceeded = new Counter({
  name: 'feedvex_rate_limit_exceeded_total',
  help: 'Total number of rate limit exceeded events',
  labelNames: ['client_id'],
  registers: [register],
});
