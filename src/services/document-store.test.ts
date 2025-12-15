import { DocumentStore, DocumentFilter } from './document-store';
import { Document } from '../models/document';

describe('DocumentStore', () => {
  let store: DocumentStore;
  let sampleDoc: Document;

  beforeEach(() => {
    store = new DocumentStore();
    sampleDoc = {
      id: 'doc-1',
      type: 'post',
      title: 'Test Post',
      content: 'This is test content',
      url: 'https://reddit.com/r/test/comments/abc123',
      author: 'testuser',
      subreddit: 'test',
      redditScore: 42,
      commentCount: 10,
      createdUtc: new Date('2024-01-15T10:00:00Z'),
      collectedAt: new Date('2024-01-15T10:05:00Z'),
      processed: false,
    };
  });

  describe('store', () => {
    it('should store a new document', async () => {
      const result = await store.store(sampleDoc);
      expect(result).toBe(true);
      expect(store.getTotalDocuments()).toBe(1);
    });

    it('should reject duplicate documents', async () => {
      await store.store(sampleDoc);
      const result = await store.store(sampleDoc);
      expect(result).toBe(false);
      expect(store.getTotalDocuments()).toBe(1);
    });

    it('should throw error when max capacity is reached', async () => {
      const smallStore = new DocumentStore({ maxDocuments: 2 });

      await smallStore.store({ ...sampleDoc, id: 'doc-1' });
      await smallStore.store({ ...sampleDoc, id: 'doc-2' });

      await expect(smallStore.store({ ...sampleDoc, id: 'doc-3' })).rejects.toThrow(
        'maximum capacity'
      );
    });
  });

  describe('storeMany', () => {
    it('should store multiple documents', async () => {
      const docs: Document[] = [
        { ...sampleDoc, id: 'doc-1' },
        { ...sampleDoc, id: 'doc-2' },
        { ...sampleDoc, id: 'doc-3' },
      ];

      const stored = await store.storeMany(docs);
      expect(stored).toBe(3);
      expect(store.getTotalDocuments()).toBe(3);
    });

    it('should skip duplicates when storing many', async () => {
      const docs: Document[] = [
        { ...sampleDoc, id: 'doc-1' },
        { ...sampleDoc, id: 'doc-1' }, // Duplicate
        { ...sampleDoc, id: 'doc-2' },
      ];

      const stored = await store.storeMany(docs);
      expect(stored).toBe(2);
      expect(store.getTotalDocuments()).toBe(2);
    });
  });

  describe('getById', () => {
    it('should retrieve document by ID', async () => {
      await store.store(sampleDoc);
      const retrieved = store.getById('doc-1');
      expect(retrieved).toEqual(sampleDoc);
    });

    it('should return undefined for non-existent ID', () => {
      const retrieved = store.getById('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getByIds', () => {
    it('should retrieve multiple documents by IDs', async () => {
      const docs: Document[] = [
        { ...sampleDoc, id: 'doc-1' },
        { ...sampleDoc, id: 'doc-2' },
        { ...sampleDoc, id: 'doc-3' },
      ];

      await store.storeMany(docs);

      const retrieved = store.getByIds(['doc-1', 'doc-3']);
      expect(retrieved.size).toBe(2);
      expect(retrieved.get('doc-1')).toEqual(docs[0]);
      expect(retrieved.get('doc-3')).toEqual(docs[2]);
    });

    it('should skip non-existent IDs', async () => {
      await store.store(sampleDoc);
      const retrieved = store.getByIds(['doc-1', 'non-existent']);
      expect(retrieved.size).toBe(1);
      expect(retrieved.get('doc-1')).toEqual(sampleDoc);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const docs: Document[] = [
        {
          ...sampleDoc,
          id: 'doc-1',
          type: 'post',
          subreddit: 'programming',
          createdUtc: new Date('2024-01-10T10:00:00Z'),
        },
        {
          ...sampleDoc,
          id: 'doc-2',
          type: 'comment',
          subreddit: 'programming',
          createdUtc: new Date('2024-01-15T10:00:00Z'),
        },
        {
          ...sampleDoc,
          id: 'doc-3',
          type: 'post',
          subreddit: 'test',
          createdUtc: new Date('2024-01-20T10:00:00Z'),
        },
      ];

      await store.storeMany(docs);
    });

    it('should return all documents when no filter is provided', () => {
      const results = store.getAll();
      expect(results.length).toBe(3);
    });

    it('should filter by subreddit', () => {
      const filter: DocumentFilter = { subreddit: 'programming' };
      const results = store.getAll(filter);
      expect(results.length).toBe(2);
      expect(results.every((d) => d.subreddit === 'programming')).toBe(true);
    });

    it('should filter by type', () => {
      const filter: DocumentFilter = { type: 'post' };
      const results = store.getAll(filter);
      expect(results.length).toBe(2);
      expect(results.every((d) => d.type === 'post')).toBe(true);
    });

    it('should filter by date range', () => {
      const filter: DocumentFilter = {
        startDate: new Date('2024-01-12T00:00:00Z'),
        endDate: new Date('2024-01-18T00:00:00Z'),
      };
      const results = store.getAll(filter);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('doc-2');
    });

    it('should apply multiple filters', () => {
      const filter: DocumentFilter = {
        subreddit: 'programming',
        type: 'post',
      };
      const results = store.getAll(filter);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('doc-1');
    });
  });

  describe('update', () => {
    it('should update an existing document', async () => {
      await store.store(sampleDoc);

      const updated = await store.update('doc-1', { processed: true, redditScore: 100 });
      expect(updated).toBe(true);

      const retrieved = store.getById('doc-1');
      expect(retrieved?.processed).toBe(true);
      expect(retrieved?.redditScore).toBe(100);
      expect(retrieved?.title).toBe(sampleDoc.title); // Other fields unchanged
    });

    it('should not allow ID to be changed', async () => {
      await store.store(sampleDoc);

      await store.update('doc-1', { id: 'new-id' } as any);

      const retrieved = store.getById('doc-1');
      expect(retrieved?.id).toBe('doc-1'); // ID should remain unchanged
    });

    it('should return false for non-existent document', async () => {
      const updated = await store.update('non-existent', { processed: true });
      expect(updated).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an existing document', async () => {
      await store.store(sampleDoc);

      const deleted = await store.delete('doc-1');
      expect(deleted).toBe(true);
      expect(store.getTotalDocuments()).toBe(0);
    });

    it('should return false for non-existent document', async () => {
      const deleted = await store.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing document', async () => {
      await store.store(sampleDoc);
      expect(store.exists('doc-1')).toBe(true);
    });

    it('should return false for non-existent document', () => {
      expect(store.exists('non-existent')).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const docs: Document[] = [
        { ...sampleDoc, id: 'doc-1', type: 'post', subreddit: 'programming' },
        { ...sampleDoc, id: 'doc-2', type: 'post', subreddit: 'test' },
        { ...sampleDoc, id: 'doc-3', type: 'comment', subreddit: 'programming' },
      ];

      await store.storeMany(docs);

      const stats = store.getStats();
      expect(stats.totalDocuments).toBe(3);
      expect(stats.postCount).toBe(2);
      expect(stats.commentCount).toBe(1);
      expect(stats.subreddits).toContain('programming');
      expect(stats.subreddits).toContain('test');
      expect(stats.subreddits.length).toBe(2);
    });

    it('should return empty stats for empty store', () => {
      const stats = store.getStats();
      expect(stats.totalDocuments).toBe(0);
      expect(stats.postCount).toBe(0);
      expect(stats.commentCount).toBe(0);
      expect(stats.subreddits).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all documents', async () => {
      await store.store(sampleDoc);
      expect(store.getTotalDocuments()).toBe(1);

      await store.clear();
      expect(store.getTotalDocuments()).toBe(0);
    });
  });
});
