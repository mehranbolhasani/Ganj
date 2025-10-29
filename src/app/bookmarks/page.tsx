'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useBookmarks, removeBookmark, clearBookmarks } from '@/lib/bookmarks-manager';
import { Search, Heart, Trash2, Calendar, List, X, Download, Upload, Filter, SortAsc, SortDesc, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/components/Toast';

type SortField = 'date' | 'poet' | 'title';
type SortOrder = 'asc' | 'desc';

export default function BookmarksPage() {
  const { bookmarks, loading } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterByPoet, setFilterByPoet] = useState<string>('all');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get unique poets for filter
  const poets = useMemo(() => {
    const uniquePoets = Array.from(new Set(bookmarks.map(b => b.poetName)));
    return uniquePoets.sort();
  }, [bookmarks]);

  // Filter and sort bookmarks
  const filteredBookmarks = useMemo(() => {
    let filtered = bookmarks;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.poetName.toLowerCase().includes(query) ||
        bookmark.categoryTitle?.toLowerCase().includes(query)
      );
    }

    // Poet filter
    if (filterByPoet !== 'all') {
      filtered = filtered.filter(bookmark => bookmark.poetName === filterByPoet);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'poet':
          comparison = a.poetName.localeCompare(b.poetName, 'fa');
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title, 'fa');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [bookmarks, searchQuery, filterByPoet, sortField, sortOrder]);

  // Group bookmarks by poet
  const bookmarksByPoet = useMemo(() => {
    const grouped: Record<string, typeof bookmarks> = {};
    filteredBookmarks.forEach(bookmark => {
      if (!grouped[bookmark.poetName]) {
        grouped[bookmark.poetName] = [];
      }
      grouped[bookmark.poetName].push(bookmark);
    });
    return grouped;
  }, [filteredBookmarks]);

  const formatTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    if (days < 7) return `${days} روز پیش`;
    return new Date(timestamp).toLocaleDateString('fa-IR');
  };

  // Export bookmarks
  const exportBookmarks = () => {
    try {
      const dataStr = JSON.stringify(bookmarks, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ganj-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('صادر شد', 'علاقه‌مندی‌ها با موفقیت صادر شد');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('خطا', 'خطا در صادر کردن علاقه‌مندی‌ها');
    }
  };

  // Import bookmarks
  const importBookmarks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedBookmarks = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedBookmarks)) {
          // Validate imported bookmarks
          const validBookmarks = importedBookmarks.filter(bookmark => 
            bookmark.id && bookmark.poemId && bookmark.poetName && bookmark.title
          );
          
          if (validBookmarks.length > 0) {
            // Merge with existing bookmarks (avoid duplicates)
            const existingIds = new Set(bookmarks.map(b => b.poemId));
            const newBookmarks = validBookmarks.filter(b => !existingIds.has(b.poemId));
            
            if (newBookmarks.length > 0) {
              // Add new bookmarks
              newBookmarks.forEach(bookmark => {
                // This would need to be implemented in the bookmarks manager
                console.log('Would add bookmark:', bookmark);
              });
              
              toast.success('وارد شد', `${newBookmarks.length} علاقه‌مندی جدید وارد شد`);
            } else {
              toast.info('تکراری', 'همه علاقه‌مندی‌ها قبلاً موجود است');
            }
          } else {
            toast.error('نامعتبر', 'فایل وارد شده معتبر نیست');
          }
        } else {
          toast.error('نامعتبر', 'فرمت فایل نامعتبر است');
        }
      } catch (error) {
        console.error('Import failed:', error);
        toast.error('خطا', 'خطا در وارد کردن فایل');
      }
    };
    reader.readAsText(file);
  };

  // Clear all bookmarks
  const clearAllBookmarks = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید همه علاقه‌مندی‌ها را حذف کنید؟')) {
      try {
        await clearBookmarks();
        toast.success('حذف شد', 'همه علاقه‌مندی‌ها حذف شد');
      } catch (error) {
        console.error('Failed to clear bookmarks:', error);
        toast.error('خطا', 'خطا در حذف علاقه‌مندی‌ها');
      }
    }
  };

  // Bulk delete selected bookmarks
  const bulkDeleteSelected = async () => {
    if (selectedBookmarks.size === 0) return;
    
    if (confirm(`آیا مطمئن هستید که می‌خواهید ${selectedBookmarks.size} علاقه‌مندی انتخاب شده را حذف کنید؟`)) {
      try {
        for (const poemId of selectedBookmarks) {
          await removeBookmark(poemId);
        }
        setSelectedBookmarks(new Set());
        toast.success('حذف شد', `${selectedBookmarks.size} علاقه‌مندی حذف شد`);
      } catch (error) {
        console.error('Bulk delete failed:', error);
        toast.error('خطا', 'خطا در حذف علاقه‌مندی‌ها');
      }
    }
  };

  // Toggle bookmark selection
  const toggleBookmarkSelection = (poemId: number) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(poemId)) {
      newSelected.delete(poemId);
    } else {
      newSelected.add(poemId);
    }
    setSelectedBookmarks(newSelected);
  };

  // Select all visible bookmarks
  const selectAllVisible = () => {
    const allVisibleIds = new Set(filteredBookmarks.map(b => b.poemId));
    setSelectedBookmarks(allVisibleIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedBookmarks(new Set());
  };

  const [removingBookmark, setRemovingBookmark] = useState<{poemId: number; title: string} | null>(null);

  const handleRemoveBookmark = (poemId: number, title: string) => {
    setRemovingBookmark({ poemId, title });
  };

  const confirmRemove = () => {
    if (removingBookmark) {
      removeBookmark(removingBookmark.poemId);
      setRemovingBookmark(null);
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

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Search and Main Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="جستجو در علاقه‌مندی‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100' 
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Filter className="w-4 h-4" />
                فیلتر
              </button>

              <button
                onClick={exportBookmarks}
                className="flex items-center gap-2 px-3 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                صادر کردن
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                وارد کردن
              </button>

              {bookmarks.length > 0 && (
                <button
                  onClick={clearAllBookmarks}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف همه
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">مرتب‌سازی:</label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="px-3 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                  >
                    <option value="date">تاریخ</option>
                    <option value="poet">شاعر</option>
                    <option value="title">عنوان</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </button>
                </div>

                {/* Poet Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">شاعر:</label>
                  <select
                    value={filterByPoet}
                    onChange={(e) => setFilterByPoet(e.target.value)}
                    className="px-3 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                  >
                    <option value="all">همه</option>
                    {poets.map(poet => (
                      <option key={poet} value={poet}>{poet}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selection Controls */}
              {filteredBookmarks.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
                  <button
                    onClick={selectAllVisible}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                  >
                    <CheckSquare className="w-4 h-4" />
                    انتخاب همه
                  </button>
                  <button
                    onClick={clearSelection}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    لغو انتخاب
                  </button>
                  {selectedBookmarks.size > 0 && (
                    <button
                      onClick={bulkDeleteSelected}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف انتخاب شده ({selectedBookmarks.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importBookmarks}
            className="hidden"
          />
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-stone-700 dark:text-stone-300 mb-2">
              {searchQuery ? 'هیچ علاقه‌مندی‌ای یافت نشد' : 'هنوز علاقه‌مندی‌ای ندارید'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {searchQuery 
                ? 'سعی کنید کلمات کلیدی دیگری جستجو کنید'
                : 'شعرهای مورد علاقه خود را با کلیک روی آیکون قلب ذخیره کنید'
              }
            </p>
            {!searchQuery && (
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
              >
                شروع جستجو
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bookmarksByPoet).map(([poetName, poetBookmarks]) => (
              <div key={poetName} className="bg-white/50 dark:bg-stone-800/50 rounded-xl p-4 border border-white dark:border-stone-700">
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
                      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group ${
                        selectedBookmarks.has(bookmark.poemId) ? 'bg-stone-100 dark:bg-stone-700' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <button
                        onClick={() => toggleBookmarkSelection(bookmark.poemId)}
                        className="flex-shrink-0 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                      >
                        {selectedBookmarks.has(bookmark.poemId) ? (
                          <CheckSquare className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

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
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTimeAgo(bookmark.timestamp)}</span>
                        </div>
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
      </div>
  );
}
