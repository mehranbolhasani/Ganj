'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useBookmarks } from '@/lib/bookmarks-manager';
import { addBookmark, removeBookmark } from '@/lib/bookmarks-manager';
import { useToast } from './Toast';
import { HugeiconsIcon } from '@hugeicons/react';
import { HeartIcon } from '@hugeicons/core-free-icons';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check if poem is bookmarked
  const isBookmarked = useMemo(() => {
    return bookmarks.some(bookmark => bookmark.poemId === poemId);
  }, [bookmarks, poemId]);

  const handleToggle = useCallback(async () => {
    try {
      if (isBookmarked) {
        await removeBookmark(poemId);
        
        // Show undo option
        const timeoutId = setTimeout(() => {
          setUndoTimeout(null);
        }, 3000);
        
        setUndoTimeout(timeoutId);
        
        toast.success('حذف شد', 'از علاقه‌مندی‌ها حذف شد', {
          action: {
            label: 'بازگردانی',
            onClick: () => {
              if (timeoutId) {
                clearTimeout(timeoutId);
                setUndoTimeout(null);
              }
              addBookmark({
                poemId,
                poetId,
                poetName,
                title,
                categoryId,
                categoryTitle,
                url: `/poem/${poemId}`,
              });
              toast.success('بازگردانی شد', 'به علاقه‌مندی‌ها بازگردانده شد');
            }
          }
        });
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
        
        toast.success('افزوده شد', 'به علاقه‌مندی‌ها افزوده شد');
      }
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      toast.error('خطا', 'خطا در ذخیره علاقه‌مندی');
    }
  }, [isBookmarked, poemId, poetId, poetName, title, categoryId, categoryTitle, toast]);

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Check if no input is focused
        const activeElement = document.activeElement;
            if (activeElement && (
              activeElement.tagName === 'INPUT' || 
              activeElement.tagName === 'TEXTAREA' || 
              (activeElement as HTMLElement).contentEditable === 'true'
            )) {
          return;
        }
        
        e.preventDefault();
        handleToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center justify-center gap-2 w-10 h-10 rounded-lg transition-all duration-200 cursor-pointer ${
          isBookmarked
            ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
            : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted'
        } ${isAnimating ? 'scale-110' : 'scale-100'} ${className}`}
        aria-label={isBookmarked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
      >
        <HugeiconsIcon icon={HeartIcon} size={16} className={`transition-all duration-200 ${
            isBookmarked ? 'fill-current' : ''
          } ${isAnimating ? 'animate-pulse' : ''}`} />
        {showLabel && (
          <span className="text-sm font-medium">
            {isBookmarked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          </span>
        )}
      </button>

      {/* Tooltip - Hidden on mobile to prevent horizontal scrolling */}
      {showTooltip && (
        <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-primary text-primary-foreground dark:text-foreground text-xs rounded shadow-lg whitespace-nowrap z-10">
          {isBookmarked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
          <span className="block text-xs opacity-75">کلید B</span>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
        </div>
      )}
    </div>
  );
}
