'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Users, BookOpen, FileText, Heart } from 'lucide-react';
import { searchAll } from '@/lib/supabase-search';
import { Poet, Category, Poem, SearchResponse } from '@/lib/types';
import { PoemCardSkeleton } from './LoadingStates';
import { useBookmarks } from '@/lib/bookmarks-manager';

interface SearchResultsProps {
  query: string;
  type: 'all' | 'poets' | 'categories' | 'poems';
  page: number;
}

const ITEMS_PER_PAGE = 20;

const SearchResults = ({ query, type, page }: SearchResultsProps) => {
  const [results, setResults] = useState<{
    poets: Poet[];
    categories: Category[];
    poems: Poem[];
  }>({ poets: [], categories: [], poems: [] });
  const [totalCounts, setTotalCounts] = useState<{
    poets: number;
    categories: number;
    poems: number;
  }>({ poets: 0, categories: 0, poems: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'poets' | 'categories' | 'poems'>(type);
  
  const { bookmarks } = useBookmarks();

  // Search function using Supabase with server-side pagination
  const search = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      let searchResults: SearchResponse;
      
      if (activeTab === 'all') {
        // For "all" tab, fetch larger batches and paginate client-side
        // Fetch enough items to cover multiple pages
        const batchSize = ITEMS_PER_PAGE * 5; // Fetch 5 pages worth
        const batchPage = Math.floor((page - 1) / 5) + 1; // Which batch we're in
        const offset = (batchPage - 1) * batchSize;
        
        searchResults = await searchAll(
          query, 
          batchSize, 
          'all',
          offset,
          batchPage === 1 // Get counts only on first batch
        );
      } else {
        // For specific tabs, use proper server-side pagination
        const offset = (page - 1) * ITEMS_PER_PAGE;
        
        searchResults = await searchAll(
          query, 
          ITEMS_PER_PAGE, 
          activeTab,
          offset,
          page === 1 // Get counts only on first page
        );
      }
      
      setResults({
        poets: searchResults.poets || [],
        categories: searchResults.categories || [],
        poems: searchResults.poems || [],
      });
      
      // Update total counts if available
      if (page === 1) {
        setTotalCounts({
          poets: searchResults.totalPoets || searchResults.poets?.length || 0,
          categories: searchResults.totalCategories || searchResults.categories?.length || 0,
          poems: searchResults.totalPoems || searchResults.poems?.length || 0,
        });
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('خطا در جستجو. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  }, [query, page, activeTab]);

  useEffect(() => {
    search();
  }, [query, search]);

  // Filter results based on active tab
  // Also filter out categories that match poet names (these are usually parent/root categories)
  const filteredResults = useMemo(() => {
    // Normalize text for comparison (remove extra spaces, diacritics, etc.)
    const normalizeText = (text: string) => text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u064B-\u065F\u0670]/g, '') // Remove diacritics
      .replace(/[\u200C\u200D]/g, ''); // Remove zero-width characters
    
    // Get all poet names for filtering (normalized)
    const poetNames = new Set(results.poets.map(p => normalizeText(p.name)));
    
    // Filter out categories that match poet names
    const filteredCategories = results.categories.filter(cat => {
      const categoryTitle = normalizeText(cat.title);
      // Check if category title exactly matches any poet name (normalized)
      return !poetNames.has(categoryTitle);
    });
    
    switch (activeTab) {
      case 'poets':
        return { poets: results.poets, categories: [], poems: [] };
      case 'categories':
        return { poets: [], categories: filteredCategories, poems: [] };
      case 'poems':
        return { poets: [], categories: [], poems: results.poems };
      default:
        return { ...results, categories: filteredCategories };
    }
  }, [activeTab, results]);

  // Pagination - now using server-side pagination
  // Calculate total results based on active tab
  let totalResults = 0;
  if (activeTab === 'all') {
    totalResults = totalCounts.poets + totalCounts.categories + totalCounts.poems;
  } else if (activeTab === 'poets') {
    totalResults = totalCounts.poets;
  } else if (activeTab === 'categories') {
    totalResults = totalCounts.categories;
  } else if (activeTab === 'poems') {
    totalResults = totalCounts.poems;
  }
  
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  // Combine results
  const allResults = [
    ...filteredResults.poets.map(item => ({ type: 'poet' as const, data: item })),
    ...filteredResults.categories.map(item => ({ type: 'category' as const, data: item })),
    ...filteredResults.poems.map(item => ({ type: 'poem' as const, data: item })),
  ];
  
  // For "all" tab, paginate client-side from the fetched batch
  // For specific tabs, results are already paginated from server
  let paginatedResults = allResults;
  if (activeTab === 'all') {
    const batchPage = Math.floor((page - 1) / 5) + 1;
    const pageInBatch = ((page - 1) % 5) + 1;
    const startIndex = (pageInBatch - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    paginatedResults = allResults.slice(startIndex, endIndex);
  }

  // Generate page URLs
  const generatePageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (activeTab !== 'all') params.set('type', activeTab);
    if (newPage > 1) params.set('page', newPage.toString());
    return `/search?${params.toString()}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {['all', 'poets', 'categories', 'poems'].map((tab) => (
            <div key={tab} className="h-10 w-20 bg-stone-200 dark:bg-stone-700 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PoemCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
          خطا در جستجو
        </h3>
        <p className="text-stone-500 dark:text-stone-400 mb-4">{error}</p>
        <button
          onClick={search}
          className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  // Highlight matching text in search results
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part) => 
      part.toLowerCase() === highlight.toLowerCase() 
        ? `<mark class="bg-yellow-200 dark:bg-yellow-600/40 text-stone-900 dark:text-stone-100 px-0.5 rounded">${part}</mark>`
        : part
    ).join('');
  };

  return (
    <div className="space-y-6">
      {/* Tabs - Always show tabs so users can switch even when current tab has no results */}
      {/* Mobile: Horizontal scrollable, Desktop: Normal flex */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 border-b border-stone-200 dark:border-stone-700 min-w-max sm:min-w-0">
          {[
            { key: 'all', label: 'همه', count: totalResults, icon: Search },
            { key: 'poets', label: 'شاعران', count: totalCounts.poets, icon: Users },
            { key: 'categories', label: 'مجموعه‌ها', count: totalCounts.categories, icon: BookOpen },
            { key: 'poems', label: 'اشعار', count: totalCounts.poems, icon: FileText },
          ].map(({ key, label, count, icon: Icon }) => {
            const handleTabClick = () => {
              setActiveTab(key as 'all' | 'poets' | 'categories' | 'poems');
              // Update URL without page parameter when switching tabs
              const params = new URLSearchParams();
              params.set('q', query);
              if (key !== 'all') params.set('type', key);
              window.history.pushState({}, '', `/search?${params.toString()}`);
            };
            
            return (
              <button
                key={key}
                onClick={handleTabClick}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 touch-manipulation ${
                  activeTab === key
                    ? 'border-stone-800 dark:border-stone-200 text-stone-900 dark:text-stone-100'
                    : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{label}</span>
                <span className="bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results or Empty State */}
      {totalResults === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
            هیچ نتیجه‌ای یافت نشد
          </h3>
          <p className="text-stone-500 dark:text-stone-400">
            برای &quot;{query}&quot; در این دسته هیچ نتیجه‌ای پیدا نشد. سعی کنید دسته دیگری را انتخاب کنید یا کلمات کلیدی دیگری جستجو کنید.
          </p>
        </div>
      ) : (
        <>
          {/* Results */}
          <div className="space-y-4">
            {paginatedResults.map(({ type, data }) => (
              <div key={`${type}-${data.id}`}>
                {type === 'poet' && <PoetResultCard poet={data as Poet} query={query} highlightText={highlightText} />}
                {type === 'category' && <CategoryResultCard category={data as Category} query={query} highlightText={highlightText} />}
                {type === 'poem' && <PoemResultCard poem={data as Poem} isBookmarked={bookmarks.some(b => b.poemId === data.id)} query={query} highlightText={highlightText} />}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={generatePageUrl(page - 1)}
              className="px-3 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              قبلی
            </Link>
          )}
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <Link
                  key={pageNum}
                  href={generatePageUrl(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    page === pageNum
                      ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>
          
          {page < totalPages && (
            <Link
              href={generatePageUrl(page + 1)}
              className="px-3 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              بعدی
            </Link>
          )}
        </div>
      )}

          {/* Page Info */}
          <div className="text-center text-sm text-stone-500 dark:text-stone-400">
            صفحه {page} از {totalPages} • {totalResults} نتیجه
          </div>
        </>
      )}
    </div>
  );
};

const PoetResultCard = ({ poet, query, highlightText }: { poet: Poet; query: string; highlightText: (text: string, highlight: string) => string }) => {
  return (
    <Link
      href={`/poet/${poet.id}`}
      className="block p-4 sm:p-6 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-stone-200 dark:bg-stone-600 rounded-full flex items-center justify-center shrink-0">
          <Users className="w-6 h-6 text-stone-600 dark:text-stone-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold text-stone-900 dark:text-stone-100 text-right mb-1"
            dangerouslySetInnerHTML={{ __html: highlightText(poet.name, query) }}
          />
          {poet.description && (
            <p 
              className="text-sm text-stone-600 dark:text-stone-400 text-right line-clamp-2"
              dangerouslySetInnerHTML={{ __html: highlightText(poet.description, query) }}
            />
          )}
        </div>
      </div>
    </Link>
  );
};

const CategoryResultCard = ({ category, query, highlightText }: { category: Category; query: string; highlightText: (text: string, highlight: string) => string }) => {
  return (
    <Link
      href={`/poet/${category.poetId}/category/${category.id}`}
      className="block p-4 sm:p-6 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-stone-200 dark:bg-stone-600 rounded-lg flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-stone-600 dark:text-stone-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold text-stone-900 dark:text-stone-100 text-right mb-1"
            dangerouslySetInnerHTML={{ __html: highlightText(category.title, query) }}
          />
          {category.description && (
            <p 
              className="text-sm text-stone-600 dark:text-stone-400 text-right line-clamp-2"
              dangerouslySetInnerHTML={{ __html: highlightText(category.description, query) }}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

const PoemResultCard = ({ poem, isBookmarked, query, highlightText }: { poem: Poem; isBookmarked: boolean; query: string; highlightText: (text: string, highlight: string) => string }) => {
  // Find the verse that contains the search keyword (same logic as GlobalSearch)
  const findMatchingVerse = (verses: string[], searchQuery: string): string => {
    if (verses.length === 0) return '';
    
    const queryLower = searchQuery.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    let foundIndex = -1;
    
    // First, check if keyword exists anywhere in all verses
    const allVersesText = verses.join(' ').toLowerCase();
    const keywordExists = allVersesText.includes(queryLower);
    
    // First: exact phrase match
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
    
    // Fourth: normalize text (remove diacritics and zero-width characters) and try again
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
    
    // Fifth: character sequence match
    if (foundIndex === -1 && keywordExists && queryLower.length > 1) {
      const queryChars = queryLower.split('');
      for (let i = 0; i < verses.length; i++) {
        const verseLower = verses[i].toLowerCase();
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
    
    // Sixth: fuzzy matching if keyword exists but exact match failed
    if (foundIndex === -1 && keywordExists && queryLower.length > 1) {
      for (let i = 0; i < verses.length; i++) {
        const verseText = verses[i].toLowerCase();
        const queryChars = queryLower.split('');
        let matchCount = 0;
        for (const char of queryChars) {
          if (verseText.includes(char)) {
            matchCount++;
          }
        }
        if (matchCount >= Math.ceil(queryChars.length * 0.7)) {
          foundIndex = i;
          break;
        }
      }
    }
    
    // Return the matching verse, or first verse if no match found
    if (foundIndex >= 0) {
      return verses[foundIndex];
    }
    
    // Fallback to first verse
    return verses[0] || '';
  };
  
  const displayVerse = poem.verses.length > 0 ? findMatchingVerse(poem.verses, query) : '';
  
  return (
    <Link
      href={`/poem/${poem.id}`}
      className="block p-4 sm:p-6 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 active:scale-[0.98] transition-all duration-200 touch-manipulation backdrop-blur-md"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-yellow-800/40 dark:bg-yellow-800/30 rounded-xl flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-700 dark:text-yellow-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 
              className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 text-right leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
              dangerouslySetInnerHTML={{ __html: highlightText(poem.title, query) }}
            />
            {isBookmarked && (
              <Heart className="w-5 h-5 text-red-500 fill-current shrink-0" />
            )}
          </div>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 text-right mb-2 font-medium">
            {poem.poetName}
            {poem.categoryTitle && ` • ${poem.categoryTitle}`}
          </p>
          {displayVerse && (
            <p 
              className="text-sm sm:text-base text-stone-500 dark:text-stone-500 text-right line-clamp-2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightText(displayVerse, query) }}
            />
          )}
        </div>
      </div>
    </Link>
  );
};

export default SearchResults;
