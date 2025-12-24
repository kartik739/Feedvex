import { Document } from '../models/document';

/**
 * Configuration for document storage
 */
export interface DocumentStoreConfig {
  // For in-memory implementation
  maxDocuments?: number;

  // For PostgreSQL implementation (future)
  databaseUrl?: string;
  poolSize?: number;
}

/**
 * Filter options for document retrieval
 */
export interface DocumentFilter {
  subreddit?: string;
  type?: 'post' | 'comment';
  startDate?: Date;
  endDate?: Date;
}

/**
 * DocumentStore manages persistent storage of Reddit documents
 * Implements requirements 1.3, 12.1, 12.3
 *
 * This is an in-memory implementation that can be replaced with PostgreSQL
 */
export class DocumentStore {
  private documents: Map<string, Document>;
  private config: DocumentStoreConfig;

  constructor(config: DocumentStoreConfig = {}) {
    this.config = {
      maxDocuments: 100000,
      ...config,
    };
    this.documents = new Map();
  }

  /**
   * Stores a document in the store
   * Requirement 1.3: Check for duplicates before storing
   * Requirement 12.1: Persist documents to durable storage
   * Requirement 12.3: Use atomic write operations
   * @param document Document to store
   * @returns True if document was stored, false if it was a duplicate
   */
  async store(document: Document): Promise<boolean> {
    // Check for duplicate (Requirement 1.3)
    if (this.documents.has(document.id)) {
      return false; // Duplicate, not stored
    }

    // Check if we've reached max capacity
    if (this.documents.size >= this.config.maxDocuments!) {
      throw new Error(`Document store has reached maximum capacity (${this.config.maxDocuments})`);
    }

    // Store document (atomic operation in memory)
    this.documents.set(document.id, document);
    return true;
  }

  /**
   * Stores multiple documents atomically
   * Requirement 12.3: Use atomic write operations
   * @param documents Documents to store
   * @returns Number of documents stored (excluding duplicates)
   */
  async storeMany(documents: Document[]): Promise<number> {
    let stored = 0;

    // In a real database implementation, this would be a transaction
    for (const doc of documents) {
      const wasStored = await this.store(doc);
      if (wasStored) {
        stored++;
      }
    }

    return stored;
  }

  /**
   * Retrieves a document by ID
   * Requirement 12.1: Support document retrieval
   * @param docId Document ID
   * @returns Document or undefined if not found
   */
  getById(docId: string): Document | undefined {
    return this.documents.get(docId);
  }

  /**
   * Retrieves multiple documents by IDs
   * Requirement 12.1: Support document retrieval
   * @param docIds Array of document IDs
   * @returns Map of document ID to document
   */
  getByIds(docIds: string[]): Map<string, Document> {
    const result = new Map<string, Document>();

    for (const docId of docIds) {
      const doc = this.documents.get(docId);
      if (doc) {
        result.set(docId, doc);
      }
    }

    return result;
  }

  /**
   * Retrieves all documents matching the filter
   * Requirement 12.1: Support filtering by subreddit, date range
   * @param filter Filter options
   * @returns Array of matching documents
   */
  getAll(filter?: DocumentFilter): Document[] {
    let results = Array.from(this.documents.values());

    if (!filter) {
      return results;
    }

    // Apply filters
    if (filter.subreddit) {
      results = results.filter((doc) => doc.subreddit === filter.subreddit);
    }

    if (filter.type) {
      results = results.filter((doc) => doc.type === filter.type);
    }

    if (filter.startDate) {
      results = results.filter((doc) => doc.createdUtc >= filter.startDate!);
    }

    if (filter.endDate) {
      results = results.filter((doc) => doc.createdUtc <= filter.endDate!);
    }

    return results;
  }

  /**
   * Updates an existing document
   * Requirement 12.3: Use atomic write operations
   * @param docId Document ID
   * @param updates Partial document with fields to update
   * @returns True if document was updated, false if not found
   */
  async update(docId: string, updates: Partial<Document>): Promise<boolean> {
    const existing = this.documents.get(docId);

    if (!existing) {
      return false;
    }

    // Merge updates with existing document
    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID from being changed
    };

    this.documents.set(docId, updated);
    return true;
  }

  /**
   * Deletes a document by ID
   * @param docId Document ID
   * @returns True if document was deleted, false if not found
   */
  async delete(docId: string): Promise<boolean> {
    return this.documents.delete(docId);
  }

  /**
   * Gets the total number of documents in the store
   * @returns Total document count
   */
  getTotalDocuments(): number {
    return this.documents.size;
  }

  /**
   * Checks if a document exists
   * Requirement 1.3: Duplicate detection
   * @param docId Document ID
   * @returns True if document exists
   */
  exists(docId: string): boolean {
    return this.documents.has(docId);
  }

  /**
   * Clears all documents from the store
   * WARNING: This is destructive and should only be used for testing
   */
  async clear(): Promise<void> {
    this.documents.clear();
  }

  /**
   * Gets statistics about the document store
   * @returns Store statistics
   */
  getStats(): {
    totalDocuments: number;
    postCount: number;
    commentCount: number;
    subreddits: string[];
  } {
    const docs = Array.from(this.documents.values());
    const subreddits = new Set(docs.map((d) => d.subreddit));

    return {
      totalDocuments: docs.length,
      postCount: docs.filter((d) => d.type === 'post').length,
      commentCount: docs.filter((d) => d.type === 'comment').length,
      subreddits: Array.from(subreddits),
    };
  }
}
