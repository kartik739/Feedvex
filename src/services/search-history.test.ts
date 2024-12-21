import { SearchHistoryService } from './search-history';

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;

  beforeEach(() => {
    service = new SearchHistoryService({ maxEntriesPerUser: 5 });
  });

  describe('addEntry', () => {
    it('should add a search history entry', () => {
      const entry = service.addEntry('user1', 'test query', 10);

      expect(entry).toHaveProperty('id');
      expect(entry.userId).toBe('user1');
      expect(entry.query).toBe('test query');
      expect(entry.resultCount).toBe(10);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('should add multiple entries for the same user', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user1', 'query 2', 10);
      service.addEntry('user1', 'query 3', 15);

      const history = service.getHistory('user1');
      expect(history).toHaveLength(3);
    });

    it('should maintain most recent first order', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user1', 'query 2', 10);
      service.addEntry('user1', 'query 3', 15);

      const history = service.getHistory('user1');
      expect(history[0].query).toBe('query 3');
      expect(history[1].query).toBe('query 2');
      expect(history[2].query).toBe('query 1');
    });

    it('should limit entries to maxEntriesPerUser', () => {
      for (let i = 1; i <= 10; i++) {
        service.addEntry('user1', `query ${i}`, i);
      }

      const history = service.getHistory('user1');
      expect(history).toHaveLength(5); // maxEntriesPerUser is 5
      expect(history[0].query).toBe('query 10'); // Most recent
      expect(history[4].query).toBe('query 6'); // Oldest kept
    });
  });

  describe('getHistory', () => {
    it('should return empty array for user with no history', () => {
      const history = service.getHistory('user1');
      expect(history).toEqual([]);
    });

    it('should return user history', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user1', 'query 2', 10);

      const history = service.getHistory('user1');
      expect(history).toHaveLength(2);
    });

    it('should respect limit parameter', () => {
      for (let i = 1; i <= 10; i++) {
        service.addEntry('user1', `query ${i}`, i);
      }

      const history = service.getHistory('user1', 3);
      expect(history).toHaveLength(3);
      expect(history[0].query).toBe('query 10'); // Most recent (limited by maxEntriesPerUser keeps 6-10)
    });

    it('should not return other users history', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user2', 'query 2', 10);

      const history1 = service.getHistory('user1');
      const history2 = service.getHistory('user2');

      expect(history1).toHaveLength(1);
      expect(history1[0].query).toBe('query 1');
      expect(history2).toHaveLength(1);
      expect(history2[0].query).toBe('query 2');
    });
  });

  describe('deleteEntry', () => {
    it('should delete a specific entry', () => {
      const entry1 = service.addEntry('user1', 'query 1', 5);
      const entry2 = service.addEntry('user1', 'query 2', 10);

      const deleted = service.deleteEntry('user1', entry1.id);
      expect(deleted).toBe(true);

      const history = service.getHistory('user1');
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(entry2.id);
    });

    it('should return false if entry not found', () => {
      service.addEntry('user1', 'query 1', 5);

      const deleted = service.deleteEntry('user1', 'nonexistent-id');
      expect(deleted).toBe(false);
    });

    it('should return false if user has no history', () => {
      const deleted = service.deleteEntry('user1', 'some-id');
      expect(deleted).toBe(false);
    });

    it('should not delete entries from other users', () => {
      const entry1 = service.addEntry('user1', 'query 1', 5);
      service.addEntry('user2', 'query 2', 10);

      const deleted = service.deleteEntry('user2', entry1.id);
      expect(deleted).toBe(false);

      const history1 = service.getHistory('user1');
      expect(history1).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history for a user', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user1', 'query 2', 10);
      service.addEntry('user1', 'query 3', 15);

      const deletedCount = service.clearHistory('user1');
      expect(deletedCount).toBe(3);

      const history = service.getHistory('user1');
      expect(history).toHaveLength(0);
    });

    it('should return 0 if user has no history', () => {
      const deletedCount = service.clearHistory('user1');
      expect(deletedCount).toBe(0);
    });

    it('should not affect other users history', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user2', 'query 2', 10);

      service.clearHistory('user1');

      const history1 = service.getHistory('user1');
      const history2 = service.getHistory('user2');

      expect(history1).toHaveLength(0);
      expect(history2).toHaveLength(1);
    });
  });

  describe('getEntryCount', () => {
    it('should return 0 for user with no history', () => {
      const count = service.getEntryCount('user1');
      expect(count).toBe(0);
    });

    it('should return correct count', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user1', 'query 2', 10);

      const count = service.getEntryCount('user1');
      expect(count).toBe(2);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      service.addEntry('user1', 'query 1', 5);
      service.addEntry('user1', 'query 2', 10);
      service.addEntry('user2', 'query 3', 15);

      const stats = service.getStats();
      expect(stats.totalUsers).toBe(2);
      expect(stats.totalEntries).toBe(3);
      expect(stats.avgEntriesPerUser).toBe(1.5);
    });

    it('should return zeros when no data', () => {
      const stats = service.getStats();
      expect(stats.totalUsers).toBe(0);
      expect(stats.totalEntries).toBe(0);
      expect(stats.avgEntriesPerUser).toBe(0);
    });
  });
});
