import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger';

/**
 * Sentry error tracking integration.
 *
 * Why Sentry? It captures errors with full stack traces, user context,
 * and breadcrumbs. The free tier gives 5K errors/month which is plenty
 * for a portfolio project. Much better than just logging to console.
 */
export function initSentry(dsn?: string, environment: string = 'development'): void {
  if (!dsn) {
    logger.warn('SENTRY_DSN not set - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  });

  logger.info('Sentry initialized', { environment });
}

export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info'): void {
  Sentry.captureMessage(message, level);
}

export function setSentryUser(user: { id: string; email?: string }): void {
  Sentry.setUser(user);
}

export { Sentry };
