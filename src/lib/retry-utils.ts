/**
 * Retry utilities for API requests
 * Implements exponential backoff and error handling
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, 5xx errors, and rate limiting
    if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
    if (error.status >= 500) return true;
    if (error.status === 429) return true; // Rate limiting
    return false;
  },
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if condition is not met
      if (!opts.retryCondition(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === opts.maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      const totalDelay = delay + jitter;
      
      console.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${totalDelay}ms:`, error instanceof Error ? error.message : 'Unknown error');
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

/**
 * Retry with specific conditions for different error types
 */
export async function withRetryConditional<T>(
  fn: () => Promise<T>,
  retryCondition: (error: any) => boolean,
  options: Omit<RetryOptions, 'retryCondition'> = {}
): Promise<T> {
  return withRetry(fn, { ...options, retryCondition });
}

/**
 * Quick retry for network errors only
 */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  return withRetry(fn, {
    maxRetries,
    retryCondition: (error) => {
      return error.name === 'TypeError' && error.message.includes('fetch');
    },
  });
}

/**
 * Retry for rate limiting with longer delays
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5
): Promise<T> {
  return withRetry(fn, {
    maxRetries,
    baseDelay: 2000, // Start with 2 seconds
    maxDelay: 30000, // Max 30 seconds
    retryCondition: (error) => error.status === 429,
  });
}
