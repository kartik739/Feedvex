import { Server } from 'http';
import { PostgresClient } from './postgres-client';
import { UpstashCache } from './upstash-cache';
import { logger } from '../utils/logger';

/**
 * GracefulShutdown - handles SIGTERM/SIGINT cleanly.
 *
 * Why graceful shutdown? When Railway redeploys, it sends SIGTERM.
 * Without graceful shutdown, in-flight requests get dropped and
 * database connections leak. We stop accepting new requests, wait
 * for pending ones to finish (up to 30s), then close all connections.
 *
 * This is a common interview question about production readiness.
 */
export class GracefulShutdown {
  private isShuttingDown = false;

  constructor(
    private server: Server,
    private db?: PostgresClient,
    private cache?: UpstashCache
  ) {}

  register(): void {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    logger.info('Graceful shutdown handlers registered');
  }

  async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    const startTime = Date.now();
    logger.info('Graceful shutdown initiated', { signal, timestamp: new Date().toISOString() });

    // Stop accepting new connections
    this.server.close(async () => {
      logger.info('HTTP server closed - no new connections accepted');

      try {
        // Close database connection pool
        if (this.db) {
          await this.db.close();
          logger.info('PostgreSQL connection pool closed');
        }

        // Disconnect from Upstash (no explicit disconnect needed for HTTP client)
        if (this.cache) {
          logger.info('Upstash cache disconnected');
        }

        const duration = Date.now() - startTime;
        logger.info('Graceful shutdown complete', {
          duration,
          timestamp: new Date().toISOString(),
        });
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown cleanup', { error });
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timeout - forcing exit');
      process.exit(1);
    }, 30_000);
  }
}
