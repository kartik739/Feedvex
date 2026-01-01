# Implementation Plan: Production-Ready FeedVex

## Overview

This implementation plan transforms FeedVex into a production-ready, resume-worthy project by integrating modern cloud services (Clerk for auth, Upstash for Redis, Railway for PostgreSQL, Vercel for frontend deployment, Resend for emails, Trigger.dev for background jobs), implementing comprehensive Reddit data collection from /r/all using OAuth, adding monitoring, security hardening, performance optimization, and deployment infrastructure. The plan is organized into incremental steps that build on each other, with testing integrated throughout.

**Key Cloud Services:**
- **Clerk**: Authentication (OAuth, social login, JWT tokens)
- **Upstash**: Serverless Redis (caching, rate limiting)
- **Railway**: PostgreSQL hosting (managed database)
- **Reddit OAuth**: 600 requests/minute API access
- **Sentry**: Error tracking and monitoring
- **Vercel**: Frontend deployment (automatic deployments, global CDN)
- **Resend**: Transactional emails (welcome emails, notifications)
- **Trigger.dev**: Background job orchestration (scheduled Reddit collection)

## Tasks

- [ ] 1. Set up Clerk authentication integration
  - [ ] 1.1 Install Clerk dependencies
    - Backend: npm install @clerk/clerk-sdk-node
    - Frontend: npm install @clerk/clerk-react
    - _Requirements: 1.1, 1.2_
  
  - [ ] 1.2 Create Clerk authentication middleware
    - Implement verifyToken() to verify Clerk JWT
    - Implement getUserFromToken() to extract user info
    - Implement requireAuth() middleware for protected routes
    - _Requirements: 1.4, 1.5, 1.6_
  
  - [ ]* 1.3 Write property test for Clerk JWT verification
    - **Property 1: Clerk JWT Verification**
    - **Validates: Requirements 1.4, 1.5**
  
  - [ ]* 1.4 Write property test for Clerk authentication failure handling
    - **Property 2: Clerk Authentication Failure Handling**
    - **Validates: Requirements 1.6**
  
  - [ ] 1.5 Integrate Clerk components in frontend
    - Wrap app with ClerkProvider
    - Add SignIn and SignUp components
    - Create ProtectedRoute component
    - Add UserButton for user menu
    - _Requirements: 1.1, 1.2, 1.7, 1.9, 1.10_
  
  - [ ] 1.6 Update environment configuration for Clerk
    - Add CLERK_PUBLISHABLE_KEY to frontend .env
    - Add CLERK_SECRET_KEY to backend .env
    - Update .env.example with Clerk variables
    - _Requirements: 1.8_
  
  - [ ] 1.7 Remove custom auth implementation
    - Delete custom AuthService
    - Delete custom password hashing logic
    - Delete custom JWT generation
    - Remove users table from schema (Clerk manages users)
    - _Requirements: 1.1_

- [ ] 2. Set up Reddit OAuth data collection
  - [ ] 2.1 Install Reddit OAuth dependencies
    - npm install snoowrap
    - npm install @types/snoowrap --save-dev
    - _Requirements: 2.1_
  
  - [ ] 2.2 Create RedditOAuthClient service
    - Implement authenticate() with client credentials flow
    - Implement refreshToken() for automatic token refresh
    - Implement fetchHot(), fetchNew(), fetchTop() for /r/all
    - Implement collectFromAll() with query filtering
    - Implement getRateLimitStatus() to track 600 req/min limit
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_
  
  - [ ]* 2.3 Write property test for Reddit OAuth token management
    - **Property 3: Reddit OAuth Token Management**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [ ]* 2.4 Write property test for Reddit rate limit compliance
    - **Property 4: Reddit Rate Limit Compliance**
    - **Validates: Requirements 2.6, 2.8**
  
  - [ ] 2.5 Create OnDemandCollector service
    - Implement shouldCollect() to check data freshness (1 hour threshold)
    - Implement collectForQuery() to trigger collection
    - Implement deduplicateRequest() using Upstash
    - Implement collectInBackground() for async collection
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.8_
  
  - [ ]* 2.6 Write property test for on-demand collection trigger
    - **Property 5: On-Demand Collection Trigger**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.6**
  
  - [ ]* 2.7 Write property test for collection deduplication
    - **Property 6: Collection Deduplication**
    - **Validates: Requirements 3.8**
  
  - [ ] 2.8 Integrate Reddit collector with search flow
    - Check data freshness on search
    - Trigger collection if data is stale
    - Return existing results immediately
    - Update results after collection completes
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.10_
  
  - [ ] 2.9 Update environment configuration for Reddit OAuth
    - Add REDDIT_CLIENT_ID to .env
    - Add REDDIT_CLIENT_SECRET to .env
    - Add REDDIT_USER_AGENT to .env
    - Update .env.example with Reddit OAuth setup instructions
    - _Requirements: 2.1_

- [ ] 3. Set up Railway PostgreSQL integration
  - [ ] 3.1 Create PostgresDocumentStore service
    - Implement initialize() with DATABASE_URL support
    - Implement connection pool with pg library (min: 2, max: 10 connections)
    - Implement store(), storeMany(), getById(), getByIds(), getAll() methods
    - Use parameterized queries for all database operations
    - Wrap write operations in transactions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7, 11.8_
  
  - [ ]* 3.2 Write property test for connection pool lifecycle
    - **Property 8: Connection Pool Lifecycle**
    - **Validates: Requirements 4.3, 4.4, 4.5**
  
  - [ ]* 3.3 Write property test for transaction atomicity
    - **Property 9: Transaction Atomicity**
    - **Validates: Requirements 4.7**
  
  - [ ] 3.4 Implement database error handling with retry logic
    - Add exponential backoff retry (max 5 attempts: 100ms, 200ms, 400ms, 800ms, 1600ms)
    - Log all database errors with full context
    - Return appropriate HTTP status codes (500, 503)
    - _Requirements: 4.9, 4.10_
  
  - [ ]* 3.5 Write property test for connection retry with exponential backoff
    - **Property 11: Connection Retry with Exponential Backoff**
    - **Validates: Requirements 4.10**
  
  - [ ] 3.6 Update existing services to use PostgresDocumentStore
    - Replace in-memory DocumentStore with PostgresDocumentStore
    - Update QueryProcessor to use PostgreSQL
    - Update Analytics service to use PostgreSQL
    - _Requirements: 4.1, 4.7_
  
  - [ ] 3.7 Update environment configuration for Railway
    - Add DATABASE_URL to .env (Railway format)
    - Support fallback to individual vars (DB_HOST, DB_PORT, etc.) for local dev
    - Update .env.example with Railway setup instructions
    - _Requirements: 4.1, 4.2_

- [ ] 4. Checkpoint - Authentication and data collection setup complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Upstash Redis caching layer
  - [ ] 5.1 Install Upstash dependencies
    - npm install @upstash/redis
    - _Requirements: 5.1_
  
  - [ ] 5.2 Create UpstashCache service
    - Implement connect() using REDIS_URL from Upstash
    - Implement disconnect(), healthCheck() methods
    - Implement get(), set(), invalidate() for query caching
    - Implement incrementRequestCount(), getRequestCount() for rate limiting
    - Use consistent key format: "search:{query}:{page}:{pageSize}"
    - Set TTL to 300 seconds (5 minutes) for search results
    - _Requirements: 5.1, 5.2, 5.4, 5.6, 5.8, 14.1, 14.2, 14.4, 14.6, 14.8_
  
  - [ ]* 5.3 Write property test for cache-first search strategy
    - **Property 19: Cache-First Search Strategy**
    - **Validates: Requirements 5.4, 9.1, 9.3, 14.2, 14.4**
  
  - [ ]* 5.4 Write property test for cache hit optimization
    - **Property 20: Cache Hit Optimization**
    - **Validates: Requirements 9.3, 14.3**
  
  - [ ] 5.5 Implement graceful cache fallback
    - Add try-catch around all Upstash operations
    - Log warnings when cache is unavailable
    - Continue with database queries when Upstash fails
    - _Requirements: 5.5, 14.5_
  
  - [ ]* 5.6 Write property test for cache graceful degradation
    - **Property 21: Cache Graceful Degradation**
    - **Validates: Requirements 5.5, 14.5**
  
  - [ ] 5.7 Integrate UpstashCache with QueryProcessor
    - Check cache before database query
    - Store results in cache after database query
    - Update QueryProcessor to use UpstashCache
    - _Requirements: 9.1, 9.3_
  
  - [ ] 5.8 Update environment configuration for Upstash
    - Add REDIS_URL to .env (from Upstash dashboard)
    - Update .env.example with Upstash setup instructions
    - _Requirements: 5.1_


- [ ] 6. Checkpoint - Database and cache integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement monitoring and observability
  - [ ] 7.1 Set up Winston structured logging
    - Configure Winston with JSON format
    - Add transports: Console (development), File (production)
    - Create logger utility with error(), warn(), info(), debug() methods
    - Include timestamp, level, message, requestId, userId (from Clerk), and metadata in all logs
    - _Requirements: 8.1, 8.7_
  
  - [ ]* 7.2 Write property test for comprehensive request logging
    - **Property 14: Comprehensive Request Logging**
    - **Validates: Requirements 8.1**
  
  - [ ] 7.3 Implement request logging middleware
    - Generate unique request ID for each request
    - Log all requests with method, path, status code, duration
    - Add request ID to response headers (X-Request-ID)
    - Include user ID from Clerk JWT
    - _Requirements: 8.1, 17.10_
  
  - [ ] 7.4 Set up Sentry error tracking
    - Initialize Sentry with DSN from environment
    - Create ErrorTracker utility with captureException() and captureMessage()
    - Integrate with Express error handler
    - Set user context from Clerk JWT
    - _Requirements: 8.2, 8.3_
  
  - [ ]* 7.5 Write property test for error capture and tracking
    - **Property 15: Error Capture and Tracking**
    - **Validates: Requirements 8.2, 8.3**
  
  - [ ] 7.6 Implement sensitive data sanitization
    - Create sanitize utility to mask passwords, tokens, API keys, Clerk secrets, Reddit secrets
    - Apply sanitization to all log entries
    - _Requirements: 8.9_
  
  - [ ]* 7.7 Write property test for sensitive data sanitization
    - **Property 18: Sensitive Data Sanitization**
    - **Validates: Requirements 8.9**
  
  - [ ] 7.8 Set up Prometheus metrics
    - Create MetricsCollector using prom-client
    - Add counters: request_count, error_count, cache_hit, cache_miss, reddit_api_calls
    - Add histograms: request_duration, db_query_duration, search_latency, reddit_api_latency
    - Add gauges: active_connections, memory_usage, reddit_rate_limit_remaining
    - Expose metrics at GET /metrics endpoint
    - _Requirements: 8.4, 8.5, 8.6, 8.10, 20.1-20.10_
  
  - [ ]* 7.9 Write property test for metrics collection
    - **Property 16: Metrics Collection**
    - **Validates: Requirements 8.5, 8.6**

- [ ] 8. Implement security hardening
  - [ ] 8.1 Create RateLimiter service using Upstash
    - Implement checkLimit() using Upstash INCR with TTL
    - Configure: 100 requests per 60-second window per IP
    - Return RateLimitResult with allowed, remaining, resetTime
    - _Requirements: 11.1, 14.6_
  
  - [ ] 8.2 Add rate limiting middleware
    - Apply rate limiter to all API routes
    - Return HTTP 429 with Retry-After header when limit exceeded
    - Log rate limit violations
    - _Requirements: 11.1, 11.2_
  
  - [ ]* 8.3 Write property test for rate limiting enforcement
    - **Property 27: Rate Limiting Enforcement**
    - **Validates: Requirements 11.1, 11.2**
  
  - [ ] 8.4 Set up Helmet.js security headers
    - Configure Content-Security-Policy (allow Clerk domains)
    - Configure HSTS, frameguard, noSniff, xssFilter
    - Apply Helmet middleware to Express app
    - _Requirements: 11.3_
  
  - [ ] 8.5 Create Zod validation schemas
    - Create SearchRequestSchema for search endpoint
    - No user registration schema needed (Clerk handles it)
    - _Requirements: 11.4_
  
  - [ ] 8.6 Add input validation middleware
    - Create validateRequest middleware using Zod
    - Return HTTP 400 with detailed field errors on validation failure
    - Apply to all API endpoints
    - _Requirements: 11.4, 11.5_
  
  - [ ]* 8.7 Write property test for input validation with detailed errors
    - **Property 28: Input Validation with Detailed Errors**
    - **Validates: Requirements 11.4, 11.5**


- [ ] 9. Checkpoint - Security and monitoring complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement health checks and graceful shutdown
  - [ ] 10.1 Create HealthChecker service
    - Implement check() method that checks Railway database, Upstash, memory, and Reddit API
    - Implement checkDatabase(), checkRedis(), checkMemory(), checkRedditApi() methods
    - Return HealthCheckResult with status and component details
    - Cache health check results for 5 seconds
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 10.2 Add health check endpoint
    - Create GET /api/v1/health endpoint
    - Return HTTP 200 if all components healthy
    - Return HTTP 503 if any critical component unhealthy
    - Include uptime, timestamp, component details, and Reddit rate limit status
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 10.3 Implement graceful shutdown
    - Create GracefulShutdown class
    - Register SIGTERM and SIGINT handlers
    - Stop accepting new connections
    - Complete pending requests (30-second timeout)
    - Close Railway database and Upstash connections
    - _Requirements: 6.4, 13.8, 13.9_
  
  - [ ]* 10.4 Write property test for graceful resource cleanup
    - **Property 12: Graceful Resource Cleanup**
    - **Validates: Requirements 4.6**
  
  - [ ] 10.5 Add startup dependency checks
    - Wait for Railway database to be ready (max 30 seconds)
    - Wait for Upstash to be ready (max 30 seconds)
    - Verify Reddit OAuth credentials
    - Don't accept traffic until all dependencies ready
    - _Requirements: 13.6, 22.10_

- [ ] 11. Implement search performance optimizations
  - [ ] 11.1 Add typo tolerance with Levenshtein distance
    - Implement levenshteinDistance() function
    - Implement findSimilarTerms() in QueryProcessor
    - Apply to terms ≥4 characters with max distance 2
    - Try up to 3 similar terms per typo
    - _Requirements: 9.4_
  
  - [ ]* 11.2 Write property test for typo tolerance
    - **Property 24: Typo Tolerance with Levenshtein Distance**
    - **Validates: Requirements 9.4**
  
  - [ ] 11.3 Implement cache warming service
    - Create CacheWarmer service
    - Implement getPopularQueries() from analytics
    - Implement warmCache() to pre-load top 100 queries into Upstash
    - Schedule warming every 5 minutes
    - _Requirements: 9.7_
  
  - [ ] 11.4 Add slow query logging
    - Log queries that take >500ms
    - Include query text, execution time, result count
    - _Requirements: 9.10_
  
  - [ ]* 11.5 Write property test for slow query logging
    - **Property 26: Slow Query Logging**
    - **Validates: Requirements 9.10**
  
  - [ ] 11.6 Optimize BM25 ranking implementation
    - Ensure BM25 calculation includes recency, popularity, engagement factors
    - Verify ranking produces expected scores
    - _Requirements: 9.5_
  
  - [ ]* 11.7 Write property test for BM25 relevance scoring
    - **Property 25: BM25 Relevance Scoring**
    - **Validates: Requirements 9.5**

- [ ] 12. Implement environment configuration management
  - [ ] 12.1 Create environment validation with Zod
    - Define envSchema with all required environment variables (Clerk, Upstash, Railway, Reddit OAuth, Sentry)
    - Validate on startup, fail with clear error if missing
    - Provide type-safe config object
    - _Requirements: 6.10, 16.1, 16.2, 16.4_
  
  - [ ]* 12.2 Write property test for environment variable loading
    - **Property 13: Environment Variable Loading**
    - **Validates: Requirements 6.2, 6.10, 16.1, 16.2**
  
  - [ ] 12.3 Update .env.example with all configuration options
    - Document all environment variables (Clerk, Upstash, Railway, Reddit OAuth, Sentry)
    - Provide sensible defaults where appropriate
    - Include comments explaining each variable and setup instructions
    - _Requirements: 16.10_


- [ ] 13. Checkpoint - Performance and configuration complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Optimize frontend build and performance
  - [ ] 14.1 Configure Vite for production optimization
    - Set up code splitting with manualChunks (vendor, clerk, ui, state)
    - Enable minification with terser
    - Configure compression (gzip)
    - Enable source maps for debugging
    - Drop console and debugger statements in production
    - _Requirements: 10.1, 10.3, 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ] 14.2 Implement lazy loading for routes
    - Use React.lazy() for SearchPage, ProfilePage, AnalyticsPage
    - Wrap routes with Suspense and loading fallback
    - _Requirements: 10.2_
  
  - [ ] 14.3 Create error boundary component
    - Implement ErrorBoundary class component
    - Integrate with Sentry for error tracking
    - Provide ErrorFallback UI with "Try Again" button
    - Wrap all routes with error boundary
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_
  
  - [ ] 14.4 Add network error handling
    - Detect offline status
    - Show offline indicator
    - Retry failed requests when back online
    - _Requirements: 23.7, 23.8, 23.9_
  
  - [ ] 14.5 Optimize API response compression
    - Enable gzip compression for responses >1KB
    - Add Cache-Control headers to responses
    - Add X-Response-Time header
    - _Requirements: 10.4, 10.6, 17.1, 17.6, 17.9_
  
  - [ ]* 14.6 Write property test for cache control headers
    - **Property 30: Cache Control Headers**
    - **Validates: Requirements 10.6**

- [ ] 15. Set up Docker containerization
  - [ ] 15.1 Create multi-stage Dockerfile for backend
    - Builder stage: Install dependencies and build
    - Production stage: Copy built files and node_modules
    - Set NODE_ENV=production
    - Expose port 3000
    - _Requirements: 6.1_
  
  - [ ] 15.2 Create multi-stage Dockerfile for frontend
    - Builder stage: Build with Vite
    - Production stage: Serve with nginx
    - Copy nginx.conf for SPA routing
    - Expose port 80
    - _Requirements: 6.1, 6.6_
  
  - [ ] 15.3 Update docker-compose.yml for local development
    - Configure health checks for all services
    - Set up proper networking
    - Configure volume mounts
    - Set environment variables
    - _Requirements: 6.3_
  
  - [ ] 15.4 Add HTTPS enforcement for production
    - Redirect HTTP to HTTPS in production
    - Configure nginx for HTTPS
    - _Requirements: 6.7, 11.6_
  
  - [ ] 15.5 Test Docker build and deployment locally
    - Build containers
    - Run docker-compose up
    - Verify health checks pass
    - Test graceful shutdown
    - _Requirements: 6.1, 6.3, 6.4_

- [ ] 16. Implement CI/CD pipeline
  - [ ] 16.1 Create GitHub Actions workflow
    - Add lint-and-typecheck job
    - Add build job with artifact upload
    - Add deploy job (main branch only) to Railway
    - Add deployment verification step
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 16.2 Create deployment verification script
    - Check health endpoint
    - Test search API with Clerk auth
    - Verify metrics endpoint
    - Return success/failure
    - _Requirements: 7.5, 21.1, 21.2, 21.3, 21.4, 21.5, 21.9_
  
  - [ ] 16.3 Configure Railway deployment
    - Set up project on Railway
    - Configure environment variables (Clerk, Upstash, Reddit OAuth, Sentry)
    - Set up custom domain
    - Configure health check endpoint
    - _Requirements: 6.5_
  
  - [ ] 16.4 Test CI/CD pipeline end-to-end
    - Push to feature branch, verify checks run
    - Merge to main, verify deployment to Railway
    - Verify health checks pass
    - Test rollback on failure
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [ ] 17. Checkpoint - Deployment infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Create comprehensive documentation
  - [ ] 18.1 Update README with architecture diagram
    - Add system architecture diagram showing Clerk, Upstash, Railway, Reddit OAuth
    - Document data flow from frontend through Clerk to backend to Railway/Upstash
    - Explain component interactions
    - _Requirements: 12.1, 12.6_
  
  - [ ] 18.2 Create TECHNICAL_DECISIONS.md
    - Document why Clerk over custom auth (OAuth, security, time-to-market)
    - Document why Upstash over self-hosted Redis (serverless, no ops, free tier)
    - Document why Railway over AWS RDS (simplicity, cost, developer experience)
    - Document why Reddit OAuth over public API (600 vs 60 req/min, /r/all access)
    - Document why BM25 over TF-IDF
    - Document why fast-check for property testing
    - Document why Winston over other loggers
    - Document why Sentry for error tracking
    - Include trade-offs and alternatives considered
    - _Requirements: 12.2, 12.10_
  
  - [ ] 18.3 Create API_DOCUMENTATION.md
    - Document all endpoints with request/response examples
    - Include Clerk authentication requirements
    - Document error responses
    - Include rate limiting information
    - Document Reddit collection endpoints
    - _Requirements: 12.3_
  
  - [ ] 18.4 Update README with setup instructions
    - Prerequisites (Node.js, Clerk account, Upstash account, Railway account, Reddit app)
    - Local development setup (< 15 minutes)
    - Docker setup
    - Environment configuration for all services
    - _Requirements: 12.4_
  
  - [ ] 18.5 Create INTERVIEW_GUIDE.md
    - Common interview questions with answers
    - "Walk me through your project architecture"
    - "Why did you choose Clerk over custom auth?"
    - "Why Upstash over self-hosted Redis?"
    - "How does Reddit OAuth improve your data collection?"
    - "How did you optimize performance?" (with metrics)
    - "How do you handle errors in production?"
    - "How would you scale this to 1 million users?"
    - "What was the most challenging part?" (Reddit rate limiting, Clerk integration)
    - Include before/after performance metrics
    - _Requirements: 12.5, 12.7, 12.8, 12.9_
  
  - [ ] 18.6 Create SCALING_STRATEGY.md
    - Document horizontal scaling approach
    - Railway database read replicas
    - Upstash global replication
    - Load balancing
    - CDN for static assets
    - Caching strategies at scale
    - Reddit collection optimization for scale
    - _Requirements: 12.8_
  
  - [ ] 18.7 Document performance optimizations with metrics
    - Before/after Lighthouse scores
    - Before/after API response times
    - Before/after bundle sizes
    - Cache hit rates
    - Database query performance
    - Reddit API usage and rate limit efficiency
    - _Requirements: 12.7_

- [ ] 19. Fix critical issues and install missing dependencies
  - [ ] 19.1 Install missing dependencies
    - Frontend: npm install @clerk/clerk-react @sentry/react web-vitals
    - Backend: npm install @clerk/clerk-sdk-node @upstash/redis @sentry/node zod
    - Update package.json with specific versions
    - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8_
  
  - [-] 19.2 Fix Dockerfile entry point
    - Update CMD to point to backend/dist/server.js instead of backend/dist/index.js
    - Verify build output structure matches entry point
    - Test Docker build locally
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5, 36.6_
  
  - [ ] 19.3 Implement environment variable validation with Zod
    - Create envSchema validating CLERK_SECRET_KEY, REDIS_URL, DATABASE_URL, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, RESEND_API_KEY, TRIGGER_API_KEY
    - Validate on startup, exit with code 1 if validation fails
    - Log clear error messages for missing/invalid variables
    - Mask sensitive values in logs (show only first 4 characters)
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8, 28.9, 28.10_
  
  - [ ]* 19.4 Write property test for environment variable validation
    - **Property 31: Environment Variable Validation**
    - **Validates: Requirements 28.1, 28.2, 28.3, 28.4**
  
  - [ ] 19.5 Enhance graceful shutdown with connection cleanup
    - Update GracefulShutdown to close Railway PostgreSQL pool
    - Update GracefulShutdown to disconnect from Upstash Redis
    - Flush pending logs before exit
    - Log shutdown start and completion with duration
    - Handle SIGINT (Ctrl+C) same as SIGTERM
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 29.8, 29.9, 29.10_
  
  - [ ]* 19.6 Write property test for graceful shutdown cleanup
    - **Property 32: Graceful Shutdown Cleanup**
    - **Validates: Requirements 29.1, 29.2, 29.3, 29.4, 29.5**
  
  - [ ] 19.7 Enhance health checks to verify all dependencies
    - Add Reddit OAuth token validation to health check
    - Include response time for each dependency
    - Cache health check results for 5 seconds
    - Return HTTP 503 if any dependency unhealthy
    - Complete all checks within 1 second
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6, 30.7, 30.8, 30.9, 30.10_
  
  - [ ]* 19.8 Write property test for comprehensive health checks
    - **Property 33: Comprehensive Health Checks**
    - **Validates: Requirements 30.1, 30.2, 30.3, 30.4, 30.5**

- [ ] 20. Checkpoint - Critical fixes complete
  - Ensure all tests pass, verify Docker builds successfully, confirm environment validation works.

- [ ] 21. Integrate Resend for transactional emails
  - [ ] 21.1 Install Resend dependency
    - npm install resend
    - _Requirements: 26.1_
  
  - [ ] 21.2 Create ResendEmailService
    - Implement sendWelcomeEmail() with user name and email
    - Include getting started tips and support contact in email template
    - Load RESEND_API_KEY from environment
    - _Requirements: 26.4, 26.5, 26.9_
  
  - [ ] 21.3 Implement Clerk webhook handler
    - Create POST /api/webhooks/clerk endpoint
    - Verify webhook signature using Clerk signing secret
    - Extract user email and name from event payload
    - Trigger welcome email on user.created event
    - Respond within 3 seconds to avoid Clerk timeout
    - _Requirements: 26.1, 26.2, 26.3, 26.10_
  
  - [ ] 21.4 Add retry logic for email sending
    - Retry up to 3 times with exponential backoff (100ms, 200ms, 400ms)
    - Log Resend message ID on success
    - Log error to Sentry if all retries fail
    - Don't fail registration if email fails
    - _Requirements: 26.6, 26.7, 26.8_
  
  - [ ]* 21.5 Write property test for webhook signature verification
    - **Property 34: Webhook Signature Verification**
    - **Validates: Requirements 26.2, 26.3**
  
  - [ ] 21.6 Update environment configuration for Resend
    - Add RESEND_API_KEY to .env
    - Add CLERK_WEBHOOK_SECRET to .env
    - Update .env.example with Resend setup instructions
    - _Requirements: 26.9_

- [ ] 22. Integrate Trigger.dev for background jobs
  - [ ] 22.1 Install Trigger.dev dependencies
    - npm install @trigger.dev/sdk
    - _Requirements: 27.1_
  
  - [ ] 22.2 Create Trigger.dev job for Reddit collection
    - Register scheduled job for Reddit data collection
    - Implement job handler to collect top posts from /r/all
    - Store collected posts in Railway PostgreSQL
    - Invalidate relevant cache entries in Upstash after collection
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_
  
  - [ ] 22.3 Configure job scheduling and retry logic
    - Schedule Reddit collection every hour for top 20 queries
    - Configure automatic retry up to 3 times with exponential backoff
    - Send alert if all retries fail
    - _Requirements: 27.6, 27.7, 27.8_
  
  - [ ] 22.4 Update environment configuration for Trigger.dev
    - Add TRIGGER_API_KEY to .env
    - Add TRIGGER_API_URL to .env
    - Update .env.example with Trigger.dev setup instructions
    - _Requirements: 27.9_
  
  - [ ]* 22.5 Write property test for scheduled job execution
    - **Property 35: Scheduled Job Execution**
    - **Validates: Requirements 27.2, 27.3, 27.4, 27.5**

- [ ] 23. Set up Vercel frontend deployment
  - [ ] 23.1 Create vercel.json configuration
    - Configure build command and output directory
    - Set up environment variables (VITE_API_URL, VITE_CLERK_PUBLISHABLE_KEY)
    - Configure rewrites for SPA routing
    - _Requirements: 25.5, 25.9, 25.10_
  
  - [ ] 23.2 Configure automatic deployments
    - Connect GitHub repository to Vercel
    - Enable automatic deployments from main branch
    - Enable preview deployments for pull requests
    - _Requirements: 25.1, 25.2, 25.3, 25.7_
  
  - [ ] 23.3 Configure production domain and SSL
    - Set up custom domain (if available)
    - Verify automatic SSL certificates
    - Ensure HTTPS enforcement
    - _Requirements: 25.8_
  
  - [ ] 23.4 Optimize Vercel deployment settings
    - Configure CDN cache headers for static assets
    - Verify build fails preserve previous deployment
    - Test preview URL generation
    - _Requirements: 25.4, 25.6_
  
  - [ ] 23.5 Update frontend to use environment variables
    - Use VITE_API_URL for backend connection
    - Use VITE_CLERK_PUBLISHABLE_KEY for Clerk
    - Verify environment variables load correctly in Vercel
    - _Requirements: 25.9, 25.10_

- [ ] 24. Checkpoint - New services integrated
  - Ensure Resend emails work, Trigger.dev jobs run, Vercel deployment succeeds.

- [ ] 25. Implement comprehensive input validation
  - [ ] 25.1 Create Zod validation schemas
    - Create SearchRequestSchema (query, page, pageSize, filters)
    - Create FilterSchema (subreddit, dateFrom, dateTo, sortBy)
    - Enforce min/max lengths for strings
    - Enforce min/max values for numbers
    - _Requirements: 31.1, 31.3, 31.5, 31.7, 31.8_
  
  - [ ] 25.2 Create validation middleware
    - Implement validateRequest middleware using Zod
    - Return HTTP 400 with detailed field errors on validation failure
    - Strip unexpected fields and log warning
    - Apply to all API endpoints
    - _Requirements: 31.2, 31.4, 31.9, 31.10_
  
  - [ ] 25.3 Integrate validation with QueryProcessor
    - Pass validated data to query processor
    - Ensure type safety throughout request pipeline
    - _Requirements: 31.6_
  
  - [ ]* 25.4 Write property test for input validation
    - **Property 36: Input Validation with Detailed Errors**
    - **Validates: Requirements 31.1, 31.2, 31.4, 31.9**

- [ ] 26. Implement retry logic with exponential backoff
  - [ ] 26.1 Create RetryHelper utility
    - Implement retry() function with exponential backoff
    - Support configurable max attempts (default 3)
    - Calculate delays: 100ms, 200ms, 400ms
    - Add jitter (random 0-50ms) to prevent thundering herd
    - _Requirements: 32.1, 32.2, 32.3, 32.10_
  
  - [ ] 26.2 Apply retry logic to database operations
    - Wrap Railway PostgreSQL queries with retry logic
    - Only retry transient errors (connection failures, timeouts)
    - Don't retry non-transient errors (constraint violations)
    - Log each retry attempt with attempt number and delay
    - _Requirements: 32.1, 32.7, 32.8_
  
  - [ ] 26.3 Apply retry logic to external services
    - Wrap Upstash Redis commands with retry logic
    - Wrap Reddit API calls with retry logic (only 5xx errors)
    - Wrap Resend API calls with retry logic
    - Log successful recovery when retry succeeds
    - _Requirements: 32.3, 32.4, 32.5, 32.9_
  
  - [ ] 26.4 Handle retry exhaustion
    - Log final error when all retries exhausted
    - Return appropriate HTTP status (503 for service unavailable)
    - _Requirements: 32.6_
  
  - [ ]* 26.5 Write property test for exponential backoff
    - **Property 37: Exponential Backoff Retry**
    - **Validates: Requirements 32.1, 32.2, 32.3, 32.8, 32.10**

- [ ] 27. Implement structured logging with request IDs
  - [ ] 27.1 Enhance Winston logger with request context
    - Generate UUID v4 for each request
    - Include requestId in all log entries
    - Include userId from Clerk JWT in all log entries
    - Use JSON format with consistent fields (timestamp, level, message, requestId, userId, duration)
    - _Requirements: 33.1, 33.3, 33.4, 33.5_
  
  - [ ] 27.2 Add request ID to response headers
    - Include X-Request-ID in response headers
    - _Requirements: 33.2_
  
  - [ ] 27.3 Enhance logging for database and cache operations
    - Log query duration with request ID
    - Log cache hit/miss with request ID
    - Log external API calls with request/response details and request ID
    - _Requirements: 33.6, 33.7, 33.9_
  
  - [ ] 27.4 Enhance error logging
    - Log full stack trace with request ID
    - Sanitize sensitive data (passwords, tokens, API keys)
    - _Requirements: 33.8, 33.10_
  
  - [ ]* 27.5 Write property test for request ID propagation
    - **Property 38: Request ID Propagation**
    - **Validates: Requirements 33.1, 33.2, 33.3, 33.6, 33.7**

- [ ] 28. Configure security headers with Clerk domain allowlist
  - [ ] 28.1 Configure Helmet.js with custom CSP
    - Allow scripts from 'self' and 'https://clerk.com'
    - Allow images from 'self', 'data:', 'https:', 'https://img.clerk.com'
    - Allow connections to 'self', API_URL, 'https://api.clerk.com'
    - _Requirements: 34.1, 34.2, 34.3, 34.4_
  
  - [ ] 28.2 Configure other security headers
    - Set HSTS with max-age 31536000 and includeSubDomains
    - Set X-Frame-Options to DENY
    - Set X-Content-Type-Options to nosniff
    - Set X-XSS-Protection to enable filtering
    - _Requirements: 34.5, 34.6, 34.7, 34.8_
  
  - [ ] 28.3 Add environment-specific CSP
    - Use strict CSP in production
    - Use relaxed CSP in development for easier debugging
    - _Requirements: 34.9, 34.10_
  
  - [ ]* 28.4 Write property test for security headers
    - **Property 39: Security Headers Configuration**
    - **Validates: Requirements 34.1, 34.2, 34.3, 34.9**

- [ ] 29. Checkpoint - Enhanced reliability and security complete
  - Ensure all tests pass, verify retry logic works, confirm logging includes request IDs.

- [ ] 30. Production readiness verification
  - [ ] 30.1 Run production readiness checklist
    - Verify all environment variables documented (Clerk, Upstash, Railway, Reddit OAuth, Sentry, Vercel, Resend, Trigger.dev)
    - Verify database migrations tested
    - Verify monitoring and alerting configured
    - Verify error tracking enabled
    - Verify HTTPS enforced
    - Verify rate limiting enabled with Upstash
    - Verify security headers configured with Clerk domain allowlist
    - Verify health checks implemented for all dependencies
    - Verify graceful shutdown implemented with connection cleanup
    - Verify performance benchmarks documented
    - _Requirements: 24.1-24.10_
  
  - [ ] 30.2 Measure and document performance metrics
    - Run Lighthouse on deployed frontend (target: ≥90)
    - Measure API response time p95 (target: <100ms)
    - Measure search latency p95 (target: <100ms)
    - Measure cache hit rate (target: >80%)
    - Measure Reddit API efficiency (requests per search)
    - Document all metrics in README
    - _Requirements: 10.5, 10.10, 9.9_
  
  - [ ] 30.3 Verify security measures
    - Test rate limiting with Upstash (exceed 100 req/min)
    - Test input validation (send invalid data)
    - Verify HTTPS enforcement
    - Verify security headers present with Clerk domains allowed
    - Test SQL injection prevention
    - Test Clerk JWT verification
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9_
  
  - [ ] 30.4 Test error handling and recovery
    - Simulate Railway database failure (verify retry and fallback)
    - Simulate Upstash failure (verify graceful degradation)
    - Simulate Reddit API failure (verify error handling)
    - Simulate network errors (verify error boundaries)
    - Verify all errors logged and tracked in Sentry
    - _Requirements: 19.1-19.10, 22.1-22.10, 23.1-23.10_
  
  - [ ] 30.5 Verify monitoring and observability
    - Check logs are structured and complete with request IDs
    - Verify errors appear in Sentry
    - Verify metrics available at /metrics
    - Test health check endpoint with all components
    - Verify Reddit API metrics tracked
    - _Requirements: 8.1-8.10, 13.1-13.10, 20.1-20.10_
  
  - [ ] 30.6 Test Reddit data collection end-to-end
    - Verify OAuth authentication works
    - Test collection from /r/all
    - Verify rate limit compliance (600 req/min)
    - Test on-demand collection trigger
    - Verify collection deduplication
    - Test background collection via Trigger.dev
    - _Requirements: 2.1-2.10, 3.1-3.10_
  
  - [ ] 30.7 Verify new service integrations
    - Test Vercel deployment and preview URLs
    - Test Resend welcome email delivery
    - Test Trigger.dev scheduled jobs
    - Verify environment variable validation catches errors
    - Test graceful shutdown closes all connections
    - _Requirements: 25.1-25.10, 26.1-26.10, 27.1-27.10, 28.1-28.10, 29.1-29.10_

- [ ] 31. Final checkpoint - Production ready
  - Ensure all tests pass, verify deployment is live on Railway and Vercel, confirm all documentation is complete, verify Resend and Trigger.dev integrations work.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities to ask questions
- Property tests validate universal correctness properties with minimum 100 iterations
- Focus on critical paths and production-ready features
- All technical decisions should be documented for interview discussions
- Performance metrics should be measured and documented before/after optimizations
- Clerk eliminates need for custom auth implementation (saves significant development time)
- Upstash provides serverless Redis (no infrastructure management)
- Railway provides managed PostgreSQL (automatic backups, scaling)
- Reddit OAuth provides 10x higher rate limits (600 vs 60 requests/minute)
- Vercel provides automatic frontend deployments with global CDN (zero configuration)
- Resend provides developer-friendly transactional emails (3,000 emails/month free)
- Trigger.dev replaces node-cron with managed background jobs (monitoring dashboard, automatic retries)

