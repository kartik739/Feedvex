import { TextProcessor } from './text-processor';
import { Indexer } from './indexer';
import { Ranker, ScoredDocument, DocumentStore } from './ranker';
import { Document } from '../models/document';
import { QueryCache } from './query-cache';
import { logger } from '../utils/logger';

/**
 * Configuration for QueryProcessor
 */
export interface QueryConfig {
  defaultPageSize?: number;
  maxPageSize?: number;
  snippetContextLength?: number; // characters before/after query term
  enableCache?: boolean; // whether to use caching
}

/**
 * Search result for a single document
 */
export interface SearchResult {
  docId: string;
  title: string;
  url: string;
  snippet: string;
  score: number;
  metadata: {
    author: string;
    subreddit: string;
    redditScore: number;
    commentCount: number;
    createdUtc: Date;
  };
}

/**
 * Complete search results with pagination metadata
 */
export interface SearchResults {
  results: SearchResult[];
  totalCount: number;
  page: number;
  pageSize: number;
  queryTimeMs: number;
}

/**
 * QueryProcessor handles search queries end-to-end
 * Implements requirements 7.1-7.6 for query processing
 */
export class QueryProcessor {
  private config: QueryConfig;
  private textProcessor: TextProcessor;
  private indexer: Indexer;
  private ranker: Ranker;
  private documentStore: DocumentStore;
  private cache?: QueryCache;

  constructor(
    config: QueryConfig,
    textProcessor: TextProcessor,
    indexer: Indexer,
    ranker: Ranker,
    documentStore: DocumentStore,
    cache?: QueryCache
  ) {
    this.config = {
      defaultPageSize: 10,
      maxPageSize: 100,
      snippetContextLength: 50,
      enableCache: true,
      ...config,
    };
    this.textProcessor = textProcessor;
    this.indexer = indexer;
    this.ranker = ranker;
    this.documentStore = documentStore;
    this.cache = cache;
  }

  /**
   * Processes a search query and returns ranked results
   * Requirements 7.1-7.6: Apply text processing, retrieve documents, rank, paginate, generate snippets
   * Requirements 8.1-8.3: Check cache, return cached results, store results with TTL
   * @param query Search query string
   * @param page Page number (1-indexed)
   * @param pageSize Number of results per page
   * @returns Search results with pagination metadata
   */
  processQuery(query: string, page: number = 1, pageSize?: number): SearchResults {
    const startTime = Date.now();

    // Validate and normalize pagination parameters
    const normalizedPageSize = Math.min(
      pageSize || this.config.defaultPageSize!,
      this.config.maxPageSize!
    );
    const normalizedPage = Math.max(1, page);

    // Requirement 8.1: Check cache before processing
    // Requirement 18.4: Handle cache unavailability gracefully
    if (this.config.enableCache && this.cache) {
      try {
        const cached = this.cache.get(query, normalizedPage, normalizedPageSize);
        if (cached) {
          // Requirement 8.2: Return cached results immediately
          return cached;
        }
      } catch (error) {
        // Cache unavailable - log and continue without cache
        logger.warn('Cache unavailable, continuing without cache', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    // Requirement 7.1: Apply same text processing pipeline as documents
    const processedDoc = this.textProcessor.processDocument({
      id: 'query',
      type: 'post',
      title: '',
      content: query,
      url: '',
      author: '',
      subreddit: '',
      redditScore: 0,
      commentCount: 0,
      createdUtc: new Date(),
      collectedAt: new Date(),
      processed: false,
    });

    const queryTerms = Array.from(processedDoc.uniqueTerms);

    // Requirement 7.2: Retrieve all documents containing at least one query term
    const matchingDocIds = this.getMatchingDocuments(queryTerms);

    // Requirement 7.3: Pass to ranker for scoring
    const scoredDocs = this.ranker.rankDocuments(queryTerms, matchingDocIds);

    // Requirement 7.4: Support pagination
    const totalCount = scoredDocs.length;
    const startIdx = (normalizedPage - 1) * normalizedPageSize;
    const endIdx = startIdx + normalizedPageSize;
    const paginatedDocs = scoredDocs.slice(startIdx, endIdx);

    // Requirement 7.5: Include document metadata for each result
    const results: SearchResult[] = paginatedDocs.map((scoredDoc) => {
      const doc = this.documentStore.getById(scoredDoc.docId);
      if (!doc) {
        throw new Error(`Document ${scoredDoc.docId} not found in store`);
      }

      // Requirement 7.6: Generate snippets with query terms
      const snippet = this.generateSnippet(doc, queryTerms);

      return {
        docId: scoredDoc.docId,
        title: doc.title,
        url: doc.url,
        snippet,
        score: scoredDoc.score,
        metadata: {
          author: doc.author,
          subreddit: doc.subreddit,
          redditScore: doc.redditScore,
          commentCount: doc.commentCount,
          createdUtc: doc.createdUtc,
        },
      };
    });

    const queryTimeMs = Date.now() - startTime;

    const searchResults: SearchResults = {
      results,
      totalCount,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      queryTimeMs,
    };

    // Requirement 8.3: Store results in cache with TTL
    // Requirement 18.4: Handle cache unavailability gracefully
    if (this.config.enableCache && this.cache) {
      try {
        this.cache.set(query, normalizedPage, normalizedPageSize, searchResults);
      } catch (error) {
        // Cache unavailable - log and continue
        logger.warn('Failed to store results in cache', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return searchResults;
  }

  /**
   * Retrieves all documents containing at least one query term
   * Requirement 7.2: Retrieve all documents containing at least one query term from the inverted index
   * @param queryTerms Array of processed query terms
   * @returns Set of document IDs
   */
  getMatchingDocuments(queryTerms: string[]): string[] {
    const docIdSet = new Set<string>();

    for (const term of queryTerms) {
      const postings = this.indexer.getPostings(term);
      for (const posting of postings) {
        docIdSet.add(posting.docId);
      }
    }

    return Array.from(docIdSet);
  }

  /**
   * Generates a snippet for a document containing query terms
   * Requirement 7.6: Extract text fragments containing query terms with surrounding context
   * @param doc Document to generate snippet from
   * @param queryTerms Array of query terms
   * @returns Snippet with highlighted query terms
   */
  generateSnippet(doc: Document, queryTerms: string[]): string {
    const contextLength = this.config.snippetContextLength!;
    const text = `${doc.title} ${doc.content}`;

    // Process the document text to get tokens
    const processedDoc = this.textProcessor.processDocument(doc);

    // Find first occurrence of any query term
    let bestPosition = -1;
    let bestTerm = '';

    for (const token of processedDoc.tokens) {
      if (queryTerms.includes(token.stem)) {
        bestPosition = token.position;
        bestTerm = token.text;
        break;
      }
    }

    // If no query term found, return beginning of content
    if (bestPosition === -1) {
      const maxLength = contextLength * 2;
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    // Find the character position of the token in the original text
    // This is approximate since we don't store exact character positions
    const words = text.split(/\s+/);
    let charPosition = 0;
    for (let i = 0; i < Math.min(bestPosition, words.length); i++) {
      charPosition += words[i].length + 1; // +1 for space
    }

    // Extract context around the term
    const start = Math.max(0, charPosition - contextLength);
    const end = Math.min(text.length, charPosition + bestTerm.length + contextLength);
    
    let snippet = text.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < text.length) {
      snippet = snippet + '...';
    }

    // Highlight query terms (simple approach - wrap in markers)
    for (const term of queryTerms) {
      // Create a case-insensitive regex to find the term
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      snippet = snippet.replace(regex, (match) => `**${match}**`);
    }

    return snippet.trim();
  }
}
