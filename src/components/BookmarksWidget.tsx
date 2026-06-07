'use client';

import React from 'react';
import Link from 'next/link';
import { useBookmarks } from '@/lib/bookmarks-manager';
import type { BookmarkItem } from '@/lib/bookmarks-manager';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, HeartIcon } from '@hugeicons/core-free-icons';
import { toPersianDigits } from '@/lib/persian-digits';

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
      <div className={`bg-card/50 rounded-xl p-4 border border-white dark:border-border ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <HugeiconsIcon icon={HeartIcon} size={20} className="text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">
              علاقه‌مندی‌ها
            </h3>
          </div>
        )}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentBookmarks = bookmarks.slice(0, maxItems);

  if (recentBookmarks.length === 0) {
    return (
      <div className={`bg-card/50 rounded-xl p-4 border border-white dark:border-border ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <HugeiconsIcon icon={HeartIcon} size={20} className="text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">
              علاقه‌مندی‌ها
            </h3>
          </div>
        )}
        <div className="text-center py-6">
          <HugeiconsIcon icon={HeartIcon} size={32} className="text-secondary-foreground dark:text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            هنوز علاقه‌مندی‌ای ندارید
          </p>
          <Link
            href="/"
            className="text-sm text-muted-foreground dark:text-secondary-foreground hover:text-foreground dark:hover:text-background underline"
          >
            شروع جستجو
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card/50 rounded-xl p-4 border border-white dark:border-border ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={HeartIcon} size={20} className="text-destructive" />
            <h3 className="text-lg font-semibold text-foreground">
              علاقه‌مندی‌ها
            </h3>
          </div>
          <Link
            href="/bookmarks"
            className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground transition-colors"
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
        <div className="mt-4 pt-3 border-t border-border">
          <Link
            href="/bookmarks"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-secondary-foreground transition-colors"
          >
            <span>مشاهده همه ({toPersianDigits(bookmarks.length)})</span>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

function BookmarkItem({ bookmark }: { bookmark: BookmarkItem }) {
  // Track current time for time ago calculations
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: number): string => {
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${toPersianDigits(minutes)}د`;
    if (hours < 24) return `${toPersianDigits(hours)}س`;
    if (days < 7) return `${toPersianDigits(days)}ر`;
    return new Date(timestamp).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  };

  return (
    <Link
      href={bookmark.url}
      className="block p-3 rounded-lg hover:bg-muted dark:hover:bg-secondary transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-right mb-1 line-clamp-2 group-hover:text-secondary-foreground dark:group-hover:text-secondary-foreground transition-colors">
            {bookmark.title}
          </h4>
          <p className="text-sm text-muted-foreground text-right truncate">
            {bookmark.poetName}
            {bookmark.categoryTitle && ` • ${bookmark.categoryTitle}`}
          </p>
        </div>
        <div className="flex-shrink-0 text-xs text-muted-foreground dark:text-muted-foreground">
          {formatTimeAgo(bookmark.timestamp)}
        </div>
      </div>
    </Link>
  );
}
