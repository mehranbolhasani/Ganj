'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, Clock, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { Poet, Category, Poem } from '@/lib/types';
import { useToast } from './Toast';
import { searchIndex } from '@/lib/search-index';

interface SearchResult {
  type: 'poet' | 'category' | 'poem';
  data: Poet | Category | Poem;
  url: string;
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [indexReady, setIndexReady] = useState(false);
  const [indexProgress, setIndexProgress] = useState<{ status: 'ready' | 'loading' | 'building'; progress: number; message?: string }>({ 
    status: 'loading', 
    progress: 0 
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Cache for recent searches (to avoid re-searching same queries)
  const searchCacheRef = useRef<Map<string, SearchResult[]>>(new Map());
  
  // Poll index progress when modal is open and index is building
  useEffect(() => {
    if (!isOpen) return;
    
    const updateProgress = () => {
      const progress = searchIndex.getProgress();
      setIndexProgress(progress);
      setIndexReady(progress.status === 'ready');
    };
    
    updateProgress();
    const interval = setInterval(updateProgress, 500); // Update every 500ms
    
    return () => clearInterval(interval);
  }, [isOpen]);

  // Check if index is ready and ensure it's initialized when modal opens
  useEffect(() => {
    if (isOpen) {
      // Check current state
      setIndexReady(searchIndex.isIndexed);
      
      // Ensure index is initialized (won't rebuild if already ready)
      searchIndex.initialize().then(() => {
        setIndexReady(searchIndex.isIndexed);
      }).catch(() => {
        // Index failed to initialize, will fall back to API
        setIndexReady(false);
      });
    }
  }, [isOpen]);
  
  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ganj_search_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [
      { query: query.trim(), timestamp: Date.now() },
      ...searchHistory.filter(item => item.query !== query.trim())
    ].slice(0, 10); // Keep only last 10 searches
    
    setSearchHistory(newHistory);
    localStorage.setItem('ganj_search_history', JSON.stringify(newHistory));
  }, [searchHistory]);

  // Search function with caching and consistent performance
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    // Check cache first for instant results
    const cacheKey = searchQuery.trim().toLowerCase();
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      setResults(cached);
      setSelectedIndex(0);
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      // Don't wait for index if it's still building - use API immediately for faster response
      // Only check if index is already ready, don't wait for initialization
      let waitedForIndex = false;
      if (searchIndex.isIndexed || indexReady) {
        // Index is ready, will use it
        waitedForIndex = false; // Already ready, no waiting
      } else {
        // Index not ready - don't wait, just use API immediately
        // This prevents blocking on index initialization (can take 30+ seconds)
        console.log('[GlobalSearch] Index not ready, using API immediately (no wait)');
      }

      // Increased limits for better search coverage
      // If index is ready, these will be instant FlexSearch results
      // If not ready, they'll fall back to API search (slower)
      const [poets, categories, poems] = await Promise.all([
        ganjoorApi.searchPoets(searchQuery, 10),
        ganjoorApi.searchCategories(searchQuery, 10),
        ganjoorApi.searchPoems(searchQuery, 50), // Increased from 10 to 50 for more results
      ]);
      
      const searchTime = performance.now() - startTime;
      console.log(`[GlobalSearch] Search "${searchQuery}": ${poets.length} poets, ${categories.length} categories, ${poems.length} poems (${Math.round(searchTime)}ms${waitedForIndex ? ', waited for index' : ''})`);

      const searchResults: SearchResult[] = [
        ...poets.map(poet => ({
          type: 'poet' as const,
          data: poet,
          url: `/poet/${poet.id}`,
        })),
        ...categories.map(category => ({
          type: 'category' as const,
          data: category,
          url: `/poet/${category.poetId}/category/${category.id}`,
        })),
        ...poems.map(poem => ({
          type: 'poem' as const,
          data: poem,
          url: `/poem/${poem.id}`,
        })),
      ];

      // Cache results (keep cache size reasonable - max 50 entries)
      if (searchCacheRef.current.size >= 50) {
        const firstKey = searchCacheRef.current.keys().next().value;
        if (firstKey) {
          searchCacheRef.current.delete(firstKey);
        }
      }
      searchCacheRef.current.set(cacheKey, searchResults);

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('خطا در جستجو', 'لطفاً دوباره تلاش کنید');
    } finally {
      setIsLoading(false);
    }
  }, [toast, indexReady]);

  // Debounced search with shorter delay for better responsiveness
  useEffect(() => {
    // Clear cache when query changes significantly (to force fresh search)
    if (query.trim().length === 0) {
      searchCacheRef.current.clear();
    }

    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        search(query);
      } else {
        setResults([]);
      }
    }, 200); // Reduced from 300ms to 200ms for faster response

    return () => clearTimeout(timeoutId);
  }, [query, search]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results.length > 0 && selectedIndex < results.length) {
          const selectedResult = results[selectedIndex];
          saveSearchHistory(query);
          window.location.href = selectedResult.url;
          onClose();
        } else if (query.trim()) {
          saveSearchHistory(query);
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
          onClose();
        }
        break;
    }
  }, [isOpen, results, selectedIndex, query, onClose, saveSearchHistory]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setShowHistory(false);
    }
  }, [isOpen]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    console.log('Result clicked:', result);
    saveSearchHistory(query);
    onClose();
  };

  // Handle history item click
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('ganj_search_history');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-20">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-800 rounded-xl shadow-xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-stone-200 dark:border-stone-700">
          <Search className="w-5 h-5 text-stone-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="جستجو در شاعران، مجموعه‌ها و اشعار..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowHistory(query === '')}
            className="flex-1 bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-stone-300 dark:border-stone-600 border-t-stone-600 dark:border-t-stone-300 rounded-full mx-auto mb-3"></div>
              <p className="text-stone-500 dark:text-stone-400 mb-2">
                {indexReady 
                  ? 'در حال جستجو...' 
                  : indexProgress.status === 'building'
                  ? (indexProgress.message || 'در حال آماده‌سازی جستجو...')
                  : 'در حال بارگذاری...'}
              </p>
              {indexProgress.status === 'building' && indexProgress.progress > 0 && (
                <div className="w-full max-w-xs mx-auto mt-3">
                  <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-stone-600 dark:bg-stone-400 transition-all duration-500 ease-out"
                      style={{ width: `${indexProgress.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
                    {indexProgress.progress}% تکمیل شده • این فرآیند یک‌بار انجام می‌شود
                  </p>
                </div>
              )}
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-stone-500 dark:text-stone-400 mb-2">
                هیچ نتیجه‌ای یافت نشد
              </p>
              {!indexReady && (
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
                  در حال آماده‌سازی جستجو. لطفاً چند لحظه صبر کنید و دوباره جستجو کنید.
                </p>
              )}
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 underline"
              >
                جستجوی کامل
              </Link>
            </div>
          ) : query.trim() ? (
            <div className="py-2">
              {results.map((result, index) => (
                <Link
                  key={`${result.type}-${result.data.id}`}
                  href={result.url}
                  onClick={() => handleResultClick(result)}
                  className={`block p-3 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors ${
                    index === selectedIndex ? 'bg-stone-50 dark:bg-stone-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {result.type === 'poet' && <div className="w-8 h-8 bg-stone-200 dark:bg-stone-600 rounded-full"></div>}
                      {result.type === 'category' && <div className="w-8 h-8 bg-blue-200 dark:bg-blue-600 rounded"></div>}
                      {result.type === 'poem' && <div className="w-8 h-8 bg-green-200 dark:bg-green-600 rounded"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-stone-900 dark:text-stone-100 text-right truncate">
                        {result.type === 'poet' ? (result.data as Poet).name : (result.data as Category | Poem).title}
                      </h4>
                      <p className="text-sm text-stone-500 dark:text-stone-400 text-right">
                        {result.type === 'poet' && 'شاعر'}
                        {result.type === 'category' && `مجموعه • ${(result.data as Category).poetId}`}
                        {result.type === 'poem' && `شعر • ${(result.data as Poem).poetName}`}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {index === selectedIndex && <ArrowRight className="w-4 h-4 text-stone-400" />}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : showHistory && searchHistory.length > 0 ? (
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-sm font-medium text-stone-600 dark:text-stone-400">جستجوهای اخیر</h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                >
                  پاک کردن
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item.query)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-right"
                >
                  <Clock className="w-4 h-4 text-stone-400" />
                  <span className="text-stone-700 dark:text-stone-300">{item.query}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700/50 rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                <ArrowDown className="w-3 h-3" />
                <span>انتخاب</span>
              </span>
              <span className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                <span>باز کردن</span>
              </span>
            </div>
            <span>Esc برای بستن</span>
          </div>
        </div>
      </div>
    </div>
  );
}
