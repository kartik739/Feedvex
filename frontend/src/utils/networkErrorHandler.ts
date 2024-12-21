/**
 * Network Error Handling Utilities
 */

export interface NetworkError {
  message: string;
  status?: number;
  statusText?: string;
  isNetworkError: boolean;
  isTimeout: boolean;
  isServerError: boolean;
  isClientError: boolean;
}

/**
 * Parse and categorize network errors
 */
export function parseNetworkError(error: any): NetworkError {
  const networkError: NetworkError = {
    message: 'An unexpected error occurred',
    isNetworkError: false,
    isTimeout: false,
    isServerError: false,
    isClientError: false,
  };

  // Check if it's a fetch/axios error
  if (error.response) {
    // Server responded with error status
    networkError.status = error.response.status;
    networkError.statusText = error.response.statusText;
    networkError.message = error.response.data?.message || error.message || 'Server error occurred';

    if (error.response.status >= 500) {
      networkError.isServerError = true;
      networkError.message = 'Server error. Please try again later.';
    } else if (error.response.status >= 400) {
      networkError.isClientError = true;
    }
  } else if (error.request) {
    // Request made but no response received
    networkError.isNetworkError = true;
    networkError.message = 'Network error. Please check your internet connection.';
  } else if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
    // Request timeout
    networkError.isTimeout = true;
    networkError.message = 'Request timeout. Please try again.';
  } else {
    // Something else happened
    networkError.message = error.message || 'An unexpected error occurred';
  }

  return networkError;
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = (error) => {
      const parsed = parseNetworkError(error);
      return parsed.isNetworkError || parsed.isTimeout || parsed.isServerError;
    },
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or error is not retryable
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Create fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: NetworkError): string {
  if (error.isNetworkError) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  if (error.isTimeout) {
    return 'The request took too long. Please try again.';
  }

  if (error.isServerError) {
    return 'Our servers are experiencing issues. Please try again in a few moments.';
  }

  if (error.isClientError) {
    if (error.status === 401) {
      return 'You need to log in to access this resource.';
    }
    if (error.status === 403) {
      return 'You don\'t have permission to access this resource.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.status === 429) {
      return 'Too many requests. Please slow down and try again later.';
    }
  }

  return error.message || 'Something went wrong. Please try again.';
}

/**
 * Log error for debugging (in development) or tracking (in production)
 */
export function logError(error: NetworkError, context?: Record<string, any>): void {
  if (import.meta.env.DEV) {
    console.error('Network Error:', error, context);
  } else {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: context });
  }
}

/**
 * Create a network error handler hook
 */
export function createNetworkErrorHandler(onError?: (error: NetworkError) => void) {
  return (error: any) => {
    const networkError = parseNetworkError(error);
    logError(networkError);

    if (onError) {
      onError(networkError);
    }

    return networkError;
  };
}
