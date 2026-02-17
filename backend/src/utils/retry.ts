import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterMs?: number;
  isRetryable?: (error: Error) => boolean;
}

/**
 * Retries an async function with exponential backoff + jitter.
 *
 * Why exponential backoff? If a service is struggling, hammering it
 * with retries makes it worse. Backoff gives it time to recover.
 * Jitter (random 0-50ms) prevents thundering herd - multiple clients
 * all retrying at exactly the same time.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 2000,
    jitterMs = 50,
    isRetryable = isTransientError,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) logger.info('Retry succeeded', { attempt });
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryable(lastError)) throw lastError;
      if (attempt === maxAttempts) break;

      const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = Math.random() * jitterMs;
      const totalDelay = Math.round(delay + jitter);

      logger.warn('Retrying after error', { attempt, maxAttempts, delayMs: totalDelay, error: lastError.message });
      await new Promise((r) => setTimeout(r, totalDelay));
    }
  }

  logger.error('All retries exhausted', { maxAttempts, error: lastError.message });
  throw lastError;
}

function isTransientError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  const transientKeywords = ['econnrefused', 'etimedout', 'enotfound', 'econnreset', 'connection', 'timeout', 'network', '503', '502', '504'];
  return transientKeywords.some((k) => msg.includes(k));
}
