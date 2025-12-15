import { AutocompleteService } from './autocomplete';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('AutocompleteService', () => {
  let autocomplete: AutocompleteService;
  const testTriePath = path.join(__dirname, '../../test-trie.json');

  beforeEach(() => {
    autocomplete = new AutocompleteService({
      maxSuggestions: 5,
      triePath: testTriePath,
    });
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testTriePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('addTerm', () => {
    it('should add a term to the trie', () => {
      autocomplete.addTerm('hello', 10);
      const suggestions = autocomplete.getSuggestions('hel');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].term).toBe('hello');
      expect(suggestions[0].frequency).toBe(10);
    });

    it('should handle multiple terms with same prefix', () => {
      autocomplete.addTerm('hello', 10);
      autocomplete.addTerm('help', 5);
      autocomplete.addTerm('helicopter', 3);

      const suggestions = autocomplete.getSuggestions('hel');

      expect(suggestions).toHaveLength(3);
      expect(suggestions.map((s) => s.term)).toContain('hello');
      expect(suggestions.map((s) => s.term)).toContain('help');
      expect(suggestions.map((s) => s.term)).toContain('helicopter');
    });

    it('should normalize terms to lowercase', () => {
      autocomplete.addTerm('Hello', 10);
      const suggestions = autocomplete.getSuggestions('hel');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].term).toBe('hello');
    });

    it('should handle empty or whitespace terms', () => {
      autocomplete.addTerm('', 10);
      autocomplete.addTerm('   ', 10);

      const stats = autocomplete.getStats();
      expect(stats.totalTerms).toBe(0);
    });
  });

  describe('recordQuery', () => {
    it('should record user queries', () => {
      autocomplete.addTerm('hello', 5);
      autocomplete.recordQuery('hello');
      autocomplete.recordQuery('hello');

      const suggestions = autocomplete.getSuggestions('hel');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].queryCount).toBe(2);
    });

    it('should create new terms for recorded queries', () => {
      autocomplete.recordQuery('newterm');

      const suggestions = autocomplete.getSuggestions('new');

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].term).toBe('newterm');
      expect(suggestions[0].queryCount).toBe(1);
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      autocomplete.addTerm('apple', 100);
      autocomplete.addTerm('application', 50);
      autocomplete.addTerm('apply', 75);
      autocomplete.addTerm('banana', 80);
      autocomplete.addTerm('band', 60);
    });

    it('should return suggestions matching prefix', () => {
      const suggestions = autocomplete.getSuggestions('app');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every((s) => s.term.startsWith('app'))).toBe(true);
    });

    it('should return empty array for non-matching prefix', () => {
      const suggestions = autocomplete.getSuggestions('xyz');

      expect(suggestions).toHaveLength(0);
    });

    it('should return empty array for empty prefix', () => {
      const suggestions = autocomplete.getSuggestions('');

      expect(suggestions).toHaveLength(0);
    });

    it('should sort suggestions by frequency', () => {
      const suggestions = autocomplete.getSuggestions('app');

      // apple (100) should come before apply (75) and application (50)
      expect(suggestions[0].term).toBe('apple');
      expect(suggestions[1].term).toBe('apply');
      expect(suggestions[2].term).toBe('application');
    });

    it('should prioritize query count over corpus frequency', () => {
      autocomplete.addTerm('test1', 10);
      autocomplete.addTerm('test2', 5);

      // Record test2 multiple times
      autocomplete.recordQuery('test2');
      autocomplete.recordQuery('test2');
      autocomplete.recordQuery('test2');

      const suggestions = autocomplete.getSuggestions('test');

      // test2 should rank higher due to query count
      expect(suggestions[0].term).toBe('test2');
    });

    it('should limit suggestions to maxSuggestions', () => {
      // Add more terms than maxSuggestions (5)
      autocomplete.addTerm('app1', 10);
      autocomplete.addTerm('app2', 9);
      autocomplete.addTerm('app3', 8);
      autocomplete.addTerm('app4', 7);
      autocomplete.addTerm('app5', 6);
      autocomplete.addTerm('app6', 5);
      autocomplete.addTerm('app7', 4);

      const suggestions = autocomplete.getSuggestions('app');

      expect(suggestions).toHaveLength(5);
    });

    it('should respect custom limit parameter', () => {
      const suggestions = autocomplete.getSuggestions('app', 2);

      expect(suggestions.length).toBeLessThanOrEqual(2);
    });

    it('should be case-insensitive', () => {
      const suggestions1 = autocomplete.getSuggestions('APP');
      const suggestions2 = autocomplete.getSuggestions('app');

      expect(suggestions1).toEqual(suggestions2);
    });
  });

  describe('buildTrie', () => {
    it('should build trie from term map', () => {
      const terms = new Map<string, number>([
        ['hello', 10],
        ['world', 20],
        ['help', 15],
      ]);

      autocomplete.buildTrie(terms);

      const suggestions1 = autocomplete.getSuggestions('hel');
      expect(suggestions1).toHaveLength(2);

      const suggestions2 = autocomplete.getSuggestions('wor');
      expect(suggestions2).toHaveLength(1);
    });

    it('should replace existing trie', () => {
      autocomplete.addTerm('old', 10);

      const terms = new Map<string, number>([['new', 20]]);

      autocomplete.buildTrie(terms);

      const oldSuggestions = autocomplete.getSuggestions('old');
      expect(oldSuggestions).toHaveLength(0);

      const newSuggestions = autocomplete.getSuggestions('new');
      expect(newSuggestions).toHaveLength(1);
    });
  });

  describe('persist and load', () => {
    it('should persist and load trie correctly', async () => {
      autocomplete.addTerm('hello', 10);
      autocomplete.addTerm('world', 20);
      autocomplete.recordQuery('hello');

      await autocomplete.persist();

      // Create new instance and load
      const newAutocomplete = new AutocompleteService({
        triePath: testTriePath,
      });
      await newAutocomplete.load();

      const suggestions = newAutocomplete.getSuggestions('hel');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].term).toBe('hello');
      expect(suggestions[0].frequency).toBe(10);
      expect(suggestions[0].queryCount).toBe(1);
    });

    it('should handle loading non-existent file', async () => {
      const newAutocomplete = new AutocompleteService({
        triePath: 'nonexistent.json',
      });

      await expect(newAutocomplete.load()).resolves.not.toThrow();

      const stats = newAutocomplete.getStats();
      expect(stats.totalTerms).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all trie data', () => {
      autocomplete.addTerm('hello', 10);
      autocomplete.addTerm('world', 20);

      autocomplete.clear();

      const suggestions = autocomplete.getSuggestions('hel');
      expect(suggestions).toHaveLength(0);

      const stats = autocomplete.getStats();
      expect(stats.totalTerms).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      autocomplete.addTerm('hello', 10);
      autocomplete.addTerm('world', 20);
      autocomplete.addTerm('help', 15);

      const stats = autocomplete.getStats();

      expect(stats.totalTerms).toBe(3);
      expect(stats.totalNodes).toBeGreaterThan(0);
    });

    it('should return zero for empty trie', () => {
      const stats = autocomplete.getStats();

      expect(stats.totalTerms).toBe(0);
      expect(stats.totalNodes).toBe(0);
    });
  });
});
