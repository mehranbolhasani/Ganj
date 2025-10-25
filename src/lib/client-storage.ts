/**
 * Client-side storage utility with error handling and fallback mechanisms
 * Provides a unified interface for localStorage operations with TypeScript support
 */

export interface StorageItem<T = unknown> {
  value: T;
  timestamp: number;
  version: string;
}

export interface StorageOptions {
  version?: string;
  ttl?: number; // Time to live in milliseconds
  fallback?: unknown;
}

export class ClientStorage {
  private readonly version: string;
  private readonly defaultTTL: number;

  constructor(version = '1.0.0', defaultTTL = 30 * 24 * 60 * 60 * 1000) { // 30 days
    this.version = version;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get an item from localStorage with error handling
   */
  get<T>(key: string, options: StorageOptions = {}): T | null {
    const startTime = performance.now();
    
    try {
      if (typeof window === 'undefined') {
        return options.fallback as T || null;
      }

      const item = localStorage.getItem(key);
      if (!item) {
        return options.fallback as T || null;
      }

      const parsed: StorageItem<T> = JSON.parse(item);
      
      // Check version compatibility
      if (options.version && parsed.version !== options.version) {
        this.remove(key);
        return options.fallback as T || null;
      }

      // Check TTL
      const ttl = options.ttl || this.defaultTTL;
      if (Date.now() - parsed.timestamp > ttl) {
        this.remove(key);
        return options.fallback as T || null;
      }

      // Track performance
      const duration = performance.now() - startTime;
      if (typeof window !== 'undefined') {
        import('./performance').then(({ trackStorageOperation }) => {
          trackStorageOperation('get', duration, item.length);
        });
      }

      return parsed.value;
    } catch (error) {
      console.warn(`Failed to get item from localStorage: ${key}`, error);
      return options.fallback as T || null;
    }
  }

  /**
   * Set an item in localStorage with error handling
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        version: options.version || this.version,
      };

      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.warn(`Failed to set item in localStorage: ${key}`, error);
      
      // Handle quota exceeded error
      if (error instanceof DOMException && error.code === DOMException.QUOTA_EXCEEDED_ERR) {
        this.handleQuotaExceeded();
      }
      
      return false;
    }
  }

  /**
   * Remove an item from localStorage
   */
  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove item from localStorage: ${key}`, error);
      return false;
    }
  }

  /**
   * Clear all items with a specific prefix
   */
  clear(prefix?: string): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      if (prefix) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      if (typeof window === 'undefined') {
        return { used: 0, available: 0, percentage: 0 };
      }

      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }

      // Estimate available space (5MB is typical limit)
      const available = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.warn('Failed to get storage info', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Handle quota exceeded error by cleaning up old items
   */
  private handleQuotaExceeded(): void {
    try {
      // Get all items and sort by timestamp
      const items: Array<{ key: string; timestamp: number }> = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ganj_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (parsed.timestamp) {
                items.push({ key, timestamp: parsed.timestamp });
              }
            }
          } catch {
            // Skip invalid items
          }
        }
      }

      // Sort by timestamp (oldest first)
      items.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 25% of items
      const toRemove = Math.ceil(items.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(items[i].key);
      }

      console.info(`Cleaned up ${toRemove} old items due to storage quota exceeded`);
    } catch (error) {
      console.warn('Failed to handle quota exceeded error', error);
    }
  }

  /**
   * Add storage event listener for cross-tab synchronization
   */
  addStorageListener(callback: (key: string, newValue: unknown, oldValue: unknown) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.newValue !== event.oldValue) {
        try {
          const newValue = event.newValue ? JSON.parse(event.newValue) : null;
          const oldValue = event.oldValue ? JSON.parse(event.oldValue) : null;
          callback(event.key, newValue, oldValue);
        } catch (error) {
          console.warn('Failed to parse storage event', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

// Create default instance
export const clientStorage = new ClientStorage();

// Export convenience functions
export const getStorageItem = <T>(key: string, options?: StorageOptions): T | null => 
  clientStorage.get<T>(key, options);

export const setStorageItem = <T>(key: string, value: T, options?: StorageOptions): boolean => 
  clientStorage.set(key, value, options);

export const removeStorageItem = (key: string): boolean => 
  clientStorage.remove(key);

export const clearStorage = (prefix?: string): boolean => 
  clientStorage.clear(prefix);

export const getStorageInfo = () => 
  clientStorage.getStorageInfo();

export const addStorageListener = (callback: (key: string, newValue: unknown, oldValue: unknown) => void) => 
  clientStorage.addStorageListener(callback);
