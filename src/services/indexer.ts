import {
  InvertedIndex,
  PostingsList,
  createEmptyIndex,
  calculateAverageDocumentLength,
  serializeIndex,
  deserializeIndex,
  SerializableInvertedIndex,
} from '../models/index';
import { ProcessedDocument } from '../models/document';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Configuration for the Indexer
 */
export interface IndexerConfig {
  // Path where the index should be persisted
  indexPath?: string;
  // Whether to automatically persist changes
  autoPersist?: boolean;
}

/**
 * Indexer builds and maintains an inverted index for fast document retrieval
 * Implements requirements 3.1, 3.2, 3.3, 3.4, 3.5 for index construction and management
 */
export class Indexer {
  private index: InvertedIndex;
  private config: IndexerConfig;

  constructor(config: IndexerConfig = {}) {
    this.config = {
      indexPath: 'index.json',
      autoPersist: false,
      ...config,
    };
    this.index = createEmptyIndex();
  }

  /**
   * Indexes a processed document by building postings lists
   * Requirements 3.1, 3.2, 3.3: Store term frequency and positions for each term-document pair
   * @param document Processed document to index
   */
  indexDocument(document: ProcessedDocument): void {
    const { docId, tokens } = document;

    // Remove existing entries for this document if it exists
    this.removeDocument(docId);

    // Track document length for BM25 calculations
    this.index.documentLengths.set(docId, tokens.length);

    // Build term frequency map and positions for this document
    const termData = new Map<string, { frequency: number; positions: number[] }>();

    // Process each token
    tokens.forEach((token) => {
      const term = token.stem; // Use stemmed form for indexing
      
      if (!termData.has(term)) {
        termData.set(term, { frequency: 0, positions: [] });
      }
      
      const data = termData.get(term)!;
      data.frequency++;
      data.positions.push(token.position);
    });

    // Add postings for each term in this document
    for (const [term, data] of termData.entries()) {
      // Sort positions to ensure they're in ascending order
      data.positions.sort((a, b) => a - b);

      const posting: PostingsList = {
        docId,
        termFrequency: data.frequency,
        positions: data.positions,
      };

      // Add to inverted index
      if (!this.index.termToPostings.has(term)) {
        this.index.termToPostings.set(term, []);
      }
      
      this.index.termToPostings.get(term)!.push(posting);
    }

    // Update document statistics
    this.updateDocumentStatistics();

    // Auto-persist if enabled
    if (this.config.autoPersist) {
      this.persist().catch(console.error);
    }
  }

  /**
   * Updates an existing document by replacing its index entries
   * Requirement 3.4: Update existing index entries rather than creating duplicates
   * @param document Updated processed document
   */
  updateDocument(document: ProcessedDocument): void {
    // Remove existing entries and re-index
    this.indexDocument(document);
  }

  /**
   * Removes a document from the index
   * Requirement 3.4: Clean up entries when documents are removed
   * @param docId Document ID to remove
   */
  removeDocument(docId: string): void {
    // Remove from document lengths
    this.index.documentLengths.delete(docId);

    // Remove postings for this document from all terms
    for (const [term, postings] of this.index.termToPostings.entries()) {
      const filteredPostings = postings.filter(posting => posting.docId !== docId);
      
      if (filteredPostings.length === 0) {
        // No documents left for this term, remove it entirely
        this.index.termToPostings.delete(term);
      } else {
        // Update the postings list
        this.index.termToPostings.set(term, filteredPostings);
      }
    }

    // Update document statistics
    this.updateDocumentStatistics();

    // Auto-persist if enabled
    if (this.config.autoPersist) {
      this.persist().catch(console.error);
    }
  }

  /**
   * Gets postings list for a term
   * Requirement 3.1: Retrieve documents containing specific terms
   * @param term Term to look up
   * @returns Array of postings for the term, or empty array if not found
   */
  getPostings(term: string): PostingsList[] {
    return this.index.termToPostings.get(term) || [];
  }

  /**
   * Gets document frequency for a term (number of documents containing the term)
   * Used for IDF calculation in ranking algorithms
   * @param term Term to look up
   * @returns Number of documents containing the term
   */
  getDocumentFrequency(term: string): number {
    const postings = this.index.termToPostings.get(term);
    return postings ? postings.length : 0;
  }

  /**
   * Gets total number of documents in the index
   * @returns Total document count
   */
  getTotalDocuments(): number {
    return this.index.totalDocuments;
  }

  /**
   * Gets average document length
   * Used for BM25 length normalization
   * @returns Average document length in tokens
   */
  getAverageDocumentLength(): number {
    return this.index.averageDocumentLength;
  }

  /**
   * Gets document length for a specific document
   * @param docId Document ID
   * @returns Document length in tokens, or 0 if not found
   */
  getDocumentLength(docId: string): number {
    return this.index.documentLengths.get(docId) || 0;
  }

  /**
   * Gets all terms in the index
   * @returns Array of all indexed terms
   */
  getAllTerms(): string[] {
    return Array.from(this.index.termToPostings.keys());
  }

  /**
   * Persists the index to disk
   * Requirements 3.5, 12.2: Serialize index to JSON file
   */
  async persist(): Promise<void> {
    if (!this.config.indexPath) {
      throw new Error('No index path configured for persistence');
    }

    const serialized = serializeIndex(this.index);
    const indexDir = path.dirname(this.config.indexPath);
    
    // Ensure directory exists
    await fs.mkdir(indexDir, { recursive: true });
    
    // Write to temporary file first, then rename for atomic operation
    const tempPath = `${this.config.indexPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(serialized, null, 2), 'utf-8');
    await fs.rename(tempPath, this.config.indexPath);
  }

  /**
   * Loads the index from disk
   * Requirements 3.5, 12.2: Restore index from file
   */
  async load(): Promise<void> {
    if (!this.config.indexPath) {
      throw new Error('No index path configured for loading');
    }

    try {
      const data = await fs.readFile(this.config.indexPath, 'utf-8');
      const serialized: SerializableInvertedIndex = JSON.parse(data);
      this.index = deserializeIndex(serialized);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, start with empty index
        this.index = createEmptyIndex();
      } else {
        throw error;
      }
    }
  }

  /**
   * Clears the entire index
   */
  clear(): void {
    this.index = createEmptyIndex();
    
    // Auto-persist if enabled
    if (this.config.autoPersist) {
      this.persist().catch(console.error);
    }
  }

  /**
   * Gets index statistics for monitoring
   */
  getStats(): {
    totalTerms: number;
    totalDocuments: number;
    averageDocumentLength: number;
    totalPostings: number;
  } {
    let totalPostings = 0;
    for (const postings of this.index.termToPostings.values()) {
      totalPostings += postings.length;
    }

    return {
      totalTerms: this.index.termToPostings.size,
      totalDocuments: this.index.totalDocuments,
      averageDocumentLength: this.index.averageDocumentLength,
      totalPostings,
    };
  }

  /**
   * Updates document statistics (total count and average length)
   * Called after adding/removing documents
   */
  private updateDocumentStatistics(): void {
    this.index.totalDocuments = this.index.documentLengths.size;
    this.index.averageDocumentLength = calculateAverageDocumentLength(this.index.documentLengths);
  }
}