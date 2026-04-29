import { z } from 'zod';

/**
 * Environment variable validation schema using Zod.
 * Validates all required env vars at startup - fails fast with clear errors.
 *
 * Why Zod? TypeScript only checks types at compile time.
 * Zod validates at runtime, catching missing env vars before they cause silent failures.
 */
export const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database (Railway PostgreSQL)
  DATABASE_URL: z.string().url().optional(),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432').transform(Number),
  POSTGRES_DB: z.string().default('feedvex'),
  POSTGRES_USER: z.string().default('feedvex'),
  POSTGRES_PASSWORD: z.string().default(''),

  // Redis (Upstash)
  REDIS_URL: z.string().optional(),

  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Reddit OAuth
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USER_AGENT: z.string().default('FeedVex/1.0.0'),

  // Resend Email
  RESEND_API_KEY: z.string().optional(),

  // Trigger.dev
  TRIGGER_API_KEY: z.string().optional(),
  TRIGGER_API_URL: z.string().default('https://api.trigger.dev'),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // CORS
  CORS_ORIGINS: z.string().default('*'),

  // Security (legacy - Clerk handles auth now)
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at startup.
 * Logs clear errors and exits with code 1 if validation fails.
 * Masks sensitive values in logs (shows only first 4 chars).
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ Environment validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('\nCheck your .env file and make sure all required variables are set.\n');
    process.exit(1);
  }

  const env = result.data;

  // Log which services are configured (mask sensitive values)
  const mask = (val?: string) => (val ? `${val.slice(0, 4)}****` : 'not set');

  console.log('✅ Environment validated:');
  console.log(`  NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  CLERK_SECRET_KEY: ${mask(env.CLERK_SECRET_KEY)}`);
  console.log(`  DATABASE_URL: ${env.DATABASE_URL ? 'set' : 'using individual params'}`);
  console.log(`  REDIS_URL: ${env.REDIS_URL ? 'set' : 'not set (cache disabled)'}`);
  console.log(`  RESEND_API_KEY: ${mask(env.RESEND_API_KEY)}`);
  console.log(`  TRIGGER_API_KEY: ${mask(env.TRIGGER_API_KEY)}`);
  console.log(`  SENTRY_DSN: ${env.SENTRY_DSN ? 'set' : 'not set'}`);

  return env;
}
