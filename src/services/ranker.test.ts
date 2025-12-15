import { Ranker, DocumentStore } from './ranker';
import { Indexer } from './indexer';
import { Document } from '../models/document';
import { createProcessedDocument } from '../models/document';

// Mock document store
class MockDocumentStore implements DocumentStore {
  private documents: Map<string, Document> = new Map();

  addDocument(doc: Document): void {
    this.documents.set(doc.id, doc);
  }

  getById(docId: string): Document | undefined {
    return this.documents.get(docId);
  }

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
}

describe('Ranker', () => {
  let indexer: Indexer;
  let documentStore: MockDocumentStore;
  let ranker: Ranker;

  beforeEach(() => {
    indexer = new Indexer();
    documentStore = new MockDocumentStore();
    ranker = new Ranker({}, indexer, documentStore);
  });

  describe('calculateTF', () => {
    it('should return term frequency for a term in a document', () => {
      // Index a document with known term frequencies
      const doc = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 1, stem: 'world' },
        { text: 'hello', position: 2, stem: 'hello' },
      ]);
      indexer.indexDocument(doc);

      expect(ranker.calculateTF('hello', 'doc1')).toBe(2);
      expect(ranker.calculateTF('world', 'doc1')).toBe(1);
      expect(ranker.calculateTF('missing', 'doc1')).toBe(0);
    });

    it('should return 0 for non-existent document', () => {
      expect(ranker.calculateTF('hello', 'nonexistent')).toBe(0);
    });
  });

  describe('calculateIDF', () => {
    it('should calculate IDF correctly', () => {
      // Index multiple documents
      const doc1 = createProcessedDocument('doc1', [{ text: 'hello', position: 0, stem: 'hello' }]);
      const doc2 = createProcessedDocument('doc2', [{ text: 'world', position: 0, stem: 'world' }]);
      const doc3 = createProcessedDocument('doc3', [{ text: 'hello', position: 0, stem: 'hello' }]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);
      indexer.indexDocument(doc3);

      // 'hello' appears in 2 out of 3 documents: log(3/2)
      expect(ranker.calculateIDF('hello')).toBeCloseTo(Math.log(3 / 2));

      // 'world' appears in 1 out of 3 documents: log(3/1)
      expect(ranker.calculateIDF('world')).toBeCloseTo(Math.log(3));

      // 'missing' appears in 0 documents
      expect(ranker.calculateIDF('missing')).toBe(0);
    });

    it('should return 0 when no documents are indexed', () => {
      expect(ranker.calculateIDF('hello')).toBe(0);
    });
  });

  describe('calculateTFIDF', () => {
    it('should calculate TF-IDF as product of TF and IDF', () => {
      const doc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'hello', position: 1, stem: 'hello' },
      ]);
      const doc2 = createProcessedDocument('doc2', [{ text: 'world', position: 0, stem: 'world' }]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);

      const tf = 2; // 'hello' appears 2 times in doc1
      const idf = Math.log(2 / 1); // 'hello' appears in 1 out of 2 documents
      const expectedTFIDF = tf * idf;

      expect(ranker.calculateTFIDF('hello', 'doc1')).toBeCloseTo(expectedTFIDF);
    });
  });

  describe('calculateTotalTFIDF', () => {
    it('should sum TF-IDF scores across multiple query terms', () => {
      const doc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 1, stem: 'world' },
      ]);
      const doc2 = createProcessedDocument('doc2', [{ text: 'hello', position: 0, stem: 'hello' }]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);

      const queryTerms = ['hello', 'world'];
      const totalScore = ranker.calculateTotalTFIDF(queryTerms, 'doc1');

      // Should equal sum of individual TF-IDF scores
      const helloScore = ranker.calculateTFIDF('hello', 'doc1');
      const worldScore = ranker.calculateTFIDF('world', 'doc1');
      expect(totalScore).toBeCloseTo(helloScore + worldScore);
    });
  });

  describe('calculateBM25', () => {
    it('should calculate BM25 score with length normalization', () => {
      const doc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 1, stem: 'world' },
      ]);
      const doc2 = createProcessedDocument('doc2', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'hello', position: 1, stem: 'hello' },
        { text: 'hello', position: 2, stem: 'hello' },
        { text: 'hello', position: 3, stem: 'hello' },
      ]);
      const doc3 = createProcessedDocument('doc3', [{ text: 'world', position: 0, stem: 'world' }]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);
      indexer.indexDocument(doc3);

      const queryTerms = ['hello'];
      const score1 = ranker.calculateBM25(queryTerms, 'doc1');
      const score2 = ranker.calculateBM25(queryTerms, 'doc2');

      // Both scores should be positive
      expect(score1).toBeGreaterThan(0);
      expect(score2).toBeGreaterThan(0);

      // doc2 has higher term frequency but is longer
      // The exact relationship depends on BM25 parameters
      expect(score2).toBeGreaterThan(score1);
    });

    it('should return 0 when average document length is 0', () => {
      const queryTerms = ['hello'];
      expect(ranker.calculateBM25(queryTerms, 'doc1')).toBe(0);
    });
  });

  describe('calculateRecencyScore', () => {
    it('should apply exponential decay based on document age', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const scoreNow = ranker.calculateRecencyScore(now);
      const scoreOneDayAgo = ranker.calculateRecencyScore(oneDayAgo);
      const scoreSevenDaysAgo = ranker.calculateRecencyScore(sevenDaysAgo);

      // More recent documents should have higher scores
      expect(scoreNow).toBeGreaterThan(scoreOneDayAgo);
      expect(scoreOneDayAgo).toBeGreaterThan(scoreSevenDaysAgo);

      // Score should be between 0 and 1
      expect(scoreNow).toBeLessThanOrEqual(1);
      expect(scoreSevenDaysAgo).toBeGreaterThanOrEqual(0);
    });

    it('should handle future dates gracefully', () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const score = ranker.calculateRecencyScore(future);

      // Future dates should have score >= 1
      expect(score).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculatePopularityScore', () => {
    it('should use log scaling for Reddit scores', () => {
      const score1 = ranker.calculatePopularityScore(0);
      const score10 = ranker.calculatePopularityScore(10);
      const score100 = ranker.calculatePopularityScore(100);

      // Higher Reddit scores should have higher popularity scores
      expect(score10).toBeGreaterThan(score1);
      expect(score100).toBeGreaterThan(score10);

      // Log scaling means differences decrease as scores increase
      const diff1 = score10 - score1;
      const diff2 = score100 - score10;
      expect(diff1).toBeGreaterThan(diff2);
    });

    it('should handle negative Reddit scores', () => {
      const score = ranker.calculatePopularityScore(-10);
      // Should not throw and should return a valid number
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should use log scaling for comment counts', () => {
      const score0 = ranker.calculateEngagementScore(0);
      const score10 = ranker.calculateEngagementScore(10);
      const score100 = ranker.calculateEngagementScore(100);

      // Higher comment counts should have higher engagement scores
      expect(score10).toBeGreaterThan(score0);
      expect(score100).toBeGreaterThan(score10);
    });
  });

  describe('rankDocuments', () => {
    beforeEach(() => {
      // Create test documents with different characteristics
      const now = new Date();

      const doc1: Document = {
        id: 'doc1',
        type: 'post',
        title: 'Hello World',
        content: 'hello world hello',
        url: 'http://example.com/1',
        author: 'user1',
        subreddit: 'test',
        redditScore: 100,
        commentCount: 50,
        createdUtc: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        collectedAt: now,
        processed: true,
      };

      const doc2: Document = {
        id: 'doc2',
        type: 'post',
        title: 'Test Post',
        content: 'hello test',
        url: 'http://example.com/2',
        author: 'user2',
        subreddit: 'test',
        redditScore: 10,
        commentCount: 5,
        createdUtc: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        collectedAt: now,
        processed: true,
      };

      documentStore.addDocument(doc1);
      documentStore.addDocument(doc2);

      // Index documents
      const processedDoc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 1, stem: 'world' },
        { text: 'hello', position: 2, stem: 'hello' },
      ]);
      const processedDoc2 = createProcessedDocument('doc2', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'test', position: 1, stem: 'test' },
      ]);

      indexer.indexDocument(processedDoc1);
      indexer.indexDocument(processedDoc2);
    });

    it('should return documents sorted by score in descending order', () => {
      const queryTerms = ['hello'];
      const docIds = ['doc1', 'doc2'];

      const results = ranker.rankDocuments(queryTerms, docIds);

      expect(results).toHaveLength(2);
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    });

    it('should include component scores', () => {
      // Add a third document to make IDF non-zero
      const doc3: Document = {
        id: 'doc3',
        type: 'post',
        title: 'Other Post',
        content: 'other content',
        url: 'http://example.com/3',
        author: 'user3',
        subreddit: 'test',
        redditScore: 5,
        commentCount: 2,
        createdUtc: new Date(),
        collectedAt: new Date(),
        processed: true,
      };
      documentStore.addDocument(doc3);

      const processedDoc3 = createProcessedDocument('doc3', [
        { text: 'other', position: 0, stem: 'other' },
        { text: 'content', position: 1, stem: 'content' },
      ]);
      indexer.indexDocument(processedDoc3);

      const queryTerms = ['hello'];
      const docIds = ['doc1'];

      const results = ranker.rankDocuments(queryTerms, docIds);

      expect(results[0].componentScores).toBeDefined();
      expect(results[0].componentScores!.textRelevance).toBeGreaterThan(0);
      expect(results[0].componentScores!.recency).toBeGreaterThan(0);
      expect(results[0].componentScores!.popularity).toBeGreaterThan(0);
      expect(results[0].componentScores!.engagement).toBeGreaterThan(0);
    });

    it('should skip documents not found in document store', () => {
      const queryTerms = ['hello'];
      const docIds = ['doc1', 'nonexistent'];

      const results = ranker.rankDocuments(queryTerms, docIds);

      expect(results).toHaveLength(1);
      expect(results[0].docId).toBe('doc1');
    });

    it('should use BM25 algorithm by default', () => {
      const queryTerms = ['hello'];
      const docIds = ['doc1'];

      const results = ranker.rankDocuments(queryTerms, docIds);

      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should use TF-IDF algorithm when configured', () => {
      const tfidfRanker = new Ranker({ algorithm: 'tfidf' }, indexer, documentStore);

      const queryTerms = ['hello'];
      const docIds = ['doc1'];

      const results = tfidfRanker.rankDocuments(queryTerms, docIds);

      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should apply configured weights to component scores', () => {
      const customRanker = new Ranker(
        {
          textWeight: 1.0,
          recencyWeight: 0.0,
          popularityWeight: 0.0,
          engagementWeight: 0.0,
        },
        indexer,
        documentStore
      );

      const queryTerms = ['hello'];
      const docIds = ['doc1'];

      const results = customRanker.rankDocuments(queryTerms, docIds);

      // Score should equal text relevance score when other weights are 0
      expect(results[0].score).toBeCloseTo(results[0].componentScores!.textRelevance);
    });
  });
});
