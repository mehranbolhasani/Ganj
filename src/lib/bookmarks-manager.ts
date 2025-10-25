'use client';

/**
 * Bookmarks manager using localStorage for storing favorite poems
 * Lightweight and fast storage for user bookmarks
 */

import { clientStorage } from './client-storage';

export interface BookmarkItem {
  id: string;
  poemId: number;
  poetId: number;
  poetName: string;
  title: string;
  categoryId?: number;
  categoryTitle?: string;
  timestamp: number;
  url: string;
  notes?: string;
}

export interface BookmarkOptions {
  maxItems?: number;
  ttl?: number; // Time to live in milliseconds
}

const DEFAULT_OPTIONS: Required<BookmarkOptions> = {
  maxItems: 1000, // Much higher limit for bookmarks
  ttl: 365 * 24 * 60 * 60 * 1000, // 1 year
};

const STORAGE_KEY = 'ganj_bookmarks';
const VERSION = '1.0.0';

class BookmarksManager {
  private options: Required<BookmarkOptions>;
  private listeners: Set<(items: BookmarkItem[]) => void> = new Set();

  constructor(options: BookmarkOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.setupStorageListener();
  }

  /**
   * Add a bookmark
   */
  addBookmark(item: Omit<BookmarkItem, 'id' | 'timestamp'>): boolean {
    try {
      const bookmark: BookmarkItem = {
        ...item,
        id: this.generateId(),
        timestamp: Date.now(),
      };

      const bookmarks = this.getBookmarks();
      
      // Check if already bookmarked
      if (bookmarks.some(b => b.poemId === bookmark.poemId)) {
        return false; // Already bookmarked
      }

      // Add to bookmarks
      const newBookmarks = [bookmark, ...bookmarks];
      
      // Limit to maxItems
      if (newBookmarks.length > this.options.maxItems) {
        newBookmarks.splice(this.options.maxItems);
      }

      if (clientStorage.set(STORAGE_KEY, newBookmarks, { version: VERSION })) {
        this.notifyListeners();
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to add bookmark', error);
      return false;
    }
  }

  /**
   * Remove a bookmark
   */
  removeBookmark(poemId: number): boolean {
    try {
      const bookmarks = this.getBookmarks();
      const newBookmarks = bookmarks.filter(b => b.poemId !== poemId);

      if (clientStorage.set(STORAGE_KEY, newBookmarks, { version: VERSION })) {
        this.notifyListeners();
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to remove bookmark', error);
      return false;
    }
  }

  /**
   * Get all bookmarks
   */
  getBookmarks(): BookmarkItem[] {
    try {
      const bookmarks = clientStorage.get<BookmarkItem[]>(STORAGE_KEY, { 
        version: VERSION,
        fallback: []
      });

      if (!bookmarks) return [];

      // Filter out expired items
      const now = Date.now();
      const validBookmarks = bookmarks.filter(b => now - b.timestamp <= this.options.ttl);

      // Update storage if items were filtered out
      if (validBookmarks.length !== bookmarks.length) {
        clientStorage.set(STORAGE_KEY, validBookmarks, { version: VERSION });
      }

      return validBookmarks;
    } catch (error) {
      console.warn('Failed to get bookmarks', error);
      return [];
    }
  }

  /**
   * Get bookmarks by poet
   */
  getBookmarksByPoet(poetId: number): BookmarkItem[] {
    const bookmarks = this.getBookmarks();
    return bookmarks.filter(b => b.poetId === poetId);
  }

  /**
   * Get bookmarks by category
   */
  getBookmarksByCategory(categoryId: number): BookmarkItem[] {
    const bookmarks = this.getBookmarks();
    return bookmarks.filter(b => b.categoryId === categoryId);
  }

  /**
   * Check if a poem is bookmarked
   */
  isBookmarked(poemId: number): boolean {
    const bookmarks = this.getBookmarks();
    return bookmarks.some(b => b.poemId === poemId);
  }

  /**
   * Get bookmark by poem ID
   */
  getBookmarkByPoemId(poemId: number): BookmarkItem | null {
    const bookmarks = this.getBookmarks();
    return bookmarks.find(b => b.poemId === poemId) || null;
  }

  /**
   * Update bookmark notes
   */
  updateBookmarkNotes(poemId: number, notes: string): boolean {
    try {
      const bookmarks = this.getBookmarks();
      const bookmarkIndex = bookmarks.findIndex(b => b.poemId === poemId);
      
      if (bookmarkIndex === -1) return false;

      bookmarks[bookmarkIndex].notes = notes;

      if (clientStorage.set(STORAGE_KEY, bookmarks, { version: VERSION })) {
        this.notifyListeners();
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Failed to update bookmark notes', error);
      return false;
    }
  }

  /**
   * Clear all bookmarks
   */
  clearBookmarks(): boolean {
    try {
      if (clientStorage.set(STORAGE_KEY, [], { version: VERSION })) {
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to clear bookmarks', error);
      return false;
    }
  }

  /**
   * Get bookmarks count
   */
  getBookmarksCount(): number {
    return this.getBookmarks().length;
  }

  /**
   * Search bookmarks
   */
  searchBookmarks(query: string): BookmarkItem[] {
    const bookmarks = this.getBookmarks();
    const lowercaseQuery = query.toLowerCase();
    
    return bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowercaseQuery) ||
      bookmark.poetName.toLowerCase().includes(lowercaseQuery) ||
      bookmark.categoryTitle?.toLowerCase().includes(lowercaseQuery) ||
      bookmark.notes?.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get bookmarks grouped by poet
   */
  getBookmarksGroupedByPoet(): Record<string, BookmarkItem[]> {
    const bookmarks = this.getBookmarks();
    const grouped: Record<string, BookmarkItem[]> = {};

    bookmarks.forEach(bookmark => {
      const poetName = bookmark.poetName;
      if (!grouped[poetName]) {
        grouped[poetName] = [];
      }
      grouped[poetName].push(bookmark);
    });

    return grouped;
  }

  /**
   * Get bookmarks grouped by category
   */
  getBookmarksGroupedByCategory(): Record<string, BookmarkItem[]> {
    const bookmarks = this.getBookmarks();
    const grouped: Record<string, BookmarkItem[]> = {};

    bookmarks.forEach(bookmark => {
      const categoryTitle = bookmark.categoryTitle || 'بدون دسته‌بندی';
      if (!grouped[categoryTitle]) {
        grouped[categoryTitle] = [];
      }
      grouped[categoryTitle].push(bookmark);
    });

    return grouped;
  }

  /**
   * Add a listener for bookmark changes
   */
  addListener(callback: (items: BookmarkItem[]) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Setup storage listener for cross-tab synchronization
   */
  private setupStorageListener(): void {
    clientStorage.addStorageListener((key, newValue) => {
      if (key === STORAGE_KEY && newValue) {
        this.notifyListeners();
      }
    });
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
  private notifyListeners(): void {
    const bookmarks = this.getBookmarks();
    this.listeners.forEach(callback => {
      try {
        callback(bookmarks);
      } catch (error) {
        console.warn('Error in bookmark listener', error);
      }
    });
  }
}

// Create singleton instance
export const bookmarksManager = new BookmarksManager();

// Export convenience functions
export const addBookmark = (item: Omit<BookmarkItem, 'id' | 'timestamp'>) => 
  bookmarksManager.addBookmark(item);
export const removeBookmark = (poemId: number) => bookmarksManager.removeBookmark(poemId);
export const getBookmarks = () => bookmarksManager.getBookmarks();
export const getBookmarksByPoet = (poetId: number) => bookmarksManager.getBookmarksByPoet(poetId);
export const getBookmarksByCategory = (categoryId: number) => bookmarksManager.getBookmarksByCategory(categoryId);
export const isBookmarked = (poemId: number) => bookmarksManager.isBookmarked(poemId);
export const getBookmarkByPoemId = (poemId: number) => bookmarksManager.getBookmarkByPoemId(poemId);
export const updateBookmarkNotes = (poemId: number, notes: string) => 
  bookmarksManager.updateBookmarkNotes(poemId, notes);
export const clearBookmarks = () => bookmarksManager.clearBookmarks();
export const getBookmarksCount = () => bookmarksManager.getBookmarksCount();
export const searchBookmarks = (query: string) => bookmarksManager.searchBookmarks(query);
export const getBookmarksGroupedByPoet = () => bookmarksManager.getBookmarksGroupedByPoet();
export const getBookmarksGroupedByCategory = () => bookmarksManager.getBookmarksGroupedByCategory();
export const addBookmarkListener = (callback: (items: BookmarkItem[]) => void) => 
  bookmarksManager.addListener(callback);

// React hooks for components
export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadBookmarks = () => {
      setLoading(true);
      try {
        const bookmarkItems = bookmarksManager.getBookmarks();
        setBookmarks(bookmarkItems);
      } catch (error) {
        console.warn('Failed to load bookmarks', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();

    const unsubscribe = bookmarksManager.addListener(setBookmarks);
    return unsubscribe;
  }, []);

  return { bookmarks, loading };
};

// Import React for hooks
import React from 'react';
