'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useViewHistory } from '@/lib/history-manager';
import { History, Clock, Search, X, Trash2 } from 'lucide-react';

interface ViewHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewHistory({ isOpen, onClose }: ViewHistoryProps) {
  const { items, loading } = useViewHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [items, searchQuery]);

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
    try {
      const { clearHistory } = await import('@/lib/history-manager');
      await clearHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
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
        className="relative bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 w-full max-w-md mx-4 max-h-96 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              تاریخچه بازدیدها
            </h3>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              ({items.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-700">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="جستجو در تاریخچه..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-h-64 overflow-y-auto">
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
              {filteredItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={onClose}
                  className="block p-4 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-stone-900 dark:text-stone-100 text-right truncate">
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
