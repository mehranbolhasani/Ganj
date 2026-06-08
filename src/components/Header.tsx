'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useViewHistory } from '@/lib/history-manager';
import { useBookmarks } from '@/lib/bookmarks-manager';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import AuthAvatar from './AuthAvatar';

// Dynamic imports for heavy modal components
const ViewHistory = dynamic(() => import('./ViewHistory'), {
  loading: () => null,
});

const GlobalSearch = dynamic(() => import('./GlobalSearch'), {
  loading: () => null,
});

const Header = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { items } = useViewHistory();
  const { bookmarks } = useBookmarks();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsHistoryOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="w-full sm:container-responsive min-h-16 h-24 flex items-center justify-between z-30 flex-row-reverse relative">
      {/* Action Buttons */}
      <div className="flex items-center gap-2">

        {/* Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-3 rounded-lg text-foreground hover:bg-warning/20 dark:hover:bg-destructive/20 active:bg-accent dark:active:bg-destructive/30 transition-colors touch-manipulation"
          aria-label="جستجو"
        >
          <HugeiconsIcon icon={Search01Icon} size={22} aria-hidden="true" />
          <span className="sr-only">جستجو</span>
        </button>

        <AuthAvatar
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={items.length}
          bookmarksCount={bookmarks.length}
        />
      </div>

      {/* Right side - Logo */}
      <div className="flex items-center gap-1 flex-row-reverse h-12">
        <Link href="/" className="flex items-center gap-1 flex-row-reverse text-foreground dark:text-secondary-foreground">
          <span className="inline-block text-md font-bold">دفتر گنج</span>
          <div className="w-8 h-8 grid items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" className="w-full h-full"><g clipPath="url(#a)"><path fill="#7b3306" d="M0 12.8c0-4.48 0-6.72.872-8.432A8 8 0 0 1 4.368.872C6.08 0 8.32 0 12.8 0h6.4c4.48 0 6.72 0 8.432.872a8 8 0 0 1 3.496 3.496C32 6.08 32 8.32 32 12.8v6.4c0 4.48 0 6.72-.872 8.432a8 8 0 0 1-3.496 3.496C25.92 32 23.68 32 19.2 32h-6.4c-4.48 0-6.72 0-8.432-.872a8 8 0 0 1-3.496-3.496C0 25.92 0 23.68 0 19.2z"/><path stroke="#fffbeb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.705" d="M24.59 14.273H9.764a2.84 2.84 0 0 0-2.838 2.996m0 0a2.84 2.84 0 0 0 2.838 2.688h10.799c2.143 0 3.215 0 3.88.666.666.666.666 1.737.666 3.88v7.958c0 2.143 0 3.215-.666 3.88-.665.667-1.737.667-3.88.667h-6.817c-3.215 0-4.822 0-5.821-.999s-.999-2.606-.999-5.821zm0 0v-.152m2.838-.002h10.799c1.071 0 1.607 0 1.94.333s.333.869.333 1.94M19.994 26.209h-7.957m4.547 4.547h-4.547"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 12.8c0-4.48 0-6.72.872-8.432A8 8 0 0 1 4.368.872C6.08 0 8.32 0 12.8 0h6.4c4.48 0 6.72 0 8.432.872a8 8 0 0 1 3.496 3.496C32 6.08 32 8.32 32 12.8v6.4c0 4.48 0 6.72-.872 8.432a8 8 0 0 1-3.496 3.496C25.92 32 23.68 32 19.2 32h-6.4c-4.48 0-6.72 0-8.432-.872a8 8 0 0 1-3.496-3.496C0 25.92 0 23.68 0 19.2z"/></clipPath></defs></svg>
          </div>
        </Link>
      </div>

      {/* View History Modal */}
      <ViewHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
};

export default Header;
