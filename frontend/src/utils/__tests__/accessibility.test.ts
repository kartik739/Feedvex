import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  announceToScreenReader,
  getPaginationLabel,
  getSearchResultsLabel,
  getUserFriendlyErrorMessage,
  prefersReducedMotion,
} from '../accessibility';

describe('Accessibility Utils', () => {
  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      expect(id1).not.toBe(id2);
    });

    it('uses provided prefix', () => {
      const id = generateId('custom');
      expect(id).toMatch(/^custom-\d+$/);
    });
  });

  describe('announceToScreenReader', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('creates announcement element', () => {
      announceToScreenReader('Test message');
      const announcement = document.querySelector('[role="status"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Test message');
    });

    it('sets correct aria-live priority', () => {
      announceToScreenReader('Urgent message', 'assertive');
      const announcement = document.querySelector('[role="status"]');
      expect(announcement?.getAttribute('aria-live')).toBe('assertive');
    });

    it('removes announcement after timeout', async () => {
      vi.useFakeTimers();
      announceToScreenReader('Test message');
      
      expect(document.querySelector('[role="status"]')).toBeTruthy();
      
      vi.advanceTimersByTime(1000);
      
      expect(document.querySelector('[role="status"]')).toBeFalsy();
      vi.useRealTimers();
    });
  });

  describe('getPaginationLabel', () => {
    it('returns correct label', () => {
      expect(getPaginationLabel(1, 10)).toBe('Page 1 of 10');
      expect(getPaginationLabel(5, 20)).toBe('Page 5 of 20');
    });
  });

  describe('getSearchResultsLabel', () => {
    it('returns correct label for no results', () => {
      expect(getSearchResultsLabel(0, 'test')).toBe('No results found for "test"');
    });

    it('returns correct label for single result', () => {
      expect(getSearchResultsLabel(1, 'test')).toBe('1 result found for "test"');
    });

    it('returns correct label for multiple results', () => {
      expect(getSearchResultsLabel(5, 'test')).toBe('5 results found for "test"');
    });
  });

  describe('prefersReducedMotion', () => {
    it('returns boolean based on media query', () => {
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
  });
});
