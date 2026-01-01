# Requirements Document: Production-Ready FeedVex

## Introduction

FeedVex is a Reddit search engine designed to be a standout resume project for full-stack/SDE interviews. This requirements document outlines the features needed to transform the current implementation into a production-ready application that demonstrates real-world full-stack development skills, including modern cloud services (Clerk, Upstash, Railway), comprehensive Reddit data collection, deployment, CI/CD, monitoring, performance optimization, and security hardening.

The project currently has a React/TypeScript frontend with modern UI, a Node.js/Express backend with in-memory storage, and a PostgreSQL schema that is not yet implemented. This spec focuses on completing the critical production features using modern managed services that will make this project interview-worthy while demonstrating knowledge of cloud-native architecture.

## Glossary

- **System**: The FeedVex application (backend API and frontend)
- **Database**: Railway-hosted PostgreSQL database for persistent storage
- **Cache**: Upstash Redis serverless cache for query results and rate limiting
- **API**: The backend REST API service
- **Frontend**: The React web application with Clerk authentication
- **Clerk**: Third-party authentication service handling OAuth, social login, JWT tokens
- **Upstash**: Serverless Redis provider with global edge caching
- **Railway**: PostgreSQL hosting platform with automatic provisioning
- **Vercel**: Frontend deployment platform with automatic GitHub deployments and global CDN
- **Resend**: Transactional email service for sending welcome emails and notifications
- **Trigger_dev**: Background job orchestration platform for scheduled Reddit data collection
- **Reddit_OAuth**: Reddit API with OAuth authentication (600 requests/minute)
- **CI/CD_Pipeline**: GitHub Actions workflow for automated testing and deployment
- **Monitoring_Service**: Combination of Winston logging and Sentry error tracking
- **Health_Check**: Endpoint that reports system health status including database, Redis, and Reddit API
- **Connection_Pool**: PostgreSQL connection pool for efficient database access
- **Rate_Limiter**: Service that limits requests per IP address using Upstash Redis
- **Search_Index**: Inverted index for fast document retrieval
- **Deployment_Platform**: Railway hosting service for backend API
- **Container**: Docker container for application deployment
- **Production_Environment**: Live deployment accessible via public URL
- **Development_Environment**: Local development setup
- **Lighthouse_Score**: Google Lighthouse performance metric
- **Response_Time**: Time from request to response (p95 percentile)
- **Error_Rate**: Percentage of requests that result in errors
- **Bundle**: Frontend JavaScript bundle
- **Code_Splitting**: Technique to split code into smaller chunks
- **Lazy_Loading**: Loading resources only when needed
- **Security_Headers**: HTTP headers that improve security (via Helmet.js) with Clerk domain allowlist
- **Input_Validation**: Validation of user input using Zod schemas
- **Transaction**: Database transaction for atomic operations
- **Migration**: Database schema change script
- **Graceful_Shutdown**: Clean shutdown that closes database and Redis connections
- **Structured_Logging**: JSON-formatted logs with consistent fields and request IDs
- **Metrics_Endpoint**: Endpoint exposing Prometheus metrics
- **Typo_Tolerance**: Ability to find results despite spelling errors
- **Relevance_Score**: Numeric score indicating search result quality
- **Query_Cache**: Cache storing search results for popular queries
- **Index_Optimization**: Database indexes for fast query performance
- **Clerk_JWT**: JSON Web Token issued by Clerk for authenticated requests
- **Reddit_Collector**: Service that collects posts from Reddit using OAuth API
- **On_Demand_Collection**: Strategy where Reddit data is collected when users search
- **Collection_Priority**: Strategy to prioritize popular and recent content from /r/all
- **Background_Job**: Scheduled task running on Trigger.dev for periodic Reddit data collection
- **Retry_Logic**: Exponential backoff strategy for handling transient failures
- **Environment_Validation**: Zod-based validation of required environment variables at startup

## Requirements

### Requirement 1: Clerk Authentication Integration

**User Story:** As a developer, I want to use Clerk for authentication, so that I can demonstrate integration with modern auth services and avoid implementing custom auth logic.

#### Acceptance Criteria

1. WHEN a user registers, THE Frontend SHALL use Clerk React components for the registration flow
2. WHEN a user logs in, THE Frontend SHALL use Clerk React components for the login flow
3. WHEN a user is authenticated, THE Clerk SHALL issue a Clerk_JWT token
4. WHEN the API receives a request, THE System SHALL verify the Clerk_JWT token using Clerk's verification library
5. WHEN token verification succeeds, THE System SHALL extract user ID and email from the token
6. WHEN token verification fails, THE System SHALL return HTTP 401 with error details
7. WHEN a user logs out, THE Frontend SHALL use Clerk's sign-out functionality
8. WHEN Clerk is configured, THE System SHALL load CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from environment variables
9. WHEN the Frontend initializes, THE System SHALL wrap the app with ClerkProvider
10. WHEN protected routes are accessed, THE Frontend SHALL use Clerk's authentication guards

### Requirement 2: Reddit OAuth Data Collection

**User Story:** As a developer, I want to collect comprehensive Reddit data using OAuth, so that users can search across all of Reddit with high rate limits.

#### Acceptance Criteria

1. WHEN the Reddit_Collector initializes, THE System SHALL authenticate with Reddit OAuth using client credentials
2. WHEN OAuth authentication succeeds, THE System SHALL receive an access token valid for 1 hour
3. WHEN the access token expires, THE System SHALL automatically refresh it
4. WHEN a user searches, THE Reddit_Collector SHALL collect posts from /r/all matching the search query
5. WHEN collecting from /r/all, THE Reddit_Collector SHALL fetch hot, new, and top posts
6. WHEN collecting posts, THE Reddit_Collector SHALL respect the 600 requests/minute OAuth rate limit
7. WHEN posts are collected, THE System SHALL store them in the Database with full metadata
8. WHEN the rate limit is approached, THE Reddit_Collector SHALL throttle requests to stay within limits
9. WHEN Reddit API returns errors, THE System SHALL log the error and continue processing
10. WHEN collection completes, THE System SHALL index the collected posts for search

### Requirement 3: On-Demand Reddit Collection Strategy

**User Story:** As a user, I want the system to collect relevant Reddit data when I search, so that I get fresh and comprehensive results.

#### Acceptance Criteria

1. WHEN a user submits a search query, THE System SHALL check if recent data exists for that query
2. WHEN recent data exists (collected within 1 hour), THE System SHALL return cached search results
3. WHEN recent data does not exist, THE System SHALL trigger On_Demand_Collection for that query
4. WHEN On_Demand_Collection is triggered, THE Reddit_Collector SHALL collect up to 1000 posts from /r/all
5. WHEN collecting posts, THE Reddit_Collector SHALL prioritize by Collection_Priority (hot > top > new)
6. WHEN collection is in progress, THE System SHALL return existing results immediately and update in background
7. WHEN collection completes, THE System SHALL invalidate the Query_Cache for that query
8. WHEN multiple users search the same query, THE System SHALL deduplicate collection requests
9. WHEN collection fails, THE System SHALL return existing results and log the error
10. WHEN the Database contains posts for a query, THE System SHALL return them even if collection is ongoing

### Requirement 4: Railway PostgreSQL Integration

**User Story:** As a developer, I want to use Railway for PostgreSQL hosting, so that I can demonstrate knowledge of modern cloud database services.

#### Acceptance Criteria

1. WHEN the System starts, THE Database SHALL connect using DATABASE_URL from Railway
2. WHEN DATABASE_URL is not provided, THE System SHALL fall back to individual connection parameters (host, port, user, password, database)
3. WHEN the Database connection is established, THE System SHALL create a Connection_Pool with configurable min/max connections
4. WHEN a database operation is requested, THE System SHALL acquire a connection from the Connection_Pool
5. WHEN a connection is no longer needed, THE System SHALL release it back to the Connection_Pool
6. WHEN the System shuts down, THE System SHALL close all database connections gracefully
7. WHEN a document is stored, THE Database SHALL persist it using a transaction
8. WHEN a document is queried, THE Database SHALL use indexes to optimize query performance
9. WHEN a database error occurs, THE System SHALL log the error with full context and return an appropriate error response
10. WHEN the database is unavailable, THE System SHALL retry connections with exponential backoff up to 5 attempts

### Requirement 5: Upstash Redis Integration

**User Story:** As a developer, I want to use Upstash for Redis caching, so that I can demonstrate serverless architecture and avoid managing Redis infrastructure.

#### Acceptance Criteria

1. WHEN the System starts, THE Cache SHALL connect to Upstash using REDIS_URL from environment variables
2. WHEN a search query is executed, THE System SHALL check Upstash for cached results
3. WHEN cache results are found, THE System SHALL return them without querying the database
4. WHEN cache results are not found, THE System SHALL execute the query and store results in Upstash with 5-minute TTL
5. WHEN the Upstash connection fails, THE System SHALL fall back to direct database queries without crashing
6. WHEN rate limiting is enforced, THE System SHALL use Upstash to track request counts per IP
7. WHEN the cache is full, THE System SHALL evict entries using LRU policy
8. WHEN cache keys are generated, THE System SHALL use consistent hashing for query parameters
9. WHEN the System shuts down, THE System SHALL close Upstash connections gracefully
10. WHEN the Health_Check endpoint is called, THE System SHALL verify Upstash connectivity

### Requirement 6: Production Deployment Infrastructure

### Requirement 6: Production Deployment Infrastructure

**User Story:** As a developer, I want to deploy the application to Railway, so that I can demonstrate a live working project to interviewers.

#### Acceptance Criteria

1. WHEN the application is built for production, THE System SHALL create optimized Docker containers for API and Frontend
2. WHEN environment variables are needed, THE System SHALL load them from environment-specific configuration files
3. WHEN the Container starts, THE System SHALL perform health checks before accepting traffic
4. WHEN the System receives a shutdown signal, THE System SHALL perform Graceful_Shutdown
5. WHEN deployed to Railway, THE Production_Environment SHALL be accessible via HTTPS with a custom domain
6. WHEN the Frontend is built, THE System SHALL optimize assets with minification and compression
7. WHEN the API is deployed, THE System SHALL enforce HTTPS in production
8. WHEN the production build completes, THE System SHALL generate a build manifest with version information
9. WHEN the deployment fails, THE System SHALL rollback to the previous working version
10. WHEN the application starts in production, THE System SHALL validate all required environment variables are present

### Requirement 7: CI/CD Pipeline

### Requirement 7: CI/CD Pipeline

**User Story:** As a developer, I want automated testing and deployment, so that I can demonstrate modern DevOps practices and ensure code quality.

#### Acceptance Criteria

1. WHEN code is pushed to the main branch, THE CI/CD_Pipeline SHALL run linting and type checking
2. WHEN linting or type checking fails, THE CI/CD_Pipeline SHALL fail the build and prevent deployment
3. WHEN all checks pass, THE CI/CD_Pipeline SHALL build the application
4. WHEN the build succeeds, THE CI/CD_Pipeline SHALL deploy to Railway automatically
5. WHEN deployment completes, THE CI/CD_Pipeline SHALL verify the deployment with a health check
6. WHEN a pull request is opened, THE CI/CD_Pipeline SHALL run checks without deploying
7. WHEN the CI/CD_Pipeline fails, THE System SHALL send a notification with failure details
8. WHEN multiple commits are pushed rapidly, THE CI/CD_Pipeline SHALL queue builds appropriately

### Requirement 8: Monitoring and Error Tracking

### Requirement 8: Monitoring and Error Tracking

**User Story:** As a developer, I want comprehensive logging and error tracking, so that I can debug production issues and demonstrate observability practices.

#### Acceptance Criteria

1. WHEN any request is processed, THE System SHALL log it with Structured_Logging including timestamp, request ID, method, path, status code, and duration
2. WHEN an error occurs, THE Monitoring_Service SHALL capture it with full stack trace and context
3. WHEN an error is captured, THE System SHALL send it to Sentry for tracking
4. WHEN the Metrics_Endpoint is called, THE System SHALL return Prometheus-formatted metrics
5. WHEN a request completes, THE System SHALL record response time metrics
6. WHEN an error occurs, THE System SHALL increment error rate metrics
7. WHEN logs are written, THE System SHALL use appropriate log levels (error, warn, info, debug)
8. WHEN the System starts, THE Monitoring_Service SHALL initialize with environment-specific configuration
9. WHEN sensitive data is logged, THE System SHALL sanitize it before writing to logs
10. WHEN metrics are collected, THE System SHALL include custom business metrics (search queries, cache hits, Reddit API calls)

### Requirement 9: Search Performance Optimization

### Requirement 9: Search Performance Optimization

**User Story:** As a user, I want fast and accurate search results, so that I can find relevant Reddit content quickly.

#### Acceptance Criteria

1. WHEN a search query is executed, THE System SHALL check the Query_Cache before performing a full search
2. WHEN a cache hit occurs, THE System SHALL return cached results within 10ms
3. WHEN a cache miss occurs, THE System SHALL execute the search and cache the results for 5 minutes
4. WHEN a query contains typos, THE System SHALL apply Levenshtein distance to find similar terms
5. WHEN search results are ranked, THE System SHALL calculate Relevance_Score using BM25 algorithm with recency and popularity factors
6. WHEN a database query is executed, THE System SHALL use indexes on subreddit, created_utc, and full-text search
7. WHEN popular queries are identified, THE System SHALL pre-warm the cache with their results
8. WHEN the cache reaches capacity, THE System SHALL evict least recently used entries
9. WHEN a search completes, THE System SHALL return results within 100ms for the 95th percentile
10. WHEN query performance degrades, THE System SHALL log slow queries for analysis

### Requirement 10: Application Performance Optimization

### Requirement 10: Application Performance Optimization

**User Story:** As a user, I want the application to load quickly and respond smoothly, so that I have a good user experience.

#### Acceptance Criteria

1. WHEN the Frontend is built, THE System SHALL apply Code_Splitting to create separate bundles for routes
2. WHEN a route is accessed, THE Frontend SHALL use Lazy_Loading to load only required components
3. WHEN the Frontend is built, THE System SHALL minify and compress all assets
4. WHEN static assets are served, THE API SHALL enable gzip compression
5. WHEN the Frontend loads, THE System SHALL achieve a Lighthouse_Score of 90 or higher
6. WHEN API responses are sent, THE System SHALL include appropriate cache headers
7. WHEN images are loaded, THE Frontend SHALL use lazy loading and responsive images
8. WHEN the Bundle is analyzed, THE System SHALL identify and eliminate duplicate dependencies
9. WHEN the application is measured, THE System SHALL achieve page load time under 3 seconds on 3G connection
10. WHEN API endpoints are called, THE System SHALL respond within 100ms for the 95th percentile

### Requirement 11: Security Hardening

### Requirement 11: Security Hardening

**User Story:** As a developer, I want the application to follow security best practices, so that I can demonstrate security awareness in interviews.

#### Acceptance Criteria

1. WHEN the API receives requests, THE Rate_Limiter SHALL limit requests to 100 per minute per IP address using Upstash
2. WHEN rate limit is exceeded, THE System SHALL return HTTP 429 with retry-after header
3. WHEN the API starts, THE System SHALL configure Security_Headers using Helmet.js
4. WHEN user input is received, THE System SHALL validate it using Input_Validation schemas
5. WHEN validation fails, THE System SHALL return HTTP 400 with detailed error messages
6. WHEN the application runs in production, THE System SHALL enforce HTTPS for all connections
7. WHEN sensitive configuration is needed, THE System SHALL load it from environment variables, never hardcoded
8. WHEN SQL queries are constructed, THE System SHALL use parameterized queries to prevent SQL injection
9. WHEN Clerk JWT tokens are verified, THE System SHALL use Clerk's official verification library
10. WHEN Reddit OAuth tokens are stored, THE System SHALL store them securely in environment variables

### Requirement 12: Documentation for Interviews

### Requirement 12: Documentation for Interviews

**User Story:** As a developer, I want comprehensive documentation, so that I can confidently explain the project in interviews.

#### Acceptance Criteria

1. WHEN the README is viewed, THE System SHALL include an architecture diagram showing all components (Clerk, Upstash, Railway, Reddit OAuth)
2. WHEN technical decisions are documented, THE System SHALL explain the rationale for choosing Clerk over custom auth, Upstash over self-hosted Redis, and Railway for PostgreSQL
3. WHEN API documentation is needed, THE System SHALL provide endpoint descriptions with request/response examples
4. WHEN setup instructions are followed, THE System SHALL enable a new developer to run the project locally within 15 minutes
5. WHEN interview preparation is needed, THE System SHALL provide a guide with common questions and answers about cloud services integration
6. WHEN the architecture is explained, THE System SHALL document data flow from frontend through Clerk to backend to Railway/Upstash
7. WHEN performance optimizations are discussed, THE System SHALL document before/after metrics
8. WHEN scaling is discussed, THE System SHALL document how the system would scale to 1 million users using serverless architecture
9. WHEN the most challenging aspects are discussed, THE System SHALL document specific technical challenges (Reddit OAuth, Clerk integration, Upstash setup)
10. WHEN the technology stack is explained, THE System SHALL document why each managed service was chosen over self-hosted alternatives

### Requirement 13: Health Checks and Reliability

### Requirement 13: Health Checks and Reliability

**User Story:** As a developer, I want comprehensive health checks, so that Railway can monitor application health and restart if needed.

#### Acceptance Criteria

1. WHEN the Health_Check endpoint is called, THE System SHALL verify Railway PostgreSQL connectivity
2. WHEN the Health_Check endpoint is called, THE System SHALL verify Upstash connectivity
3. WHEN the Health_Check endpoint is called, THE System SHALL return response within 1 second
4. WHEN all dependencies are healthy, THE Health_Check SHALL return HTTP 200 with status details
5. WHEN any dependency is unhealthy, THE Health_Check SHALL return HTTP 503 with failure details
6. WHEN the System starts, THE System SHALL wait for all dependencies to be ready before accepting traffic
7. WHEN a dependency fails, THE System SHALL retry with exponential backoff
8. WHEN the System receives SIGTERM, THE System SHALL stop accepting new requests and complete pending requests within 30 seconds
9. WHEN the System shuts down, THE System SHALL close all connections and release resources
10. WHEN Railway performs health checks, THE System SHALL respond consistently

### Requirement 14: Redis Caching Integration

### Requirement 14: Redis Caching Integration

**User Story:** As a developer, I want to integrate Upstash Redis for caching, so that I can improve performance and demonstrate serverless caching strategies.

#### Acceptance Criteria

1. WHEN the System starts, THE Cache SHALL establish a connection to Upstash using REDIS_URL
2. WHEN a search query is executed, THE System SHALL check Upstash for cached results
3. WHEN cache results are found, THE System SHALL return them without querying the database
4. WHEN cache results are not found, THE System SHALL execute the query and store results in Upstash with 5-minute TTL
5. WHEN the Upstash connection fails, THE System SHALL fall back to direct database queries without crashing
6. WHEN rate limiting is enforced, THE System SHALL use Upstash to track request counts per IP
7. WHEN the cache is full, THE System SHALL evict entries using LRU policy
8. WHEN cache keys are generated, THE System SHALL use consistent hashing for query parameters
9. WHEN the System shuts down, THE System SHALL close Upstash connections gracefully
10. WHEN the Health_Check is called, THE System SHALL verify Upstash connectivity

### Requirement 15: Database Migration System

### Requirement 15: Database Migration System

**User Story:** As a developer, I want a database migration system, so that I can manage schema changes safely in production.

#### Acceptance Criteria

1. WHEN a schema change is needed, THE System SHALL provide a Migration script
2. WHEN migrations are run, THE System SHALL track which migrations have been applied
3. WHEN the application starts, THE System SHALL automatically run pending migrations
4. WHEN a migration fails, THE System SHALL rollback the transaction and log the error
5. WHEN migrations are applied, THE System SHALL apply them in order based on timestamp
6. WHEN the migration status is queried, THE System SHALL return a list of applied migrations
7. WHEN a migration is created, THE System SHALL include both up and down scripts
8. WHEN rolling back, THE System SHALL execute down scripts in reverse order
9. WHEN migrations modify data, THE System SHALL include data migration logic
10. WHEN the database is initialized, THE System SHALL create a migrations tracking table

### Requirement 16: Environment Configuration Management

### Requirement 16: Environment Configuration Management

**User Story:** As a developer, I want proper environment configuration, so that the application works correctly in development and production with all managed services.

#### Acceptance Criteria

1. WHEN the System starts, THE System SHALL load configuration from environment variables including CLERK_SECRET_KEY, REDIS_URL, DATABASE_URL, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET
2. WHEN required environment variables are missing, THE System SHALL fail to start with a clear error message
3. WHEN environment-specific behavior is needed, THE System SHALL check NODE_ENV variable
4. WHEN configuration is loaded, THE System SHALL validate all values using schemas
5. WHEN sensitive values are logged, THE System SHALL mask them in log output
6. WHEN default values are appropriate, THE System SHALL provide sensible defaults for optional configuration
7. WHEN the configuration is accessed, THE System SHALL provide type-safe configuration objects
8. WHEN environment files are used, THE System SHALL support .env files for local development
9. WHEN configuration changes, THE System SHALL require restart to apply changes
10. WHEN configuration is documented, THE System SHALL provide .env.example with all available options including Clerk, Upstash, Railway, and Reddit OAuth credentials

### Requirement 17: API Response Optimization

### Requirement 17: API Response Optimization

**User Story:** As a user, I want fast API responses, so that the application feels responsive.

#### Acceptance Criteria

1. WHEN API responses are sent, THE System SHALL enable gzip compression for responses larger than 1KB
2. WHEN JSON is serialized, THE System SHALL use efficient serialization
3. WHEN database queries return large result sets, THE System SHALL implement pagination with configurable page size
4. WHEN responses include timestamps, THE System SHALL use ISO 8601 format
5. WHEN errors occur, THE System SHALL return consistent error response format with error code and message
6. WHEN responses are cached, THE System SHALL include appropriate Cache-Control headers
7. WHEN CORS is configured, THE System SHALL allow requests from the frontend origin
8. WHEN the API is versioned, THE System SHALL include version in the URL path (/api/v1/)
9. WHEN response times are measured, THE System SHALL include X-Response-Time header
10. WHEN request IDs are needed for tracing, THE System SHALL generate and include X-Request-ID header

### Requirement 18: Frontend Build Optimization

### Requirement 18: Frontend Build Optimization

**User Story:** As a developer, I want optimized frontend builds, so that the application loads quickly for users.

#### Acceptance Criteria

1. WHEN the Frontend is built, THE System SHALL tree-shake unused code
2. WHEN the Frontend is built, THE System SHALL minify JavaScript and CSS
3. WHEN the Frontend is built, THE System SHALL generate source maps for debugging
4. WHEN the Frontend is built, THE System SHALL hash filenames for cache busting
5. WHEN the Frontend is built, THE System SHALL split vendor dependencies into separate chunks
6. WHEN the Frontend is built, THE System SHALL inline critical CSS
7. WHEN the Frontend is built, THE System SHALL optimize images and convert to modern formats
8. WHEN the Frontend is built, THE System SHALL generate a service worker for offline support
9. WHEN the Bundle is analyzed, THE System SHALL generate a bundle size report
10. WHEN the Frontend is deployed, THE System SHALL serve assets with long cache headers

### Requirement 19: Error Handling and Recovery

### Requirement 19: Error Handling and Recovery

**User Story:** As a user, I want the application to handle errors gracefully, so that I get helpful feedback when something goes wrong.

#### Acceptance Criteria

1. WHEN an unhandled error occurs in the API, THE System SHALL catch it and return HTTP 500 with a generic error message
2. WHEN a database query fails, THE System SHALL retry up to 3 times with exponential backoff
3. WHEN a Reddit API call fails, THE System SHALL log the error and continue processing other requests
4. WHEN validation fails, THE System SHALL return HTTP 400 with specific field errors
5. WHEN a resource is not found, THE System SHALL return HTTP 404 with a helpful message
6. WHEN Clerk authentication fails, THE System SHALL return HTTP 401 with clear error reason
7. WHEN authorization fails, THE System SHALL return HTTP 403 with access requirements
8. WHEN the Frontend encounters an error, THE System SHALL display an error boundary with recovery options
9. WHEN network requests fail, THE Frontend SHALL show retry options
10. WHEN the System is overloaded, THE System SHALL return HTTP 503 with retry-after header

### Requirement 20: Performance Monitoring and Metrics

### Requirement 20: Performance Monitoring and Metrics

**User Story:** As a developer, I want detailed performance metrics, so that I can identify and fix performance bottlenecks.

#### Acceptance Criteria

1. WHEN the Metrics_Endpoint is called, THE System SHALL return request count by endpoint and status code
2. WHEN the Metrics_Endpoint is called, THE System SHALL return request duration histogram
3. WHEN the Metrics_Endpoint is called, THE System SHALL return database query duration metrics
4. WHEN the Metrics_Endpoint is called, THE System SHALL return cache hit/miss ratio
5. WHEN the Metrics_Endpoint is called, THE System SHALL return active connection counts
6. WHEN the Metrics_Endpoint is called, THE System SHALL return memory usage metrics
7. WHEN the Metrics_Endpoint is called, THE System SHALL return error rate by type
8. WHEN the Metrics_Endpoint is called, THE System SHALL return search query performance metrics
9. WHEN the Metrics_Endpoint is called, THE System SHALL return Reddit API call metrics and rate limit usage
10. WHEN metrics are collected, THE System SHALL use minimal overhead (< 1% performance impact)

### Requirement 21: Deployment Verification

### Requirement 21: Deployment Verification

**User Story:** As a developer, I want automated deployment verification, so that I know deployments succeeded before they go live.

#### Acceptance Criteria

1. WHEN deployment completes, THE CI/CD_Pipeline SHALL call the Health_Check endpoint
2. WHEN the Health_Check succeeds, THE CI/CD_Pipeline SHALL mark the deployment as successful
3. WHEN the Health_Check fails, THE CI/CD_Pipeline SHALL rollback the deployment
4. WHEN deployment is verified, THE CI/CD_Pipeline SHALL run smoke tests against critical endpoints
5. WHEN smoke tests pass, THE CI/CD_Pipeline SHALL complete the deployment
6. WHEN smoke tests fail, THE CI/CD_Pipeline SHALL rollback and notify developers
7. WHEN deployment is complete, THE CI/CD_Pipeline SHALL update deployment status in Railway
8. WHEN rollback occurs, THE CI/CD_Pipeline SHALL restore the previous working version
9. WHEN deployment verification runs, THE System SHALL test Clerk authentication, search, and health endpoints
10. WHEN verification completes, THE CI/CD_Pipeline SHALL log deployment metrics (duration, success rate)

### Requirement 22: Database Connection Resilience

### Requirement 22: Database Connection Resilience

**User Story:** As a developer, I want resilient database connections, so that temporary network issues don't crash the application.

#### Acceptance Criteria

1. WHEN a Railway PostgreSQL connection is lost, THE System SHALL attempt to reconnect automatically
2. WHEN reconnection attempts fail, THE System SHALL use exponential backoff with maximum delay of 30 seconds
3. WHEN the database is unavailable, THE System SHALL return HTTP 503 for requests requiring database access
4. WHEN connection pool is exhausted, THE System SHALL queue requests with timeout of 10 seconds
5. WHEN a query times out, THE System SHALL cancel the query and return an error
6. WHEN connection errors occur, THE System SHALL log detailed error information
7. WHEN the database recovers, THE System SHALL resume normal operation automatically
8. WHEN connection pool health degrades, THE System SHALL log warnings
9. WHEN idle connections exist, THE System SHALL validate them before use
10. WHEN the System starts, THE System SHALL wait up to 30 seconds for Railway database to be ready

### Requirement 23: Frontend Error Boundaries

### Requirement 23: Frontend Error Boundaries

**User Story:** As a user, I want the application to recover from errors gracefully, so that one error doesn't break the entire page.

#### Acceptance Criteria

1. WHEN a component throws an error, THE Frontend SHALL catch it with an error boundary
2. WHEN an error is caught, THE Frontend SHALL display a user-friendly error message
3. WHEN an error is caught, THE Frontend SHALL log the error to the console with stack trace
4. WHEN an error is caught, THE Frontend SHALL send the error to Sentry
5. WHEN an error boundary is displayed, THE Frontend SHALL provide a "Try Again" button
6. WHEN "Try Again" is clicked, THE Frontend SHALL reset the error boundary and re-render
7. WHEN a network error occurs, THE Frontend SHALL display a specific network error message
8. WHEN the user is offline, THE Frontend SHALL display an offline indicator
9. WHEN the user comes back online, THE Frontend SHALL automatically retry failed requests
10. WHEN critical errors occur, THE Frontend SHALL provide a "Reload Page" option

### Requirement 24: Production Readiness Checklist

### Requirement 24: Production Readiness Checklist

**User Story:** As a developer, I want a production readiness checklist, so that I can verify all production requirements are met before going live.

#### Acceptance Criteria

1. WHEN preparing for production, THE System SHALL have all environment variables documented (Clerk, Upstash, Railway, Reddit OAuth, Sentry, Vercel, Resend, Trigger.dev)
2. WHEN preparing for production, THE System SHALL have database migrations tested
3. WHEN preparing for production, THE System SHALL have monitoring and alerting configured
4. WHEN preparing for production, THE System SHALL have error tracking enabled
5. WHEN preparing for production, THE System SHALL have HTTPS enforced
6. WHEN preparing for production, THE System SHALL have rate limiting enabled using Upstash
7. WHEN preparing for production, THE System SHALL have security headers configured with Clerk domain allowlist
8. WHEN preparing for production, THE System SHALL have health checks implemented for all dependencies
9. WHEN preparing for production, THE System SHALL have graceful shutdown implemented with connection cleanup
10. WHEN preparing for production, THE System SHALL have performance benchmarks documented

### Requirement 25: Vercel Frontend Deployment

**User Story:** As a developer, I want to deploy the frontend to Vercel, so that I can leverage automatic deployments, global CDN, and demonstrate modern frontend deployment practices.

**Interview Talking Point:** "I chose Vercel over self-hosted frontend because it provides automatic deployments from GitHub, global CDN for fast load times worldwide, and zero configuration. This lets me focus on features rather than infrastructure, which is important for a solo project. The free tier is generous for portfolio projects, and Vercel's edge network ensures users get fast load times regardless of location."

#### Acceptance Criteria

1. WHEN code is pushed to the main branch, THE Vercel SHALL automatically deploy the frontend
2. WHEN the deployment completes, THE Vercel SHALL provide a unique preview URL
3. WHEN the deployment is successful, THE Vercel SHALL promote it to the production domain
4. WHEN static assets are served, THE Vercel SHALL serve them from the global CDN with optimal cache headers
5. WHEN environment variables are needed, THE System SHALL load them from Vercel environment configuration
6. WHEN the build fails, THE Vercel SHALL preserve the previous working deployment
7. WHEN pull requests are opened, THE Vercel SHALL create preview deployments for testing
8. WHEN the frontend is accessed, THE Vercel SHALL serve it over HTTPS with automatic SSL certificates
9. WHEN API requests are made, THE Frontend SHALL use the VITE_API_URL environment variable to connect to Railway backend
10. WHEN Clerk authentication is configured, THE Frontend SHALL load VITE_CLERK_PUBLISHABLE_KEY from Vercel environment variables

### Requirement 26: Resend Transactional Email Integration

**User Story:** As a user, I want to receive a welcome email when I sign up, so that I know my account was created successfully and have important information.

**Interview Talking Point:** "I integrated Resend for transactional emails because it has a simple API, generous free tier (3,000 emails/month), and is specifically designed for developers. I trigger welcome emails via Clerk webhooks when users sign up. This demonstrates understanding of event-driven architecture and third-party service integration. Resend was chosen over SendGrid or Mailgun because of its developer-friendly API and modern approach."

#### Acceptance Criteria

1. WHEN a user completes registration via Clerk, THE System SHALL receive a webhook event from Clerk
2. WHEN the webhook is received, THE System SHALL verify the webhook signature using Clerk's signing secret
3. WHEN the webhook is verified, THE System SHALL extract user email and name from the event payload
4. WHEN user information is extracted, THE System SHALL send a welcome email using Resend API
5. WHEN the welcome email is sent, THE Email SHALL include the user's name, getting started tips, and support contact
6. WHEN the Resend API call fails, THE System SHALL retry up to 3 times with exponential backoff
7. WHEN all retries fail, THE System SHALL log the error to Sentry but not fail the registration
8. WHEN the email is sent successfully, THE System SHALL log the Resend message ID for tracking
9. WHEN Resend is configured, THE System SHALL load RESEND_API_KEY from environment variables
10. WHEN the webhook endpoint is called, THE System SHALL respond within 3 seconds to avoid Clerk timeout

### Requirement 27: Trigger.dev Background Job Orchestration

**User Story:** As a developer, I want to use Trigger.dev for scheduled Reddit data collection, so that I can replace node-cron with a managed service that provides monitoring, retries, and a dashboard.

**Interview Talking Point:** "I replaced node-cron with Trigger.dev because it provides a monitoring dashboard, automatic retries, and doesn't require keeping a server running 24/7 just for cron jobs. This is more cost-effective and reliable than self-hosted cron. The free tier includes 100K task runs per month, which is plenty for collecting Reddit data hourly. Trigger.dev also gives me visibility into job execution history and failures, which is crucial for debugging production issues."

#### Acceptance Criteria

1. WHEN the System initializes, THE Trigger_dev SHALL register background jobs for Reddit data collection
2. WHEN a scheduled job is triggered, THE Trigger_dev SHALL execute the Reddit collection task
3. WHEN the collection task runs, THE System SHALL collect top posts from /r/all for popular search queries
4. WHEN posts are collected, THE System SHALL store them in Railway PostgreSQL
5. WHEN the collection completes, THE System SHALL invalidate relevant cache entries in Upstash
6. WHEN a job fails, THE Trigger_dev SHALL automatically retry up to 3 times with exponential backoff
7. WHEN all retries fail, THE Trigger_dev SHALL mark the job as failed and send an alert
8. WHEN jobs are scheduled, THE System SHALL run Reddit collection every hour for top 20 queries
9. WHEN Trigger.dev is configured, THE System SHALL load TRIGGER_API_KEY and TRIGGER_API_URL from environment variables
10. WHEN job execution is monitored, THE Trigger_dev dashboard SHALL show execution history, duration, and success rate

### Requirement 28: Environment Variable Validation

**User Story:** As a developer, I want automatic validation of environment variables at startup, so that I catch configuration errors before the application starts serving traffic.

**Interview Talking Point:** "I use Zod to validate all environment variables at startup. This catches configuration errors immediately rather than discovering them when a feature is used. For example, if CLERK_SECRET_KEY is missing, the app fails fast with a clear error message instead of crashing when someone tries to authenticate. This is a production best practice that prevents silent failures and makes debugging much easier."

#### Acceptance Criteria

1. WHEN the System starts, THE System SHALL validate all required environment variables using Zod schemas
2. WHEN a required variable is missing, THE System SHALL log a clear error message and exit with code 1
3. WHEN a variable has an invalid format, THE System SHALL log the validation error and exit with code 1
4. WHEN all variables are valid, THE System SHALL log successful validation and continue startup
5. WHEN environment variables are validated, THE System SHALL check CLERK_SECRET_KEY, REDIS_URL, DATABASE_URL, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, RESEND_API_KEY, TRIGGER_API_KEY
6. WHEN optional variables are missing, THE System SHALL use sensible defaults and log a warning
7. WHEN sensitive values are logged, THE System SHALL mask them (show only first 4 characters)
8. WHEN validation schemas are defined, THE System SHALL include type checking (string, number, URL, enum)
9. WHEN the validation fails, THE System SHALL list all validation errors, not just the first one
10. WHEN running in development, THE System SHALL load variables from .env file before validation

### Requirement 29: Graceful Shutdown with Connection Cleanup

**User Story:** As a developer, I want proper graceful shutdown, so that the application closes all connections cleanly when Railway restarts or redeploys.

**Interview Talking Point:** "Graceful shutdown is critical in production. When Railway sends SIGTERM during a deployment, my app stops accepting new requests, completes pending requests, closes database connections, disconnects from Redis, and then exits. This prevents connection leaks and ensures no requests are dropped. I learned this is a common interview question about production readiness."

#### Acceptance Criteria

1. WHEN the System receives SIGTERM signal, THE System SHALL stop accepting new HTTP requests
2. WHEN new requests are stopped, THE System SHALL wait up to 30 seconds for pending requests to complete
3. WHEN pending requests complete, THE System SHALL close the Railway PostgreSQL connection pool
4. WHEN the database pool is closed, THE System SHALL disconnect from Upstash Redis
5. WHEN Redis is disconnected, THE System SHALL flush any pending logs
6. WHEN all cleanup is complete, THE System SHALL exit with code 0
7. WHEN the 30-second timeout is reached, THE System SHALL force close remaining connections and exit
8. WHEN shutdown begins, THE System SHALL log "Graceful shutdown initiated" with timestamp
9. WHEN shutdown completes, THE System SHALL log "Graceful shutdown complete" with duration
10. WHEN the System receives SIGINT (Ctrl+C), THE System SHALL perform the same graceful shutdown

### Requirement 30: Comprehensive Health Checks

**User Story:** As a developer, I want health checks that verify all dependencies, so that Railway can detect issues and restart the service if needed.

**Interview Talking Point:** "My health check endpoint verifies connectivity to Railway PostgreSQL, Upstash Redis, and Reddit API. This is important because Railway uses health checks to determine if the service is working. If any dependency is down, the health check returns 503, and Railway can restart the service or alert me. I also include response times for each dependency to help diagnose performance issues."

#### Acceptance Criteria

1. WHEN the Health_Check endpoint is called, THE System SHALL verify Railway PostgreSQL connectivity by executing a simple query
2. WHEN the Health_Check endpoint is called, THE System SHALL verify Upstash Redis connectivity by executing a PING command
3. WHEN the Health_Check endpoint is called, THE System SHALL verify Reddit OAuth token is valid and not expired
4. WHEN all dependencies are healthy, THE Health_Check SHALL return HTTP 200 with status details
5. WHEN any dependency is unhealthy, THE Health_Check SHALL return HTTP 503 with failure details
6. WHEN health checks are executed, THE System SHALL complete all checks within 1 second
7. WHEN a dependency check times out, THE System SHALL mark it as unhealthy and continue checking others
8. WHEN health check results are returned, THE System SHALL include response time for each dependency
9. WHEN the health check is called frequently, THE System SHALL cache results for 5 seconds to prevent overload
10. WHEN Railway performs health checks, THE System SHALL respond consistently without side effects

### Requirement 31: API Input Validation with Zod

**User Story:** As a developer, I want comprehensive input validation, so that invalid requests are rejected before processing and users get clear error messages.

**Interview Talking Point:** "I use Zod for runtime type validation of all API inputs. TypeScript only provides compile-time checking, but Zod validates at runtime, which is essential for API endpoints. When validation fails, users get detailed error messages like 'query must be between 1 and 500 characters' instead of generic 400 errors. This improves developer experience and prevents invalid data from reaching the database."

#### Acceptance Criteria

1. WHEN a search request is received, THE System SHALL validate the query parameter using Zod schema
2. WHEN the query is invalid, THE System SHALL return HTTP 400 with detailed validation errors
3. WHEN the query is valid, THE System SHALL validate optional parameters (page, pageSize, filters)
4. WHEN pagination parameters are invalid, THE System SHALL return HTTP 400 with specific field errors
5. WHEN filter parameters are provided, THE System SHALL validate subreddit, dateFrom, dateTo, sortBy
6. WHEN validation succeeds, THE System SHALL pass validated data to the query processor
7. WHEN validation schemas are defined, THE System SHALL enforce minimum and maximum lengths for strings
8. WHEN validation schemas are defined, THE System SHALL enforce minimum and maximum values for numbers
9. WHEN validation errors occur, THE System SHALL return errors in a consistent format with field names and error messages
10. WHEN the API receives unexpected fields, THE System SHALL strip them and log a warning

### Requirement 32: Retry Logic with Exponential Backoff

**User Story:** As a developer, I want automatic retry logic for transient failures, so that temporary network issues don't cause user-facing errors.

**Interview Talking Point:** "I implement exponential backoff for all external service calls - Railway database, Upstash Redis, Reddit API, and Resend. This handles transient network issues gracefully. For example, if a database query fails, I retry after 100ms, then 200ms, then 400ms, up to 3 attempts. This is a standard production pattern that significantly improves reliability without overwhelming failing services."

#### Acceptance Criteria

1. WHEN a Railway PostgreSQL query fails with a transient error, THE System SHALL retry up to 3 times with exponential backoff
2. WHEN retrying, THE System SHALL wait 100ms before first retry, 200ms before second, 400ms before third
3. WHEN an Upstash Redis command fails, THE System SHALL retry up to 3 times with exponential backoff
4. WHEN a Reddit API call fails with 5xx error, THE System SHALL retry up to 3 times with exponential backoff
5. WHEN a Resend API call fails with transient error, THE System SHALL retry up to 3 times with exponential backoff
6. WHEN all retries are exhausted, THE System SHALL log the final error and return appropriate HTTP status
7. WHEN a non-transient error occurs (4xx), THE System SHALL not retry and return immediately
8. WHEN retrying, THE System SHALL log each retry attempt with attempt number and delay
9. WHEN a retry succeeds, THE System SHALL log successful recovery and continue processing
10. WHEN implementing backoff, THE System SHALL add jitter (random 0-50ms) to prevent thundering herd

### Requirement 33: Structured Logging with Request IDs

**User Story:** As a developer, I want structured logging with request IDs, so that I can trace requests through the system and debug production issues efficiently.

**Interview Talking Point:** "Every request gets a unique request ID that's included in all log entries for that request. This makes it easy to trace a request through the entire system - from API entry, through database queries, to cache operations. Logs are in JSON format so they can be easily parsed by log aggregation tools. This is essential for debugging production issues where you need to see exactly what happened for a specific request."

#### Acceptance Criteria

1. WHEN a request is received, THE System SHALL generate a unique request ID (UUID v4)
2. WHEN the request ID is generated, THE System SHALL include it in the X-Request-ID response header
3. WHEN any log entry is written for that request, THE System SHALL include the request ID
4. WHEN logs are written, THE System SHALL use JSON format with consistent fields (timestamp, level, message, requestId, userId, duration)
5. WHEN a user is authenticated, THE System SHALL include the Clerk user ID in all log entries
6. WHEN database queries are executed, THE System SHALL log query duration and request ID
7. WHEN cache operations are performed, THE System SHALL log cache hit/miss and request ID
8. WHEN errors occur, THE System SHALL log full stack trace with request ID
9. WHEN external API calls are made, THE System SHALL log request/response details with request ID
10. WHEN sensitive data is logged, THE System SHALL sanitize it (mask passwords, tokens, API keys)

### Requirement 34: Security Headers with Clerk Domain Allowlist

**User Story:** As a developer, I want proper security headers that allow Clerk to function, so that the application is secure while supporting third-party authentication.

**Interview Talking Point:** "I use Helmet.js for security headers but had to customize the Content Security Policy to allow Clerk domains. This is a common real-world scenario - you need security headers, but you also need to integrate with third-party services. I specifically allow clerk.com for scripts, img.clerk.com for images, and api.clerk.com for API calls. This demonstrates understanding of CSP and how to balance security with functionality."

#### Acceptance Criteria

1. WHEN the API starts, THE System SHALL configure Helmet.js with security headers
2. WHEN Content-Security-Policy is set, THE System SHALL allow scripts from 'self' and 'https://clerk.com'
3. WHEN Content-Security-Policy is set, THE System SHALL allow images from 'self', 'data:', 'https:', and 'https://img.clerk.com'
4. WHEN Content-Security-Policy is set, THE System SHALL allow connections to 'self', API_URL, and 'https://api.clerk.com'
5. WHEN HSTS header is set, THE System SHALL use max-age of 31536000 seconds with includeSubDomains
6. WHEN X-Frame-Options is set, THE System SHALL use DENY to prevent clickjacking
7. WHEN X-Content-Type-Options is set, THE System SHALL use nosniff to prevent MIME sniffing
8. WHEN X-XSS-Protection is set, THE System SHALL enable XSS filtering
9. WHEN running in production, THE System SHALL enforce all security headers
10. WHEN running in development, THE System SHALL use relaxed CSP for easier debugging

### Requirement 35: Missing Dependencies Installation

**User Story:** As a developer, I want all required dependencies installed, so that the application builds and runs without errors.

**Interview Talking Point:** "During code review, I identified missing dependencies that would cause runtime errors. I added @clerk/clerk-react and @clerk/clerk-sdk-node for authentication, @upstash/redis for caching, @sentry/node and @sentry/react for error tracking, and web-vitals for performance monitoring. This demonstrates attention to detail and understanding of the full dependency tree."

#### Acceptance Criteria

1. WHEN the frontend is built, THE System SHALL have @clerk/clerk-react installed for authentication components
2. WHEN the backend is built, THE System SHALL have @clerk/clerk-sdk-node installed for JWT verification
3. WHEN the backend connects to Redis, THE System SHALL have @upstash/redis installed
4. WHEN error tracking is initialized, THE System SHALL have @sentry/node installed in backend
5. WHEN error tracking is initialized, THE System SHALL have @sentry/react installed in frontend
6. WHEN performance metrics are collected, THE System SHALL have web-vitals installed in frontend
7. WHEN environment validation runs, THE System SHALL have zod installed for schema validation
8. WHEN the package.json is reviewed, THE System SHALL list all dependencies with specific versions
9. WHEN dependencies are installed, THE System SHALL use npm ci for reproducible builds
10. WHEN the application starts, THE System SHALL verify all required dependencies are available

### Requirement 36: Dockerfile Entry Point Fix

**User Story:** As a developer, I want the correct Docker entry point, so that the container starts successfully when deployed to Railway.

**Interview Talking Point:** "I fixed a critical bug in the Dockerfile where the entry point was pointing to backend/dist/index.js instead of backend/dist/server.js. This would cause the container to fail at startup. I caught this during code review by checking the actual build output structure. This demonstrates understanding of Docker, build processes, and the importance of testing deployment configurations."

#### Acceptance Criteria

1. WHEN the backend Docker image is built, THE Dockerfile SHALL copy the built files from backend/dist
2. WHEN the container starts, THE Dockerfile SHALL execute node backend/dist/server.js as the entry point
3. WHEN the entry point is executed, THE System SHALL start the Express server successfully
4. WHEN the build output is generated, THE System SHALL place the compiled server code at backend/dist/server.js
5. WHEN the Dockerfile is reviewed, THE entry point SHALL match the actual build output structure
6. WHEN the container starts, THE System SHALL log "Server started on port 3000" to confirm successful startup
7. WHEN the container fails to start, THE System SHALL log clear error messages to help diagnose issues
8. WHEN the Docker image is built, THE System SHALL use multi-stage builds to minimize image size
9. WHEN the production image is created, THE System SHALL only include production dependencies
10. WHEN the container is deployed to Railway, THE System SHALL start successfully and pass health checks
