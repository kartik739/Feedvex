# Technical Decisions

Why I chose each technology and what I'd say in an interview.

## Authentication: Clerk over custom auth

**Decision**: Use Clerk instead of building custom JWT auth.

**Why**: Building auth correctly is hard - you need to handle password hashing, JWT rotation, OAuth flows, MFA, and session management. Clerk handles all of this. I can focus on the actual product features instead of reinventing auth.

**Trade-offs**: Vendor dependency, cost at scale. But for a portfolio project and early-stage product, the time savings are worth it.

**Interview answer**: "I chose Clerk because authentication is a solved problem. Clerk gives me OAuth, social login, MFA, and JWT management out of the box. This let me focus on the search engine features that actually differentiate the product."

## Database: Railway PostgreSQL over self-hosted

**Decision**: Use Railway's managed PostgreSQL instead of running our own.

**Why**: Railway handles backups, connection pooling, scaling, and maintenance. The DATABASE_URL format makes it easy to connect. For a portfolio project, zero ops overhead is the right call.

**Interview answer**: "I used Railway for PostgreSQL because it's managed - automatic backups, connection pooling, and I can deploy with a single command. I connect via DATABASE_URL which Railway provides, and I use pg with a connection pool (min: 2, max: 10) for efficient connection reuse."

## Caching: Upstash Redis over self-hosted Redis

**Decision**: Use Upstash serverless Redis instead of running Redis ourselves.

**Why**: Upstash is serverless - no connection pooling needed, global edge caching, and 10K commands/day free. We don't manage any infrastructure. The @upstash/redis client is optimized for serverless environments.

**Interview answer**: "I chose Upstash because it's serverless Redis. No connection pooling, no infrastructure management. I cache search results for 5 minutes using the key format `search:{query}:{page}:{pageSize}`. Cache misses fall back to PostgreSQL gracefully."

## Search Ranking: BM25 over TF-IDF

**Decision**: Use BM25 algorithm for ranking search results.

**Why**: BM25 is the industry standard for text search (used by Elasticsearch, Lucene). It handles term frequency saturation better than TF-IDF - a word appearing 100 times isn't 100x more relevant than appearing 10 times. We also factor in recency and Reddit score.

**Interview answer**: "I use BM25 because it's the industry standard for relevance ranking. Unlike TF-IDF, BM25 has term frequency saturation - a word appearing many times doesn't keep increasing the score linearly. I also blend in recency (newer posts score higher) and Reddit score (upvotes signal quality)."

## Email: Resend over SendGrid/Mailgun

**Decision**: Use Resend for transactional emails.

**Why**: Resend has a simple, modern API, 3K emails/month free, and is built specifically for developers. We trigger welcome emails via Clerk webhooks when users sign up - this demonstrates event-driven architecture.

**Interview answer**: "I use Resend for transactional emails triggered by Clerk webhooks. When a user signs up, Clerk sends a webhook to my backend, I verify the signature with svix, then send a welcome email via Resend. I retry up to 3 times with exponential backoff, and if all retries fail, I log to Sentry but don't fail the registration."

## Background Jobs: Trigger.dev over node-cron

**Decision**: Use Trigger.dev instead of node-cron for scheduled Reddit collection.

**Why**: Trigger.dev gives us a monitoring dashboard, automatic retries, and doesn't require keeping a server running 24/7 just for cron jobs. node-cron is fine for simple cases but has no visibility into failures.

**Interview answer**: "I replaced node-cron with Trigger.dev because it gives me a dashboard to see job history, automatic retries on failure, and I don't need to keep a server running just for cron jobs. The free tier includes 100K task runs/month which is plenty for hourly Reddit collection."

## Error Handling: Exponential Backoff

**Decision**: Retry all external service calls with exponential backoff + jitter.

**Why**: Transient failures (network blips, temporary service unavailability) are common in distributed systems. Exponential backoff gives services time to recover. Jitter prevents thundering herd - multiple clients all retrying at exactly the same time.

**Interview answer**: "I use exponential backoff for all external calls - database, Redis, Reddit API, Resend. The delays are 100ms, 200ms, 400ms. I add random jitter (0-50ms) to prevent thundering herd. I only retry transient errors (connection failures, 5xx) - not 4xx errors which indicate a bug in my code."
