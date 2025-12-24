import { z } from 'zod';

/**
 * Zod schemas for configuration validation
 * Provides runtime type checking and detailed error messages
 */

// Reddit API configuration schema
export const RedditConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  userAgent: z.string().min(1, 'User agent is required'),
  subreddits: z
    .array(z.string().min(1))
    .min(1, 'At least one subreddit must be configured')
    .describe('List of subreddits to collect from'),
  maxPostsPerSubreddit: z.number().int().positive().default(100),
  collectionIntervalHours: z.number().positive().default(6),
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
    bm25K1: z.number().nonnegative('BM25 k1 parameter must be non-negative'),
    bm25B: z.number().min(0).max(1, 'BM25 b parameter must be between 0 and 1'),
    textWeight: z.number().nonnegative('Text weight must be non-negative'),
    recencyWeight: z.number().nonnegative('Recency weight must be non-negative'),
    popularityWeight: z.number().nonnegative('Popularity weight must be non-negative'),
    engagementWeight: z.number().nonnegative('Engagement weight must be non-negative'),
    relevanceWeight: z.number().nonnegative('Relevance weight must be non-negative'),
    recencyDecayDays: z.number().positive('Recency decay days must be positive'),
  })
  .refine(
    (data) => {
      const sum =
        data.textWeight +
        data.recencyWeight +
        data.popularityWeight +
        data.engagementWeight +
        data.relevanceWeight;
      return Math.abs(sum - 1.0) < 0.0001; // Allow for floating point precision
    },
    {
      message: 'Ranking weights (text, recency, popularity, engagement, relevance) must sum to 1.0',
    }
  );

// Redis configuration schema
export const RedisConfigSchema = z.object({
  host: z.string().min(1, 'Redis host is required'),
  port: z.number().int().positive('Redis port must be a positive integer').max(65535),
  password: z.string().optional(),
});

// PostgreSQL configuration schema
export const PostgresConfigSchema = z.object({
  host: z.string().min(1, 'Database host is required'),
  port: z.number().int().positive('Database port must be a positive integer').max(65535),
  database: z.string().min(1, 'Database name is required'),
  user: z.string().min(1, 'Database user is required'),
  password: z.string().min(1, 'Database password is required'),
});

// Security configuration schema
export const SecurityConfigSchema = z.object({
  jwtSecret: z.string().min(1, 'JWT secret is required'),
  sessionSecret: z.string().min(1, 'Session secret is required'),
});

// CORS configuration schema
export const CorsConfigSchema = z.object({
  origins: z.string(),
});

// Cache configuration schema (updated)
export const CacheConfigSchema = z.object({
  ttlSeconds: z.number().positive('Cache TTL must be positive'),
  maxSize: z.number().int().positive('Cache max size must be a positive integer'),
});

// Rate limiter configuration schema (updated)
export const RateLimitConfigSchema = z.object({
  windowMs: z.number().positive('Rate limit window must be positive'),
  maxRequests: z.number().int().positive('Max requests must be a positive integer'),
});

// System configuration schema (combines all sub-schemas)
export const SystemConfigSchema = z.object({
  reddit: RedditConfigSchema,
  collector: CollectorConfigSchema,
  ranking: RankingConfigSchema,
  cache: CacheConfigSchema,
  rateLimit: RateLimitConfigSchema,
  postgres: PostgresConfigSchema,
  redis: RedisConfigSchema,
  security: SecurityConfigSchema,
  cors: CorsConfigSchema,
  port: z.number().int().positive('Server port must be a positive integer').max(65535),
  nodeEnv: z.enum(['development', 'production', 'test']),
});

// Export TypeScript types inferred from Zod schemas
export type RedditConfig = z.infer<typeof RedditConfigSchema>;
export type CollectorConfig = z.infer<typeof CollectorConfigSchema>;
export type RankingConfig = z.infer<typeof RankingConfigSchema>;
export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type PostgresConfig = z.infer<typeof PostgresConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
export type CorsConfig = z.infer<typeof CorsConfigSchema>;
export type SystemConfig = z.infer<typeof SystemConfigSchema>;
