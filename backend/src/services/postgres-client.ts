import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';

/**
 * Configuration for PostgreSQL connection pool
 */
export interface PostgresClientConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  min?: number; // Minimum connections in pool
  max?: number; // Maximum connections in pool
  idleTimeoutMillis?: number; // How long a client can be idle before being closed
  connectionTimeoutMillis?: number; // How long to wait for a connection
}

/**
 * Health status for the PostgreSQL connection
 */
export interface HealthStatus {
  healthy: boolean;
  details: {
    database: 'connected' | 'disconnected';
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
  };
}

/**
 * Configuration for retry logic
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * PostgresClient manages PostgreSQL connections with pooling, transactions, and retry logic
 * Implements requirements 1.1, 1.2, 1.3, 1.5, 1.9, 7.10
 */
export class PostgresClient {
  private pool: Pool | null = null;
  private config: PostgresClientConfig;
  private retryConfig: RetryConfig;
  private isInitialized = false;

  constructor(config: PostgresClientConfig) {
    this.config = {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ...config,
    };

    this.retryConfig = {
      maxAttempts: 5,
      initialDelayMs: 100,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'],
    };
  }

  /**
   * Initializes the connection pool
   * Requirement 1.1: Establish connection pool with configurable min/max connections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('PostgresClient already initialized');
      return;
    }

    try {
      const poolConfig: PoolConfig = {
        connectionString: this.config.connectionString,
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        min: this.config.min,
        max: this.config.max,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
      };

      this.pool = new Pool(poolConfig);

      // Set up error handler for the pool
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle PostgreSQL client', { error: err });
      });

      // Test the connection
      await this.testConnection();

      this.isInitialized = true;
      logger.info('PostgreSQL connection pool initialized', {
        min: this.config.min,
        max: this.config.max,
        database: this.config.database,
      });
    } catch (error) {
      logger.error('Failed to initialize PostgreSQL connection pool', { error });
      throw error;
    }
  }

  /**
   * Tests the database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.pool) {
      throw new Error('Pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      logger.info('PostgreSQL connection test successful');
    } finally {
      client.release();
    }
  }

  /**
   * Executes a query with retry logic
   * Requirement 1.2: Acquire connection from pool
   * Requirement 1.10: Retry connections with exponential backoff
   * Requirement 7.10: Use parameterized queries to prevent SQL injection
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    this.ensureInitialized();

    return this.executeWithRetry(async () => {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const startTime = Date.now();
      try {
        const result = await this.pool.query<T>(text, params);
        const duration = Date.now() - startTime;

        logger.debug('Query executed successfully', {
          duration,
          rowCount: result.rowCount,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Query execution failed', {
          error,
          duration,
          query: text,
        });
        throw error;
      }
    });
  }

  /**
   * Executes a query and returns a single row or null
   * Requirement 1.2: Acquire connection from pool
   */
  async queryOne<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Executes multiple queries in a transaction
   * Requirement 1.5: Use database transactions for atomic operations
   * Requirement 1.9: Wrap write operations in transactions
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    this.ensureInitialized();

    return this.executeWithRetry(async () => {
      if (!this.pool) {
        throw new Error('Pool not initialized');
      }

      const client = await this.pool.connect();
      const startTime = Date.now();

      try {
        await client.query('BEGIN');
        logger.debug('Transaction started');

        const result = await callback(client);

        await client.query('COMMIT');
        const duration = Date.now() - startTime;
        logger.debug('Transaction committed', { duration });

        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        const duration = Date.now() - startTime;
        logger.error('Transaction rolled back', { error, duration });
        throw error;
      } finally {
        client.release();
      }
    });
  }

  /**
   * Executes a function with exponential backoff retry logic
   * Requirement 1.10: Retry connections with exponential backoff up to 5 attempts
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = this.isRetryableError(error);
      const canRetry = attempt < this.retryConfig.maxAttempts;

      if (isRetryable && canRetry) {
        const delay = Math.min(
          this.retryConfig.initialDelayMs *
            Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
          this.retryConfig.maxDelayMs
        );

        logger.warn('Retrying database operation', {
          attempt,
          maxAttempts: this.retryConfig.maxAttempts,
          delayMs: delay,
          error: error.message,
        });

        await this.sleep(delay);
        return this.executeWithRetry(fn, attempt + 1);
      }

      // Not retryable or max attempts reached
      logger.error('Database operation failed after retries', {
        attempt,
        maxAttempts: this.retryConfig.maxAttempts,
        error,
      });
      throw error;
    }
  }

  /**
   * Checks if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorCode = error.code || '';
    const errorMessage = error.message || '';

    // Check if error code is in retryable list
    if (this.retryConfig.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check for connection-related errors in message
    const connectionErrors = [
      'connection',
      'timeout',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNRESET',
    ];

    return connectionErrors.some((keyword) =>
      errorMessage.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Performs a health check on the database connection
   * Requirement 1.8: Verify database connectivity and return connection pool status
   */
  async healthCheck(): Promise<HealthStatus> {
    if (!this.pool || !this.isInitialized) {
      return {
        healthy: false,
        details: {
          database: 'disconnected',
          activeConnections: 0,
          idleConnections: 0,
          waitingRequests: 0,
        },
      };
    }

    try {
      // Test query with timeout
      const startTime = Date.now();
      await this.pool.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      const poolStats = {
        activeConnections: this.pool.totalCount - this.pool.idleCount,
        idleConnections: this.pool.idleCount,
        waitingRequests: this.pool.waitingCount,
      };

      logger.debug('Health check passed', {
        responseTime,
        ...poolStats,
      });

      return {
        healthy: true,
        details: {
          database: 'connected',
          ...poolStats,
        },
      };
    } catch (error) {
      logger.error('Health check failed', { error });
      return {
        healthy: false,
        details: {
          database: 'disconnected',
          activeConnections: 0,
          idleConnections: 0,
          waitingRequests: 0,
        },
      };
    }
  }

  /**
   * Closes all database connections gracefully
   * Requirement 1.4: Close all database connections gracefully on shutdown
   */
  async close(): Promise<void> {
    if (!this.pool) {
      logger.warn('PostgresClient not initialized, nothing to close');
      return;
    }

    try {
      await this.pool.end();
      this.pool = null;
      this.isInitialized = false;
      logger.info('PostgreSQL connection pool closed gracefully');
    } catch (error) {
      logger.error('Error closing PostgreSQL connection pool', { error });
      throw error;
    }
  }

  /**
   * Ensures the client is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.pool) {
      throw new Error('PostgresClient not initialized. Call initialize() first.');
    }
  }

  /**
   * Gets the underlying pool instance (for advanced use cases)
   */
  getPool(): Pool {
    this.ensureInitialized();
    return this.pool!;
  }
}
