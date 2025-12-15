import { SearchResults } from './query-processor';
import * as crypto from 'crypto';

/**
 * Configuration for QueryCache
 */
export interface CacheConfig {
  ttlSeconds?: number; // Time to live for cache entries
  maxSize?: number; // Maximum number of entries (for in-memory cache)
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
}

/**
 * Cache entry with expiration
 */
interface CacheEntry {
  data: SearchResults;
  expiresAt: number;
}

/**
 * QueryCache caches search results to reduce latency and load
 * Implements requirements 8.1-8.5 for query result caching
 *
 * Note: This is an in-memory implementation. For production, use Redis.
 */
export class QueryCache {
  private config: CacheConfig;
  private cache: Map<string, CacheEntry>;
  private accessOrder: string[]; // For LRU eviction
  private stats: { hits: number; misses: number };

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttlSeconds: 300, // 5 minutes default
      maxSize: 1000,
      ...config,
    };
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Generates a cache key from query parameters
   * @param query Search query
   * @param page Page number
   * @param pageSize Page size
   * @returns Cache key
   */
  private generateKey(query: string, page: number, pageSize: number): string {
    const data = `${query}:${page}:${pageSize}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Checks if a cache entry is expired
   * @param entry Cache entry
   * @returns True if expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Updates LRU access order
   * @param key Cache key
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Evicts least recently used entry
   * Requirement 8.4: Evict least recently used entries when cache reaches capacity
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    // Remove least recently used (first in array)
    const keyToEvict = this.accessOrder.shift()!;
    this.cache.delete(keyToEvict);
  }

  /**
   * Gets cached results for a query
   * Requirements 8.1, 8.2: Check cache before processing, return cached results immediately
   * @param query Search query
   * @param page Page number
   * @param pageSize Page size
   * @returns Cached results or undefined if not found/expired
   */
  get(query: string, page: number, pageSize: number): SearchResults | undefined {
    const key = this.generateKey(query, page, pageSize);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    this.stats.hits++;

    // Requirement 8.2: Return cached results immediately
    return entry.data;
  }

  /**
   * Stores search results in cache
   * Requirement 8.3: Store results with configurable TTL
   * @param query Search query
   * @param page Page number
   * @param pageSize Page size
   * @param results Search results to cache
   */
  set(query: string, page: number, pageSize: number, results: SearchResults): void {
    const key = this.generateKey(query, page, pageSize);

    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize! && !this.cache.has(key)) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + this.config.ttlSeconds! * 1000;
    this.cache.set(key, { data: results, expiresAt });
    this.updateAccessOrder(key);
  }

  /**
   * Invalidates cache entries matching a pattern
   * Requirement 8.5: Invalidate affected cache entries when index is updated
   * @param pattern Pattern to match (simple substring match for in-memory implementation)
   */
  invalidate(_pattern: string): void {
    const keysToDelete: string[] = [];

    // For in-memory cache, we'll invalidate all entries
    // In Redis, this would use pattern matching
    for (const key of this.cache.keys()) {
      keysToDelete.push(key);
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Gets cache statistics
   * Requirement 8.2: Track cache hits and misses
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.cache.size,
    };
  }

  /**
   * Resets cache statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }
}
