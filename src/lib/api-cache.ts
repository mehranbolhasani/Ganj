/**
 * API Caching and Request Deduplication
 * Prevents duplicate API calls and implements caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  // Default TTL: 5 minutes for poets, 1 hour for poems
  private defaultTTL = {
    poets: 5 * 60 * 1000,      // 5 minutes
    poet: 10 * 60 * 1000,       // 10 minutes
    category: 15 * 60 * 1000,   // 15 minutes
    poem: 60 * 60 * 1000,       // 1 hour
  };

  /**
   * Get data from cache or make request
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached) {
      return cached;
    }

    // Make request and cache result
    const promise = this.fetchAndCache(key, fetcher, ttl);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Fetch data and cache it
   */
  private async fetchAndCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    try {
      const data = await fetcher();
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.getDefaultTTL(key),
      };
      
      this.cache.set(key, entry);
      return data;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  /**
   * Get default TTL based on key pattern
   */
  private getDefaultTTL(key: string): number {
    if (key.includes('/poets')) return this.defaultTTL.poets;
    if (key.includes('/poet/')) return this.defaultTTL.poet;
    if (key.includes('/cat/')) return this.defaultTTL.category;
    if (key.includes('/poem/')) return this.defaultTTL.poem;
    return 5 * 60 * 1000; // Default 5 minutes
  }

  /**
   * Clear cache for specific key or all cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

/**
 * Higher-order function to add caching to API calls
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return apiCache.get(key, fetcher, ttl);
}

/**
 * Clear cache for specific patterns
 */
export function clearCachePattern(pattern: string): void {
  const stats = apiCache.getStats();
  stats.keys.forEach(key => {
    if (key.includes(pattern)) {
      apiCache.clear(key);
    }
  });
}
