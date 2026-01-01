# Design Document: Production-Ready FeedVex

## Overview

This design transforms FeedVex from a development prototype into a production-ready, resume-worthy project that demonstrates real-world full-stack development skills with modern cloud services. The design focuses on ten critical areas:

1. **Authentication Layer**: Clerk integration for OAuth, social login, and JWT token management
2. **Reddit Data Collection**: OAuth-based collection from /r/all with on-demand strategy and smart prioritization
3. **Database Layer**: Railway PostgreSQL with connection pooling, transactions, and optimized indexes
4. **Caching Layer**: Upstash Redis (serverless) for query caching and rate limiting
5. **Deployment Infrastructure**: 
   - Vercel for frontend deployment with automatic GitHub deployments and global CDN
   - Railway for backend deployment with Docker containerization and graceful shutdown
6. **CI/CD Pipeline**: GitHub Actions workflow for automated linting, building, and deployment
7. **Observability**: Structured logging with Winston (request IDs), error tracking with Sentry, and Prometheus metrics
8. **Performance**: Query caching, code splitting, lazy loading, and bundle optimization
9. **Security**: Rate limiting, Helmet.js security headers with Clerk domain allowlist, Zod input validation, and HTTPS enforcement
10. **Production Readiness**:
    - Environment variable validation with Zod schemas
    - Comprehensive health checks (database, Redis, Reddit API)
    - Graceful shutdown with connection cleanup
    - Retry logic with exponential backoff
    - Resend for transactional emails (welcome emails via Clerk webhooks)
    - Trigger.dev for background jobs (scheduled Reddit data collection)
11. **Documentation**: Architecture diagrams, technical decision rationale, and interview preparation guide

The design replaces custom authentication with Clerk, uses Upstash for serverless Redis, leverages Railway for PostgreSQL and backend hosting, uses Vercel for frontend deployment, integrates Resend for transactional emails, and uses Trigger.dev for background job orchestration. All technical decisions prioritize explainability for interviews and demonstrate knowledge of modern cloud-native architecture.

### Critical Fixes Implemented

1. **Dockerfile Entry Point**: Fixed backend/dist/index.js → backend/dist/server.js
2. **Missing Dependencies**: Added @clerk/clerk-react, @clerk/clerk-sdk-node, @upstash/redis, @sentry/node, @sentry/react, web-vitals, zod, resend, @trigger.dev/sdk
3. **Environment Validation**: Zod schemas validate all required environment variables at startup
4. **Graceful Shutdown**: Proper SIGTERM handling with connection cleanup (database, Redis)
5. **Health Checks**: Comprehensive checks for Railway PostgreSQL, Upstash Redis, and Reddit OAuth API
6. **Input Validation**: Zod schemas for all API inputs with detailed error messages
7. **Retry Logic**: Exponential backoff for database, Redis, Reddit API, and Resend
8. **Structured Logging**: JSON logs with request IDs for tracing
9. **Security Headers**: Helmet.js with Clerk domain allowlist in CSP

### Design Principles

- **Cloud-native architecture**: Use managed services (Clerk, Upstash, Railway, Vercel, Resend, Trigger.dev) over self-hosted
- **Simplicity over cleverness**: Use industry-standard patterns that are easy to explain
- **Measurable results**: Every optimization must have before/after metrics
- **Interview-focused**: Every technical decision has a clear "why" for interview discussions
- **Production-ready**: Follow real-world best practices (graceful shutdown, health checks, retry logic, structured logging)
- **Cost-effective**: All services have generous free tiers suitable for portfolio projects
- **Fail-fast**: Validate configuration at startup, catch errors early
- **Observability**: Comprehensive logging, monitoring, and error tracking for debugging production issues


## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         Vercel (Frontend Deployment + Global CDN)                │
│              Frontend (React + Vite + Clerk)                     │
│  - Clerk authentication components                               │
│  - Code splitting & lazy loading                                 │
│  - Error boundaries                                              │
│  - Optimized bundles                                             │
│  - Automatic GitHub deployments                                  │
│  - Edge caching                                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API + Clerk JWT
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Railway (Backend Deployment)                        │
│                    API Layer (Express)                           │
│  - Clerk JWT verification middleware                             │
│  - Rate limiting via Upstash (per IP)                            │
│  - Security headers (Helmet.js + Clerk allowlist)                │
│  - Input validation (Zod schemas)                                │
│  - Structured logging (Winston + request IDs)                    │
│  - Error tracking (Sentry)                                       │
│  - Metrics endpoint (Prometheus)                                 │
│  - Graceful shutdown with connection cleanup                     │
│  - Comprehensive health checks                                   │
│  - Retry logic with exponential backoff                          │
└──┬────┬──────────┬──────────────┬──────────────┬────────────────┘
   │    │          │              │              │
   │    │          ▼              ▼              ▼
   │    │    ┌──────────┐ ┌─────────────┐ ┌──────────────┐
   │    │    │ Upstash  │ │   Search    │ │   Reddit     │
   │    │    │  Redis   │ │   Engine    │ │ OAuth API    │
   │    │    │          │ │             │ │              │
   │    │    │ - Query  │ │ - Inverted  │ │ - /r/all     │
   │    │    │   cache  │ │   Index     │ │ - 600 req/m  │
   │    │    │ - Rate   │ │ - BM25      │ │ - On-demand  │
   │    │    │   limit  │ │   Ranking   │ │   collection │
   │    │    └──────────┘ └─────────────┘ └──────────────┘
   │    │                                        │
   │    ▼                                        │
   │  ┌─────────────────────────────────────────┼──────────┐
   │  │           Railway PostgreSQL            │          │
   │  │                                          ▼          │
   │  │  - Documents                    Store collected    │
   │  │  - Analytics                         posts         │
   │  │  - Indexes                                         │
   │  │  - Connection pooling                              │
   │  └────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    External Services                              │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Clerk     │  │   Resend     │  │    Trigger.dev       │  │
│  │              │  │              │  │                      │  │
│  │ - OAuth      │  │ - Welcome    │  │ - Background jobs    │  │
│  │ - Social     │  │   emails     │  │ - Reddit collection  │  │
│  │   login      │  │ - Webhooks   │  │ - Scheduled tasks    │  │
│  │ - JWT tokens │  │   trigger    │  │ - Retry logic        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

**Authentication Flow:**
1. User clicks "Sign In" in frontend
2. Clerk modal opens with OAuth/social login options
3. User authenticates with Clerk
4. Clerk issues JWT token to frontend
5. Frontend includes JWT in Authorization header for API requests
6. API verifies JWT using Clerk's verification library
7. API extracts user ID and email from verified token

**Search Request Flow:**
1. User enters query in frontend
2. Frontend sends request to `/api/v1/search` with Clerk JWT
3. API verifies JWT and validates input
4. API checks rate limit in Upstash
5. API checks Upstash cache for results
6. On cache miss: Query processor retrieves documents from Railway PostgreSQL
7. If data is stale, trigger background Reddit collection from /r/all
8. Search engine ranks results using BM25 algorithm
9. Results cached in Upstash with 5-minute TTL
10. Response sent to frontend with metrics
11. Analytics logged to Railway PostgreSQL

**Reddit Collection Flow:**
1. User searches for query not in database
2. System triggers on-demand collection
3. Reddit OAuth client authenticates with client credentials
4. Collector fetches hot, top, and new posts from /r/all matching query
5. Collector respects 600 requests/minute rate limit
6. Posts stored in Railway PostgreSQL with full metadata
7. Search index updated with new posts
8. Cache invalidated for that query
9. User receives updated search results

**Deployment Flow:**
1. Developer pushes code to GitHub
2. GitHub Actions runs linting and type checking
3. On success, builds Docker containers
4. Frontend deploys to Vercel automatically (with preview URLs for PRs)
5. Backend deploys to Railway
6. Railway performs health checks (database, Redis, Reddit API)
7. Traffic routed to new deployment
8. Old deployment gracefully shut down (closes connections cleanly)
9. Trigger.dev background jobs continue running independently


## Components and Interfaces

### 1. Clerk Authentication Integration

**ClerkAuthMiddleware** - Verifies Clerk JWT tokens on API requests

```typescript
interface ClerkAuthMiddleware {
  // Verify JWT token from Authorization header
  verifyToken(req: Request): Promise<ClerkUser>;
  
  // Extract user info from verified token
  getUserFromToken(token: string): Promise<ClerkUser>;
  
  // Middleware function for Express
  requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
}

interface ClerkUser {
  id: string;           // Clerk user ID
  email: string;        // User email
  username?: string;    // Optional username
  firstName?: string;   // Optional first name
  lastName?: string;    // Optional last name
}

// Frontend Clerk setup
import { ClerkProvider, SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';

// Wrap app with ClerkProvider
<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>

// Protected route component
function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useUser();
  
  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" />;
  
  return children;
}
```

**Implementation Strategy:**
- Use `@clerk/clerk-sdk-node` for backend JWT verification
- Use `@clerk/clerk-react` for frontend components
- Verify JWT on all protected API routes
- Extract user ID from JWT and use for analytics
- No custom password hashing or JWT generation needed
- Clerk handles: registration, login, password reset, MFA, OAuth providers

**Environment Variables:**
```env
# Frontend
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Backend
CLERK_SECRET_KEY=sk_test_xxx
```


### 2. Reddit OAuth Data Collection

**RedditOAuthClient** - Collects data from /r/all using OAuth

```typescript
interface RedditOAuthClient {
  // OAuth authentication
  authenticate(): Promise<void>;
  refreshToken(): Promise<void>;
  
  // Data collection from /r/all
  collectFromAll(query: string, options: CollectionOptions): Promise<RedditPost[]>;
  
  // Fetch specific listings
  fetchHot(limit: number): Promise<RedditPost[]>;
  fetchNew(limit: number): Promise<RedditPost[]>;
  fetchTop(timeframe: 'hour' | 'day' | 'week', limit: number): Promise<RedditPost[]>;
  
  // Rate limit management
  getRateLimitStatus(): RateLimitStatus;
  waitForRateLimit(): Promise<void>;
}

interface CollectionOptions {
  maxPosts: number;        // Maximum posts to collect (default: 1000)
  priority: 'hot' | 'top' | 'new';  // Collection priority
  timeframe?: 'hour' | 'day' | 'week';  // For top posts
  subreddit?: string;      // Optional subreddit filter (default: 'all')
}

interface RateLimitStatus {
  remaining: number;       // Requests remaining in window
  reset: Date;            // When rate limit resets
  used: number;           // Requests used in window
  limit: number;          // Total requests per window (600/minute with OAuth)
}

interface RedditPost {
  id: string;
  type: 'post' | 'comment';
  title: string;
  content: string;
  url: string;
  author: string;
  subreddit: string;
  score: number;
  commentCount: number;
  createdUtc: Date;
  permalink: string;
}
```

**OnDemandCollector** - Manages on-demand collection strategy

```typescript
interface OnDemandCollector {
  // Check if collection is needed for query
  shouldCollect(query: string): Promise<boolean>;
  
  // Trigger collection for query
  collectForQuery(query: string): Promise<CollectionResult>;
  
  // Deduplicate concurrent collection requests
  deduplicateRequest(query: string): Promise<CollectionResult>;
  
  // Background collection
  collectInBackground(query: string): void;
}

interface CollectionResult {
  postsCollected: number;
  timeElapsed: number;
  rateLimitUsed: number;
  errors: string[];
}

// Collection strategy
{
  staleThreshold: 3600000,    // 1 hour (data older than this triggers collection)
  maxPostsPerQuery: 1000,     // Maximum posts to collect per query
  priority: ['hot', 'top', 'new'],  // Collection order
  backgroundCollection: true,  // Collect in background, return existing results
  deduplicationWindow: 60000   // 1 minute (deduplicate requests within this window)
}
```

**Implementation Strategy:**
- Use `snoowrap` library for Reddit OAuth
- Authenticate with client credentials (app-only OAuth)
- Access token valid for 1 hour, refresh automatically
- Respect 600 requests/minute rate limit (vs 60 without OAuth)
- Collect from /r/all by default (all of Reddit)
- On-demand collection: trigger when user searches and data is stale
- Background collection: return existing results immediately, update in background
- Store all collected posts in Railway PostgreSQL
- Deduplicate concurrent requests for same query
- Log all Reddit API errors but continue processing

**Reddit OAuth Setup:**
1. Create Reddit app at https://www.reddit.com/prefs/apps
2. Get client ID and client secret
3. Set user agent: "FeedVex/1.0.0"
4. Use client credentials flow (no user login needed)


### 3. Database Layer (Railway PostgreSQL)

### 3. Database Layer (Railway PostgreSQL)

**PostgresDocumentStore** - Replaces in-memory DocumentStore with Railway PostgreSQL persistence

```typescript
interface PostgresDocumentStore {
  // Connection management
  initialize(databaseUrl?: string): Promise<void>;  // Support Railway DATABASE_URL
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
- Support Railway's DATABASE_URL format (postgresql://user:pass@host:port/db)
- Fall back to individual env vars for local dev (DB_HOST, DB_PORT, etc.)
- Wrap all write operations in transactions
- Use parameterized queries to prevent SQL injection
- Implement retry logic with exponential backoff (max 5 attempts)
- Log all database errors with full context
- Railway provides automatic backups and connection pooling

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


### 4. Caching Layer (Upstash Redis)

### 4. Caching Layer (Upstash Redis)

**UpstashCache** - Implements query result caching and rate limiting using Upstash

```typescript
interface UpstashCache {
  // Connection management
  connect(redisUrl: string): Promise<void>;  // Use Upstash REDIS_URL
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  
  // Query cache operations
  get(query: string, page: number, pageSize: number): Promise<SearchResults | null>;
  set(query: string, page: number, pageSize: number, results: SearchResults, ttl: number): Promise<void>;
  invalidate(pattern: string): Promise<number>;
  
  // Rate limiting operations (no session storage needed - Clerk handles sessions)
  incrementRequestCount(ip: string, windowMs: number): Promise<number>;
  getRequestCount(ip: string): Promise<number>;
}

interface CacheKey {
  // Format: "search:{query}:{page}:{pageSize}"
  generate(query: string, page: number, pageSize: number): string;
}
```

**Implementation Strategy:**
- Use `@upstash/redis` library (optimized for serverless)
- Connect using REDIS_URL from Upstash dashboard
- Serverless architecture: no connection pooling needed
- Global edge caching for low latency
- Free tier: 10,000 commands/day (sufficient for portfolio project)
- Implement graceful fallback when Upstash is unavailable
- Use consistent key naming: `search:{query}:{page}:{pageSize}`
- Set TTL to 5 minutes for search results
- Use LRU eviction policy
- Log cache hit/miss rates for monitoring

**Upstash Setup:**
1. Create account at https://upstash.com
2. Create Redis database (choose region closest to Railway deployment)
3. Copy REDIS_URL from dashboard
4. Free tier includes: 10K commands/day, 256MB storage

**Cache Warming Strategy:**
- Identify top 100 queries from analytics
- Pre-warm cache on application startup
- Refresh popular queries every 5 minutes


### 5. Monitoring and Observability

### 5. Monitoring and Observability

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
  userId?: string;          // From Clerk JWT
  duration?: number;
  error?: Error;
  redditApiCalls?: number;  // Track Reddit API usage
  [key: string]: any;
}

// Log format (JSON)
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Search query processed",
  "requestId": "req-123",
  "userId": "user_clerk_123",
  "query": "typescript tutorial",
  "resultCount": 42,
  "duration": 85,
  "cacheHit": false,
  "redditApiCalls": 3
}
```

**ErrorTracker** - Sentry integration for error tracking

```typescript
interface ErrorTracker {
  initialize(dsn: string, environment: string): void;
  captureException(error: Error, context?: ErrorContext): void;
  captureMessage(message: string, level: 'error' | 'warning' | 'info'): void;
  setUser(user: { id: string; email?: string }): void;  // From Clerk
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
  incrementRedditApiCall(endpoint: string): void;  // Track Reddit API usage
  
  // Histogram metrics
  recordRequestDuration(endpoint: string, duration: number): void;
  recordDatabaseQueryDuration(operation: string, duration: number): void;
  recordSearchLatency(duration: number): void;
  recordRedditApiLatency(duration: number): void;
  
  // Gauge metrics
  setActiveConnections(count: number): void;
  setMemoryUsage(bytes: number): void;
  setRedditRateLimitRemaining(count: number): void;
  
  // Export metrics
  getMetrics(): Promise<string>;  // Prometheus format
}
```

**Implementation Strategy:**
- Winston transports: Console (development), File (production)
- Sentry free tier: 5,000 errors/month
- Prometheus metrics exposed at `/metrics`
- Sanitize sensitive data before logging (passwords, tokens, API keys)
- Include request ID in all logs for tracing
- Track Reddit API usage and rate limits in metrics


### 6. Security Layer

### 6. Security Layer

**RateLimiter** - IP-based rate limiting using Upstash

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

// No user registration validation needed - Clerk handles it
```

**SecurityHeaders** - Helmet.js configuration

```typescript
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://clerk.com"],  // Allow Clerk scripts
      imgSrc: ["'self'", "data:", "https:", "https://img.clerk.com"],  // Allow Clerk images
      connectSrc: ["'self'", process.env.API_URL, "https://api.clerk.com"]  // Allow Clerk API
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
- Rate limiting: 100 requests/minute per IP using Upstash
- Return HTTP 429 with `Retry-After` header when limit exceeded
- Validate all user input before processing
- Return detailed validation errors (HTTP 400)
- No custom password hashing needed (Clerk handles it)
- No custom JWT generation needed (Clerk handles it)
- Verify Clerk JWT tokens using `@clerk/clerk-sdk-node`
- Enforce HTTPS in production (redirect HTTP to HTTPS)


### 7. Health Check System

### 7. Health Check System

**HealthChecker** - Comprehensive health monitoring

```typescript
interface HealthChecker {
  check(): Promise<HealthCheckResult>;
  checkDatabase(): Promise<ComponentHealth>;  // Railway PostgreSQL
  checkRedis(): Promise<ComponentHealth>;     // Upstash
  checkMemory(): Promise<ComponentHealth>;
  checkRedditApi(): Promise<ComponentHealth>; // Reddit OAuth status
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    redditApi: ComponentHealth;
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
        "provider": "Railway",
        "activeConnections": 3,
        "idleConnections": 7
      }
    },
    "redis": {
      "status": "up",
      "responseTime": 2,
      "details": {
        "provider": "Upstash",
        "commandsUsed": 1250,
        "commandsLimit": 10000
      }
    },
    "memory": {
      "status": "up",
      "details": {
        "usedMB": 256,
        "totalMB": 512,
        "percentage": 50
      }
    },
    "redditApi": {
      "status": "up",
      "details": {
        "rateLimitRemaining": 450,
        "rateLimitLimit": 600,
        "tokenExpiry": "2024-01-15T11:30:00.000Z"
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
- Railway health checks every 30 seconds
- Include Reddit OAuth token status and rate limit info


### 8. Search Performance Optimization

### 8. Search Performance Optimization

**Enhanced Query Processor** - Adds caching and typo tolerance

```typescript
interface EnhancedQueryProcessor extends QueryProcessor {
  // Typo tolerance using Levenshtein distance
  findSimilarTerms(term: string, maxDistance: number): string[];
  
  // Cache-aware search with Upstash
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
  // Warm Upstash cache with popular queries
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
- Check Upstash cache before database query
- Cache hit: Return in <10ms
- Cache miss: Execute search, cache result with 5-minute TTL
- Typo tolerance: Try Levenshtein distance ≤2 for terms ≥4 chars
- Pre-warm cache with top 100 queries on startup
- Target: p95 response time <100ms


### 9. Frontend Performance Optimization

### 9. Frontend Performance Optimization

**Build Configuration** - Vite optimization with Clerk

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
          'clerk': ['@clerk/clerk-react'],  // Separate Clerk bundle
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

// Route configuration with Clerk protection
<ClerkProvider publishableKey={clerkKey}>
  <Routes>
    <Route path="/" element={
      <Suspense fallback={<LoadingSpinner />}>
        <SearchPage />
      </Suspense>
    } />
    <Route path="/profile" element={
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <ProfilePage />
        </Suspense>
      </ProtectedRoute>
    } />
  </Routes>
</ClerkProvider>
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
- Code splitting: 4+ chunks (vendor, clerk, ui, routes)


### 10. Deployment Infrastructure

### 10. Deployment Infrastructure

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
  
  // Railway PostgreSQL
  DATABASE_URL: z.string().url(),
  
  // Upstash Redis
  REDIS_URL: z.string().url(),
  
  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().min(1),
  
  // Reddit OAuth
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_USER_AGENT: z.string().min(1),
  
  // Sentry
  SENTRY_DSN: z.string().url().optional(),
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
    
    // Close Railway database connections
    await database.close();
    
    // Close Upstash connections
    await redis.disconnect();
    
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }
}

// Register signal handlers
process.on('SIGTERM', () => shutdown.shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown.shutdown('SIGINT'));
```


### 11. Vercel Frontend Deployment

**VercelDeployment** - Automatic frontend deployment with global CDN

```typescript
interface VercelDeployment {
  // Deployment configuration
  framework: 'vite';
  buildCommand: 'npm run build';
  outputDirectory: 'dist';
  installCommand: 'npm ci';
  
  // Environment variables
  environmentVariables: {
    VITE_API_URL: string;              // Railway backend URL
    VITE_CLERK_PUBLISHABLE_KEY: string; // Clerk public key
  };
  
  // Deployment features
  automaticDeployments: boolean;      // Deploy on push to main
  previewDeployments: boolean;        // Deploy PRs for testing
  productionDomain: string;           // Custom domain
  sslCertificates: 'automatic';       // Auto SSL
}
```

**Implementation Strategy:**
- Connect GitHub repository to Vercel
- Configure build settings: framework=vite, output=dist
- Set environment variables in Vercel dashboard
- Enable automatic deployments for main branch
- Enable preview deployments for pull requests
- Configure custom domain with automatic SSL
- Leverage global CDN for fast load times worldwide
- Use Vercel Analytics for performance monitoring

**Vercel Setup:**
1. Sign up at https://vercel.com
2. Import GitHub repository
3. Select frontend directory
4. Configure environment variables
5. Deploy

**Why Vercel:**
- Automatic deployments from GitHub (no manual steps)
- Global CDN with edge caching (fast worldwide)
- Preview URLs for every PR (easy testing)
- Zero configuration for Vite projects
- Generous free tier for personal projects
- Automatic SSL certificates
- Built-in analytics and performance monitoring


### 12. Resend Transactional Email Integration

**ResendEmailClient** - Send transactional emails via Resend API

```typescript
interface ResendEmailClient {
  // Send welcome email
  sendWelcomeEmail(user: WelcomeEmailData): Promise<EmailResult>;
  
  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): boolean;
  
  // Handle Clerk webhook
  handleClerkWebhook(event: ClerkWebhookEvent): Promise<void>;
}

interface WelcomeEmailData {
  to: string;              // User email
  name: string;            // User name
  userId: string;          // Clerk user ID
}

interface EmailResult {
  id: string;              // Resend message ID
  success: boolean;
  error?: string;
}

interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
  };
}
```

**Welcome Email Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to FeedVex</title>
</head>
<body>
  <h1>Welcome to FeedVex, {{name}}!</h1>
  <p>Your account has been created successfully.</p>
  
  <h2>Getting Started</h2>
  <ul>
    <li>Search Reddit content from /r/all</li>
    <li>Filter by subreddit, date, and relevance</li>
    <li>View trending topics and discussions</li>
  </ul>
  
  <p>Need help? Contact us at support@feedvex.com</p>
  
  <p>Happy searching!</p>
  <p>The FeedVex Team</p>
</body>
</html>
```

**Implementation Strategy:**
- Use `resend` npm package for API calls
- Set up Clerk webhook endpoint at `/api/webhooks/clerk`
- Verify webhook signature using Clerk signing secret
- Extract user email and name from webhook payload
- Send welcome email using Resend API
- Retry failed emails up to 3 times with exponential backoff
- Log all email sends with Resend message ID
- Handle webhook within 3 seconds to avoid Clerk timeout

**Resend Setup:**
1. Create account at https://resend.com
2. Verify domain or use resend.dev for testing
3. Get API key from dashboard
4. Configure Clerk webhook in Clerk dashboard
5. Set webhook URL to `https://your-api.railway.app/api/webhooks/clerk`
6. Add RESEND_API_KEY to environment variables

**Environment Variables:**
```env
RESEND_API_KEY=re_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```


### 13. Trigger.dev Background Job Orchestration

**TriggerDevClient** - Scheduled background jobs for Reddit collection

```typescript
interface TriggerDevClient {
  // Initialize Trigger.dev client
  initialize(apiKey: string, apiUrl: string): Promise<void>;
  
  // Register background jobs
  registerJobs(): Promise<void>;
  
  // Define Reddit collection job
  defineRedditCollectionJob(): TriggerJob;
  
  // Manually trigger job
  triggerJob(jobId: string, payload: any): Promise<JobRun>;
}

interface TriggerJob {
  id: string;
  name: string;
  schedule: string;          // Cron expression
  handler: (payload: any) => Promise<void>;
  retry: RetryConfig;
}

interface JobRun {
  id: string;
  status: 'pending' | 'running' | 'success' | 'failure';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface RetryConfig {
  maxAttempts: 3;
  backoff: 'exponential';
  initialDelayMs: 1000;
  maxDelayMs: 30000;
}
```

**Reddit Collection Job Definition:**
```typescript
// Job: Collect Reddit data for popular queries
const redditCollectionJob = {
  id: 'reddit-collection',
  name: 'Collect Reddit Data',
  schedule: '0 * * * *',  // Every hour
  
  handler: async (payload) => {
    // Get top 20 queries from analytics
    const popularQueries = await getPopularQueries(20);
    
    // Collect posts for each query
    for (const query of popularQueries) {
      try {
        const result = await redditCollector.collectForQuery(query);
        logger.info('Reddit collection complete', {
          query,
          postsCollected: result.postsCollected,
          duration: result.timeElapsed
        });
        
        // Invalidate cache for this query
        await cache.invalidate(`search:${query}:*`);
      } catch (error) {
        logger.error('Reddit collection failed', { query, error });
        // Continue with next query
      }
    }
  },
  
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelayMs: 1000,
    maxDelayMs: 30000
  }
};
```

**Implementation Strategy:**
- Use `@trigger.dev/sdk` npm package
- Replace node-cron with Trigger.dev scheduled jobs
- Define job for hourly Reddit data collection
- Collect data for top 20 queries from analytics
- Automatic retries with exponential backoff
- Monitor job execution in Trigger.dev dashboard
- Log all job runs with duration and success/failure
- Alert on repeated failures

**Trigger.dev Setup:**
1. Create account at https://trigger.dev
2. Create new project
3. Get API key and API URL
4. Install @trigger.dev/sdk
5. Register jobs in application startup
6. Monitor jobs in dashboard

**Environment Variables:**
```env
TRIGGER_API_KEY=tr_xxx
TRIGGER_API_URL=https://api.trigger.dev
```

**Why Trigger.dev:**
- No need to keep server running 24/7 for cron jobs
- Built-in monitoring dashboard
- Automatic retries with exponential backoff
- Job execution history and logs
- More reliable than self-hosted cron
- Free tier: 100K task runs/month
- Better for serverless/Railway deployments


### 14. Environment Variable Validation with Zod

**EnvValidator** - Validate all environment variables at startup

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  
  // Railway PostgreSQL
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  
  // Upstash Redis
  REDIS_URL: z.string().url().startsWith('redis://'),
  
  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().min(1).startsWith('sk_'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1).startsWith('pk_').optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).startsWith('whsec_').optional(),
  
  // Reddit OAuth
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_USER_AGENT: z.string().min(1).default('FeedVex/1.0.0'),
  
  // Resend
  RESEND_API_KEY: z.string().min(1).startsWith('re_').optional(),
  
  // Trigger.dev
  TRIGGER_API_KEY: z.string().min(1).startsWith('tr_').optional(),
  TRIGGER_API_URL: z.string().url().optional(),
  
  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  
  // API Configuration
  API_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    logger.info('Environment validation successful');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Environment validation failed:', {
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          received: maskSensitive(String(e.input))
        }))
      });
    }
    process.exit(1);
  }
}

function maskSensitive(value: string): string {
  if (!value || value.length < 4) return '***';
  return value.substring(0, 4) + '***';
}

// Validate on startup
const env = validateEnv();
export default env;
```

**Implementation Strategy:**
- Validate all environment variables at application startup
- Fail fast with clear error messages if validation fails
- Use Zod for runtime type checking and validation
- Mask sensitive values in error messages (show only first 4 chars)
- List all validation errors, not just the first one
- Provide sensible defaults for optional variables
- Load from .env file in development
- Export typed environment object for use throughout app

**Benefits:**
- Catch configuration errors before serving traffic
- Clear error messages for missing/invalid variables
- Type-safe environment access throughout codebase
- Prevents silent failures from misconfiguration
- Production best practice


### 15. Comprehensive Health Checks

**HealthChecker** - Verify all dependencies are operational

```typescript
interface HealthChecker {
  check(): Promise<HealthCheckResult>;
  checkDatabase(): Promise<ComponentHealth>;
  checkRedis(): Promise<ComponentHealth>;
  checkRedditApi(): Promise<ComponentHealth>;
  checkMemory(): Promise<ComponentHealth>;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    redditApi: ComponentHealth;
    memory: ComponentHealth;
  };
}

interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  details?: Record<string, any>;
  error?: string;
}
```

**Health Check Implementation:**
```typescript
async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await db.query('SELECT 1');
    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: {
        provider: 'Railway',
        activeConnections: pool.totalCount,
        idleConnections: pool.idleCount
      }
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'up',
      responseTime: Date.now() - start,
      details: {
        provider: 'Upstash'
      }
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message
    };
  }
}

async function checkRedditApi(): Promise<ComponentHealth> {
  try {
    const rateLimitStatus = redditClient.getRateLimitStatus();
    const tokenExpiry = redditClient.getTokenExpiry();
    
    return {
      status: 'up',
      details: {
        rateLimitRemaining: rateLimitStatus.remaining,
        rateLimitLimit: rateLimitStatus.limit,
        tokenExpiry: tokenExpiry.toISOString()
      }
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message
    };
  }
}
```

**Implementation Strategy:**
- Health check endpoint: `GET /api/v1/health`
- Return HTTP 200 if all components healthy
- Return HTTP 503 if any critical component unhealthy
- Timeout each check after 1 second
- Cache results for 5 seconds to prevent overload
- Railway calls health check every 30 seconds
- Include response times for performance monitoring
- Check database, Redis, Reddit API, and memory


### 16. Retry Logic with Exponential Backoff

**RetryHandler** - Automatic retry for transient failures

```typescript
interface RetryHandler {
  retry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T>;
}

interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
  retryableErrors: string[];
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterMs: 50,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNRESET',
    'EPIPE'
  ]
};
```

**Retry Implementation:**
```typescript
async function retry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry non-transient errors
      if (!isRetryableError(error, config.retryableErrors)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );
      const jitter = Math.random() * config.jitterMs;
      const delay = baseDelay + jitter;
      
      logger.warn('Operation failed, retrying', {
        attempt,
        maxAttempts: config.maxAttempts,
        delayMs: Math.round(delay),
        error: error.message
      });
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

function isRetryableError(error: any, retryableErrors: string[]): boolean {
  return retryableErrors.some(code => 
    error.code === code || error.message?.includes(code)
  );
}
```

**Implementation Strategy:**
- Retry database queries on connection errors
- Retry Redis commands on network errors
- Retry Reddit API calls on 5xx errors
- Retry Resend API calls on transient errors
- Don't retry on 4xx client errors
- Add jitter to prevent thundering herd
- Log each retry attempt with delay
- Throw error after all retries exhausted


### 17. Structured Logging with Request IDs

**Logger** - Structured JSON logging with request tracing

```typescript
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

interface LogContext {
  requestId?: string;
  userId?: string;
  duration?: number;
  [key: string]: any;
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Request ID middleware
function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

// Logging middleware
function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: req.requestId,
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
}

// Sanitize sensitive data
function sanitize(data: any): any {
  const sensitive = ['password', 'token', 'secret', 'key', 'authorization'];
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitize(sanitized[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}
```

**Log Format:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_clerk_123",
  "method": "POST",
  "path": "/api/v1/search",
  "statusCode": 200,
  "duration": 85,
  "userAgent": "Mozilla/5.0..."
}
```

**Implementation Strategy:**
- Generate UUID v4 for each request
- Include request ID in X-Request-ID response header
- Include request ID in all log entries for that request
- Use JSON format for structured logging
- Include user ID from Clerk JWT in logs
- Log request duration for performance monitoring
- Sanitize sensitive data before logging
- Use appropriate log levels (error, warn, info, debug)


### 18. Security Headers with Clerk Domain Allowlist

**SecurityHeaders** - Helmet.js configuration with Clerk support

```typescript
import helmet from 'helmet';

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'",
        "https://clerk.com",
        "https://*.clerk.accounts.dev"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "https://img.clerk.com"
      ],
      connectSrc: [
        "'self'",
        process.env.API_URL || 'http://localhost:3000',
        "https://api.clerk.com",
        "https://clerk.com"
      ],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

// Apply in Express app
app.use(securityHeaders);
```

**Implementation Strategy:**
- Use Helmet.js for security headers
- Customize CSP to allow Clerk domains
- Allow scripts from clerk.com for authentication
- Allow images from img.clerk.com for user avatars
- Allow connections to api.clerk.com for API calls
- Enable HSTS with 1-year max-age
- Deny framing to prevent clickjacking
- Enable XSS filter and MIME sniffing protection
- Use strict referrer policy


### 19. Missing Dependencies Installation

**Required Dependencies:**

```json
{
  "dependencies": {
    "@clerk/clerk-react": "^4.30.0",
    "@clerk/clerk-sdk-node": "^4.13.0",
    "@upstash/redis": "^1.28.0",
    "@sentry/node": "^7.99.0",
    "@sentry/react": "^7.99.0",
    "web-vitals": "^3.5.1",
    "zod": "^3.22.4",
    "resend": "^3.0.0",
    "@trigger.dev/sdk": "^2.3.0"
  }
}
```

**Installation:**
```bash
# Frontend dependencies
cd frontend
npm install @clerk/clerk-react @sentry/react web-vitals

# Backend dependencies
cd backend
npm install @clerk/clerk-sdk-node @upstash/redis @sentry/node zod resend @trigger.dev/sdk
```


### 20. Dockerfile Entry Point Fix

**Corrected Backend Dockerfile:**

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

# FIXED: Changed from backend/dist/index.js to backend/dist/server.js
CMD ["node", "backend/dist/server.js"]
```

**Why This Fix Matters:**
- The build output places the compiled server at `backend/dist/server.js`
- The original Dockerfile pointed to `backend/dist/index.js` which doesn't exist
- This would cause the container to fail at startup with "Cannot find module"
- Critical for Railway deployment to work


### 21. CI/CD Pipeline

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

### Environment Configuration Schema

**Zod Validation Schema:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  
  // Railway PostgreSQL
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  
  // Upstash Redis
  REDIS_URL: z.string().url().startsWith('redis://'),
  
  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().min(1).startsWith('sk_'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1).startsWith('pk_').optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1).startsWith('whsec_').optional(),
  
  // Reddit OAuth
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_USER_AGENT: z.string().min(1).default('FeedVex/1.0.0'),
  
  // Resend
  RESEND_API_KEY: z.string().min(1).startsWith('re_').optional(),
  
  // Trigger.dev
  TRIGGER_API_KEY: z.string().min(1).startsWith('tr_').optional(),
  TRIGGER_API_URL: z.string().url().optional(),
  
  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  
  // API Configuration
  API_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;
```

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

**Analytics Tables** (No users table needed - Clerk handles user data)
```sql
CREATE TABLE analytics_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),    -- Clerk user ID
    session_id VARCHAR(255)
);

CREATE TABLE analytics_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    doc_id VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255),    -- Clerk user ID
    session_id VARCHAR(255),
    FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

### Upstash Redis Data Structures

### Upstash Redis Data Structures

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

**Collection Deduplication**
```
Key: "collection:{query}"
Value: "in_progress" | "completed"
TTL: 60 seconds (deduplication window)
```

### API Input Validation Schemas

**Search Request Validation:**
```typescript
import { z } from 'zod';

const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  page: z.number().int().min(1).max(1000).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  filters: z.object({
    subreddit: z.string().max(100).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    sortBy: z.enum(['relevance', 'date', 'score']).optional().default('relevance')
  }).optional()
});

type SearchRequest = z.infer<typeof SearchRequestSchema>;
```

**Webhook Validation:**
```typescript
const ClerkWebhookSchema = z.object({
  type: z.enum(['user.created', 'user.updated', 'user.deleted']),
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string().email()
    })),
    first_name: z.string().optional(),
    last_name: z.string().optional()
  })
});

type ClerkWebhook = z.infer<typeof ClerkWebhookSchema>;
```


## Correctness Properties

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Properties

**Property 1: Clerk JWT Verification**
*For any* API request with a Clerk JWT token in the Authorization header, the system should verify the token using Clerk's verification library, and on success, extract the user ID and email from the token payload.
**Validates: Requirements 1.4, 1.5**

**Property 2: Clerk Authentication Failure Handling**
*For any* API request with an invalid or expired Clerk JWT token, the system should return HTTP 401 with a clear error message indicating the authentication failure reason.
**Validates: Requirements 1.6**

### Reddit OAuth Collection Properties

**Property 3: Reddit OAuth Token Management**
*For any* Reddit API request, the system should use a valid OAuth access token, and when the token expires (after 1 hour), the system should automatically refresh it before making the next request.
**Validates: Requirements 2.1, 2.2, 2.3**

**Property 4: Reddit Rate Limit Compliance**
*For any* sequence of Reddit API requests, the system should track the request count and ensure it never exceeds 600 requests per minute, throttling requests when approaching the limit.
**Validates: Requirements 2.6, 2.8**

**Property 5: On-Demand Collection Trigger**
*For any* search query where the most recent data is older than 1 hour, the system should trigger on-demand collection from /r/all while returning existing results immediately.
**Validates: Requirements 3.1, 3.2, 3.3, 3.6**

**Property 6: Collection Deduplication**
*For any* search query that triggers collection, if another collection for the same query is already in progress, the system should deduplicate the request and wait for the existing collection to complete.
**Validates: Requirements 3.8**

**Property 7: Reddit Collection Storage**
*For any* posts collected from Reddit, the system should store them in Railway PostgreSQL with all metadata (title, content, author, subreddit, score, created_utc) and update the search index.
**Validates: Requirements 2.7, 2.10**

### Database and Connection Management Properties

**Property 8: Connection Pool Lifecycle**
*For any* database operation sequence, the connection pool should maintain its configured size, acquiring connections for operations and releasing them back to the pool after completion, ensuring no connection leaks occur.
**Validates: Requirements 4.3, 4.4, 4.5**

**Property 9: Transaction Atomicity**
*For any* set of database operations that require atomicity, executing them within a transaction should result in either all operations succeeding or all operations failing, with no partial state changes.
**Validates: Requirements 4.7**

**Property 10: Database Error Handling**
*For any* database error that occurs during operation, the system should log the error with full context (operation type, parameters, stack trace) and return an appropriate HTTP error response (500 for internal errors, 503 for unavailability).
**Validates: Requirements 4.9**

**Property 11: Connection Retry with Exponential Backoff**
*For any* database connection failure, the system should retry the connection up to 5 times with exponentially increasing delays (e.g., 100ms, 200ms, 400ms, 800ms, 1600ms) before giving up.
**Validates: Requirements 4.10**

**Property 12: Graceful Resource Cleanup**
*For any* shutdown signal (SIGTERM, SIGINT), the system should close all Railway PostgreSQL and Upstash connections gracefully, ensuring no active connections remain after shutdown completes.
**Validates: Requirements 4.6**


### Configuration and Environment Properties

**Property 13: Environment Variable Loading**
*For any* configuration value needed by the system (CLERK_SECRET_KEY, REDIS_URL, DATABASE_URL, REDDIT_CLIENT_ID, etc.), it should be loaded from environment variables, and missing required variables should cause startup to fail with a clear error message listing the missing variables.
**Validates: Requirements 6.2, 6.10, 16.1, 16.2**

### Monitoring and Observability Properties

**Property 14: Comprehensive Request Logging**
*For any* HTTP request processed by the API, the system should produce a structured log entry containing timestamp, request ID, HTTP method, path, status code, duration, user ID (from Clerk), and any relevant metadata.
**Validates: Requirements 8.1**

**Property 15: Error Capture and Tracking**
*For any* error that occurs during request processing, the system should capture it with full stack trace and context, log it locally, and send it to Sentry for tracking.
**Validates: Requirements 8.2, 8.3**

**Property 16: Metrics Collection**
*For any* request completion, the system should record response time metrics, and for any error, the system should increment error rate metrics, ensuring all metrics are available at the /metrics endpoint.
**Validates: Requirements 8.5, 8.6**

**Property 17: Log Level Appropriateness**
*For any* event logged by the system, it should use the appropriate log level: error for failures, warn for degraded conditions, info for normal operations, and debug for detailed diagnostics.
**Validates: Requirements 8.7**

**Property 18: Sensitive Data Sanitization**
*For any* log entry containing sensitive data (passwords, tokens, API keys, Clerk secrets, Reddit secrets), the system should sanitize the sensitive values before writing to logs, replacing them with masked values (e.g., "***").
**Validates: Requirements 8.9**


### Caching Properties

**Property 19: Cache-First Search Strategy**
*For any* search query, the system should check the Upstash cache before querying the database, and on cache miss, should execute the search and store results in Upstash with a 5-minute TTL.
**Validates: Requirements 5.1, 5.4, 9.1, 9.3, 14.2, 14.4**

**Property 20: Cache Hit Optimization**
*For any* cached search query, the system should return results directly from Upstash without querying the database, demonstrating cache effectiveness.
**Validates: Requirements 5.3, 14.3**

**Property 21: Cache Graceful Degradation**
*For any* Upstash connection failure, the system should fall back to direct database queries without crashing, logging the cache unavailability as a warning.
**Validates: Requirements 5.5, 14.5**

**Property 22: Consistent Cache Key Generation**
*For any* search query with the same parameters (query text, page, pageSize), the system should generate identical cache keys, ensuring cache hits for repeated queries.
**Validates: Requirements 14.8**

**Property 23: LRU Cache Eviction**
*For any* cache that reaches capacity, the system should evict least recently used entries according to Upstash's LRU policy.
**Validates: Requirements 9.8, 14.7**


### Search Performance Properties

**Property 24: Typo Tolerance with Levenshtein Distance**
*For any* search query containing terms with typos (edit distance ≤2 from indexed terms), the system should find similar terms using Levenshtein distance and include results for those terms.
**Validates: Requirements 9.4**

**Property 25: BM25 Relevance Scoring**
*For any* search query, the system should calculate relevance scores using the BM25 algorithm combined with recency, popularity, and engagement factors, producing a final score for each result.
**Validates: Requirements 9.5**

**Property 26: Slow Query Logging**
*For any* search query that takes longer than a configured threshold (e.g., 500ms), the system should log it as a slow query with full details (query text, execution time, result count) for performance analysis.
**Validates: Requirements 9.10**

### Security Properties

**Property 27: Rate Limiting Enforcement**
*For any* IP address that exceeds 100 requests per minute, the system should return HTTP 429 (Too Many Requests) with a Retry-After header indicating when the client can retry, using Upstash to track request counts.
**Validates: Requirements 11.1, 11.2**

**Property 28: Input Validation with Detailed Errors**
*For any* user input that fails validation against Zod schemas, the system should return HTTP 400 with detailed error messages specifying which fields failed validation and why.
**Validates: Requirements 11.4, 11.5**

**Property 29: Parameterized SQL Queries**
*For any* SQL query constructed by the system, it should use parameterized statements (prepared statements) rather than string concatenation, preventing SQL injection attacks.
**Validates: Requirements 11.8**


### API Response Properties

**Property 30: Cache Control Headers**
*For any* API response sent by the system, it should include appropriate Cache-Control headers based on the endpoint type (no-cache for dynamic data, max-age for static data).
**Validates: Requirements 10.6**

### Environment Validation Properties

**Property 31: Environment Variable Validation at Startup**
*For any* required environment variable (CLERK_SECRET_KEY, REDIS_URL, DATABASE_URL, etc.), the system should validate its presence and format using Zod schemas at startup, and fail with a clear error message if validation fails.
**Validates: Requirements 28.1, 28.2, 28.3, 28.5**

**Property 32: Sensitive Data Masking in Logs**
*For any* environment variable or configuration value logged by the system, if it contains sensitive data (passwords, tokens, API keys), the system should mask it by showing only the first 4 characters followed by asterisks.
**Validates: Requirements 28.7**

### Graceful Shutdown Properties

**Property 33: Graceful Shutdown Sequence**
*For any* shutdown signal (SIGTERM, SIGINT), the system should stop accepting new requests, wait up to 30 seconds for pending requests to complete, close all database and Redis connections, and exit with code 0.
**Validates: Requirements 29.1, 29.2, 29.3, 29.4, 29.5, 29.6**

**Property 34: Shutdown Logging**
*For any* graceful shutdown sequence, the system should log "Graceful shutdown initiated" at the start and "Graceful shutdown complete" with duration at the end.
**Validates: Requirements 29.8, 29.9**

### Health Check Properties

**Property 35: Comprehensive Dependency Health Checks**
*For any* health check request, the system should verify connectivity to Railway PostgreSQL, Upstash Redis, and Reddit OAuth API, and return HTTP 200 if all are healthy or HTTP 503 if any are unhealthy.
**Validates: Requirements 30.1, 30.2, 30.3, 30.4, 30.5**

**Property 36: Health Check Response Time**
*For any* health check execution, the system should complete all dependency checks within 1 second, timing out any individual check that exceeds this limit.
**Validates: Requirements 30.6, 30.7**

**Property 37: Health Check Caching**
*For any* health check request received within 5 seconds of a previous check, the system should return cached results to prevent overload from frequent health check calls.
**Validates: Requirements 30.9**

### Input Validation Properties

**Property 38: Zod Schema Validation for API Inputs**
*For any* API request with input parameters, the system should validate them using Zod schemas and return HTTP 400 with detailed field-level error messages if validation fails.
**Validates: Requirements 31.1, 31.2, 31.4, 31.9**

**Property 39: Pagination Parameter Validation**
*For any* search request with pagination parameters (page, pageSize), the system should validate that page is between 1 and 1000, and pageSize is between 1 and 100, returning HTTP 400 with specific errors if invalid.
**Validates: Requirements 31.4**

### Retry Logic Properties

**Property 40: Exponential Backoff Retry**
*For any* transient failure (database connection error, Redis timeout, Reddit API 5xx), the system should retry up to 3 times with exponentially increasing delays (100ms, 200ms, 400ms) plus random jitter.
**Validates: Requirements 32.1, 32.2, 32.3, 32.4, 32.5**

**Property 41: Non-Transient Error Handling**
*For any* non-transient error (4xx client errors), the system should not retry and should return immediately with the appropriate error response.
**Validates: Requirements 32.7**

**Property 42: Retry Logging**
*For any* retry attempt, the system should log the attempt number, delay duration, and error message, and on successful recovery, log the successful retry.
**Validates: Requirements 32.8, 32.9**

### Structured Logging Properties

**Property 43: Request ID Generation and Propagation**
*For any* HTTP request received, the system should generate a unique UUID v4 request ID, include it in the X-Request-ID response header, and include it in all log entries for that request.
**Validates: Requirements 33.1, 33.2, 33.3**

**Property 44: Structured JSON Logging**
*For any* log entry written, the system should use JSON format with consistent fields including timestamp, level, message, requestId, userId (from Clerk), and duration.
**Validates: Requirements 33.4, 33.5**

**Property 45: Sensitive Data Sanitization in Logs**
*For any* log entry containing sensitive data (passwords, tokens, API keys, Clerk secrets), the system should sanitize these values before writing, replacing them with masked values.
**Validates: Requirements 33.10**

### Security Headers Properties

**Property 46: Clerk Domain Allowlist in CSP**
*For any* HTTP response, the system should include Content-Security-Policy headers that allow scripts from clerk.com, images from img.clerk.com, and connections to api.clerk.com, while maintaining security for other resources.
**Validates: Requirements 34.2, 34.3, 34.4**

**Property 47: HSTS Header Configuration**
*For any* HTTP response in production, the system should include Strict-Transport-Security header with max-age of 31536000 seconds and includeSubDomains directive.
**Validates: Requirements 34.5**

### Email Integration Properties

**Property 48: Clerk Webhook Signature Verification**
*For any* webhook request received at /api/webhooks/clerk, the system should verify the webhook signature using Clerk's signing secret before processing the event.
**Validates: Requirements 26.2**

**Property 49: Welcome Email Delivery**
*For any* verified user.created webhook event, the system should extract the user's email and name, and send a welcome email using Resend API with retry logic.
**Validates: Requirements 26.3, 26.4, 26.5, 26.6**

### Background Job Properties

**Property 50: Trigger.dev Job Registration**
*For any* application startup, the system should register background jobs with Trigger.dev for scheduled Reddit data collection with automatic retry configuration.
**Validates: Requirements 27.1, 27.6**

**Property 51: Scheduled Reddit Collection**
*For any* hourly job execution, the system should collect Reddit data for the top 20 popular queries, store results in Railway PostgreSQL, and invalidate relevant cache entries.
**Validates: Requirements 27.3, 27.4, 27.5, 27.8**

### Deployment Properties

**Property 52: Vercel Automatic Deployment**
*For any* push to the main branch, Vercel should automatically build and deploy the frontend with environment variables loaded from Vercel configuration.
**Validates: Requirements 25.1, 25.5**

**Property 53: Docker Entry Point Correctness**
*For any* backend Docker container startup, the system should execute node backend/dist/server.js as the entry point, successfully starting the Express server.
**Validates: Requirements 36.2, 36.3, 36.6**

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
- 503 Service Unavailable: Railway PostgreSQL, Upstash, or Reddit API unavailable

### Error Handling Strategy

1. **Validation Errors**: Return 400 with field-specific error messages
2. **Database Errors**: Retry with exponential backoff, return 503 if all retries fail
3. **Cache Errors**: Log warning and continue without cache (graceful degradation)
4. **Clerk Auth Errors**: Return 401 with clear error message
5. **Reddit API Errors**: Log error and continue processing, use cached data if available
6. **External API Errors**: Log error and return appropriate status code
7. **Unhandled Errors**: Catch at top level, log to Sentry, return 500 with generic message

### Retry Logic

```typescript
interface RetryConfig {
  maxAttempts: 3;
  initialDelayMs: 100;
  maxDelayMs: 5000;
  backoffMultiplier: 2;
  jitterMs: 50;
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'EPIPE'];
}

async function retry<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry non-transient errors (4xx)
      if (!isRetryableError(error, config.retryableErrors)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );
      const jitter = Math.random() * config.jitterMs;
      const delay = baseDelay + jitter;
      
      logger.warn('Operation failed, retrying', {
        attempt,
        maxAttempts: config.maxAttempts,
        delayMs: Math.round(delay),
        error: error.message
      });
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}
```

**Retry Strategy:**
- Attempt 1: Immediate execution
- Attempt 2: Wait 100ms + jitter (0-50ms)
- Attempt 3: Wait 200ms + jitter (0-50ms)
- Attempt 4: Wait 400ms + jitter (0-50ms)
- After 3 attempts: Throw final error

**Applied To:**
- Railway PostgreSQL queries (connection errors)
- Upstash Redis commands (network errors)
- Reddit API calls (5xx errors)
- Resend API calls (transient errors)

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

1. **Database Operations**: Connection pooling, transactions, error handling, retry logic
2. **Caching**: Cache hits/misses, TTL, graceful degradation
3. **Security**: Rate limiting, input validation with Zod, security headers with Clerk allowlist
4. **Search**: Query processing, ranking, typo tolerance
5. **Monitoring**: Structured logging with request IDs, error tracking, metrics collection
6. **Deployment**: Health checks for all dependencies, graceful shutdown with connection cleanup, environment validation
7. **Authentication**: Clerk JWT verification, webhook signature validation
8. **Email**: Resend integration, welcome email delivery, retry logic
9. **Background Jobs**: Trigger.dev job execution, scheduled Reddit collection
10. **Retry Logic**: Exponential backoff for transient failures

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



## Interview Talking Points

### Why These Services?

**Vercel for Frontend:**
"I chose Vercel over self-hosted frontend because it provides automatic deployments from GitHub, global CDN for fast load times worldwide, and zero configuration for Vite projects. This lets me focus on features rather than infrastructure, which is important for a solo project. The free tier is generous for portfolio projects, and Vercel's edge network ensures users get fast load times regardless of location. In an interview, I can discuss the tradeoffs between managed services and self-hosted solutions."

**Resend for Emails:**
"I integrated Resend for transactional emails because it has a simple API, generous free tier (3,000 emails/month), and is specifically designed for developers. I trigger welcome emails via Clerk webhooks when users sign up. This demonstrates understanding of event-driven architecture and third-party service integration. Resend was chosen over SendGrid or Mailgun because of its developer-friendly API and modern approach. I can explain webhook signature verification and retry logic in interviews."

**Trigger.dev for Background Jobs:**
"I replaced node-cron with Trigger.dev because it provides a monitoring dashboard, automatic retries, and doesn't require keeping a server running 24/7 just for cron jobs. This is more cost-effective and reliable than self-hosted cron. The free tier includes 100K task runs per month, which is plenty for collecting Reddit data hourly. Trigger.dev also gives me visibility into job execution history and failures, which is crucial for debugging production issues. This shows understanding of serverless architecture and managed services."

**Railway for Backend:**
"Railway provides PostgreSQL hosting and backend deployment with automatic provisioning, connection pooling, and health checks. It's simpler than AWS RDS + EC2 for a portfolio project, but I understand the tradeoffs. In production at scale, I'd consider AWS for more control and cost optimization. Railway's DATABASE_URL makes it easy to connect, and the free tier is sufficient for demonstration purposes."

**Upstash for Redis:**
"Upstash is serverless Redis with global edge caching. I chose it over self-hosted Redis because it requires zero maintenance, has a generous free tier (10K commands/day), and works well with serverless architectures. The @upstash/redis client is optimized for serverless environments. In interviews, I can discuss the benefits of serverless vs. self-hosted caching."

**Clerk for Authentication:**
"I used Clerk instead of implementing custom auth because it handles OAuth, social login, JWT tokens, and security best practices out of the box. This demonstrates understanding of when to use managed services vs. building from scratch. In production, authentication is critical and error-prone, so using a battle-tested service makes sense. I can explain JWT verification, webhook handling, and the security implications."

### Production Readiness Highlights

**Environment Validation:**
"I use Zod to validate all environment variables at startup. This catches configuration errors immediately rather than discovering them when a feature is used. For example, if CLERK_SECRET_KEY is missing, the app fails fast with a clear error message instead of crashing when someone tries to authenticate. This is a production best practice that prevents silent failures."

**Graceful Shutdown:**
"Graceful shutdown is critical in production. When Railway sends SIGTERM during a deployment, my app stops accepting new requests, completes pending requests, closes database connections, disconnects from Redis, and then exits. This prevents connection leaks and ensures no requests are dropped. I learned this is a common interview question about production readiness."

**Health Checks:**
"My health check endpoint verifies connectivity to Railway PostgreSQL, Upstash Redis, and Reddit API. This is important because Railway uses health checks to determine if the service is working. If any dependency is down, the health check returns 503, and Railway can restart the service or alert me. I also include response times for each dependency to help diagnose performance issues."

**Retry Logic:**
"I implement exponential backoff for all external service calls - Railway database, Upstash Redis, Reddit API, and Resend. This handles transient network issues gracefully. For example, if a database query fails, I retry after 100ms, then 200ms, then 400ms, up to 3 attempts. This is a standard production pattern that significantly improves reliability without overwhelming failing services."

**Structured Logging:**
"Every request gets a unique request ID that's included in all log entries for that request. This makes it easy to trace a request through the entire system - from API entry, through database queries, to cache operations. Logs are in JSON format so they can be easily parsed by log aggregation tools. This is essential for debugging production issues where you need to see exactly what happened for a specific request."

**Security Headers:**
"I use Helmet.js for security headers but had to customize the Content Security Policy to allow Clerk domains. This is a common real-world scenario - you need security headers, but you also need to integrate with third-party services. I specifically allow clerk.com for scripts, img.clerk.com for images, and api.clerk.com for API calls. This demonstrates understanding of CSP and how to balance security with functionality."

**Input Validation:**
"I use Zod for runtime type validation of all API inputs. TypeScript only provides compile-time checking, but Zod validates at runtime, which is essential for API endpoints. When validation fails, users get detailed error messages like 'query must be between 1 and 500 characters' instead of generic 400 errors. This improves developer experience and prevents invalid data from reaching the database."

### Technical Challenges Overcome

**Dockerfile Entry Point Bug:**
"I caught a critical bug during code review where the Dockerfile entry point was pointing to backend/dist/index.js instead of backend/dist/server.js. This would cause the container to fail at startup. I fixed it by checking the actual build output structure. This demonstrates attention to detail and understanding of Docker and build processes."

**Missing Dependencies:**
"During implementation, I identified several missing dependencies that would cause runtime errors: @clerk/clerk-react, @clerk/clerk-sdk-node, @upstash/redis, @sentry/node, @sentry/react, web-vitals, and zod. I added all of them with specific versions to ensure reproducible builds. This shows understanding of the full dependency tree and attention to detail."

**Clerk CSP Configuration:**
"Integrating Clerk required customizing the Content Security Policy to allow Clerk domains while maintaining security. I had to allow scripts from clerk.com, images from img.clerk.com, and connections to api.clerk.com. This was a real-world challenge that taught me about CSP directives and third-party integration security."

### Scaling Considerations

**To 1 Million Users:**
"To scale to 1 million users, I would:
1. Move to AWS RDS for PostgreSQL with read replicas
2. Use AWS ElastiCache for Redis with clustering
3. Implement CDN caching for API responses
4. Add database connection pooling with PgBouncer
5. Implement rate limiting per user, not just per IP
6. Add database sharding for horizontal scaling
7. Use message queues (SQS) for background jobs
8. Implement circuit breakers for external services
9. Add comprehensive monitoring with CloudWatch
10. Use auto-scaling for backend instances

The current architecture with managed services (Vercel, Railway, Upstash, Trigger.dev) provides a solid foundation that can be migrated to AWS as needed."

### What I Learned

**Production Best Practices:**
- Environment validation prevents silent failures
- Graceful shutdown prevents connection leaks
- Health checks enable automatic recovery
- Retry logic handles transient failures
- Structured logging enables debugging
- Request IDs enable distributed tracing
- Input validation prevents invalid data
- Security headers protect against common attacks

**Cloud Services Integration:**
- When to use managed services vs. self-hosted
- How to integrate multiple third-party services
- Webhook signature verification for security
- OAuth flows and JWT token management
- Serverless architecture benefits and tradeoffs

**Docker and Deployment:**
- Multi-stage builds for smaller images
- Entry point configuration and debugging
- Environment variable management
- Health check configuration
- Graceful shutdown handling

This project demonstrates production-ready full-stack development with modern cloud services, making it an excellent talking point for SDE interviews.
