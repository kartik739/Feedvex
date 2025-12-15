import { Indexer } from './indexer';
import { ProcessedDocument, createProcessedDocument } from '../models/document';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Indexer', () => {
  let indexer: Indexer;
  const testIndexPath = path.join(__dirname, '../../test-index.json');

  beforeEach(() => {
    indexer = new Indexer({ indexPath: testIndexPath });
  });

  afterEach(async () => {
    // Clean up test index file
    try {
      await fs.unlink(testIndexPath);
    } catch {
      // File might not exist, ignore error
    }
  });

  describe('indexDocument', () => {
    it('should index a document with term frequencies and positions', () => {
      const doc: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'hello', position: 0, stem: 'hello' },
        { text: 'world', position: 6, stem: 'world' },
        { text: 'hello', position: 12, stem: 'hello' },
      ]);

      indexer.indexDocument(doc);

      // Check hello term (appears twice)
      const helloPostings = indexer.getPostings('hello');
      expect(helloPostings).toHaveLength(1);
      expect(helloPostings[0].docId).toBe('doc1');
      expect(helloPostings[0].termFrequency).toBe(2);
      expect(helloPostings[0].positions).toEqual([0, 12]);

      // Check world term (appears once)
      const worldPostings = indexer.getPostings('world');
      expect(worldPostings).toHaveLength(1);
      expect(worldPostings[0].docId).toBe('doc1');
      expect(worldPostings[0].termFrequency).toBe(1);
      expect(worldPostings[0].positions).toEqual([6]);

      // Check document statistics
      expect(indexer.getTotalDocuments()).toBe(1);
      expect(indexer.getDocumentLength('doc1')).toBe(3);
      expect(indexer.getAverageDocumentLength()).toBe(3);
    });

    it('should handle multiple documents with same terms', () => {
      const doc1: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'machine', position: 0, stem: 'machin' },
        { text: 'learning', position: 8, stem: 'learn' },
      ]);

      const doc2: ProcessedDocument = createProcessedDocument('doc2', [
        { text: 'machine', position: 0, stem: 'machin' },
        { text: 'intelligence', position: 8, stem: 'intellig' },
        { text: 'machine', position: 20, stem: 'machin' },
      ]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);

      // Check machine term appears in both documents
      const machinePostings = indexer.getPostings('machin');
      expect(machinePostings).toHaveLength(2);

      const doc1Posting = machinePostings.find((p) => p.docId === 'doc1');
      expect(doc1Posting?.termFrequency).toBe(1);
      expect(doc1Posting?.positions).toEqual([0]);

      const doc2Posting = machinePostings.find((p) => p.docId === 'doc2');
      expect(doc2Posting?.termFrequency).toBe(2);
      expect(doc2Posting?.positions).toEqual([0, 20]);

      // Check document frequency
      expect(indexer.getDocumentFrequency('machin')).toBe(2);
      expect(indexer.getDocumentFrequency('learn')).toBe(1);
      expect(indexer.getDocumentFrequency('intellig')).toBe(1);

      // Check statistics
      expect(indexer.getTotalDocuments()).toBe(2);
      expect(indexer.getAverageDocumentLength()).toBe(2.5); // (2 + 3) / 2
    });

    it('should handle empty documents', () => {
      const doc: ProcessedDocument = createProcessedDocument('empty-doc', []);

      indexer.indexDocument(doc);

      expect(indexer.getTotalDocuments()).toBe(1);
      expect(indexer.getDocumentLength('empty-doc')).toBe(0);
      expect(indexer.getAverageDocumentLength()).toBe(0);
      expect(indexer.getAllTerms()).toHaveLength(0);
    });
  });

  describe('updateDocument', () => {
    it('should replace existing document entries', () => {
      // Index original document
      const originalDoc: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'old', position: 0, stem: 'old' },
        { text: 'content', position: 4, stem: 'content' },
      ]);
      indexer.indexDocument(originalDoc);

      expect(indexer.getPostings('old')).toHaveLength(1);
      expect(indexer.getPostings('content')).toHaveLength(1);
      expect(indexer.getDocumentLength('doc1')).toBe(2);

      // Update with new content
      const updatedDoc: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'new', position: 0, stem: 'new' },
        { text: 'content', position: 4, stem: 'content' },
        { text: 'added', position: 12, stem: 'add' },
      ]);
      indexer.updateDocument(updatedDoc);

      // Old term should be gone
      expect(indexer.getPostings('old')).toHaveLength(0);

      // Content term should still exist
      expect(indexer.getPostings('content')).toHaveLength(1);

      // New terms should be added
      expect(indexer.getPostings('new')).toHaveLength(1);
      expect(indexer.getPostings('add')).toHaveLength(1);

      // Document length should be updated
      expect(indexer.getDocumentLength('doc1')).toBe(3);
      expect(indexer.getTotalDocuments()).toBe(1);
    });
  });

  describe('removeDocument', () => {
    it('should remove document and clean up terms', () => {
      const doc1: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'shared', position: 0, stem: 'share' },
        { text: 'unique1', position: 7, stem: 'uniqu1' },
      ]);

      const doc2: ProcessedDocument = createProcessedDocument('doc2', [
        { text: 'shared', position: 0, stem: 'share' },
        { text: 'unique2', position: 7, stem: 'uniqu2' },
      ]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);

      expect(indexer.getTotalDocuments()).toBe(2);
      expect(indexer.getDocumentFrequency('share')).toBe(2);
      expect(indexer.getDocumentFrequency('uniqu1')).toBe(1);

      // Remove doc1
      indexer.removeDocument('doc1');

      expect(indexer.getTotalDocuments()).toBe(1);
      expect(indexer.getDocumentFrequency('share')).toBe(1); // Still in doc2
      expect(indexer.getDocumentFrequency('uniqu1')).toBe(0); // Completely removed
      expect(indexer.getDocumentLength('doc1')).toBe(0);
      expect(indexer.getDocumentLength('doc2')).toBe(2);
    });

    it('should remove terms completely when no documents contain them', () => {
      const doc: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'unique', position: 0, stem: 'uniqu' },
      ]);

      indexer.indexDocument(doc);
      expect(indexer.getAllTerms()).toContain('uniqu');

      indexer.removeDocument('doc1');
      expect(indexer.getAllTerms()).not.toContain('uniqu');
      expect(indexer.getTotalDocuments()).toBe(0);
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      // Set up test data
      const doc1: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'machine', position: 0, stem: 'machin' },
        { text: 'learning', position: 8, stem: 'learn' },
      ]);

      const doc2: ProcessedDocument = createProcessedDocument('doc2', [
        { text: 'machine', position: 0, stem: 'machin' },
        { text: 'intelligence', position: 8, stem: 'intellig' },
      ]);

      indexer.indexDocument(doc1);
      indexer.indexDocument(doc2);
    });

    it('should return correct postings for existing terms', () => {
      const postings = indexer.getPostings('machin');
      expect(postings).toHaveLength(2);
      expect(postings.map((p) => p.docId)).toEqual(expect.arrayContaining(['doc1', 'doc2']));
    });

    it('should return empty array for non-existent terms', () => {
      const postings = indexer.getPostings('nonexistent');
      expect(postings).toHaveLength(0);
    });

    it('should return correct document frequency', () => {
      expect(indexer.getDocumentFrequency('machin')).toBe(2);
      expect(indexer.getDocumentFrequency('learn')).toBe(1);
      expect(indexer.getDocumentFrequency('nonexistent')).toBe(0);
    });

    it('should return correct statistics', () => {
      const stats = indexer.getStats();
      expect(stats.totalTerms).toBe(3); // machin, learn, intellig
      expect(stats.totalDocuments).toBe(2);
      expect(stats.averageDocumentLength).toBe(2);
      expect(stats.totalPostings).toBe(4); // machin appears in 2 docs, learn in 1, intellig in 1 = 4 total
    });
  });

  describe('persistence', () => {
    it('should persist and load index correctly', async () => {
      const doc: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'persist', position: 0, stem: 'persist' },
        { text: 'test', position: 8, stem: 'test' },
      ]);

      indexer.indexDocument(doc);
      await indexer.persist();

      // Create new indexer and load
      const newIndexer = new Indexer({ indexPath: testIndexPath });
      await newIndexer.load();

      // Verify data was loaded correctly
      expect(newIndexer.getTotalDocuments()).toBe(1);
      expect(newIndexer.getDocumentFrequency('persist')).toBe(1);
      expect(newIndexer.getDocumentFrequency('test')).toBe(1);
      expect(newIndexer.getDocumentLength('doc1')).toBe(2);

      const postings = newIndexer.getPostings('persist');
      expect(postings).toHaveLength(1);
      expect(postings[0].docId).toBe('doc1');
      expect(postings[0].positions).toEqual([0]);
    });

    it('should handle loading non-existent index file', async () => {
      const newIndexer = new Indexer({ indexPath: 'non-existent-file.json' });
      await newIndexer.load(); // Should not throw

      expect(newIndexer.getTotalDocuments()).toBe(0);
      expect(newIndexer.getAllTerms()).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all index data', () => {
      const doc: ProcessedDocument = createProcessedDocument('doc1', [
        { text: 'test', position: 0, stem: 'test' },
      ]);

      indexer.indexDocument(doc);
      expect(indexer.getTotalDocuments()).toBe(1);

      indexer.clear();
      expect(indexer.getTotalDocuments()).toBe(0);
      expect(indexer.getAllTerms()).toHaveLength(0);
      expect(indexer.getDocumentLength('doc1')).toBe(0);
    });
  });
});
