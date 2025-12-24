import { logger } from '../utils/logger';

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  timestamp: Date;
  resultCount: number;
}

/**
 * Configuration for SearchHistoryService
 */
export interface SearchHistoryConfig {
  maxEntriesPerUser?: number; // Maximum history entries per user (default: 100)
}

/**
 * Service for managing user search history
 * Implements requirement 18.3: Store, retrieve, and delete user search history
 */
export class SearchHistoryService {
  private history: Map<string, SearchHistoryEntry[]> = new Map();
  private config: Required<SearchHistoryConfig>;

  constructor(config: SearchHistoryConfig = {}) {
    this.config = {
      maxEntriesPerUser: config.maxEntriesPerUser || 100,
    };
  }

  /**
   * Store a search query in user's history
   * Requirement 18.3: Store user search history
   * @param userId User identifier
   * @param query Search query
   * @param resultCount Number of results returned
   * @returns The created history entry
   */
  addEntry(userId: string, query: string, resultCount: number): SearchHistoryEntry {
    const entry: SearchHistoryEntry = {
      id: this.generateId(),
      userId,
      query,
      timestamp: new Date(),
      resultCount,
    };

    // Get or create user's history
    let userHistory = this.history.get(userId);
    if (!userHistory) {
      userHistory = [];
      this.history.set(userId, userHistory);
    }

    // Add entry at the beginning (most recent first)
    userHistory.unshift(entry);

    // Trim to max entries
    if (userHistory.length > this.config.maxEntriesPerUser) {
      userHistory.splice(this.config.maxEntriesPerUser);
    }

    logger.debug('Search history entry added', {
      userId,
      query,
      totalEntries: userHistory.length,
    });

    return entry;
  }

  /**
   * Retrieve user's search history
   * Requirement 18.3: Retrieve history endpoint
   * @param userId User identifier
   * @param limit Maximum number of entries to return (default: 50)
   * @returns Array of search history entries, most recent first
   */
  getHistory(userId: string, limit: number = 50): SearchHistoryEntry[] {
    const userHistory = this.history.get(userId);
    if (!userHistory) {
      return [];
    }

    return userHistory.slice(0, limit);
  }

  /**
   * Delete a specific history entry
   * Requirement 18.3: Delete history endpoint
   * @param userId User identifier
   * @param entryId History entry ID to delete
   * @returns True if entry was deleted, false if not found
   */
  deleteEntry(userId: string, entryId: string): boolean {
    const userHistory = this.history.get(userId);
    if (!userHistory) {
      return false;
    }

    const index = userHistory.findIndex((entry) => entry.id === entryId);
    if (index === -1) {
      return false;
    }

    userHistory.splice(index, 1);

    logger.debug('Search history entry deleted', {
      userId,
      entryId,
      remainingEntries: userHistory.length,
    });

    return true;
  }

  /**
   * Clear all history for a user
   * Requirement 18.3: Delete history endpoint
   * @param userId User identifier
   * @returns Number of entries deleted
   */
  clearHistory(userId: string): number {
    const userHistory = this.history.get(userId);
    if (!userHistory) {
      return 0;
    }

    const count = userHistory.length;
    this.history.delete(userId);

    logger.info('Search history cleared', {
      userId,
      entriesDeleted: count,
    });

    return count;
  }

  /**
   * Get total number of entries for a user
   * @param userId User identifier
   * @returns Number of history entries
   */
  getEntryCount(userId: string): number {
    const userHistory = this.history.get(userId);
    return userHistory ? userHistory.length : 0;
  }

  /**
   * Get statistics about search history
   * @returns Statistics object
   */
  getStats(): {
    totalUsers: number;
    totalEntries: number;
    avgEntriesPerUser: number;
  } {
    const totalUsers = this.history.size;
    let totalEntries = 0;

    for (const userHistory of this.history.values()) {
      totalEntries += userHistory.length;
    }

    return {
      totalUsers,
      totalEntries,
      avgEntriesPerUser: totalUsers > 0 ? totalEntries / totalUsers : 0,
    };
  }

  /**
   * Generate a unique ID for history entries
   * @returns Unique identifier
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
