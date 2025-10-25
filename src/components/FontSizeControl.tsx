'use client';

import React, { useState, useEffect } from 'react';
import { useFontSize, updatePreference } from '@/lib/user-preferences';
import { Type } from 'lucide-react';

interface FontSizeControlProps {
  className?: string;
  showLabel?: boolean;
}

export default function FontSizeControl({ 
  className = '', 
  showLabel = true 
}: FontSizeControlProps) {
  const { fontSize } = useFontSize();
  const [isHydrated, setIsHydrated] = useState(false);

  const increaseFontSize = () => {
    const sizes = ['small', 'medium', 'large'] as const;
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex < sizes.length - 1) {
      const newSize = sizes[currentIndex + 1];
      updatePreference('fontSize', newSize);
    }
  };

  const decreaseFontSize = () => {
    const sizes = ['small', 'medium', 'large'] as const;
    const currentIndex = sizes.indexOf(fontSize);
    if (currentIndex > 0) {
      const newSize = sizes[currentIndex - 1];
      updatePreference('fontSize', newSize);
    }
  };

  // Prevent hydration mismatch by only rendering after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
  }, [fontSize, increaseFontSize, decreaseFontSize]);

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

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <div className={`font-size-control ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
            اندازه فونت
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        

        {/* Size options */}
        <div className="flex items-center gap-1">
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
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                fontSize === size
                  ? 'bg-stone-300/50 dark:bg-stone-600/75 text-stone-900 dark:text-stone-100'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
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
      {/* <div className="mt-2 text-xs text-stone-500 dark:text-stone-400 text-center">
        {getSizeLabel(fontSize)}
      </div> */}
    </div>
  );
}

