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
  
  // Cache size limits
  private maxCacheSize = 100; // Maximum number of cache entries
  private maxMemoryUsage = 50 * 1024 * 1024; // 50MB in bytes
  
  // Enhanced TTL with stale-while-revalidate
  private defaultTTL = {
    poets: 24 * 60 * 60 * 1000,    // 24 hours (static data)
    poet: 12 * 60 * 60 * 1000,     // 12 hours
    category: 6 * 60 * 60 * 1000,  // 6 hours
    poem: 2 * 60 * 60 * 1000,      // 2 hours
    search: 10 * 60 * 1000,        // 10 minutes
  };

  // Stale time (when to start background refresh)
  private staleTime = {
    poets: 12 * 60 * 60 * 1000,    // 12 hours
    poet: 6 * 60 * 60 * 1000,      // 6 hours
    category: 3 * 60 * 60 * 1000,  // 3 hours
    poem: 1 * 60 * 60 * 1000,      // 1 hour
    search: 5 * 60 * 1000,         // 5 minutes
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
      
      // Check cache size limits before adding
      this.enforceCacheLimits();
      
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
   * Enforce cache size and memory limits
   */
  private enforceCacheLimits(): void {
    // Check entry count limit
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupOldEntries();
    }

    // Check memory usage (rough estimation)
    const estimatedMemory = this.estimateMemoryUsage();
    if (estimatedMemory > this.maxMemoryUsage) {
      this.cleanupOldEntries();
    }
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.cache) {
      // Rough estimation: key size + data size + overhead
      totalSize += key.length * 2; // Unicode characters
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 100; // Overhead for object structure
    }
    return totalSize;
  }

  /**
   * Clean up old cache entries (LRU-style)
   */
  private cleanupOldEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get stale time based on key pattern
   */
  private getStaleTime(key: string): number {
    if (key.includes('/poets')) return this.staleTime.poets;
    if (key.includes('/poet/')) return this.staleTime.poet;
    if (key.includes('/cat/')) return this.staleTime.category;
    if (key.includes('/poem/')) return this.staleTime.poem;
    if (key.includes('/search/')) return this.staleTime.search;
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
    if (key.includes('/search/')) return this.defaultTTL.search;
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
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Calculate age distribution
    const ageDistribution = {
      fresh: 0,      // < 1 hour
      recent: 0,     // 1-6 hours
      stale: 0,      // 6-24 hours
      old: 0,        // > 24 hours
    };
    
    entries.forEach(([, entry]) => {
      const age = now - entry.timestamp;
      const ageHours = age / (1000 * 60 * 60);
      
      if (ageHours < 1) ageDistribution.fresh++;
      else if (ageHours < 6) ageDistribution.recent++;
      else if (ageHours < 24) ageDistribution.stale++;
      else ageDistribution.old++;
    });

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      memoryUsage: this.estimateMemoryUsage(),
      maxMemoryUsage: this.maxMemoryUsage,
      memoryUsagePercent: Math.round((this.estimateMemoryUsage() / this.maxMemoryUsage) * 100),
      pendingRequests: this.pendingRequests.size,
      backgroundRefresh: this.backgroundRefresh.size,
      ageDistribution,
      keys: Array.from(this.cache.keys()),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(([, entry]) => entry.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(([, entry]) => entry.timestamp)) : null,
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

/**
 * Get detailed cache statistics
 */
export function getCacheStats() {
  return apiCache.getStats();
}

/**
 * Force cleanup of old cache entries
 */
export function cleanupCache(): void {
  const stats = apiCache.getStats();
  if (stats.memoryUsagePercent > 80) {
    // Force cleanup if memory usage is high
    apiCache.clear();
  }
}

/**
 * Monitor cache health
 */
export function monitorCacheHealth(): {
  healthy: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const stats = apiCache.getStats();
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (stats.memoryUsagePercent > 90) {
    warnings.push('Cache memory usage is very high');
    recommendations.push('Consider clearing cache or reducing cache size');
  } else if (stats.memoryUsagePercent > 75) {
    warnings.push('Cache memory usage is high');
    recommendations.push('Monitor cache usage and consider cleanup');
  }

  if (stats.size > stats.maxSize * 0.9) {
    warnings.push('Cache is near maximum size limit');
    recommendations.push('Consider increasing max cache size or implementing better cleanup');
  }

  if (stats.pendingRequests > 10) {
    warnings.push('Many pending requests detected');
    recommendations.push('Check for potential request bottlenecks');
  }

  if (stats.backgroundRefresh > 5) {
    warnings.push('Many background refreshes in progress');
    recommendations.push('Consider reducing stale time or TTL values');
  }

  return {
    healthy: warnings.length === 0,
    warnings,
    recommendations,
  };
}
