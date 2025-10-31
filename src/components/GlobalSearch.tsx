'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Search, X, Clock, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { searchAll } from '@/lib/supabase-search';
import { Poet, Category, Poem } from '@/lib/types';
import { useToast } from './Toast';

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
  const [isPending, startTransition] = useTransition();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
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

  // Search function using Supabase (instant, no indexing wait)
  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      startTransition(() => {
        setResults([]);
      });
      return;
    }

    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      // Search using Supabase API (instant full-text search) - limited to 20 for performance
      const { poets, categories, poems } = await searchAll(searchQuery, 20);
      
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

      // Use startTransition to make updates non-blocking
      startTransition(() => {
        setResults(searchResults);
        setSelectedIndex(0);
      });
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('خطا در جستجو', 'لطفاً دوباره تلاش کنید');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Debounced search - increased to 500ms for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        search(query);
      } else {
        startTransition(() => {
          setResults([]);
        });
      }
    }, 500); // Increased from 300ms to 500ms for better INP

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
    saveSearchHistory(query);
    onClose();
  };
  
  // Highlight matching text in search results
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? `<mark class="bg-yellow-200 dark:bg-yellow-600/40 text-stone-900 dark:text-stone-100 px-0.5 rounded">${part}</mark>`
        : part
    ).join('');
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
              <p className="text-stone-500 dark:text-stone-400">در حال جستجو...</p>
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                هیچ نتیجه‌ای یافت نشد
              </p>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 underline"
              >
                جستجوی کامل
              </Link>
            </div>
          ) : query.trim() ? (
            <>
              {/* Results count */}
              <div className="px-4 py-3 text-sm text-stone-500 dark:text-stone-400 border-b border-stone-200 dark:border-stone-700">
                {results.length} نتیجه
              </div>
              
              {/* Results list */}
              <div className="divide-y divide-stone-200 dark:divide-stone-700/50">
                {results.map((result, index) => {
                  const isPoet = result.type === 'poet';
                  const isCategory = result.type === 'category';
                  const isPoem = result.type === 'poem';
                  
                  const data = result.data as Poet | Category | Poem;
                  const title = isPoet ? (data as Poet).name : (data as Category | Poem).title;
                  
                  let poetName = '';
                  let categoryTitle = '';
                  let verses: string[] = [];
                  
                  if (isPoem) {
                    const poemData = data as Poem;
                    poetName = poemData.poetName || '';
                    categoryTitle = poemData.categoryTitle || '';
                    verses = poemData.verses || [];
                  } else if (isCategory) {
                    // Category doesn't have poetName in our types, skip it
                    poetName = '';
                  }
                  
                  // Find the beyt (couplet) that contains the search term
                  // A beyt = 2 verses (hemistiches)
                  let displayVerses: string[] = [];
                  if (verses.length > 0) {
                    // Try to find which beyt contains the search term
                    let foundIndex = -1;
                    for (let i = 0; i < verses.length; i++) {
                      if (verses[i].toLowerCase().includes(query.toLowerCase())) {
                        foundIndex = i;
                        break;
                      }
                    }
                    
                    if (foundIndex >= 0) {
                      // Show the beyt containing the match (even index = first hemistich, pair it with next)
                      const beytStart = foundIndex % 2 === 0 ? foundIndex : foundIndex - 1;
                      displayVerses = [
                        verses[beytStart] || '',
                        verses[beytStart + 1] || ''
                      ].filter(v => v);
                    } else {
                      // No match found (might be in title), show first beyt
                      displayVerses = [verses[0], verses[1]].filter(v => v);
                    }
                  }
                  
                  return (
                    <Link
                      key={`${result.type}-${data.id}`}
                      href={result.url}
                      onClick={() => handleResultClick(result)}
                      className={`block p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group ${
                        index === selectedIndex ? 'bg-stone-100 dark:bg-yellow-800/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Title with highlight */}
                          <h4 
                            className="font-abar text-[15px] font-medium text-stone-900 dark:text-stone-100 text-right mb-1"
                            dangerouslySetInnerHTML={{ __html: highlightText(title, query) }}
                          />
                          
                          {/* Metadata */}
                          <p className="text-[13px] text-stone-500 dark:text-stone-400 text-right mb-2">
                            {isPoet && 'شاعر'}
                            {isCategory && `${poetName}`}
                            {isPoem && (
                              <>
                                {poetName}
                                {categoryTitle && ` - ${categoryTitle}`}
                              </>
                            )}
                          </p>
                          
                          {/* Beyt preview for poems (both hemistiches) */}
                          {isPoem && displayVerses.length > 0 && (
                            <div className="text-[13px] text-stone-600 dark:text-stone-300 text-right leading-relaxed space-y-1">
                              {displayVerses.map((verse, vIndex) => (
                                <p 
                                  key={vIndex}
                                  dangerouslySetInnerHTML={{ __html: highlightText(verse, query) }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Arrow indicator */}
                        <div className="flex-shrink-0 pt-1">
                          <CornerDownLeft className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
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
                <CornerDownLeft className="w-3 h-3" />
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
