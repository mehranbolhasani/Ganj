'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { Search, X, FileText, Heart } from 'lucide-react';
import { searchAll } from '@/lib/supabase-search';
import { Poem } from '@/lib/types';
import { useBookmarks } from '@/lib/bookmarks-manager';

interface PoetSearchProps {
  poetId: number;
  poetName: string;
}

const PoetSearch = ({ poetId, poetName }: PoetSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Poem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLElement | null>(null);
  const currentSearchIdRef = useRef<number>(0);
  const { bookmarks } = useBookmarks();
  
  // Search function - only searches poems for this poet
  const search = useCallback(async (searchQuery: string, searchId: number, targetPoetId: number) => {
    if (!searchQuery.trim()) {
      startTransition(() => {
        setResults([]);
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Search only poems for this specific poet
      const { poems } = await searchAll(searchQuery, 20, 'poems', 0, false, targetPoetId);
      
      // Only update results if:
      // 1. This is still the latest search
      // 2. The poetId hasn't changed
      // 3. All results belong to the target poet
      if (currentSearchIdRef.current === searchId && targetPoetId === poetId) {
        // Filter results to ensure they all belong to the current poet
        const validPoems = (poems || []).filter(poem => poem.poetId === targetPoetId);
        
        // Debug log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PoetSearch] Search completed for poetId: ${targetPoetId}, found ${validPoems.length} poems`);
          if (validPoems.length > 0 && validPoems[0].poetId !== targetPoetId) {
            console.warn(`[PoetSearch] WARNING: First poem has wrong poetId! Expected ${targetPoetId}, got ${validPoems[0].poetId}`);
          }
        }
        
        startTransition(() => {
          setResults(validPoems);
          setSelectedIndex(0);
        });
      } else {
        // Debug log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[PoetSearch] Search result discarded - searchId mismatch or poetId changed`);
        }
      }
    } catch (error) {
      // Only handle error if this is still the latest search and poetId matches
      if (currentSearchIdRef.current === searchId && targetPoetId === poetId) {
        console.error('Poet search failed:', error);
      }
    } finally {
      // Only clear loading if this is still the latest search and poetId matches
      if (currentSearchIdRef.current === searchId && targetPoetId === poetId) {
        setIsLoading(false);
      }
    }
  }, [poetId]);

  // Debounced search
  useEffect(() => {
    // Increment search ID to invalidate any pending searches
    currentSearchIdRef.current += 1;
    const searchId = currentSearchIdRef.current;
    const currentPoetId = poetId; // Capture current poetId
    
    const timeoutId = setTimeout(() => {
      // Check if this is still the latest search and poetId hasn't changed
      if (currentSearchIdRef.current === searchId && currentPoetId === poetId) {
        if (query.trim()) {
          search(query, searchId, currentPoetId);
        } else {
          startTransition(() => {
            setResults([]);
          });
        }
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query, poetId, search]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && results.length > 0) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex, results.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (isExpanded) {
          setIsExpanded(false);
          setQuery('');
          setResults([]);
        }
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
          const selectedPoem = results[selectedIndex];
          window.location.href = `/poem/${selectedPoem.id}`;
        }
        break;
    }
  }, [isExpanded, results, selectedIndex]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Reset state when collapsed
  useEffect(() => {
    if (!isExpanded) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isExpanded]);

  // Reset state when poetId changes (user navigated to different poet)
  useEffect(() => {
    // Invalidate any pending searches by incrementing search ID
    currentSearchIdRef.current += 1;
    
    // Immediately clear results - don't wait for transition
    setResults([]);
    setQuery('');
    setSelectedIndex(0);
    setIsExpanded(false);
    setIsLoading(false);
    
    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PoetSearch] Reset for poetId: ${poetId}, poetName: ${poetName}`);
    }
  }, [poetId, poetName]);

  // Highlight matching text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? `<mark class="bg-yellow-200 dark:bg-yellow-600/40 text-stone-900 dark:text-stone-100 px-0.5 rounded">${part}</mark>`
        : part
    ).join('');
  };

  // Find matching verse
  const findMatchingVerse = (verses: string[], searchQuery: string): string => {
    if (verses.length === 0) return '';
    
    const queryLower = searchQuery.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    let foundIndex = -1;
    
    // Exact phrase match
    for (let i = 0; i < verses.length; i++) {
      const verseLower = verses[i].toLowerCase();
      if (verseLower.includes(queryLower)) {
        foundIndex = i;
        break;
      }
    }
    
    // Multi-word match
    if (foundIndex === -1 && queryWords.length > 1) {
      for (let i = 0; i < verses.length; i++) {
        const verseLower = verses[i].toLowerCase();
        const hasAllWords = queryWords.every(word => verseLower.includes(word));
        if (hasAllWords) {
          foundIndex = i;
          break;
        }
      }
    }
    
    // Any word match
    if (foundIndex === -1 && queryWords.length > 0) {
      for (let i = 0; i < verses.length; i++) {
        const verseLower = verses[i].toLowerCase();
        const hasAnyWord = queryWords.some(word => verseLower.includes(word));
        if (hasAnyWord) {
          foundIndex = i;
          break;
        }
      }
    }
    
    return foundIndex >= 0 ? verses[foundIndex] : (verses[0] || '');
  };

  return (
    <div className="relative w-full mb-6">
      {/* Search Toggle Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white/50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700/50 transition-colors text-right"
        >
          <Search className="w-5 h-5 text-stone-500 dark:text-stone-400" />
          <span className="text-stone-600 dark:text-stone-400">جستجو در اشعار {poetName}...</span>
        </button>
      )}

      {/* Expanded Search */}
      {isExpanded && (
        <div className="bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg backdrop-blur-md">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-stone-200 dark:border-stone-700">
            <Search className="w-5 h-5 text-stone-500 dark:text-stone-400" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`جستجو در اشعار ${poetName}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none"
            />
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
              aria-label="بستن جستجو"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Results */}
          {query.trim() && (
            <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-stone-300 dark:border-stone-600 border-t-stone-600 dark:border-t-stone-300 rounded-full mx-auto mb-3"></div>
                  <p className="text-stone-600 dark:text-stone-400">در حال جستجو...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-stone-600 dark:text-stone-400">
                    هیچ شعری یافت نشد
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200 dark:divide-stone-700/50">
                  {results
                    .filter(poem => poem.poetId === poetId) // Double-check: filter out any poems not from current poet
                    .map((poem, index) => {
                    const displayVerse = findMatchingVerse(poem.verses || [], query);
                    const isBookmarked = bookmarks.some(b => b.poemId === poem.id);
                    
                    return (
                      <Link
                        key={`${poetId}-${poem.id}`} // Include poetId in key to force remount on poet change
                        ref={(el) => {
                          if (index === selectedIndex && el) {
                            selectedItemRef.current = el as HTMLElement;
                          }
                        }}
                        href={`/poem/${poem.id}`}
                        className={`block p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${
                          index === selectedIndex ? 'bg-stone-100 dark:bg-yellow-800/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Title */}
                            <div className="flex items-center gap-2 mb-1">
                              <h4 
                                className="font-abar text-[15px] font-medium text-stone-900 dark:text-stone-100 text-right"
                                dangerouslySetInnerHTML={{ __html: highlightText(poem.title, query) }}
                              />
                              {isBookmarked && (
                                <Heart className="w-4 h-4 text-red-500 fill-current shrink-0" />
                              )}
                            </div>
                            
                            {/* Category */}
                            {poem.categoryTitle && (
                              <p className="text-[13px] text-stone-600 dark:text-stone-400 text-right mb-2">
                                {poem.categoryTitle}
                              </p>
                            )}
                            
                            {/* Verse preview */}
                            {displayVerse && (
                              <p 
                                className="text-[13px] text-stone-600 dark:text-stone-300 text-right leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: highlightText(displayVerse, query) }}
                              />
                            )}
                          </div>
                          
                          <FileText className="w-4 h-4 text-stone-400 shrink-0 mt-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PoetSearch;

