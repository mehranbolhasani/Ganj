'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { searchAll } from '@/lib/supabase-search';
import { Poet, Category, Poem } from '@/lib/types';
import { useToast } from './Toast';
import { simpleApi } from '@/lib/simple-api';
import PoetSelector from './PoetSelector';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowDownLeft01Icon, ArrowLeft01Icon, ArrowUp01Icon, Cancel01Icon, Clock01Icon, FilterIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { toPersianDigits } from '@/lib/persian-digits';

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

const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPoetId, setSelectedPoetId] = useState<number | undefined>(undefined);
  const [poets, setPoets] = useState<Poet[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLElement | null>(null);
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

  // Load poets for filter dropdown
  useEffect(() => {
    const loadPoets = async () => {
      try {
        const poetsData = await simpleApi.getPoets();
        setPoets(poetsData);
      } catch (error) {
        console.error('Failed to load poets:', error);
      }
    };
    loadPoets();
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
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      startTransition(() => {
        setResults([]);
      });
      return;
    }

    setIsLoading(true);

    try {
      // Search using Supabase API (instant full-text search) - limited to 30 for modal preview
      // If poet filter is selected, only search poems for that poet
      const searchType = selectedPoetId ? 'poems' : 'all';
      const { poets, categories, poems } = await searchAll(
        searchQuery,
        30,
        searchType,
        0,
        false,
        selectedPoetId
      );

      const searchResults: SearchResult[] = [];

      // Only include poets if no poet filter is selected
      if (!selectedPoetId) {
        searchResults.push(
          ...poets.map(poet => ({
            type: 'poet' as const,
            data: poet,
            url: `/poet/${poet.id}`,
          })),
          ...categories.map(category => ({
            type: 'category' as const,
            data: category,
            url: `/poet/${category.poetId}/category/${category.id}`,
          }))
        );
      }

      // Always include poems (filtered by poet if selected)
      searchResults.push(
        ...poems.map(poem => ({
          type: 'poem' as const,
          data: poem,
          url: `/poem/${poem.id}`,
        }))
      );

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
  }, [toast, selectedPoetId]);

  // Debounced search - increased to 500ms for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query);
      } else {
        startTransition(() => {
          setResults([]);
        });
      }
    }, 500); // Increased from 300ms to 500ms for better INP

    return () => clearTimeout(timeoutId);
  }, [query, selectedPoetId, search]);

  // Scroll selected item into view when navigating with arrow keys
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
          const url = `/search?q=${encodeURIComponent(query)}${selectedPoetId ? `&poetId=${selectedPoetId}` : ''}`;
          window.location.href = url;
          onClose();
        }
        break;
    }
  }, [isOpen, results, selectedIndex, query, selectedPoetId, onClose, saveSearchHistory]);

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
      setSelectedPoetId(undefined);
    }
  }, [isOpen]);

  // Handle result click
  const handleResultClick = () => {
    saveSearchHistory(query);
    onClose();
  };

  // Highlight matching text in search results
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part) =>
      part.toLowerCase() === highlight.toLowerCase()
        ? `<mark class="bg-accent text-foreground px-0.5 rounded">${part}</mark>`
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

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-20"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-2xl bg-card rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={Search01Icon} size={20} className="text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              placeholder={selectedPoetId ? `جستجو در اشعار ${poets.find(p => p.id === selectedPoetId)?.name || ''}...` : "جستجو در شاعران، مجموعه‌ها و اشعار..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowHistory(query === '')}
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none"
            />

            {/* Poet Filter */}
            <div className="flex items-center gap-2 w-56">
              <HugeiconsIcon icon={FilterIcon} size={16} className="text-muted-foreground shrink-0" />
              <PoetSelector
                poets={poets}
                selectedPoetId={selectedPoetId}
                onSelect={(poetId) => {
                  setSelectedPoetId(poetId);
                  // Trigger search again with new filter
                  if (query.trim()) {
                    search(query);
                  }
                }}
                placeholder="همه شاعران"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground transition-colors"
              aria-label="بستن جستجو"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} aria-hidden="true" />
            </button>

          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-input border-t-muted-foreground rounded-full mx-auto mb-3"></div>
              <p className="text-muted-foreground">در حال جستجو...</p>
            </div>
          ) : !isLoading && query.trim().length === 1 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">
                برای جستجو حداقل ۲ کاراکتر وارد کنید
              </p>
            </div>
          ) : !isLoading && query.trim().length >= 2 && results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                هیچ نتیجه‌ای برای «{query}» یافت نشد
              </p>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="text-muted-foreground dark:text-secondary-foreground hover:text-foreground dark:hover:text-background underline text-sm"
              >
                جستجوی کامل
              </Link>
            </div>
          ) : query.trim().length >= 2 && results.length > 0 ? (
            <>
              {/* Results count */}
              <div className="px-4 py-3 flex items-center justify-between text-sm text-muted-foreground border-b border-border">
                <span>
                  {toPersianDigits(results.length)} نتیجه
                  {selectedPoetId && (
                    <span className="text-muted-foreground">
                      {' '}در اشعار {poets.find(p => p.id === selectedPoetId)?.name}
                    </span>
                  )}
                </span>
                {results.length >= 30 && (
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}${selectedPoetId ? `&poetId=${selectedPoetId}` : ''}`}
                    onClick={onClose}
                    className="text-muted-foreground dark:text-secondary-foreground hover:text-foreground dark:hover:text-background text-xs flex items-center gap-1 border border-border dark:border-input rounded-full py-2 px-2"
                  >
                    مشاهده همه نتایج
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="text-muted-foreground" aria-hidden="true" />
                  </Link>
                )}
              </div>

              {/* Results list */}
              <div className="divide-y divide-border/50">
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

                  // Find the verse(s) that contain the search term
                  // For long texts (>10 verses), show only one line before and after the match
                  let displayVerses: string[] = [];
                  const isLongText = verses.length > 10;
                  let foundIndex = -1;

                  if (verses.length > 0) {
                    const queryLower = query.toLowerCase().trim();
                    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

                    // First, check if keyword exists anywhere in all verses (for debugging)
                    const allVersesText = verses.join(' ').toLowerCase();
                    const keywordExists = allVersesText.includes(queryLower);

                    // Try to find which verse contains the search term
                    // First: exact phrase match (case-insensitive)
                    for (let i = 0; i < verses.length; i++) {
                      const verseLower = verses[i].toLowerCase();
                      if (verseLower.includes(queryLower)) {
                        foundIndex = i;
                        break;
                      }
                    }

                    // Second: if multi-word query, try finding verse with all words
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

                    // Third: try finding any word from the query
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

                    // Fourth: normalize text (remove diacritics and normalize Persian characters) and try again
                    if (foundIndex === -1 && queryLower.length > 1) {
                      const normalizeText = (text: string) => text
                        .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics
                        .replace(/[\u200C\u200D]/g, '') // Remove zero-width characters
                        .replace(/\s+/g, ' ')
                        .trim();

                      const normalizedQuery = normalizeText(queryLower);
                      for (let i = 0; i < verses.length; i++) {
                        const normalizedVerse = normalizeText(verses[i].toLowerCase());
                        if (normalizedVerse.includes(normalizedQuery)) {
                          foundIndex = i;
                          break;
                        }
                      }
                    }

                    // Fifth: if keyword exists in all verses but we still haven't found it,
                    // try searching with different Persian character variations
                    if (foundIndex === -1 && keywordExists && queryLower.length > 1) {
                      // Try searching character by character for better matching
                      const queryChars = queryLower.split('');
                      for (let i = 0; i < verses.length; i++) {
                        const verseLower = verses[i].toLowerCase();
                        // Check if all characters of query appear in order in the verse
                        let charIndex = 0;
                        for (let j = 0; j < verseLower.length && charIndex < queryChars.length; j++) {
                          if (verseLower[j] === queryChars[charIndex]) {
                            charIndex++;
                          }
                        }
                        if (charIndex === queryChars.length) {
                          foundIndex = i;
                          break;
                        }
                      }
                    }

                    // Check if keyword is in title
                    const titleContainsKeyword = title.toLowerCase().includes(queryLower);

                    if (foundIndex >= 0) {
                      // Found keyword in verses - show the matching verse(s)
                      if (isLongText) {
                        // For long texts: show one line before, the match, and one line after
                        displayVerses = [
                          foundIndex > 0 ? verses[foundIndex - 1] : null,
                          verses[foundIndex],
                          foundIndex < verses.length - 1 ? verses[foundIndex + 1] : null
                        ].filter((v): v is string => v !== null);
                      } else {
                        // For short texts: show the beyt containing the match (even index = first hemistich, pair it with next)
                        const beytStart = foundIndex % 2 === 0 ? foundIndex : foundIndex - 1;
                        displayVerses = [
                          verses[beytStart] || '',
                          verses[beytStart + 1] || ''
                        ].filter(v => v);
                      }
                    } else if (titleContainsKeyword) {
                      // Keyword is in title but not found in verses_array
                      // This can happen if verses_array is incomplete or the keyword is in a verse not in the array
                      // Show first verses as fallback
                      if (isLongText) {
                        displayVerses = verses.slice(0, 3);
                      } else {
                        displayVerses = [verses[0], verses[1]].filter(v => v);
                      }
                    } else if (keywordExists) {
                      // Keyword exists somewhere in all verses but we couldn't find the exact verse
                      // This shouldn't happen, but as a fallback, show first verses
                      // Try to find it by searching more thoroughly
                      for (let i = 0; i < verses.length; i++) {
                        const verseText = verses[i].toLowerCase();
                        // Try fuzzy matching - check if most characters match
                        const queryChars = queryLower.split('');
                        let matchCount = 0;
                        for (const char of queryChars) {
                          if (verseText.includes(char)) {
                            matchCount++;
                          }
                        }
                        // If most characters match, consider it a match
                        if (matchCount >= Math.ceil(queryChars.length * 0.7)) {
                          foundIndex = i;
                          break;
                        }
                      }

                      if (foundIndex >= 0) {
                        if (isLongText) {
                          displayVerses = [
                            foundIndex > 0 ? verses[foundIndex - 1] : null,
                            verses[foundIndex],
                            foundIndex < verses.length - 1 ? verses[foundIndex + 1] : null
                          ].filter((v): v is string => v !== null);
                        } else {
                          const beytStart = foundIndex % 2 === 0 ? foundIndex : foundIndex - 1;
                          displayVerses = [
                            verses[beytStart] || '',
                            verses[beytStart + 1] || ''
                          ].filter(v => v);
                        }
                      } else {
                        // Still couldn't find it - show first verses
                        if (isLongText) {
                          displayVerses = verses.slice(0, 3);
                        } else {
                          displayVerses = [verses[0], verses[1]].filter(v => v);
                        }
                      }
                    } else {
                      // No match found in verses - might be in title only or verses_array is incomplete
                      // Still show first verses, but user will see title is highlighted
                      if (isLongText) {
                        displayVerses = verses.slice(0, 3);
                      } else {
                        displayVerses = [verses[0], verses[1]].filter(v => v);
                      }
                    }
                  }

                  return (
                    <Link
                      key={`${result.type}-${data.id}`}
                      ref={(el) => {
                        if (index === selectedIndex && el) {
                          selectedItemRef.current = el as HTMLElement;
                        }
                      }}
                      href={result.url}
                      onClick={handleResultClick}
                      className={`block p-4 hover:bg-background dark:hover:bg-primary/50 transition-colors group ${
                        index === selectedIndex ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Title with highlight */}
                          <h4
                            className="text-[15px] font-medium text-foreground text-right mb-1"
                            dangerouslySetInnerHTML={{ __html: highlightText(title, query) }}
                          />

                          {/* Metadata */}
                          <p
                            className="text-[13px] text-muted-foreground text-right mb-2"
                            dangerouslySetInnerHTML={{
                              __html: isPoet
                                ? 'شاعر'
                                : isCategory
                                  ? highlightText(poetName, query)
                                  : isPoem
                                    ? highlightText(poetName, query) + (categoryTitle ? ` - ${highlightText(categoryTitle, query)}` : '')
                                    : ''
                            }}
                          />

                          {/* Verse preview for poems */}
                          {isPoem && displayVerses.length > 0 && (
                            <div className="text-[13px] text-muted-foreground dark:text-secondary-foreground text-right leading-relaxed space-y-1">
                              {isLongText && foundIndex > 0 && (
                                <span className="text-muted-foreground dark:text-muted-foreground text-xs">...</span>
                              )}
                              {displayVerses.map((verse, vIndex) => {
                                // For long texts, the middle line (index 1) is the match if we have 3 lines
                                // If we have 2 lines, the first is the match (when foundIndex is 0)
                                // If we have 2 lines and foundIndex > 0, the second is the match
                                let isMatchLine = false;
                                if (isLongText && foundIndex >= 0) {
                                  if (displayVerses.length === 3) {
                                    isMatchLine = vIndex === 1; // Middle line is always the match
                                  } else if (displayVerses.length === 2) {
                                    isMatchLine = foundIndex === 0 ? vIndex === 0 : vIndex === 1;
                                  } else {
                                    isMatchLine = vIndex === 0; // Single line
                                  }
                                }
                                return (
                                  <p
                                    key={vIndex}
                                    className={isMatchLine ? '' : 'opacity-75'}
                                    dangerouslySetInnerHTML={{ __html: highlightText(verse, query) }}
                                  />
                                );
                              })}
                              {isLongText && foundIndex >= 0 && foundIndex < verses.length - 1 && (
                                <span className="text-muted-foreground dark:text-muted-foreground text-xs">...</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Arrow indicator */}
                        <div className="flex-shrink-0 pt-1">
                          <HugeiconsIcon icon={ArrowDownLeft01Icon} size={16} className="text-muted-foreground group-hover:text-secondary-foreground dark:group-hover:text-secondary-foreground transition-colors" aria-hidden="true" />
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
                <h3 className="text-sm font-medium text-muted-foreground">جستجوهای اخیر</h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground hover:text-secondary-foreground dark:hover:text-secondary-foreground"
                >
                  پاک کردن
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item.query)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-background dark:hover:bg-secondary transition-colors text-right"
                >
                  <HugeiconsIcon icon={Clock01Icon} size={16} className="text-muted-foreground" />
                  <span className="text-secondary-foreground">{item.query}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-background dark:bg-secondary/50 rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                <span>انتخاب</span>
              </span>
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={ArrowDownLeft01Icon} size={14} />
                <span>باز کردن</span>
              </span>
            </div>
            <span>Esc برای بستن</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
