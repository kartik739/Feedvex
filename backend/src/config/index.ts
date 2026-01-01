import dotenv from 'dotenv';
import { validateEnv } from './schemas';

// Load .env file before validation
dotenv.config();

// Validate and export typed config
export const env = validateEnv();

export function loadConfig() {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    database: {
      url: env.DATABASE_URL,
      host: env.POSTGRES_HOST,
      port: env.POSTGRES_PORT,
      name: env.POSTGRES_DB,
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
    },
    redis: {
      url: env.REDIS_URL,
    },
    clerk: {
      secretKey: env.CLERK_SECRET_KEY,
      webhookSecret: env.CLERK_WEBHOOK_SECRET,
    },
    reddit: {
      clientId: env.REDDIT_CLIENT_ID,
      clientSecret: env.REDDIT_CLIENT_SECRET,
      userAgent: env.REDDIT_USER_AGENT,
      subreddits: ['programming', 'technology', 'webdev', 'javascript', 'python'],
      maxPostsPerSubreddit: 100,
      collectionIntervalHours: 6,
    },
    resend: {
      apiKey: env.RESEND_API_KEY,
    },
    trigger: {
      apiKey: env.TRIGGER_API_KEY,
      apiUrl: env.TRIGGER_API_URL,
    },
    sentry: {
      dsn: env.SENTRY_DSN,
    },
    cors: {
      origins: env.CORS_ORIGINS,
    },
    security: {
      jwtSecret: env.JWT_SECRET,
    },
    ranking: {
      algorithm: 'bm25',
      bm25K1: 1.2,
      bm25B: 0.75,
      textWeight: 0.4,
      recencyWeight: 0.2,
      popularityWeight: 0.3,
      engagementWeight: 0.1,
      recencyDecayDays: 7,
    },
  };
}
