import { Indexer } from './indexer';
import { Document } from '../models/document';

/**
 * Configuration for the Ranker
 */
export interface RankingConfig {
  // Ranking algorithm to use
  algorithm?: 'tfidf' | 'bm25';
  // BM25 parameters
  bm25K1?: number; // term saturation (default: 1.5)
  bm25B?: number; // length normalization (default: 0.75)
  // Multi-factor weights
  textWeight?: number; // weight for text relevance score
  recencyWeight?: number; // weight for recency score
  popularityWeight?: number; // weight for popularity score
  engagementWeight?: number; // weight for engagement score
  // Recency decay
  recencyDecayDays?: number; // decay constant for recency scoring
}

/**
 * Scored document with relevance score
 */
export interface ScoredDocument {
  docId: string;
  score: number;
  componentScores?: {
    textRelevance: number;
    recency: number;
    popularity: number;
    engagement: number;
  };
}

/**
 * Document store interface for retrieving document metadata
 */
export interface DocumentStore {
  getById(docId: string): Document | undefined;
  getByIds(docIds: string[]): Map<string, Document>;
}

/**
 * Ranker scores and ranks documents based on relevance and other signals
 * Implements requirements 4.1-4.5 (TF-IDF), 5.1-5.4 (BM25), 6.1-6.5 (Multi-factor)
 */
export class Ranker {
  private config: RankingConfig;
  private indexer: Indexer;
  private documentStore: DocumentStore;

  constructor(
    config: RankingConfig,
    indexer: Indexer,
    documentStore: DocumentStore
  ) {
    this.config = {
      algorithm: 'bm25',
      bm25K1: 1.5,
      bm25B: 0.75,
      textWeight: 0.7,
      recencyWeight: 0.15,
      popularityWeight: 0.10,
      engagementWeight: 0.05,
      recencyDecayDays: 7,
      ...config,
    };
    this.indexer = indexer;
    this.documentStore = documentStore;
  }

  /**
   * Calculates term frequency for a term in a document
   * Requirement 4.1: Compute the frequency of each query term in each matching document
   * @param term Query term
   * @param docId Document ID
   * @returns Term frequency (number of times term appears in document)
   */
  calculateTF(term: string, docId: string): number {
    const postings = this.indexer.getPostings(term);
    const posting = postings.find(p => p.docId === docId);
    return posting ? posting.termFrequency : 0;
  }

  /**
   * Calculates inverse document frequency for a term
   * Requirement 4.2: Compute log(total_documents / documents_containing_term)
   * @param term Query term
   * @returns IDF score
   */
  calculateIDF(term: string): number {
    const totalDocs = this.indexer.getTotalDocuments();
    const docFreq = this.indexer.getDocumentFrequency(term);
    
    if (docFreq === 0 || totalDocs === 0) {
      return 0;
    }
    
    return Math.log(totalDocs / docFreq);
  }

  /**
   * Calculates TF-IDF score for a single term and document
   * Requirement 4.3: Multiply term frequency by inverse document frequency
   * @param term Query term
   * @param docId Document ID
   * @returns TF-IDF score
   */
  calculateTFIDF(term: string, docId: string): number {
    const tf = this.calculateTF(term, docId);
    const idf = this.calculateIDF(term);
    return tf * idf;
  }

  /**
   * Calculates total TF-IDF score for multiple query terms and a document
   * Requirement 4.4: Sum TF-IDF scores across all query terms
   * @param queryTerms Array of query terms
   * @param docId Document ID
   * @returns Total TF-IDF score
   */
  calculateTotalTFIDF(queryTerms: string[], docId: string): number {
    return queryTerms.reduce((sum, term) => {
      return sum + this.calculateTFIDF(term, docId);
    }, 0);
  }

  /**
   * Calculates BM25 score for a document given query terms
   * Requirements 5.1, 5.3: Apply BM25 formula with length normalization
   * Formula: IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLength / avgDocLength))
   * @param queryTerms Array of query terms
   * @param docId Document ID
   * @returns BM25 score
   */
  calculateBM25(queryTerms: string[], docId: string): number {
    const k1 = this.config.bm25K1!;
    const b = this.config.bm25B!;
    const docLength = this.indexer.getDocumentLength(docId);
    const avgDocLength = this.indexer.getAverageDocumentLength();
    
    if (avgDocLength === 0) {
      return 0;
    }
    
    let score = 0;
    
    for (const term of queryTerms) {
      const tf = this.calculateTF(term, docId);
      const idf = this.calculateIDF(term);
      
      // BM25 formula
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
      
      score += idf * (numerator / denominator);
    }
    
    return score;
  }

  /**
   * Calculates recency score based on document age
   * Requirement 6.2: Apply exponential decay based on document age
   * @param timestamp Document creation timestamp
   * @returns Recency score (0-1)
   */
  calculateRecencyScore(timestamp: Date): number {
    const now = new Date();
    const ageInMs = now.getTime() - timestamp.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    const decayConstant = this.config.recencyDecayDays!;
    
    // Exponential decay: exp(-age / decay_constant)
    return Math.exp(-ageInDays / decayConstant);
  }

  /**
   * Calculates popularity score based on Reddit score
   * Requirement 6.3: Incorporate Reddit score (upvotes minus downvotes)
   * @param redditScore Reddit score (upvotes - downvotes)
   * @returns Popularity score (normalized)
   */
  calculatePopularityScore(redditScore: number): number {
    // Use log scaling to handle wide range of scores
    // Add 1 to handle negative scores and zero
    return Math.log(1 + Math.max(0, redditScore));
  }

  /**
   * Calculates engagement score based on comment count
   * Requirement 6.4: Incorporate comment count as a signal
   * @param commentCount Number of comments
   * @returns Engagement score (normalized)
   */
  calculateEngagementScore(commentCount: number): number {
    // Use log scaling for comment counts
    return Math.log(1 + commentCount);
  }

  /**
   * Ranks documents using the configured algorithm and multi-factor scoring
   * Requirements 4.5, 5.4, 6.1, 6.5: Combine scores and sort by relevance
   * @param queryTerms Array of query terms
   * @param docIds Array of document IDs to rank
   * @returns Array of scored documents sorted by score (descending)
   */
  rankDocuments(queryTerms: string[], docIds: string[]): ScoredDocument[] {
    const scoredDocs: ScoredDocument[] = [];
    
    // Get document metadata for all documents
    const documents = this.documentStore.getByIds(docIds);
    
    for (const docId of docIds) {
      const doc = documents.get(docId);
      if (!doc) {
        continue; // Skip if document not found
      }
      
      // Calculate text relevance score
      let textRelevance: number;
      if (this.config.algorithm === 'bm25') {
        textRelevance = this.calculateBM25(queryTerms, docId);
      } else {
        textRelevance = this.calculateTotalTFIDF(queryTerms, docId);
      }
      
      // Calculate other signals
      const recency = this.calculateRecencyScore(doc.createdUtc);
      const popularity = this.calculatePopularityScore(doc.redditScore);
      const engagement = this.calculateEngagementScore(doc.commentCount);
      
      // Combine scores with weights (Requirement 6.5)
      const finalScore =
        this.config.textWeight! * textRelevance +
        this.config.recencyWeight! * recency +
        this.config.popularityWeight! * popularity +
        this.config.engagementWeight! * engagement;
      
      scoredDocs.push({
        docId,
        score: finalScore,
        componentScores: {
          textRelevance,
          recency,
          popularity,
          engagement,
        },
      });
    }
    
    // Sort by score in descending order (Requirement 4.5, 5.4)
    scoredDocs.sort((a, b) => b.score - a.score);
    
    return scoredDocs;
  }
}
