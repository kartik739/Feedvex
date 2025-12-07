import { QueryProcessor, QueryConfig } from './query-processor';
import { TextProcessor } from './text-processor';
import { Indexer } from './indexer';
import { Ranker, DocumentStore } from './ranker';
import { Document, createProcessedDocument } from '../models/document';

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

describe('QueryProcessor', () => {
  let textProcessor: TextProcessor;
  let indexer: Indexer;
  let documentStore: MockDocumentStore;
  let ranker: Ranker;
  let queryProcessor: QueryProcessor;

  beforeEach(() => {
    textProcessor = new TextProcessor();
    indexer = new Indexer();
    documentStore = new MockDocumentStore();
    ranker = new Ranker({}, indexer, documentStore);
    queryProcessor = new QueryProcessor(
      {},
      textProcessor,
      indexer,
      ranker,
      documentStore
    );
  });

  describe('getMatchingDocuments', () => {
    it('should retrieve all documents containing at least one query term', () => {
      // Index documents
      const doc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 1, stem: 'world' },
      ]);
      const doc2 = createProcessedDocument('doc2', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'test', position: 1, stem: 'test' },
      ]);
      const doc3 = createProcessedDocument('doc3', [
        { text: 'other', position: 0, stem: 'other' },
      ]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);
      indexer.indexDocument(doc3);

      const queryTerms = ['hello'];
      const matchingDocs = queryProcessor.getMatchingDocuments(queryTerms);

      expect(matchingDocs).toHaveLength(2);
      expect(matchingDocs).toContain('doc1');
      expect(matchingDocs).toContain('doc2');
      expect(matchingDocs).not.toContain('doc3');
    });

    it('should return documents matching any query term', () => {
      const doc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
      ]);
      const doc2 = createProcessedDocument('doc2', [
        { text: 'world', position: 0, stem: 'world' },
      ]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);

      const queryTerms = ['hello', 'world'];
      const matchingDocs = queryProcessor.getMatchingDocuments(queryTerms);

      expect(matchingDocs).toHaveLength(2);
      expect(matchingDocs).toContain('doc1');
      expect(matchingDocs).toContain('doc2');
    });

    it('should return empty array when no documents match', () => {
      const doc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
      ]);

      indexer.indexDocument(doc1);

      const queryTerms = ['nonexistent'];
      const matchingDocs = queryProcessor.getMatchingDocuments(queryTerms);

      expect(matchingDocs).toHaveLength(0);
    });

    it('should not return duplicate document IDs', () => {
      const doc1 = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 1, stem: 'world' },
      ]);

      indexer.indexDocument(doc1);

      const queryTerms = ['hello', 'world'];
      const matchingDocs = queryProcessor.getMatchingDocuments(queryTerms);

      expect(matchingDocs).toHaveLength(1);
      expect(matchingDocs).toContain('doc1');
    });
  });

  describe('generateSnippet', () => {
    it('should extract text fragment containing query term', () => {
      const doc: Document = {
        id: 'doc1',
        type: 'post',
        title: 'Test Title',
        content: 'This is a test document with some content about testing',
        url: 'http://example.com',
        author: 'user1',
        subreddit: 'test',
        redditScore: 10,
        commentCount: 5,
        createdUtc: new Date(),
        collectedAt: new Date(),
        processed: true,
      };

      const queryTerms = ['test'];
      const snippet = queryProcessor.generateSnippet(doc, queryTerms);

      expect(snippet).toContain('test');
      expect(snippet.length).toBeGreaterThan(0);
    });

    it('should include surrounding context', () => {
      const doc: Document = {
        id: 'doc1',
        type: 'post',
        title: '',
        content: 'The quick brown fox jumps over the lazy dog',
        url: 'http://example.com',
        author: 'user1',
        subreddit: 'test',
        redditScore: 10,
        commentCount: 5,
        createdUtc: new Date(),
        collectedAt: new Date(),
        processed: true,
      };

      const queryTerms = ['fox'];
      const snippet = queryProcessor.generateSnippet(doc, queryTerms);

      // Should include words before and after 'fox'
      expect(snippet.toLowerCase()).toContain('fox');
    });

    it('should handle query term not found in document', () => {
      const doc: Document = {
        id: 'doc1',
        type: 'post',
        title: 'Test Title',
        content: 'This is some content',
        url: 'http://example.com',
        author: 'user1',
        subreddit: 'test',
        redditScore: 10,
        commentCount: 5,
        createdUtc: new Date(),
        collectedAt: new Date(),
        processed: true,
      };

      const queryTerms = ['nonexistent'];
      const snippet = queryProcessor.generateSnippet(doc, queryTerms);

      // Should return beginning of content
      expect(snippet).toBeTruthy();
      expect(snippet.length).toBeGreaterThan(0);
    });

    it('should add ellipsis when truncating', () => {
      const longContent = 'a '.repeat(200); // Very long content
      const doc: Document = {
        id: 'doc1',
        type: 'post',
        title: '',
        content: longContent + 'important word ' + longContent,
        url: 'http://example.com',
        author: 'user1',
        subreddit: 'test',
        redditScore: 10,
        commentCount: 5,
        createdUtc: new Date(),
        collectedAt: new Date(),
        processed: true,
      };

      const queryTerms = ['import'];
      const snippet = queryProcessor.generateSnippet(doc, queryTerms);

      expect(snippet).toContain('...');
    });
  });

  describe('processQuery', () => {
    beforeEach(() => {
      // Create and index test documents
      const now = new Date();

      const doc1: Document = {
        id: 'doc1',
        type: 'post',
        title: 'Hello World',
        content: 'This is a hello world example',
        url: 'http://example.com/1',
        author: 'user1',
        subreddit: 'test',
        redditScore: 100,
        commentCount: 50,
        createdUtc: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        collectedAt: now,
        processed: true,
      };

      const doc2: Document = {
        id: 'doc2',
        type: 'post',
        title: 'Test Post',
        content: 'Another test document',
        url: 'http://example.com/2',
        author: 'user2',
        subreddit: 'test',
        redditScore: 50,
        commentCount: 25,
        createdUtc: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        collectedAt: now,
        processed: true,
      };

      const doc3: Document = {
        id: 'doc3',
        type: 'post',
        title: 'Third Document',
        content: 'Yet another test',
        url: 'http://example.com/3',
        author: 'user3',
        subreddit: 'test',
        redditScore: 25,
        commentCount: 10,
        createdUtc: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        collectedAt: now,
        processed: true,
      };

      documentStore.addDocument(doc1);
      documentStore.addDocument(doc2);
      documentStore.addDocument(doc3);

      // Index documents
      const processedDoc1 = textProcessor.processDocument(doc1);
      const processedDoc2 = textProcessor.processDocument(doc2);
      const processedDoc3 = textProcessor.processDocument(doc3);

      indexer.indexDocument(processedDoc1);
      indexer.indexDocument(processedDoc2);
      indexer.indexDocument(processedDoc3);
    });

    it('should return search results with all required fields', () => {
      const results = queryProcessor.processQuery('test');

      expect(results.results).toBeDefined();
      expect(results.totalCount).toBeGreaterThan(0);
      expect(results.page).toBe(1);
      expect(results.pageSize).toBe(10);
      expect(results.queryTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return results sorted by relevance', () => {
      const results = queryProcessor.processQuery('test');

      expect(results.results.length).toBeGreaterThan(0);
      
      // Verify scores are in descending order
      for (let i = 0; i < results.results.length - 1; i++) {
        expect(results.results[i].score).toBeGreaterThanOrEqual(
          results.results[i + 1].score
        );
      }
    });

    it('should include document metadata in results', () => {
      const results = queryProcessor.processQuery('test');

      expect(results.results.length).toBeGreaterThan(0);
      
      const result = results.results[0];
      expect(result.docId).toBeDefined();
      expect(result.title).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.snippet).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.author).toBeDefined();
      expect(result.metadata.subreddit).toBeDefined();
      expect(result.metadata.redditScore).toBeDefined();
      expect(result.metadata.commentCount).toBeDefined();
      expect(result.metadata.createdUtc).toBeInstanceOf(Date);
    });

    it('should support pagination', () => {
      const page1 = queryProcessor.processQuery('test', 1, 2);
      const page2 = queryProcessor.processQuery('test', 2, 2);

      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);
      expect(page1.results.length).toBeLessThanOrEqual(2);

      expect(page2.page).toBe(2);
      expect(page2.pageSize).toBe(2);

      // Results should be different
      if (page1.results.length > 0 && page2.results.length > 0) {
        expect(page1.results[0].docId).not.toBe(page2.results[0].docId);
      }
    });

    it('should respect max page size', () => {
      const results = queryProcessor.processQuery('test', 1, 1000);

      expect(results.pageSize).toBeLessThanOrEqual(100);
    });

    it('should handle page numbers less than 1', () => {
      const results = queryProcessor.processQuery('test', 0);

      expect(results.page).toBe(1);
    });

    it('should return empty results for non-matching query', () => {
      const results = queryProcessor.processQuery('nonexistentterm12345');

      expect(results.results).toHaveLength(0);
      expect(results.totalCount).toBe(0);
    });

    it('should apply text processing to query', () => {
      // Query with uppercase and stopwords
      const results = queryProcessor.processQuery('THE TEST');

      // Should still find results because query is processed
      expect(results.totalCount).toBeGreaterThan(0);
    });

    it('should generate snippets for all results', () => {
      const results = queryProcessor.processQuery('test');

      for (const result of results.results) {
        expect(result.snippet).toBeDefined();
        expect(result.snippet.length).toBeGreaterThan(0);
      }
    });
  });

  describe('cache integration', () => {
    beforeEach(() => {
      // Re-setup for cache tests
      const now = new Date();

      const doc1: Document = {
        id: 'doc1',
        type: 'post',
        title: 'Hello World',
        content: 'This is a hello world example',
        url: 'http://example.com/1',
        author: 'user1',
        subreddit: 'test',
        redditScore: 100,
        commentCount: 50,
        createdUtc: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        collectedAt: now,
        processed: true,
      };

      documentStore.addDocument(doc1);
      const processedDoc1 = textProcessor.processDocument(doc1);
      indexer.indexDocument(processedDoc1);
    });

    it('should use cache when available', () => {
      const cache = new (require('./query-cache').QueryCache)();
      const cachedProcessor = new QueryProcessor(
        {},
        textProcessor,
        indexer,
        ranker,
        documentStore,
        cache
      );

      // First query - cache miss
      const results1 = cachedProcessor.processQuery('test');
      
      // Second query - should hit cache
      const results2 = cachedProcessor.processQuery('test');

      expect(results1).toEqual(results2);
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should work without cache', () => {
      const noCacheProcessor = new QueryProcessor(
        { enableCache: false },
        textProcessor,
        indexer,
        ranker,
        documentStore
      );

      const results = noCacheProcessor.processQuery('test');
      expect(results).toBeDefined();
    });
  });
});
