'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useBookmarks } from '@/lib/bookmarks-manager';
import type { BookmarkItem } from '@/lib/bookmarks-manager';

interface BookmarksWidgetProps {
  maxItems?: number;
  showTitle?: boolean;
  className?: string;
}

export default function BookmarksWidget({ 
  maxItems = 5, 
  showTitle = true,
  className = ''
}: BookmarksWidgetProps) {
  const { bookmarks, loading } = useBookmarks();

  if (loading) {
    return (
      <div className={`bg-white/50 dark:bg-stone-800/50 rounded-xl p-4 border border-white dark:border-stone-700 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              علاقه‌مندی‌ها
            </h3>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentBookmarks = bookmarks.slice(0, maxItems);

  if (recentBookmarks.length === 0) {
    return (
      <div className={`bg-white/50 dark:bg-stone-800/50 rounded-xl p-4 border border-white dark:border-stone-700 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              علاقه‌مندی‌ها
            </h3>
          </div>
        )}
        <div className="text-center py-6">
          <Heart className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
            هنوز علاقه‌مندی‌ای ندارید
          </p>
          <Link
            href="/"
            className="text-sm text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 underline"
          >
            شروع جستجو
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/50 dark:bg-stone-800/50 rounded-xl p-4 border border-white dark:border-stone-700 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
              علاقه‌مندی‌ها
            </h3>
          </div>
          <Link
            href="/bookmarks"
            className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            همه
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {recentBookmarks.map((bookmark) => (
          <BookmarkItem key={bookmark.id} bookmark={bookmark} />
        ))}
      </div>

      {bookmarks.length > maxItems && (
        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700">
          <Link
            href="/bookmarks"
            className="flex items-center justify-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            <span>مشاهده همه ({bookmarks.length})</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function BookmarkItem({ bookmark }: { bookmark: BookmarkItem }) {
  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes}د`;
    if (hours < 24) return `${hours}س`;
    if (days < 7) return `${days}ر`;
    return new Date(timestamp).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  };

  return (
    <Link
      href={bookmark.url}
      className="block p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-stone-900 dark:text-stone-100 text-right mb-1 line-clamp-2 group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors">
            {bookmark.title}
          </h4>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-right truncate">
            {bookmark.poetName}
            {bookmark.categoryTitle && ` • ${bookmark.categoryTitle}`}
          </p>
        </div>
        <div className="flex-shrink-0 text-xs text-stone-400 dark:text-stone-500">
          {formatTimeAgo(bookmark.timestamp)}
        </div>
      </div>
    </Link>
  );
}
