/**
 * API Caching and Request Deduplication
 * Prevents duplicate API calls and implements caching with stale-while-revalidate
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  staleTime: number; // Time when data becomes stale but is still usable
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private backgroundRefresh = new Map<string, Promise<unknown>>();
  
  // Enhanced TTL with stale-while-revalidate
  private defaultTTL = {
    poets: 5 * 60 * 1000,      // 5 minutes
    poet: 10 * 60 * 1000,       // 10 minutes
    category: 15 * 60 * 1000,   // 15 minutes
    poem: 60 * 60 * 1000,       // 1 hour
  };

  // Stale time (when to start background refresh)
  private staleTime = {
    poets: 3 * 60 * 1000,      // 3 minutes
    poet: 7 * 60 * 1000,        // 7 minutes
    category: 10 * 60 * 1000,   // 10 minutes
    poem: 45 * 60 * 1000,       // 45 minutes
  };

  /**
   * Get data from cache or make request with stale-while-revalidate
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)! as Promise<T>;
    }

    // Check cache first
    const cached = this.getFromCache<T>(key);
    if (cached) {
      // Check if data is stale and trigger background refresh
      const entry = this.cache.get(key);
      if (entry && this.isStale(entry)) {
        this.triggerBackgroundRefresh(key, fetcher, ttl);
      }
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

    return entry.data as T;
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
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        ttl: ttl || this.getDefaultTTL(key),
        staleTime: now + this.getStaleTime(key),
      };
      
      this.cache.set(key, entry);
      return data;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  /**
   * Check if cache entry is stale
   */
  private isStale(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.staleTime;
  }

  /**
   * Trigger background refresh for stale data
   */
  private triggerBackgroundRefresh<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): void {
    // Don't trigger if already refreshing
    if (this.backgroundRefresh.has(key)) {
      return;
    }

    const refreshPromise = this.fetchAndCache(key, fetcher, ttl)
      .catch(error => {
        console.warn(`Background refresh failed for ${key}:`, error);
      })
      .finally(() => {
        this.backgroundRefresh.delete(key);
      });

    this.backgroundRefresh.set(key, refreshPromise);
  }

  /**
   * Get stale time based on key pattern
   */
  private getStaleTime(key: string): number {
    if (key.includes('/poets')) return this.staleTime.poets;
    if (key.includes('/poet/')) return this.staleTime.poet;
    if (key.includes('/cat/')) return this.staleTime.category;
    if (key.includes('/poem/')) return this.staleTime.poem;
    return 3 * 60 * 1000; // Default 3 minutes
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
   * Warm cache with frequently accessed data
   */
  async warmCache<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<void> {
    try {
      // Only warm if not already cached
      if (!this.cache.has(key)) {
        await this.fetchAndCache(key, fetcher, ttl);
      }
    } catch (error) {
      console.warn(`Cache warming failed for ${key}:`, error);
    }
  }

  /**
   * Preload multiple items in parallel
   */
  async preload<T>(
    items: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>
  ): Promise<void> {
    const promises = items.map(item => 
      this.warmCache(item.key, item.fetcher, item.ttl)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      backgroundRefresh: this.backgroundRefresh.size,
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

/**
 * Warm cache with data
 */
export function warmCache<T>(
  key: string, 
  fetcher: () => Promise<T>, 
  ttl?: number
): Promise<void> {
  return apiCache.warmCache(key, fetcher, ttl);
}

/**
 * Preload multiple cache items
 */
export function preloadCache<T>(
  items: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>
): Promise<void> {
  return apiCache.preload(items);
}
