'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useBookmarks, removeBookmark } from '@/lib/bookmarks-manager';
import { Heart, Calendar, List, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function BookmarksPage() {
  const { bookmarks, loading } = useBookmarks();
  const { toast } = useToast();

  // Group bookmarks by poet
  const bookmarksByPoet = useMemo(() => {
    const grouped: Record<string, typeof bookmarks> = {};
    bookmarks.forEach(bookmark => {
      if (!grouped[bookmark.poetName]) {
        grouped[bookmark.poetName] = [];
      }
      grouped[bookmark.poetName].push(bookmark);
    });
    return grouped;
  }, [bookmarks]);

  // Track current time for time ago calculations
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: number): string => {
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    if (days < 7) return `${days} روز پیش`;
    return new Date(timestamp).toLocaleDateString('fa-IR');
  };

  const [removingBookmark, setRemovingBookmark] = useState<{poemId: number; title: string} | null>(null);

  const handleRemoveBookmark = (poemId: number, title: string) => {
    setRemovingBookmark({ poemId, title });
  };

  const confirmRemove = async () => {
    if (removingBookmark) {
      try {
        await removeBookmark(removingBookmark.poemId);
        toast.success('حذف شد', 'شعر از علاقه‌مندی‌ها حذف شد');
        setRemovingBookmark(null);
      } catch (error) {
        console.error('Failed to remove bookmark:', error);
        toast.error('خطا', 'خطا در حذف علاقه‌مندی');
      }
    }
  };

  const cancelRemove = () => {
    setRemovingBookmark(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-stone-600 dark:text-stone-300">در حال بارگذاری علاقه‌مندی‌ها...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100">
              علاقه‌مندی‌ها
            </h1>
          </div>
          <p className="text-stone-600 dark:text-stone-300">
            {bookmarks.length} شعر در علاقه‌مندی‌های شما
          </p>
        </div>


        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
              هنوز علاقه‌مندی‌ای ندارید
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              شعرهای مورد علاقه خود را با کلیک روی آیکون قلب ذخیره کنید
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              شروع جستجو
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bookmarksByPoet).map(([poetName, poetBookmarks]) => (
              <div key={poetName} className="bg-white/50 dark:bg-yellow-950/20 rounded-xl p-4 border border-white dark:border-yellow-900/50">
                {/* Poet Header - Only show if there are multiple poets */}
                {Object.keys(bookmarksByPoet).length > 1 && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-200 dark:border-stone-700 justify-between">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                        {poetName}
                      </h2>
                    </div>
                    <div className="text-sm text-stone-500 dark:text-stone-400">
                      <span className="text-sm text-stone-500 dark:text-stone-400">
                        {poetBookmarks.length} شعر
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Bookmarks List - More compact layout */}
                <div className="space-y-2">
                  {poetBookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-start gap-3 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group mb-8"
                    >
                      <div className="flex-1 min-w-0">
                        <Link href={bookmark.url} className="block">
                          <h3 className="font-medium text-stone-900 dark:text-stone-100 text-right mb-1 hover:text-stone-700 dark:hover:text-stone-200 transition-colors truncate">
                            {bookmark.title}
                          </h3>
                          {bookmark.categoryTitle && (
                            <p className="text-sm text-stone-500 dark:text-stone-400 text-right truncate">
                              {bookmark.categoryTitle}
                            </p>
                          )}

                        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTimeAgo(bookmark.timestamp)}</span>
                        </div>
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveBookmark(bookmark.poemId, bookmark.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200"
                          title="حذف از علاقه‌مندی‌ها"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        {removingBookmark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    حذف از علاقه‌مندی‌ها
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    این عمل قابل بازگشت نیست
                  </p>
                </div>
              </div>
              
              <p className="text-stone-700 dark:text-stone-300 mb-6">
                آیا مطمئن هستید که می‌خواهید <span className="font-medium">&quot;{removingBookmark.title}&quot;</span> را از علاقه‌مندی‌هایتان حذف کنید؟
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelRemove}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmRemove}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Confirmation Modal */}
        {removingBookmark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-stone-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                    حذف از علاقه‌مندی‌ها
                  </h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    این عمل قابل بازگشت نیست
                  </p>
                </div>
              </div>
              
              <p className="text-stone-700 dark:text-stone-300 mb-6">
                آیا مطمئن هستید که می‌خواهید <span className="font-medium">&quot;{removingBookmark.title}&quot;</span> را از علاقه‌مندی‌هایتان حذف کنید؟
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelRemove}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmRemove}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
  );
}
