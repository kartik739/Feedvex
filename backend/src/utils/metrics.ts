import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus metrics for monitoring FeedVex.
 *
 * Why Prometheus? It's the industry standard for metrics collection.
 * We expose a /metrics endpoint that Prometheus scrapes, then visualize
 * in Grafana. This is what every production system uses.
 */
export const register = new Registry();

// Collect default Node.js metrics (memory, CPU, event loop)
collectDefaultMetrics({ register });

// --- Counters ---
export const requestCount = new Counter({
  name: 'feedvex_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

export const errorCount = new Counter({
  name: 'feedvex_errors_total',
  help: 'Total number of errors',
  labelNames: ['type'],
  registers: [register],
});

export const cacheHits = new Counter({
  name: 'feedvex_cache_hits_total',
  help: 'Total cache hits',
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'feedvex_cache_misses_total',
  help: 'Total cache misses',
  registers: [register],
});

export const redditApiCalls = new Counter({
  name: 'feedvex_reddit_api_calls_total',
  help: 'Total Reddit API calls',
  labelNames: ['endpoint'],
  registers: [register],
});

// --- Histograms ---
export const requestDuration = new Histogram({
  name: 'feedvex_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'endpoint'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000],
  registers: [register],
});

export const searchLatency = new Histogram({
  name: 'feedvex_search_latency_ms',
  help: 'Search query latency in milliseconds',
  buckets: [10, 25, 50, 100, 200, 500],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'feedvex_db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['operation'],
  buckets: [5, 10, 25, 50, 100, 250, 500],
  registers: [register],
});

// --- Gauges ---
export const activeConnections = new Gauge({
  name: 'feedvex_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

export const redditRateLimitRemaining = new Gauge({
  name: 'feedvex_reddit_rate_limit_remaining',
  help: 'Reddit API rate limit remaining',
  registers: [register],
});
