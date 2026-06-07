'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useViewHistory } from '@/lib/history-manager';
import { useToast } from '@/components/Toast';
import { toPersianDigits } from '@/lib/persian-digits';
import { HugeiconsIcon } from '@hugeicons/react';
import { BookOpen01Icon, ChartBarLineIcon, Clock01Icon, Delete02Icon, Download04Icon, FilterIcon, HistoryIcon, Search01Icon, UserIcon } from '@hugeicons/core-free-icons';

type GroupBy = 'none' | 'date' | 'poet';
type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month';

export default function HistoryPage() {
  const { items, loading } = useViewHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('date');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // Filter and group items
  const { filteredItems, groupedItems, statistics } = useMemo(() => {
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

    // Calculate statistics
    const poetCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    
    items.forEach(item => {
      poetCounts[item.poetName] = (poetCounts[item.poetName] || 0) + 1;
      if (item.categoryTitle) {
        categoryCounts[item.categoryTitle] = (categoryCounts[item.categoryTitle] || 0) + 1;
      }
    });

    const mostReadPoet = Object.entries(poetCounts).reduce((a, b) => poetCounts[a[0]] > poetCounts[b[0]] ? a : b, ['', 0]);
    const mostReadCategory = Object.entries(categoryCounts).reduce((a, b) => categoryCounts[a[0]] > categoryCounts[b[0]] ? a : b, ['', 0]);

    return { 
      filteredItems: filtered, 
      groupedItems: grouped,
      statistics: {
        totalItems: items.length,
        mostReadPoet: mostReadPoet[0],
        mostReadPoetCount: mostReadPoet[1],
        mostReadCategory: mostReadCategory[0],
        mostReadCategoryCount: mostReadCategory[1],
      }
    };
  }, [items, searchQuery, dateFilter, groupBy]);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
    if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
    if (days < 7) return `${toPersianDigits(days)} روز پیش`;
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

  const exportHistory = () => {
    try {
      const dataStr = JSON.stringify(items, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ganj-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('صادر شد', 'تاریخچه با موفقیت صادر شد');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('خطا', 'خطا در صادر کردن تاریخچه');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground dark:text-secondary-foreground">در حال بارگذاری تاریخچه...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <HugeiconsIcon icon={HistoryIcon} size={32} className="text-muted-foreground" />
            <h1 className="text-3xl font-bold text-foreground">
              تاریخچه بازدیدها
            </h1>
          </div>
          <p className="text-muted-foreground dark:text-secondary-foreground">
            {toPersianDigits(items.length)} مورد در تاریخچه شما
          </p>
        </div>

        {/* Statistics */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card/50 rounded-xl p-4 border border-white dark:border-border">
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={ChartBarLineIcon} size={24} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {toPersianDigits(statistics.totalItems)}
                  </h3>
                  <p className="text-sm text-muted-foreground">کل بازدیدها</p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 rounded-xl p-4 border border-white dark:border-border">
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={UserIcon} size={24} className="text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {statistics.mostReadPoet}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    محبوب‌ترین شاعر ({toPersianDigits(statistics.mostReadPoetCount)} بار)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/50 rounded-xl p-4 border border-white dark:border-border">
              <div className="flex items-center gap-3">
                <HugeiconsIcon icon={BookOpen01Icon} size={24} className="text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {statistics.mostReadCategory}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    محبوب‌ترین مجموعه ({toPersianDigits(statistics.mostReadCategoryCount)} بار)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="جستجو در تاریخچه..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 border border-input rounded-lg bg-card dark:bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-muted text-foreground' 
                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-primary'
                }`}
              >
                <HugeiconsIcon icon={FilterIcon} size={16} />
                فیلتر
              </button>

              <button
                onClick={exportHistory}
                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted dark:hover:bg-primary rounded-lg transition-colors"
              >
                <HugeiconsIcon icon={Download04Icon} size={16} />
                صادر کردن
              </button>

              {items.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-lg transition-colors"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                  پاک کردن همه
                </button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-background dark:bg-primary/50 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Group By */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary-foreground">گروه‌بندی:</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="px-3 py-1 border border-input rounded bg-card dark:bg-secondary text-foreground text-sm"
                  >
                    <option value="none">بدون گروه‌بندی</option>
                    <option value="date">تاریخ</option>
                    <option value="poet">شاعر</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-secondary-foreground">زمان:</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="px-3 py-1 border border-input rounded bg-card dark:bg-secondary text-foreground text-sm"
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

        {/* History List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <HugeiconsIcon icon={HistoryIcon} size={64} className="text-secondary-foreground dark:text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-foreground mb-2">
              {searchQuery ? 'هیچ موردی یافت نشد' : 'تاریخچه‌ای وجود ندارد'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'سعی کنید کلمات کلیدی دیگری جستجو کنید'
                : 'شعرهای مورد علاقه خود را بازدید کنید تا در اینجا نمایش داده شوند'
              }
            </p>
            {!searchQuery && (
              <Link
                href="/"
                className="inline-block mt-4 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
              >
                شروع جستجو
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([groupName, groupItems]) => (
              <div key={groupName} className="bg-card/50 rounded-xl border border-white dark:border-border">
                {groupBy !== 'none' && (
                  <div className="px-4 py-3 bg-background dark:bg-primary/50 border-b border-border rounded-t-xl">
                    <h3 className="text-lg font-semibold text-foreground text-right">
                      {groupName} ({toPersianDigits(groupItems.length)})
                    </h3>
                  </div>
                )}
                
                <div className="divide-y divide-border">
                  {groupItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url}
                      className="block p-4 hover:bg-muted dark:hover:bg-secondary transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-right mb-1 group-hover:text-secondary-foreground dark:group-hover:text-secondary-foreground transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-sm text-muted-foreground text-right">
                            {item.poetName}
                            {item.categoryTitle && ` • ${item.categoryTitle}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <HugeiconsIcon icon={Clock01Icon} size={14} />
                          <span>{formatTimeAgo(item.timestamp)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
