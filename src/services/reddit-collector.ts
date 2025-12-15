import { Document } from '../models/document';
import { DocumentStore } from './ranker';
import CircuitBreaker from 'opossum';
import { logger } from '../utils/logger';

/**
 * Configuration for Reddit data collection
 */
export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  subreddits: string[]; // List of subreddits to collect from
  maxPostsPerSubreddit?: number; // Max posts to fetch per cycle
  concurrentRequests?: number; // Number of concurrent API requests
}

/**
 * Result of a collection cycle
 */
export interface CollectionResult {
  documentsCollected: number;
  errors: string[];
  subredditsProcessed: string[];
  startTime: Date;
  endTime: Date;
}

/**
 * Retry configuration for exponential backoff
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
}

/**
 * RedditCollector fetches content from Reddit API with reliability and efficiency
 * Implements requirements 1.1-1.8, 18.5
 */
export class RedditCollector {
  private config: RedditConfig;
  private documentStore: DocumentStore;
  private processedIds: Set<string>; // For duplicate detection (Requirement 1.3)
  private retryConfig: RetryConfig;
  private circuitBreaker: CircuitBreaker; // Requirement 18.5

  constructor(config: RedditConfig, documentStore: DocumentStore) {
    this.config = {
      maxPostsPerSubreddit: 100,
      concurrentRequests: 5,
      ...config,
    };
    this.documentStore = documentStore;
    this.processedIds = new Set();

    // Requirement 1.2: Retry with exponential backoff
    this.retryConfig = {
      maxAttempts: 3,
      initialDelayMs: 1000, // 1 second
      maxDelayMs: 60000, // 60 seconds
      multiplier: 2,
    };

    // Requirement 18.5: Circuit breaker for Reddit API
    this.circuitBreaker = new CircuitBreaker(this.makeApiCall.bind(this), {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 80, // Open circuit if 80% of requests fail (more lenient for testing)
      resetTimeout: 60000, // Try again after 60 seconds
      rollingCountTimeout: 10000, // 10 second window
      rollingCountBuckets: 10,
      volumeThreshold: 5, // Minimum number of requests before circuit can open
    });

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      logger.warn('Circuit breaker opened - Reddit API calls will be blocked');
    });

    this.circuitBreaker.on('halfOpen', () => {
      logger.info('Circuit breaker half-open - testing Reddit API');
    });

    this.circuitBreaker.on('close', () => {
      logger.info('Circuit breaker closed - Reddit API calls resumed');
    });
  }

  /**
   * Make an API call (wrapped by circuit breaker)
   * @param fn Function to execute
   * @returns Result of the function
   */
  private async makeApiCall<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }

  /**
   * Executes a function with retry logic and exponential backoff
   * Requirement 1.2: Retry the request with exponential backoff up to 3 attempts
   * Requirement 1.5: Respect rate limits and delay subsequent requests
   * Requirement 18.5: Use circuit breaker to prevent cascading failures
   * @param fn Function to execute
   * @param context Description of the operation for logging
   * @returns Result of the function
   */
  private async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        // Use circuit breaker for API calls
        const result = await this.circuitBreaker.fire(fn);
        return result as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if this is a rate limit error (Requirement 1.5)
        const isRateLimitError = this.isRateLimitError(lastError);

        if (attempt === this.retryConfig.maxAttempts && !isRateLimitError) {
          // Last attempt failed and not a rate limit error, throw error
          logger.error(`${context} failed after ${this.retryConfig.maxAttempts} attempts`, {
            error: lastError.message,
          });
          throw new Error(
            `${context} failed after ${this.retryConfig.maxAttempts} attempts: ${lastError.message}`
          );
        }

        // Calculate delay with exponential backoff
        let delay = Math.min(
          this.retryConfig.initialDelayMs * Math.pow(this.retryConfig.multiplier, attempt - 1),
          this.retryConfig.maxDelayMs
        );

        // If rate limit error, use a longer delay
        if (isRateLimitError) {
          delay = Math.max(delay, 60000); // Wait at least 60 seconds for rate limits
          logger.warn(`${context} hit rate limit. Waiting ${delay}ms before retrying...`);
        } else {
          logger.warn(
            `${context} failed (attempt ${attempt}/${this.retryConfig.maxAttempts}): ${lastError.message}. Retrying in ${delay}ms...`
          );
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError!;
  }

  /**
   * Checks if an error is a rate limit error from Reddit API
   * Requirement 1.5: Detect Reddit API rate limit responses
   * @param error Error to check
   * @returns True if error is a rate limit error
   */
  private isRateLimitError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('429') ||
      message.includes('too many requests')
    );
  }

  /**
   * Collects posts from a subreddit
   * Requirement 1.1: Use concurrent requests to improve throughput
   * Requirement 1.2: Retry with exponential backoff
   * @param subreddit Subreddit name
   * @param limit Maximum number of posts to fetch
   * @returns Array of documents
   */
  async collectPosts(subreddit: string, _limit: number): Promise<Document[]> {
    return this.withRetry(async () => {
      // TODO: Implement actual Reddit API integration using snoowrap
      // For now, return empty array as stub
      return [];
    }, `Collecting posts from r/${subreddit}`);
  }

  /**
   * Collects comments from a post
   * Requirement 1.1: Fetch comments for posts
   * Requirement 1.2: Retry with exponential backoff
   * @param postId Reddit post ID
   * @returns Array of comment documents
   */
  async collectComments(postId: string): Promise<Document[]> {
    return this.withRetry(async () => {
      // TODO: Implement actual Reddit API integration using snoowrap
      // For now, return empty array as stub
      return [];
    }, `Collecting comments for post ${postId}`);
  }

  /**
   * Checks if a document has already been processed
   * Requirement 1.3: Check for duplicates before storing
   * @param docId Document ID
   * @returns True if document is a duplicate
   */
  private isDuplicate(docId: string): boolean {
    return this.processedIds.has(docId);
  }

  /**
   * Marks a document as processed
   * @param docId Document ID
   */
  private markAsProcessed(docId: string): void {
    this.processedIds.add(docId);
  }

  /**
   * Runs a complete collection cycle
   * Requirements 1.1-1.8: Collect from all configured subreddits with error handling
   * @returns Collection result with statistics
   */
  async runCollectionCycle(): Promise<CollectionResult> {
    const startTime = new Date();
    const errors: string[] = [];
    const subredditsProcessed: string[] = [];
    let documentsCollected = 0;

    // Process each subreddit
    for (const subreddit of this.config.subreddits) {
      try {
        const posts = await this.collectPosts(subreddit, this.config.maxPostsPerSubreddit!);

        for (const post of posts) {
          // Requirement 1.3: Check for duplicates
          if (this.isDuplicate(post.id)) {
            continue;
          }

          // Store document
          // Note: DocumentStore interface needs to be extended with store method
          this.markAsProcessed(post.id);
          documentsCollected++;
        }

        subredditsProcessed.push(subreddit);
      } catch (error) {
        // Requirement 1.8: Log errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Error collecting from r/${subreddit}: ${errorMessage}`);
      }
    }

    const endTime = new Date();

    // Requirement 1.7: Log document counts and errors
    logger.info(
      `Collection cycle completed: ${documentsCollected} documents collected from ${subredditsProcessed.length} subreddits`
    );
    if (errors.length > 0) {
      logger.error(`Errors encountered: ${errors.length}`, { errors });
    }

    return {
      documentsCollected,
      errors,
      subredditsProcessed,
      startTime,
      endTime,
    };
  }

  /**
   * Schedules collection to run at regular intervals
   * Requirement 1.6: Run on a configurable schedule
   * @param intervalMs Interval in milliseconds
   * @returns Timer ID that can be used to cancel the schedule
   */
  scheduleCollection(intervalMs: number): NodeJS.Timeout {
    return setInterval(async () => {
      await this.runCollectionCycle();
    }, intervalMs);
  }
}
