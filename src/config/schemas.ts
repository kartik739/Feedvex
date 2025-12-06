import { z } from 'zod';

/**
 * Zod schemas for configuration validation
 * Provides runtime type checking and detailed error messages
 */

// Reddit API configuration schema
export const RedditConfigSchema = z.object({
  clientId: z.string().min(1, 'Reddit client ID is required'),
  clientSecret: z.string().min(1, 'Reddit client secret is required'),
  userAgent: z.string().min(1, 'User agent is required'),
  subreddits: z
    .array(z.string().min(1))
    .min(1, 'At least one subreddit must be configured')
    .describe('List of subreddits to collect from'),
});

// Data collection configuration schema
export const CollectorConfigSchema = z.object({
  interval: z.number().positive('Collection interval must be positive'),
  concurrentRequests: z
    .number()
    .int()
    .positive('Concurrent requests must be a positive integer')
    .max(20, 'Concurrent requests should not exceed 20 to avoid rate limiting'),
  maxPostsPerSubreddit: z
    .number()
    .int()
    .positive('Max posts per subreddit must be a positive integer')
    .max(1000, 'Max posts per subreddit should not exceed 1000'),
});

// Ranking algorithm configuration schema
export const RankingConfigSchema = z
  .object({
    algorithm: z.enum(['tfidf', 'bm25']),
    bm25K1: z
      .number()
      .nonnegative('BM25 k1 parameter must be non-negative')
      .max(3, 'BM25 k1 parameter typically ranges from 1.2 to 2.0'),
    bm25B: z
      .number()
      .min(0, 'BM25 b parameter must be between 0 and 1')
      .max(1, 'BM25 b parameter must be between 0 and 1'),
    textWeight: z.number().nonnegative('Text weight must be non-negative'),
    recencyWeight: z.number().nonnegative('Recency weight must be non-negative'),
    popularityWeight: z.number().nonnegative('Popularity weight must be non-negative'),
    engagementWeight: z.number().nonnegative('Engagement weight must be non-negative'),
    recencyDecayDays: z.number().positive('Recency decay days must be positive'),
  })
  .refine(
    (data) => {
      const total =
        data.textWeight + data.recencyWeight + data.popularityWeight + data.engagementWeight;
      return Math.abs(total - 1.0) < 0.01;
    },
    {
      message:
        'Ranking weights (text, recency, popularity, engagement) must sum to 1.0. ' +
        'Adjust TEXT_WEIGHT, RECENCY_WEIGHT, POPULARITY_WEIGHT, and ENGAGEMENT_WEIGHT.',
    }
  );

// Cache configuration schema
export const CacheConfigSchema = z.object({
  ttl: z.number().positive('Cache TTL must be positive'),
  maxSize: z.number().int().positive('Cache max size must be a positive integer'),
});

// Rate limiter configuration schema
export const RateLimiterConfigSchema = z.object({
  windowMs: z.number().positive('Rate limit window must be positive'),
  maxRequests: z.number().int().positive('Max requests must be a positive integer'),
});

// Database configuration schema
export const DatabaseConfigSchema = z.object({
  host: z.string().min(1, 'Database host is required'),
  port: z.number().int().positive('Database port must be a positive integer').max(65535),
  database: z.string().min(1, 'Database name is required'),
  user: z.string().min(1, 'Database user is required'),
  password: z.string().min(1, 'Database password is required'),
});

// Redis configuration schema
export const RedisConfigSchema = z.object({
  host: z.string().min(1, 'Redis host is required'),
  port: z.number().int().positive('Redis port must be a positive integer').max(65535),
});

// System configuration schema (combines all sub-schemas)
export const SystemConfigSchema = z.object({
  reddit: RedditConfigSchema,
  collector: CollectorConfigSchema,
  ranking: RankingConfigSchema,
  cache: CacheConfigSchema,
  rateLimiter: RateLimiterConfigSchema,
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  port: z.number().int().positive('Server port must be a positive integer').max(65535),
  nodeEnv: z.enum(['development', 'production', 'test']),
});

// Export TypeScript types inferred from Zod schemas
export type RedditConfig = z.infer<typeof RedditConfigSchema>;
export type CollectorConfig = z.infer<typeof CollectorConfigSchema>;
export type RankingConfig = z.infer<typeof RankingConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type RateLimiterConfig = z.infer<typeof RateLimiterConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type SystemConfig = z.infer<typeof SystemConfigSchema>;
