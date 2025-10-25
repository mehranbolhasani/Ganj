'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useBookmarks } from '@/lib/bookmarks-manager';
import { addBookmark, removeBookmark } from '@/lib/bookmarks-manager';

interface BookmarkButtonProps {
  poemId: number;
  poetId: number;
  poetName: string;
  title: string;
  categoryId?: number;
  categoryTitle?: string;
  className?: string;
  showLabel?: boolean;
}

export default function BookmarkButton({
  poemId,
  poetId,
  poetName,
  title,
  categoryId,
  categoryTitle,
  className = '',
  showLabel = false,
}: BookmarkButtonProps) {
  const { bookmarks } = useBookmarks();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if poem is bookmarked
  useEffect(() => {
    setIsBookmarked(bookmarks.some(bookmark => bookmark.poemId === poemId));
  }, [bookmarks, poemId]);

  const handleToggle = async () => {
    try {
      if (isBookmarked) {
        await removeBookmark(poemId);
      } else {
        await addBookmark({
          poemId,
          poetId,
          poetName,
          title,
          categoryId,
          categoryTitle,
          url: `/poem/${poemId}`,
        });
      }
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
        isBookmarked
          ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600'
      } ${isAnimating ? 'scale-110' : 'scale-100'} ${className}`}
      aria-label={isBookmarked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
      title={isBookmarked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
    >
      <Heart 
        className={`w-4 h-4 transition-all duration-200 ${
          isBookmarked ? 'fill-current' : ''
        }`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isBookmarked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        </span>
      )}
    </button>
  );
}
