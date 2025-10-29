'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Users, BookOpen, FileText, Heart } from 'lucide-react';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { Poet, Category, Poem } from '@/lib/types';
import { PoemCardSkeleton } from './LoadingStates';
import { useBookmarks } from '@/lib/bookmarks-manager';

interface SearchResultsProps {
  query: string;
  type: 'all' | 'poets' | 'categories' | 'poems';
  page: number;
}

const ITEMS_PER_PAGE = 20;

function SearchResults({ query, type, page }: SearchResultsProps) {
  const [results, setResults] = useState<{
    poets: Poet[];
    categories: Category[];
    poems: Poem[];
  }>({ poets: [], categories: [], poems: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'poets' | 'categories' | 'poems'>(type);
  
  const { bookmarks } = useBookmarks();

  // Search function
  const search = useCallback(async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const [poets, categories, poems] = await Promise.all([
        ganjoorApi.searchPoets(query, 50),
        ganjoorApi.searchCategories(query, 50),
        ganjoorApi.searchPoems(query, 100),
      ]);

      setResults({ poets, categories, poems });
    } catch (err) {
      console.error('Search failed:', err);
      setError('خطا در جستجو. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    search();
  }, [query, search]);

  // Filter results based on active tab
  const filteredResults = useMemo(() => {
    switch (activeTab) {
      case 'poets':
        return { poets: results.poets, categories: [], poems: [] };
      case 'categories':
        return { poets: [], categories: results.categories, poems: [] };
      case 'poems':
        return { poets: [], categories: [], poems: results.poems };
      default:
        return results;
    }
  }, [activeTab, results]);

  // Pagination
  const totalResults = filteredResults.poets.length + filteredResults.categories.length + filteredResults.poems.length;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Combine and paginate results
  const allResults = [
    ...filteredResults.poets.map(item => ({ type: 'poet' as const, data: item })),
    ...filteredResults.categories.map(item => ({ type: 'category' as const, data: item })),
    ...filteredResults.poems.map(item => ({ type: 'poem' as const, data: item })),
  ];

  const paginatedResults = allResults.slice(startIndex, endIndex);

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

  if (totalResults === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-stone-400" />
        </div>
        <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
          هیچ نتیجه‌ای یافت نشد
        </h3>
        <p className="text-stone-500 dark:text-stone-400">
          برای &quot;{query}&quot; هیچ نتیجه‌ای پیدا نشد. سعی کنید کلمات کلیدی دیگری جستجو کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200 dark:border-stone-700">
        {[
          { key: 'all', label: 'همه', count: totalResults, icon: Search },
          { key: 'poets', label: 'شاعران', count: results.poets.length, icon: Users },
          { key: 'categories', label: 'مجموعه‌ها', count: results.categories.length, icon: BookOpen },
          { key: 'poems', label: 'اشعار', count: results.poems.length, icon: FileText },
        ].map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'all' | 'poets' | 'categories' | 'poems')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-stone-800 dark:border-stone-200 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            <span className="bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 text-xs px-2 py-1 rounded-full">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {paginatedResults.map(({ type, data }) => (
          <div key={`${type}-${data.id}`}>
            {type === 'poet' && <PoetResultCard poet={data as Poet} />}
            {type === 'category' && <CategoryResultCard category={data as Category} />}
            {type === 'poem' && <PoemResultCard poem={data as Poem} isBookmarked={bookmarks.some(b => b.poemId === data.id)} />}
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
    </div>
  );
}

function PoetResultCard({ poet }: { poet: Poet }) {
  return (
    <Link
      href={`/poet/${poet.id}`}
      className="block p-4 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-stone-200 dark:bg-stone-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6 text-stone-600 dark:text-stone-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 text-right mb-1">
            {poet.name}
          </h3>
          {poet.description && (
            <p className="text-sm text-stone-600 dark:text-stone-400 text-right line-clamp-2">
              {poet.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function CategoryResultCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/poet/${category.poetId}/category/${category.id}`}
      className="block p-4 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 transition-all duration-200"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-200 dark:bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 text-right mb-1">
            {category.title}
          </h3>
          {category.description && (
            <p className="text-sm text-stone-600 dark:text-stone-400 text-right line-clamp-2">
              {category.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function PoemResultCard({ poem, isBookmarked }: { poem: Poem; isBookmarked: boolean }) {
  return (
    <Link
      href={`/poem/${poem.id}`}
      className="block p-4 sm:p-6 bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700/30 dark:hover:border-stone-600 active:scale-[0.98] transition-all duration-200 touch-manipulation"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-200 dark:bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 text-right leading-tight">
              {poem.title}
            </h3>
            {isBookmarked && (
              <Heart className="w-5 h-5 text-red-500 fill-current flex-shrink-0" />
            )}
          </div>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 text-right mb-2 font-medium">
            {poem.poetName}
            {poem.categoryTitle && ` • ${poem.categoryTitle}`}
          </p>
          {poem.verses.length > 0 && (
            <p className="text-sm sm:text-base text-stone-500 dark:text-stone-500 text-right line-clamp-2 leading-relaxed">
              {poem.verses[0]}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
export default SearchResults;
