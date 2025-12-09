/**
 * Configuration for analytics service
 */
export interface AnalyticsConfig {
  // For in-memory implementation
  maxEvents?: number;
  
  // For database implementation (future)
  databaseUrl?: string;
}

/**
 * Query event logged when a search is performed
 */
export interface QueryEvent {
  query: string;
  resultCount: number;
  latencyMs: number;
  timestamp: Date;
}

/**
 * Click event logged when a user clicks a search result
 */
export interface ClickEvent {
  query: string;
  docId: string;
  position: number; // Position in search results (0-indexed)
  timestamp: Date;
}

/**
 * Statistics for a specific query
 */
export interface QueryStats {
  query: string;
  totalSearches: number;
  totalClicks: number;
  clickThroughRate: number;
  averageLatencyMs: number;
  averageResultCount: number;
  averageClickPosition: number;
}

/**
 * AnalyticsService tracks and analyzes search usage patterns
 * Implements requirements 11.1-11.5
 * 
 * This is an in-memory implementation that can be replaced with a time-series database
 */
export class AnalyticsService {
  private config: AnalyticsConfig;
  private queryEvents: QueryEvent[];
  private clickEvents: ClickEvent[];

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      maxEvents: 100000,
      ...config,
    };
    this.queryEvents = [];
    this.clickEvents = [];
  }

  /**
   * Logs a query event
   * Requirement 11.1: Log query text, result count, and response time
   * @param query Search query
   * @param resultCount Number of results returned
   * @param latencyMs Query processing time in milliseconds
   */
  logQuery(query: string, resultCount: number, latencyMs: number): void {
    const event: QueryEvent = {
      query,
      resultCount,
      latencyMs,
      timestamp: new Date(),
    };

    this.queryEvents.push(event);

    // Prevent unbounded growth
    if (this.queryEvents.length > this.config.maxEvents!) {
      this.queryEvents.shift(); // Remove oldest event
    }
  }

  /**
   * Logs a click event
   * Requirement 11.2: Record click event with query, result position, and document ID
   * @param query Search query that led to this click
   * @param docId Document ID that was clicked
   * @param position Position of the result in the search results (0-indexed)
   */
  logClick(query: string, docId: string, position: number): void {
    const event: ClickEvent = {
      query,
      docId,
      position,
      timestamp: new Date(),
    };

    this.clickEvents.push(event);

    // Prevent unbounded growth
    if (this.clickEvents.length > this.config.maxEvents!) {
      this.clickEvents.shift(); // Remove oldest event
    }
  }

  /**
   * Calculates click-through rate for a query
   * Requirement 11.3: Calculate and store click-through rate for each query
   * @param query Search query
   * @returns CTR (clicks / searches)
   */
  calculateCTR(query: string): number {
    const searches = this.queryEvents.filter(e => e.query === query).length;
    const clicks = this.clickEvents.filter(e => e.query === query).length;

    if (searches === 0) {
      return 0;
    }

    return clicks / searches;
  }

  /**
   * Gets detailed statistics for a specific query
   * Requirement 11.4: Track response time distribution
   * @param query Search query
   * @returns Query statistics
   */
  getQueryStats(query: string): QueryStats {
    const queryEventsForQuery = this.queryEvents.filter(e => e.query === query);
    const clickEventsForQuery = this.clickEvents.filter(e => e.query === query);

    const totalSearches = queryEventsForQuery.length;
    const totalClicks = clickEventsForQuery.length;

    // Calculate averages
    const averageLatencyMs =
      totalSearches > 0
        ? queryEventsForQuery.reduce((sum, e) => sum + e.latencyMs, 0) / totalSearches
        : 0;

    const averageResultCount =
      totalSearches > 0
        ? queryEventsForQuery.reduce((sum, e) => sum + e.resultCount, 0) / totalSearches
        : 0;

    const averageClickPosition =
      totalClicks > 0
        ? clickEventsForQuery.reduce((sum, e) => sum + e.position, 0) / totalClicks
        : 0;

    const clickThroughRate = this.calculateCTR(query);

    return {
      query,
      totalSearches,
      totalClicks,
      clickThroughRate,
      averageLatencyMs,
      averageResultCount,
      averageClickPosition,
    };
  }

  /**
   * Gets the most popular queries
   * Requirement 11.5: Expose analytics metrics
   * Requirement 11.1: Track query frequency
   * @param limit Maximum number of queries to return
   * @returns Array of popular queries with their search counts
   */
  getPopularQueries(limit: number = 10): Array<{ query: string; count: number }> {
    // Count query frequencies
    const queryCounts = new Map<string, number>();

    for (const event of this.queryEvents) {
      const count = queryCounts.get(event.query) || 0;
      queryCounts.set(event.query, count + 1);
    }

    // Convert to array and sort by count
    const sortedQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count);

    // Return top N
    return sortedQueries.slice(0, limit);
  }

  /**
   * Gets response time distribution statistics
   * Requirement 11.4: Track the distribution of query response times
   * @returns Response time statistics
   */
  getResponseTimeStats(): {
    min: number;
    max: number;
    mean: number;
    median: number;
    p95: number;
    p99: number;
  } {
    if (this.queryEvents.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0 };
    }

    const latencies = this.queryEvents.map(e => e.latencyMs).sort((a, b) => a - b);

    const min = latencies[0];
    const max = latencies[latencies.length - 1];
    const mean = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;

    const getPercentile = (p: number): number => {
      const index = Math.ceil((p / 100) * latencies.length) - 1;
      return latencies[Math.max(0, index)];
    };

    const median = getPercentile(50);
    const p95 = getPercentile(95);
    const p99 = getPercentile(99);

    return { min, max, mean, median, p95, p99 };
  }

  /**
   * Gets overall analytics metrics
   * Requirement 11.5: Expose analytics metrics through a monitoring endpoint
   * @returns Overall analytics metrics
   */
  getOverallMetrics(): {
    totalQueries: number;
    totalClicks: number;
    overallCTR: number;
    uniqueQueries: number;
    responseTimeStats: ReturnType<AnalyticsService['getResponseTimeStats']>;
    popularQueries: ReturnType<AnalyticsService['getPopularQueries']>;
  } {
    const uniqueQueries = new Set(this.queryEvents.map(e => e.query)).size;
    const totalQueries = this.queryEvents.length;
    const totalClicks = this.clickEvents.length;
    const overallCTR = totalQueries > 0 ? totalClicks / totalQueries : 0;

    return {
      totalQueries,
      totalClicks,
      overallCTR,
      uniqueQueries,
      responseTimeStats: this.getResponseTimeStats(),
      popularQueries: this.getPopularQueries(10),
    };
  }

  /**
   * Clears all analytics data
   * WARNING: This is destructive and should only be used for testing
   */
  clear(): void {
    this.queryEvents = [];
    this.clickEvents = [];
  }
}
