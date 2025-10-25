'use client';

/**
 * View history manager using IndexedDB for storing recently viewed poems
 * Handles automatic cleanup and cross-tab synchronization
 */

// import { clientStorage } from './client-storage';

export interface HistoryItem {
  id: string;
  poemId: number;
  poetId: number;
  poetName: string;
  title: string;
  categoryId?: number;
  categoryTitle?: string;
  timestamp: number;
  url: string;
}

export interface HistoryOptions {
  maxItems?: number;
  ttl?: number; // Time to live in milliseconds
}

const DEFAULT_OPTIONS: Required<HistoryOptions> = {
  maxItems: 50,
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
};

const DB_NAME = 'GanjDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const INDEXES = {
  timestamp: 'timestamp',
  poetId: 'poetId',
  poemId: 'poemId',
};

class HistoryManager {
  private db: IDBDatabase | null = null;
  private options: Required<HistoryOptions>;
  private listeners: Set<(items: HistoryItem[]) => void> = new Set();

  constructor(options: HistoryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initDB();
  }

  /**
   * Add an item to history
   */
  async addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;

      // Add a small delay to prevent rapid-fire transactions
      await new Promise(resolve => setTimeout(resolve, 10));

      const historyItem: HistoryItem = {
        ...item,
        id: this.generateId(),
        timestamp: Date.now(),
      };

      // Remove existing item with same poemId to avoid duplicates
      await this.removeByPoemId(historyItem.poemId);

      // Create a new transaction for adding the item
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.add(historyItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        
        // Ensure transaction completes
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });

      // Cleanup old items in a separate transaction
      await this.cleanup();
      
      // Notify listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.warn('Failed to add item to history', error);
      return false;
    }
  }

  /**
   * Get history items, optionally filtered
   */
  async getHistory(limit?: number): Promise<HistoryItem[]> {
    try {
      const db = await this.getDB();
      if (!db) return [];

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(INDEXES.timestamp);

      return new Promise<HistoryItem[]>((resolve, reject) => {
        const items: HistoryItem[] = [];
        const request = index.openCursor(null, 'prev'); // Most recent first

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && (!limit || items.length < limit)) {
            const item = cursor.value as HistoryItem;
            
            // Check TTL
            if (Date.now() - item.timestamp <= this.options.ttl) {
              items.push(item);
            }
            
            cursor.continue();
          } else {
            resolve(items);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to get history', error);
      return [];
    }
  }

  /**
   * Get history for a specific poet
   */
  async getHistoryByPoet(poetId: number, limit?: number): Promise<HistoryItem[]> {
    try {
      const db = await this.getDB();
      if (!db) return [];

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(INDEXES.poetId);

      return new Promise<HistoryItem[]>((resolve, reject) => {
        const items: HistoryItem[] = [];
        const request = index.openCursor(IDBKeyRange.only(poetId), 'prev');

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && (!limit || items.length < limit)) {
            const item = cursor.value as HistoryItem;
            
            // Check TTL
            if (Date.now() - item.timestamp <= this.options.ttl) {
              items.push(item);
            }
            
            cursor.continue();
          } else {
            resolve(items);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to get history by poet', error);
      return [];
    }
  }

  /**
   * Remove an item from history
   */
  async removeFromHistory(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.notifyListeners();
      return true;
    } catch (error) {
      console.warn('Failed to remove item from history', error);
      return false;
    }
  }

  /**
   * Remove item by poem ID
   */
  async removeByPoemId(poemId: number): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(INDEXES.poemId);

      return new Promise<boolean>((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(poemId));
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve(true);
          }
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to remove item by poem ID', error);
      return false;
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.notifyListeners();
      return true;
    } catch (error) {
      console.warn('Failed to clear history', error);
      return false;
    }
  }

  /**
   * Get history count
   */
  async getHistoryCount(): Promise<number> {
    try {
      const items = await this.getHistory();
      return items.length;
    } catch (error) {
      console.warn('Failed to get history count', error);
      return 0;
    }
  }

  /**
   * Add a listener for history changes
   */
  addListener(callback: (items: HistoryItem[]) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex(INDEXES.timestamp, 'timestamp', { unique: false });
            store.createIndex(INDEXES.poetId, 'poetId', { unique: false });
            store.createIndex(INDEXES.poemId, 'poemId', { unique: false });
          }
        };
      });
    } catch (error) {
      console.warn('Failed to initialize IndexedDB', error);
      this.db = null;
    }
  }

  /**
   * Get database instance
   */
  private async getDB(): Promise<IDBDatabase | null> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  /**
   * Cleanup old items
   */
  private async cleanup(): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) return;

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index(INDEXES.timestamp);

      // Get all items
      const allItems = await new Promise<HistoryItem[]>((resolve, reject) => {
        const items: HistoryItem[] = [];
        const request = index.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            items.push(cursor.value);
            cursor.continue();
          } else {
            resolve(items);
          }
        };

        request.onerror = () => reject(request.error);
      });

      // Remove items that exceed maxItems or TTL
      const now = Date.now();
      const itemsToRemove: string[] = [];

      // Sort by timestamp (oldest first)
      const sortedItems = allItems.sort((a, b) => a.timestamp - b.timestamp);

      // Remove items that exceed maxItems
      if (sortedItems.length > this.options.maxItems) {
        const excess = sortedItems.slice(0, sortedItems.length - this.options.maxItems);
        itemsToRemove.push(...excess.map(item => item.id));
      }

      // Remove items that exceed TTL
      sortedItems.forEach(item => {
        if (now - item.timestamp > this.options.ttl) {
          itemsToRemove.push(item.id);
        }
      });

      // Remove excess items
      for (const id of itemsToRemove) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup history', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify all listeners
   */
  private async notifyListeners(): Promise<void> {
    try {
      const items = await this.getHistory();
      this.listeners.forEach(callback => {
        try {
          callback(items);
        } catch (error) {
          console.warn('Error in history listener', error);
        }
      });
    } catch (error) {
      console.warn('Failed to notify history listeners', error);
    }
  }
}

// Create singleton instance
export const historyManager = new HistoryManager();

// Export convenience functions
export const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => 
  historyManager.addToHistory(item);
export const getHistory = (limit?: number) => historyManager.getHistory(limit);
export const getHistoryByPoet = (poetId: number, limit?: number) => 
  historyManager.getHistoryByPoet(poetId, limit);
export const removeFromHistory = (id: string) => historyManager.removeFromHistory(id);
export const removeByPoemId = (poemId: number) => historyManager.removeByPoemId(poemId);
export const clearHistory = () => historyManager.clearHistory();
export const getHistoryCount = () => historyManager.getHistoryCount();
export const addHistoryListener = (callback: (items: HistoryItem[]) => void) => 
  historyManager.addListener(callback);

// React hooks for components
export const useViewHistory = () => {
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const historyItems = await historyManager.getHistory();
        setItems(historyItems);
      } catch (error) {
        console.warn('Failed to load history', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    const unsubscribe = historyManager.addListener(setItems);
    return unsubscribe;
  }, []);

  return { items, loading };
};

// Import React for hooks
import React from 'react';
