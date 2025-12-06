import dotenv from 'dotenv';
import { SystemConfigSchema, SystemConfig } from './schemas';

// Load environment variables
dotenv.config();

// Re-export types and schemas
export * from './schemas';

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
}

/**
 * Validates configuration using Zod schema
 * Provides detailed error messages for invalid configuration
 */
function validateConfig(config: unknown): SystemConfig {
  try {
    return SystemConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
    throw error;
  }
}

export function loadConfig(): SystemConfig {
  const rawConfig = {
    reddit: {
      clientId: getEnvVar('REDDIT_CLIENT_ID', ''),
      clientSecret: getEnvVar('REDDIT_CLIENT_SECRET', ''),
      userAgent: getEnvVar('REDDIT_USER_AGENT', 'reddit-search-engine/1.0'),
      subreddits: getEnvVar('SUBREDDITS', 'programming')
        .split(',')
        .map((s) => s.trim()),
    },
    collector: {
      interval: getEnvNumber('COLLECTION_INTERVAL', 3600000),
      concurrentRequests: getEnvNumber('CONCURRENT_REQUESTS', 5),
      maxPostsPerSubreddit: getEnvNumber('MAX_POSTS_PER_SUBREDDIT', 100),
    },
    ranking: {
      algorithm: getEnvVar('RANKING_ALGORITHM', 'bm25'),
      bm25K1: getEnvNumber('BM25_K1', 1.5),
      bm25B: getEnvNumber('BM25_B', 0.75),
      textWeight: getEnvNumber('TEXT_WEIGHT', 0.7),
      recencyWeight: getEnvNumber('RECENCY_WEIGHT', 0.15),
      popularityWeight: getEnvNumber('POPULARITY_WEIGHT', 0.1),
      engagementWeight: getEnvNumber('ENGAGEMENT_WEIGHT', 0.05),
      recencyDecayDays: getEnvNumber('RECENCY_DECAY_DAYS', 7),
    },
    cache: {
      ttl: getEnvNumber('CACHE_TTL', 300),
      maxSize: getEnvNumber('CACHE_MAX_SIZE', 1000),
    },
    rateLimiter: {
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW', 60000),
      maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    },
    database: {
      host: getEnvVar('DB_HOST', 'localhost'),
      port: getEnvNumber('DB_PORT', 5432),
      database: getEnvVar('DB_NAME', 'reddit_search'),
      user: getEnvVar('DB_USER', 'postgres'),
      password: getEnvVar('DB_PASSWORD', 'postgres'),
    },
    redis: {
      host: getEnvVar('REDIS_HOST', 'localhost'),
      port: getEnvNumber('REDIS_PORT', 6379),
    },
    port: getEnvNumber('PORT', 3000),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
  };

  // Validate and return typed config
  return validateConfig(rawConfig);
}
