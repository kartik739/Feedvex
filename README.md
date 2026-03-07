# FeedVex - Reddit Search Engine

A production-ready Reddit search engine built with modern cloud services. Search across all of Reddit with fast, relevant results powered by BM25 ranking.

**Live Demo**: [feedvex.vercel.app](https://feedvex.vercel.app) | **API**: [feedvex.up.railway.app](https://feedvex.up.railway.app)

## Architecture

```
Browser → Vercel (Frontend) → Railway (Backend API)
                                    ↓
                    Upstash Redis (Cache) + Railway PostgreSQL (DB)
                                    ↓
                    Reddit OAuth API (600 req/min)

External: Clerk (Auth) · Resend (Email) · Trigger.dev (Jobs) · Sentry (Errors)
```

## Cloud Services

| Service | Purpose | Why chosen |
|---------|---------|------------|
| **Clerk** | Authentication | OAuth, social login, JWT - no custom auth needed |
| **Railway** | PostgreSQL + Backend hosting | Managed DB, automatic backups, simple deploys |
| **Upstash** | Redis caching | Serverless, no infra to manage, 10K cmds/day free |
| **Vercel** | Frontend deployment | Auto deploys from GitHub, global CDN, free tier |
| **Resend** | Transactional email | Developer-friendly API, 3K emails/month free |
| **Trigger.dev** | Background jobs | Managed cron with dashboard, replaces node-cron |
| **Sentry** | Error tracking | Full stack traces, 5K errors/month free |

## Quick Start

### Prerequisites
- Node.js 20+
- Accounts: [Clerk](https://clerk.com), [Upstash](https://upstash.com), [Railway](https://railway.app), [Reddit App](https://www.reddit.com/prefs/apps)

### Local Development

```bash
# Clone and install
git clone https://github.com/kartik739/Feedvex.git
cd Feedvex
npm install

# Copy env file and fill in your keys
cp .env.example .env

# Start backend
npm run dev:backend

# Start frontend (separate terminal)
npm run dev:frontend
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Required for full functionality
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
DATABASE_URL=postgresql://...  # From Railway
REDIS_URL=redis://...          # From Upstash
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...

# Optional (features degrade gracefully without these)
RESEND_API_KEY=re_...
TRIGGER_API_KEY=tr_dev_...
SENTRY_DSN=https://...
```

### Docker

```bash
docker-compose up
```

## Key Features

- **Full-text search** across Reddit posts using BM25 ranking
- **On-demand collection** - fresh data collected when you search
- **5-minute cache** via Upstash Redis for fast repeat searches
- **Rate limiting** - 100 req/min per IP using Upstash
- **Graceful shutdown** - closes DB/Redis connections cleanly on SIGTERM
- **Health checks** - verifies PostgreSQL, Redis, Reddit API connectivity
- **Structured logging** - JSON logs with request IDs for tracing
- **Error tracking** - Sentry captures errors with full context

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/search` | Search Reddit posts |
| GET | `/api/v1/health` | Health check (all dependencies) |
| GET | `/api/v1/metrics` | Prometheus metrics |
| GET | `/api/v1/autocomplete` | Search suggestions |
| POST | `/api/webhooks/clerk` | Clerk webhook (welcome emails) |

## Performance

- Search p95: < 100ms (cache hit < 10ms)
- Lighthouse score: 90+
- Reddit data: 600 req/min via OAuth (10x public API)
