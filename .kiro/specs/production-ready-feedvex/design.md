# Design Document: Production-Ready FeedVex

## Overview

This design transforms FeedVex from a development prototype into a production-ready, resume-worthy project that demonstrates real-world full-stack development skills. The design focuses on eight critical areas:

1. **Database Layer**: Replace in-memory storage with PostgreSQL using connection pooling, transactions, and optimized indexes
2. **Deployment Infrastructure**: Docker containerization with environment-based configuration and graceful shutdown
3. **CI/CD Pipeline**: GitHub Actions workflow for automated linting, building, and deployment
4. **Observability**: Structured logging with Winston and error tracking with Sentry
5. **Performance**: Query caching with Redis, code splitting, lazy loading, and bundle optimization
6. **Security**: Rate limiting, Helmet.js security headers, Zod input validation, and HTTPS enforcement
7. **Reliability**: Health checks, connection resilience, error boundaries, and graceful degradation
8. **Documentation**: Architecture diagrams, technical decision rationale, and interview preparation guide

The design maintains the existing architecture (React frontend, Express API, inverted index search) while adding production-grade infrastructure. All technical decisions prioritize explainability for interviews over complexity.

### Design Principles

- **Simplicity over cleverness**: Use industry-standard patterns that are easy to explain
- **Measurable results**: Every optimization must have before/after metrics
- **Interview-focused**: Every technical decision has a clear "why" for interview discussions
- **Production-ready**: Follow real-world best practices used in production systems
- **Pragmatic testing**: Focus on critical paths, not 100% coverage


## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                       │
│  - Code splitting & lazy loading                                 │
│  - Error boundaries                                              │
│  - Optimized bundles                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                           │
│  - Rate limiting (per IP)                                        │
│  - Security headers (Helmet.js)                                  │
│  - Input validation (Zod)                                        │
│  - Structured logging (Winston)                                  │
│  - Error tracking (Sentry)                                       │
│  - Metrics endpoint (Prometheus)                                 │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│ PostgreSQL  │   │    Redis     │   │   Search    │
│  Database   │   │    Cache     │   │   Engine    │
│             │   │              │   │             │
│ - Documents │   │ - Query      │   │ - Inverted  │
│ - Users     │   │   results    │   │   Index     │
│ - Analytics │   │ - Sessions   │   │ - BM25      │
│ - Indexes   │   │ - Rate limit │   │   Ranking   │
└─────────────┘   └──────────────┘   └─────────────┘
```

### Data Flow

**Search Request Flow:**
1. User enters query in frontend
2. Frontend sends request to `/api/v1/search`
3. API validates input and checks rate limit
4. API checks Redis cache for results
5. On cache miss: Query processor retrieves documents from PostgreSQL
6. Search engine ranks results using BM25 algorithm
7. Results cached in Redis with 5-minute TTL
8. Response sent to frontend with metrics
9. Analytics logged to PostgreSQL

**Deployment Flow:**
1. Developer pushes code to GitHub
2. GitHub Actions runs linting and type checking
3. On success, builds Docker containers
4. Deploys to Railway/Render
5. Platform performs health checks
6. Traffic routed to new deployment
7. Old deployment gracefully shut down


## Components and Interfaces

### 1. Database Layer (PostgreSQL)

**PostgresDocumentStore** - Replaces in-memory DocumentStore with PostgreSQL persistence

```typescript
interface PostgresDocumentStore {
  // Connection management
  initialize(): Promise<void>;
  close(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  
  // Document operations (with transactions)
  store(document: Document): Promise<boolean>;
  storeMany(documents: Document[]): Promise<number>;
  getById(docId: string): Promise<Document | null>;
  getByIds(docIds: string[]): Promise<Map<string, Document>>;
  getAll(filter?: DocumentFilter): Promise<Document[]>;
  update(docId: string, updates: Partial<Document>): Promise<boolean>;
  delete(docId: string): Promise<boolean>;
  
  // Statistics
  getStats(): Promise<DocumentStats>;
}

interface ConnectionPool {
  min: number;           // Minimum connections (default: 2)
  max: number;           // Maximum connections (default: 10)
  idleTimeoutMillis: number;  // Idle connection timeout (default: 30000)
  connectionTimeoutMillis: number;  // Connection acquisition timeout (default: 2000)
}

interface HealthStatus {
  healthy: boolean;
  details: {
    database: 'connected' | 'disconnected';
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
  };
}
```

**Implementation Strategy:**
- Use `pg` library with connection pooling
- Wrap all write operations in transactions
- Use parameterized queries to prevent SQL injection
- Implement retry logic with exponential backoff (max 5 attempts)
- Log all database errors with full context

**Indexes for Performance:**
```sql
-- Full-text search on title and content
CREATE INDEX idx_documents_title_content_fts 
  ON documents USING gin(to_tsvector('english', title || ' ' || content));

-- Filter and sort indexes
CREATE INDEX idx_documents_subreddit ON documents(subreddit);
CREATE INDEX idx_documents_created_utc ON documents(created_utc DESC);
CREATE INDEX idx_documents_reddit_score ON documents(reddit_score DESC);

-- Analytics indexes
CREATE INDEX idx_analytics_queries_query ON analytics_queries(query);
CREATE INDEX idx_analytics_queries_timestamp ON analytics_queries(timestamp DESC);
CREATE INDEX idx_analytics_clicks_query ON analytics_clicks(query);
CREATE INDEX idx_analytics_clicks_doc_id ON analytics_clicks(doc_id);
```


### 2. Caching Layer (Redis)

**RedisCache** - Implements query result caching and session storage

```typescript
interface RedisCache {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  
  // Query cache operations
  get(query: string, page: number, pageSize: number): Promise<SearchResults | null>;
  set(query: string, page: number, pageSize: number, results: SearchResults, ttl: number): Promise<void>;
  invalidate(pattern: string): Promise<number>;
  
  // Session operations
  setSession(sessionId: string, data: SessionData, ttl: number): Promise<void>;
  getSession(sessionId: string): Promise<SessionData | null>;
  deleteSession(sessionId: string): Promise<void>;
  
  // Rate limiting operations
  incrementRequestCount(ip: string, windowMs: number): Promise<number>;
  getRequestCount(ip: string): Promise<number>;
}

interface CacheKey {
  // Format: "search:{query}:{page}:{pageSize}"
  generate(query: string, page: number, pageSize: number): string;
}
```

**Implementation Strategy:**
- Use `ioredis` library for Redis client
- Implement graceful fallback when Redis is unavailable
- Use consistent key naming: `search:{query}:{page}:{pageSize}`
- Set TTL to 5 minutes for search results
- Use LRU eviction policy
- Log cache hit/miss rates for monitoring

**Cache Warming Strategy:**
- Identify top 100 queries from analytics
- Pre-warm cache on application startup
- Refresh popular queries every 5 minutes


### 3. Monitoring and Observability

**Logger** - Structured logging with Winston

```typescript
interface Logger {
  error(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
}

interface LogMeta {
  requestId?: string;
  userId?: string;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

// Log format (JSON)
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Search query processed",
  "requestId": "req-123",
  "query": "typescript tutorial",
  "resultCount": 42,
  "duration": 85,
  "cacheHit": false
}
```

**ErrorTracker** - Sentry integration for error tracking

```typescript
interface ErrorTracker {
  initialize(dsn: string, environment: string): void;
  captureException(error: Error, context?: ErrorContext): void;
  captureMessage(message: string, level: 'error' | 'warning' | 'info'): void;
  setUser(user: { id: string; email?: string }): void;
}

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  level?: 'fatal' | 'error' | 'warning' | 'info';
}
```

**MetricsCollector** - Prometheus metrics

```typescript
interface MetricsCollector {
  // Counter metrics
  incrementRequestCount(endpoint: string, method: string, statusCode: number): void;
  incrementErrorCount(errorType: string): void;
  incrementCacheHit(): void;
  incrementCacheMiss(): void;
  
  // Histogram metrics
  recordRequestDuration(endpoint: string, duration: number): void;
  recordDatabaseQueryDuration(operation: string, duration: number): void;
  recordSearchLatency(duration: number): void;
  
  // Gauge metrics
  setActiveConnections(count: number): void;
  setMemoryUsage(bytes: number): void;
  
  // Export metrics
  getMetrics(): Promise<string>;  // Prometheus format
}
```

**Implementation Strategy:**
- Winston transports: Console (development), File (production)
- Sentry free tier: 5,000 errors/month
- Prometheus metrics exposed at `/metrics`
- Sanitize sensitive data before logging (passwords, tokens)
- Include request ID in all logs for tracing


### 4. Security Layer

**RateLimiter** - IP-based rate limiting using Redis

```typescript
interface RateLimiter {
  checkLimit(ip: string): Promise<RateLimitResult>;
  resetLimit(ip: string): Promise<void>;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

// Configuration
{
  windowMs: 60000,        // 1 minute window
  maxRequests: 100,       // 100 requests per window
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}
```

**InputValidator** - Zod schema validation

```typescript
// Search request validation
const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  page: z.number().int().min(1).max(1000).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  filters: z.object({
    subreddit: z.string().max(100).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    sortBy: z.enum(['relevance', 'date', 'score']).optional()
  }).optional()
});

// User registration validation
const RegisterRequestSchema = z.object({
  email: z.string().email().max(255),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
});
```

**SecurityHeaders** - Helmet.js configuration

```typescript
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
};
```

**Implementation Strategy:**
- Rate limiting: 100 requests/minute per IP
- Return HTTP 429 with `Retry-After` header when limit exceeded
- Validate all user input before processing
- Return detailed validation errors (HTTP 400)
- Hash passwords with bcrypt (salt rounds: 10)
- JWT tokens: 15-minute access, 7-day refresh
- Enforce HTTPS in production (redirect HTTP to HTTPS)


### 5. Health Check System

**HealthChecker** - Comprehensive health monitoring

```typescript
interface HealthChecker {
  check(): Promise<HealthCheckResult>;
  checkDatabase(): Promise<ComponentHealth>;
  checkRedis(): Promise<ComponentHealth>;
  checkMemory(): Promise<ComponentHealth>;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
  };
}

interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  details?: Record<string, any>;
  error?: string;
}

// Response format
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 86400,
  "components": {
    "database": {
      "status": "up",
      "responseTime": 5,
      "details": {
        "activeConnections": 3,
        "idleConnections": 7
      }
    },
    "redis": {
      "status": "up",
      "responseTime": 2
    },
    "memory": {
      "status": "up",
      "details": {
        "usedMB": 256,
        "totalMB": 512,
        "percentage": 50
      }
    }
  }
}
```

**Implementation Strategy:**
- Health check endpoint: `GET /api/v1/health`
- Return HTTP 200 if all components healthy
- Return HTTP 503 if any critical component unhealthy
- Timeout health checks after 1 second
- Cache health check results for 5 seconds to prevent overload
- Platform health checks every 30 seconds


### 6. Search Performance Optimization

**Enhanced Query Processor** - Adds caching and typo tolerance

```typescript
interface EnhancedQueryProcessor extends QueryProcessor {
  // Typo tolerance using Levenshtein distance
  findSimilarTerms(term: string, maxDistance: number): string[];
  
  // Cache-aware search
  searchWithCache(query: string, page: number, pageSize: number): Promise<SearchResults>;
  
  // Query expansion
  expandQuery(query: string): string[];
}

// Levenshtein distance implementation
function levenshteinDistance(a: string, b: string): number {
  // Dynamic programming approach
  // Returns edit distance between two strings
}

// Typo tolerance strategy
{
  maxDistance: 2,           // Maximum edit distance
  minTermLength: 4,         // Only apply to terms >= 4 chars
  maxSuggestions: 3         // Maximum similar terms to try
}
```

**Cache Warming Service**

```typescript
interface CacheWarmer {
  // Warm cache with popular queries
  warmCache(): Promise<void>;
  
  // Get popular queries from analytics
  getPopularQueries(limit: number): Promise<string[]>;
  
  // Schedule periodic warming
  scheduleWarming(intervalMs: number): void;
}

// Warming strategy
{
  topQueries: 100,          // Warm top 100 queries
  intervalMs: 300000,       // Refresh every 5 minutes
  concurrency: 5            // Warm 5 queries concurrently
}
```

**Implementation Strategy:**
- Check Redis cache before database query
- Cache hit: Return in <10ms
- Cache miss: Execute search, cache result with 5-minute TTL
- Typo tolerance: Try Levenshtein distance ≤2 for terms ≥4 chars
- Pre-warm cache with top 100 queries on startup
- Target: p95 response time <100ms


### 7. Frontend Performance Optimization

**Build Configuration** - Vite optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['lucide-react'],
          'state': ['zustand']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  plugins: [
    react(),
    compression({ algorithm: 'gzip' })
  ]
});
```

**Code Splitting Strategy**

```typescript
// Lazy load routes
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

// Route configuration
<Routes>
  <Route path="/" element={
    <Suspense fallback={<LoadingSpinner />}>
      <SearchPage />
    </Suspense>
  } />
  <Route path="/profile" element={
    <Suspense fallback={<LoadingSpinner />}>
      <ProfilePage />
    </Suspense>
  } />
</Routes>
```

**Error Boundary Implementation**

```typescript
class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to Sentry
    errorTracker.captureException(error, {
      extra: { errorInfo }
    });
    
    // Log to console
    console.error('Error boundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
```

**Performance Targets:**
- Lighthouse score: ≥90
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Bundle size: <500KB (gzipped)
- Code splitting: 3+ chunks (vendor, ui, routes)


### 8. Deployment Infrastructure

**Docker Configuration**

```dockerfile
# Backend Dockerfile (multi-stage build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
```

```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Environment Configuration**

```typescript
// Environment validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SENTRY_DSN: z.string().url().optional(),
  // ... other required vars
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}
```

**Graceful Shutdown**

```typescript
class GracefulShutdown {
  private server: Server;
  private connections: Set<Socket> = new Set();
  
  async shutdown(signal: string) {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    // Stop accepting new connections
    this.server.close();
    
    // Close existing connections
    for (const connection of this.connections) {
      connection.destroy();
    }
    
    // Close database connections
    await database.close();
    
    // Close Redis connections
    await redis.disconnect();
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }
}

// Register signal handlers
process.on('SIGTERM', () => shutdown.shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown.shutdown('SIGINT'));
```


### 9. CI/CD Pipeline

**GitHub Actions Workflow**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
  
  build:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build:all
      - uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            backend/dist
            frontend/dist
  
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway up
      - name: Verify deployment
        run: |
          sleep 10
          curl -f ${{ secrets.DEPLOYMENT_URL }}/api/v1/health || exit 1
```

**Deployment Verification Script**

```typescript
async function verifyDeployment(url: string): Promise<boolean> {
  const checks = [
    { name: 'Health Check', endpoint: '/api/v1/health' },
    { name: 'Search API', endpoint: '/api/v1/search', method: 'POST', body: { query: 'test' } },
    { name: 'Metrics', endpoint: '/metrics' }
  ];
  
  for (const check of checks) {
    try {
      const response = await fetch(`${url}${check.endpoint}`, {
        method: check.method || 'GET',
        body: check.body ? JSON.stringify(check.body) : undefined
      });
      
      if (!response.ok) {
        logger.error(`${check.name} failed`, { status: response.status });
        return false;
      }
    } catch (error) {
      logger.error(`${check.name} error`, { error });
      return false;
    }
  }
  
  return true;
}
```


## Data Models

### Database Schema

**Documents Table**
```sql
CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('post', 'comment')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    subreddit VARCHAR(255) NOT NULL,
    reddit_score INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_utc TIMESTAMP NOT NULL,
    collected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Analytics Tables**
```sql
CREATE TABLE analytics_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    session_id VARCHAR(255)
);

CREATE TABLE analytics_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    doc_id VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

### Redis Data Structures

**Query Cache**
```
Key: "search:{query}:{page}:{pageSize}"
Value: JSON-serialized SearchResults
TTL: 300 seconds (5 minutes)
```

**Rate Limiting**
```
Key: "ratelimit:{ip}"
Value: Request count (integer)
TTL: 60 seconds (1 minute window)
```

**Session Storage**
```
Key: "session:{sessionId}"
Value: JSON-serialized SessionData
TTL: 604800 seconds (7 days)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Database and Connection Management Properties

**Property 1: Connection Pool Lifecycle**
*For any* database operation sequence, the connection pool should maintain its configured size, acquiring connections for operations and releasing them back to the pool after completion, ensuring no connection leaks occur.
**Validates: Requirements 1.1, 1.2, 1.3**

**Property 2: Transaction Atomicity**
*For any* set of database operations that require atomicity, executing them within a transaction should result in either all operations succeeding or all operations failing, with no partial state changes.
**Validates: Requirements 1.5, 1.9**

**Property 3: Database Error Handling**
*For any* database error that occurs during operation, the system should log the error with full context (operation type, parameters, stack trace) and return an appropriate HTTP error response (500 for internal errors, 503 for unavailability).
**Validates: Requirements 1.7**

**Property 4: Connection Retry with Exponential Backoff**
*For any* database connection failure, the system should retry the connection up to 5 times with exponentially increasing delays (e.g., 100ms, 200ms, 400ms, 800ms, 1600ms) before giving up.
**Validates: Requirements 1.10**

**Property 5: Graceful Resource Cleanup**
*For any* shutdown signal (SIGTERM, SIGINT), the system should close all database and Redis connections gracefully, ensuring no active connections remain after shutdown completes.
**Validates: Requirements 1.4, 10.10**


### Configuration and Environment Properties

**Property 6: Environment Variable Loading**
*For any* configuration value needed by the system, it should be loaded from environment variables, and missing required variables should cause startup to fail with a clear error message listing the missing variables.
**Validates: Requirements 2.2, 2.10**

### Monitoring and Observability Properties

**Property 7: Comprehensive Request Logging**
*For any* HTTP request processed by the API, the system should produce a structured log entry containing timestamp, request ID, HTTP method, path, status code, duration, and any relevant metadata (user ID, query parameters).
**Validates: Requirements 4.1**

**Property 8: Error Capture and Tracking**
*For any* error that occurs during request processing, the system should capture it with full stack trace and context, log it locally, and send it to Sentry for tracking.
**Validates: Requirements 4.2, 4.3**

**Property 9: Metrics Collection**
*For any* request completion, the system should record response time metrics, and for any error, the system should increment error rate metrics, ensuring all metrics are available at the /metrics endpoint.
**Validates: Requirements 4.5, 4.6**

**Property 10: Log Level Appropriateness**
*For any* event logged by the system, it should use the appropriate log level: error for failures, warn for degraded conditions, info for normal operations, and debug for detailed diagnostics.
**Validates: Requirements 4.7**

**Property 11: Sensitive Data Sanitization**
*For any* log entry containing sensitive data (passwords, tokens, API keys), the system should sanitize the sensitive values before writing to logs, replacing them with masked values (e.g., "***").
**Validates: Requirements 4.9**


### Caching Properties

**Property 12: Cache-First Search Strategy**
*For any* search query, the system should check the Redis cache before querying the database, and on cache miss, should execute the search and store results in Redis with a 5-minute TTL.
**Validates: Requirements 5.1, 5.3, 10.2, 10.4**

**Property 13: Cache Hit Optimization**
*For any* cached search query, the system should return results directly from Redis without querying the database, demonstrating cache effectiveness.
**Validates: Requirements 10.3**

**Property 14: Cache Graceful Degradation**
*For any* Redis connection failure, the system should fall back to direct database queries without crashing, logging the cache unavailability as a warning.
**Validates: Requirements 10.5**

**Property 15: Consistent Cache Key Generation**
*For any* search query with the same parameters (query text, page, pageSize), the system should generate identical cache keys, ensuring cache hits for repeated queries.
**Validates: Requirements 10.9**

**Property 16: LRU Cache Eviction**
*For any* cache that reaches capacity, the system should evict the least recently used entries to make room for new entries, maintaining the configured maximum cache size.
**Validates: Requirements 5.8**

**Property 17: Session Storage in Redis**
*For any* user session created, the system should store session data in Redis with appropriate TTL, and session retrieval should fetch data from Redis.
**Validates: Requirements 10.6**

**Property 18: Rate Limit Tracking in Redis**
*For any* IP address making requests, the system should track request counts in Redis with a sliding window, incrementing the count for each request and resetting after the window expires.
**Validates: Requirements 10.7**


### Search Performance Properties

**Property 19: Typo Tolerance with Levenshtein Distance**
*For any* search query containing terms with typos (edit distance ≤2 from indexed terms), the system should find similar terms using Levenshtein distance and include results for those terms.
**Validates: Requirements 5.4**

**Property 20: BM25 Relevance Scoring**
*For any* search query, the system should calculate relevance scores using the BM25 algorithm combined with recency, popularity, and engagement factors, producing a final score for each result.
**Validates: Requirements 5.5**

**Property 21: Slow Query Logging**
*For any* search query that takes longer than a configured threshold (e.g., 500ms), the system should log it as a slow query with full details (query text, execution time, result count) for performance analysis.
**Validates: Requirements 5.10**

### Security Properties

**Property 22: Rate Limiting Enforcement**
*For any* IP address that exceeds 100 requests per minute, the system should return HTTP 429 (Too Many Requests) with a Retry-After header indicating when the client can retry.
**Validates: Requirements 7.1, 7.2**

**Property 23: Input Validation with Detailed Errors**
*For any* user input that fails validation against Zod schemas, the system should return HTTP 400 with detailed error messages specifying which fields failed validation and why.
**Validates: Requirements 7.4, 7.5**

**Property 24: Password Hashing with Bcrypt**
*For any* password stored in the database, it should be hashed using bcrypt with a salt rounds value of 10 or higher, ensuring passwords are never stored in plaintext.
**Validates: Requirements 7.7**

**Property 25: JWT Token Expiration**
*For any* JWT token issued by the system, access tokens should expire in 15 minutes and refresh tokens should expire in 7 days, with expiration times encoded in the token payload.
**Validates: Requirements 7.8**

**Property 26: Parameterized SQL Queries**
*For any* SQL query constructed by the system, it should use parameterized statements (prepared statements) rather than string concatenation, preventing SQL injection attacks.
**Validates: Requirements 7.10**


### API Response Properties

**Property 27: Cache Control Headers**
*For any* API response sent by the system, it should include appropriate Cache-Control headers based on the endpoint type (no-cache for dynamic data, max-age for static data).
**Validates: Requirements 6.6**

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error details (validation errors, etc.)
    requestId: string;      // Request ID for tracing
    timestamp: string;      // ISO 8601 timestamp
  };
}
```

### Error Categories

**Client Errors (4xx)**
- 400 Bad Request: Invalid input, validation failures
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found
- 429 Too Many Requests: Rate limit exceeded

**Server Errors (5xx)**
- 500 Internal Server Error: Unexpected server errors
- 503 Service Unavailable: Database or Redis unavailable

### Error Handling Strategy

1. **Validation Errors**: Return 400 with field-specific error messages
2. **Database Errors**: Retry with exponential backoff, return 503 if all retries fail
3. **Cache Errors**: Log warning and continue without cache (graceful degradation)
4. **External API Errors**: Log error and return appropriate status code
5. **Unhandled Errors**: Catch at top level, log to Sentry, return 500 with generic message

### Retry Logic

```typescript
interface RetryConfig {
  maxAttempts: 5;
  initialDelayMs: 100;
  maxDelayMs: 5000;
  backoffMultiplier: 2;
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
}
```

### Error Boundaries (Frontend)

```typescript
// Wrap each route with error boundary
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => {
    errorTracker.captureException(error, { extra: errorInfo });
  }}
>
  <Route />
</ErrorBoundary>
```


## Testing Strategy

### Dual Testing Approach

The project uses both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and integration points
- Specific input/output examples
- Edge cases (empty strings, null values, boundary conditions)
- Error conditions (network failures, invalid input)
- Integration between components

**Property-Based Tests**: Verify universal properties across all inputs
- Universal properties that hold for all valid inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each property test references its design document property

### Testing Balance

- Focus on critical paths, not 100% coverage
- Unit tests for specific examples and edge cases
- Property tests for universal behaviors
- Integration tests for component interactions
- Avoid over-testing: test what matters for production

### Property-Based Testing Configuration

**Library**: fast-check (already in dependencies)

**Configuration**:
```typescript
fc.assert(
  fc.property(
    // Generators
    fc.string(),
    fc.integer(),
    // Test function
    (input, count) => {
      // Property assertion
    }
  ),
  { numRuns: 100 }  // Minimum 100 iterations
);
```

**Test Tagging**:
```typescript
// Feature: production-ready-feedvex, Property 12: Cache-First Search Strategy
test('search should check cache before database', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 100 }),
      async (query) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Critical Test Areas

1. **Database Operations**: Connection pooling, transactions, error handling
2. **Caching**: Cache hits/misses, TTL, graceful degradation
3. **Security**: Rate limiting, input validation, password hashing
4. **Search**: Query processing, ranking, typo tolerance
5. **Monitoring**: Logging, error tracking, metrics collection
6. **Deployment**: Health checks, graceful shutdown, environment validation

### Test Organization

```
backend/
  src/
    services/
      __tests__/
        postgres-document-store.test.ts
        redis-cache.test.ts
        rate-limiter.test.ts
        query-processor.test.ts
    __tests__/
      integration/
        search-flow.test.ts
        auth-flow.test.ts
      properties/
        cache-properties.test.ts
        database-properties.test.ts
        security-properties.test.ts
```

### Performance Testing

While not part of automated tests, performance should be measured:
- Lighthouse score for frontend (target: ≥90)
- API response time (target: p95 <100ms)
- Search latency (target: p95 <100ms)
- Cache hit rate (target: >80% for popular queries)

