'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useViewHistory } from '@/lib/history-manager';
import { History, Clock, Search, X, Trash2, Filter, ArrowLeft, Eye } from 'lucide-react';
import { useToast } from './Toast';

interface ViewHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

type GroupBy = 'none' | 'date' | 'poet';
type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month';

export default function ViewHistory({ isOpen, onClose }: ViewHistoryProps) {
  const { items, loading } = useViewHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Filter and group items
  const { filteredItems, groupedItems } = useMemo(() => {
    let filtered = items;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.poetName.toLowerCase().includes(query) ||
        item.categoryTitle?.toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {

      filtered = filtered.filter(item => {
        const diff = now - item.timestamp;
        switch (dateFilter) {
          case 'today':
            return diff < oneDay;
          case 'yesterday':
            return diff >= oneDay && diff < 2 * oneDay;
          case 'week':
            return diff < oneWeek;
          case 'month':
            return diff < oneMonth;
          default:
            return true;
        }
      });
    }

    // Group items
    const grouped: Record<string, typeof filtered> = {};
    
    if (groupBy === 'date') {
      filtered.forEach(item => {
        const date = new Date(item.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let groupKey: string;
        if (date.toDateString() === today.toDateString()) {
          groupKey = 'امروز';
        } else if (date.toDateString() === yesterday.toDateString()) {
          groupKey = 'دیروز';
        } else if (date.getTime() > today.getTime() - 7 * oneDay) {
          groupKey = 'این هفته';
        } else if (date.getTime() > today.getTime() - 30 * oneDay) {
          groupKey = 'این ماه';
        } else {
          groupKey = date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
        }
        
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(item);
      });
    } else if (groupBy === 'poet') {
      filtered.forEach(item => {
        const poetName = item.poetName;
        if (!grouped[poetName]) {
          grouped[poetName] = [];
        }
        grouped[poetName].push(item);
      });
    } else {
      grouped['همه'] = filtered;
    }

    return { filteredItems: filtered, groupedItems: grouped };
  }, [items, searchQuery, dateFilter, groupBy]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
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

  const clearHistory = async () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید همه تاریخچه را پاک کنید؟')) {
      try {
        const { clearHistory } = await import('@/lib/history-manager');
        await clearHistory();
        toast.success('پاک شد', 'تاریخچه با موفقیت پاک شد');
      } catch (error) {
        console.error('Failed to clear history:', error);
        toast.error('خطا', 'خطا در پاک کردن تاریخچه');
      }
    }
  };

  const getRecentItems = () => {
    return items.slice(0, 5);
  };

  const getDisplayItems = () => {
    if (showFullHistory) {
      return groupedItems;
    }
    return { 'اخیر': getRecentItems() };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div 
        ref={dropdownRef}
        className={`relative bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 w-full mx-4 overflow-hidden ${
          showFullHistory ? 'max-w-4xl max-h-[80vh]' : 'max-w-md max-h-96'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            {showFullHistory && (
              <button
                onClick={() => setShowFullHistory(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                aria-label="بازگشت"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <History className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              {showFullHistory ? 'تاریخچه کامل' : 'تاریخچه بازدیدها'}
            </h3>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              ({filteredItems.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!showFullHistory && items.length > 5 && (
              <button
                onClick={() => setShowFullHistory(true)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                مشاهده همه
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              aria-label="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-700 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="جستجو در تاریخچه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              />
            </div>
            {showFullHistory && (
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
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && showFullHistory && (
            <div className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Group By */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">گروه‌بندی:</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                  >
                    <option value="none">بدون گروه‌بندی</option>
                    <option value="date">تاریخ</option>
                    <option value="poet">شاعر</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">زمان:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                  >
                    <option value="all">همه</option>
                    <option value="today">امروز</option>
                    <option value="yesterday">دیروز</option>
                    <option value="week">این هفته</option>
                    <option value="month">این ماه</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`overflow-y-auto ${showFullHistory ? 'max-h-96' : 'max-h-64'}`}>
          {loading ? (
            <div className="p-4 text-center text-stone-500 dark:text-stone-400">
              در حال بارگذاری...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-4 text-center text-stone-500 dark:text-stone-400">
              {searchQuery ? 'هیچ موردی یافت نشد' : 'تاریخچه‌ای وجود ندارد'}
            </div>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-stone-700">
              {Object.entries(getDisplayItems()).map(([groupName, groupItems]) => (
                <div key={groupName}>
                  {groupBy !== 'none' && (
                    <div className="px-4 py-2 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-200 dark:border-stone-700">
                      <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 text-right">
                        {groupName} ({groupItems.length})
                      </h4>
                    </div>
                  )}
                  {groupItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url}
                      onClick={onClose}
                      className="block p-4 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-stone-900 dark:text-stone-100 text-right truncate group-hover:text-stone-700 dark:group-hover:text-stone-200 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-sm text-stone-600 dark:text-stone-400 text-right">
                            {item.poetName}
                          </p>
                          {item.categoryTitle && (
                            <p className="text-xs text-stone-500 dark:text-stone-500 text-right">
                              {item.categoryTitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-200 dark:border-stone-700">
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              پاک کردن تاریخچه
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
