# Interview Guide

Common questions about this project and how to answer them.

## "Walk me through your architecture"

"FeedVex is a Reddit search engine. The frontend is React deployed on Vercel, which gives me automatic GitHub deployments and global CDN. The backend is Express on Railway with PostgreSQL for storage and Upstash Redis for caching.

For authentication I use Clerk - it handles OAuth, social login, and JWT tokens so I don't have to build custom auth. When users search, I check Upstash cache first (5-minute TTL), then fall back to PostgreSQL. If the data is stale, I trigger Reddit collection in the background using our OAuth client which gets 600 requests/minute.

For emails I use Resend triggered by Clerk webhooks. For scheduled Reddit collection I use Trigger.dev instead of node-cron because it gives me a monitoring dashboard and automatic retries."

## "Why Clerk over custom auth?"

"Building auth correctly is genuinely hard - you need password hashing, JWT rotation, OAuth flows, MFA, session management, and security updates. Clerk handles all of that. I can focus on the search features that actually differentiate the product. For a portfolio project, this is the right trade-off. At scale, the cost might push you toward custom auth, but Clerk's free tier is generous."

## "How does your caching work?"

"I use Upstash Redis with a cache-first strategy. Every search request checks the cache first using the key `search:{query}:{page}:{pageSize}`. Cache hits return in under 10ms. On a miss, I query PostgreSQL, store the result with a 5-minute TTL, and return it. If Upstash is unavailable, I fall back to direct database queries - the cache failure never breaks search."

## "How do you handle errors in production?"

"Three layers: First, Sentry captures all unhandled errors with full stack traces and request context. Second, I use exponential backoff retry for all external service calls - database, Redis, Reddit API, Resend. Third, I have graceful degradation - if Redis is down, search still works via PostgreSQL. If Resend fails, registration still succeeds. The system degrades gracefully rather than failing completely."

## "How would you scale this to 1 million users?"

"The architecture already scales well because of the managed services. For the database, Railway supports read replicas - I'd add those for search queries. Upstash has global replication so cache reads are fast worldwide. For the backend, Railway supports horizontal scaling - I'd add more instances behind a load balancer. The stateless design (Clerk handles sessions) makes horizontal scaling straightforward. For Reddit collection, Trigger.dev handles the scheduling so I don't need to worry about distributed cron."

## "What was the most challenging part?"

"Two things: First, the Clerk webhook integration - I had to understand svix signature verification and make sure the webhook responds within 3 seconds or Clerk retries. Second, the graceful shutdown - making sure SIGTERM closes the database connection pool and Redis before exiting, so Railway deployments don't cause connection leaks."

## "What would you do differently?"

"I'd add a proper migration system (like Flyway or node-postgres-migrate) instead of running CREATE TABLE IF NOT EXISTS on startup. I'd also add more comprehensive property-based tests using fast-check to verify the BM25 ranking properties. And I'd set up proper database read replicas earlier rather than waiting until scale demands it."
