'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFontSize, updatePreference } from '@/lib/user-preferences';
import { HugeiconsIcon } from '@hugeicons/react';
import { TextIcon } from '@hugeicons/core-free-icons';

interface FontSizeControlProps {
  className?: string;
  showLabel?: boolean;
  vertical?: boolean;
}

export default function FontSizeControl({ 
  className = '', 
  showLabel = true,
  vertical = false
}: FontSizeControlProps) {
  const { fontSize } = useFontSize();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  const increaseFontSize = useCallback(() => {
    const sizes = ['small', 'medium', 'large'] as const;
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      const newSize = sizes[currentIndex + 1];
      updatePreference('fontSize', newSize);
    }
  }, [fontSize]);

  const decreaseFontSize = useCallback(() => {
    const sizes = ['small', 'medium', 'large'] as const;
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      const newSize = sizes[currentIndex - 1];
      updatePreference('fontSize', newSize);
    }
  }, [fontSize]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Plus to increase font size
      if ((event.ctrlKey || event.metaKey) && event.key === '=') {
        event.preventDefault();
        increaseFontSize();
      }
      // Ctrl/Cmd + Minus to decrease font size
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        decreaseFontSize();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [increaseFontSize, decreaseFontSize]);

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small': return 'کوچک';
      case 'medium': return 'متوسط';
      case 'large': return 'بزرگ';
      default: return 'متوسط';
    }
  };

  const getSizeIcon = (size: string) => {
    switch (size) {
      case 'small': return 'A';
      case 'medium': return 'A';
      case 'large': return 'A';
      default: return 'A';
    }
  };

  // Reserve space to prevent layout shift
  if (!isHydrated) {
    return (
      <div className={`flex align-center font-size-control ${className}`} aria-hidden="true">
        <div className="flex items-center gap-1">
          <div className="w-10 h-10" />
          <div className="w-10 h-10" />
          <div className="w-10 h-10" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex align-center font-size-control ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2 mb-2">
          <HugeiconsIcon icon={TextIcon} size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-secondary-foreground">
            اندازه فونت
          </span>
        </div>
      )}
      
      <div className={`flex ${vertical ? 'flex-col' : 'items-center'} gap-2`}>
        {/* Size options */}
        <div className={`flex ${vertical ? 'flex-col' : 'items-center'} gap-1`}>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => {
                const sizes = ['small', 'medium', 'large'] as const;
                const newSize = sizes.find(s => s === size);
                if (newSize) {
                  updatePreference('fontSize', newSize);
                }
              }}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer aspect-square flex items-center justify-center ${
                fontSize === size
                  ? 'bg-muted/50 dark:bg-yellow-600/35 text-foreground'
                  : 'text-muted-foreground dark:text-secondary-foreground hover:bg-muted dark:hover:bg-muted'
              }`}
              aria-label={`تنظیم اندازه فونت به ${getSizeLabel(size)}`}
              title={getSizeLabel(size)}
            >
              <span className={`${size === 'small' ? 'text-xs' : size === 'medium' ? 'text-sm' : 'text-base'}`}>
                {getSizeIcon(size)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Current size indicator */}
      {/* <div className="mt-2 text-xs text-muted-foreground text-center">
        {getSizeLabel(fontSize)}
      </div> */}
    </div>
  );
}

