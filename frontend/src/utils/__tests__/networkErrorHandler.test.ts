import { describe, it, expect, vi } from 'vitest';
import {
  parseNetworkError,
  getUserFriendlyErrorMessage,
  isOnline,
  retryRequest,
} from '../networkErrorHandler';

describe('Network Error Handler', () => {
  describe('parseNetworkError', () => {
    it('parses server error correctly', () => {
      const error = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { message: 'Server error' },
        },
      };

      const parsed = parseNetworkError(error);
      expect(parsed.isServerError).toBe(true);
      expect(parsed.status).toBe(500);
    });

    it('parses client error correctly', () => {
      const error = {
        response: {
          status: 404,
          statusText: 'Not Found',
        },
      };

      const parsed = parseNetworkError(error);
      expect(parsed.isClientError).toBe(true);
      expect(parsed.status).toBe(404);
    });

    it('parses network error correctly', () => {
      const error = {
        request: {},
      };

      const parsed = parseNetworkError(error);
      expect(parsed.isNetworkError).toBe(true);
    });

    it('parses timeout error correctly', () => {
      const error = {
        name: 'AbortError',
      };

      const parsed = parseNetworkError(error);
      expect(parsed.isTimeout).toBe(true);
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('returns friendly message for network error', () => {
      const error = {
        message: 'Network error',
        isNetworkError: true,
        isTimeout: false,
        isServerError: false,
        isClientError: false,
      };

      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('internet connection');
    });

    it('returns friendly message for timeout', () => {
      const error = {
        message: 'Timeout',
        isNetworkError: false,
        isTimeout: true,
        isServerError: false,
        isClientError: false,
      };

      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('took too long');
    });

    it('returns friendly message for 401 error', () => {
      const error = {
        message: 'Unauthorized',
        status: 401,
        isNetworkError: false,
        isTimeout: false,
        isServerError: false,
        isClientError: true,
      };

      const message = getUserFriendlyErrorMessage(error);
      expect(message).toContain('log in');
    });
  });

  describe('isOnline', () => {
    it('returns navigator.onLine value', () => {
      const result = isOnline();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('retryRequest', () => {
    it('retries failed requests', async () => {
      let attempts = 0;
      const requestFn = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const result = await retryRequest(requestFn, {
        maxRetries: 3,
        initialDelay: 10,
      });

      expect(result).toBe('success');
      expect(requestFn).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries', async () => {
      const requestFn = vi.fn(async () => {
        throw new Error('Network error');
      });

      await expect(
        retryRequest(requestFn, {
          maxRetries: 2,
          initialDelay: 10,
        })
      ).rejects.toThrow('Network error');

      expect(requestFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
