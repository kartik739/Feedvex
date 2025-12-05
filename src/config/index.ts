import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  subreddits: string[];
}

export interface CollectorConfig {
  interval: number;
  concurrentRequests: number;
  maxPostsPerSubreddit: number;
}

export interface RankingConfig {
  algorithm: 'tfidf' | 'bm25';
  bm25K1: number;
  bm25B: number;
  textWeight: number;
  recencyWeight: number;
  popularityWeight: number;
  engagementWeight: number;
  recencyDecayDays: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
}

export interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface SystemConfig {
  reddit: RedditConfig;
  collector: CollectorConfig;
  ranking: RankingConfig;
  cache: CacheConfig;
  rateLimiter: RateLimiterConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  port: number;
  nodeEnv: string;
}

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

function validateConfig(config: SystemConfig): void {
  // Validate Reddit config
  if (!config.reddit.clientId || !config.reddit.clientSecret) {
    throw new Error('Reddit API credentials are required');
  }
  if (config.reddit.subreddits.length === 0) {
    throw new Error('At least one subreddit must be configured');
  }

  // Validate ranking weights sum to 1
  const totalWeight =
    config.ranking.textWeight +
    config.ranking.recencyWeight +
    config.ranking.popularityWeight +
    config.ranking.engagementWeight;

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    throw new Error(
      `Ranking weights must sum to 1.0, got ${totalWeight}. ` +
        `Adjust TEXT_WEIGHT, RECENCY_WEIGHT, POPULARITY_WEIGHT, and ENGAGEMENT_WEIGHT.`
    );
  }

  // Validate BM25 parameters
  if (config.ranking.bm25K1 < 0) {
    throw new Error('BM25_K1 must be non-negative');
  }
  if (config.ranking.bm25B < 0 || config.ranking.bm25B > 1) {
    throw new Error('BM25_B must be between 0 and 1');
  }

  // Validate cache config
  if (config.cache.ttl <= 0) {
    throw new Error('CACHE_TTL must be positive');
  }
  if (config.cache.maxSize <= 0) {
    throw new Error('CACHE_MAX_SIZE must be positive');
  }

  // Validate rate limiter config
  if (config.rateLimiter.windowMs <= 0) {
    throw new Error('RATE_LIMIT_WINDOW must be positive');
  }
  if (config.rateLimiter.maxRequests <= 0) {
    throw new Error('RATE_LIMIT_MAX_REQUESTS must be positive');
  }
}

export function loadConfig(): SystemConfig {
  const config: SystemConfig = {
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
      algorithm: getEnvVar('RANKING_ALGORITHM', 'bm25') as 'tfidf' | 'bm25',
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

  validateConfig(config);
  return config;
}
