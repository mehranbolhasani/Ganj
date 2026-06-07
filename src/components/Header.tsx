'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PoetsDropdown from './PoetsDropdown';
import { useViewHistory } from '@/lib/history-manager';
import { useBookmarks } from '@/lib/bookmarks-manager';
import { simpleApi } from '@/lib/simple-api';
import { Poet } from '@/lib/types';
import { toPersianDigits } from '@/lib/persian-digits';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, HeartIcon, HistoryIcon, Menu01Icon, Search01Icon } from '@hugeicons/core-free-icons';

// Dynamic imports for heavy modal components
const ViewHistory = dynamic(() => import('./ViewHistory'), {
  loading: () => null, // No loading state needed for modals
});

const GlobalSearch = dynamic(() => import('./GlobalSearch'), {
  loading: () => null, // No loading state needed for modals
});

const Header = () => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [poets, setPoets] = useState<Poet[]>([]);
  const { items } = useViewHistory();
  const { bookmarks } = useBookmarks();

  // Load poets data
  useEffect(() => {
    const loadPoets = async () => {
      try {
        const poetsData = await simpleApi.getPoets();
        setPoets(poetsData);
      } catch (error) {
        console.error('Failed to load poets:', error);
      }
    };
    loadPoets();
  }, []);

  // Handle mobile search with useMemo
  const mobileSearchResults = useMemo(() => {
    if (mobileSearchQuery.trim()) {
      const filtered = poets.filter(poet =>
        poet.name.toLowerCase().includes(mobileSearchQuery.toLowerCase())
      );
      return filtered.slice(0, 10); // Limit to 10 results
    }
    return [];
  }, [mobileSearchQuery, poets]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="w-full sm:container-responsive min-h-16 h-16 flex items-center justify-between z-30 flex-row-reverse relative">
      {/* Mobile Menu & Search Buttons */}
      <div className="md:hidden flex items-center gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-3 rounded-lg text-foreground hover:bg-warning/20 dark:hover:bg-destructive/20 active:bg-accent dark:active:bg-destructive/30 transition-colors touch-manipulation"
        >
          <HugeiconsIcon icon={Search01Icon} size={24} aria-hidden="true" />
          <span className="sr-only">جستجو</span>
        </button>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 rounded-lg text-foreground hover:bg-warning/20 dark:hover:bg-destructive/20 active:bg-accent dark:active:bg-destructive/30 transition-colors touch-manipulation"
        >
          <HugeiconsIcon icon={Menu01Icon} size={24} aria-hidden="true" />
          <span className="sr-only">منوی موبایل</span>
        </button>
      </div>

      {/* Left side - Navigation (Desktop) */}
      <div className="hidden md:flex items-center gap-4 flex-row-reverse h-12">
        {/* Navigation menu */}
        <nav className="flex items-center gap-0 flex-row-reverse">
          {/* Search button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-2 py-2 rounded-md text-sm font-normal text-foreground hover:bg-primary/10 hover:backdrop-blur-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
            <span className="sr-only">جستجو</span>
            <span className="hidden sm:inline">جستجو</span>
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-muted dark:bg-secondary text-muted-foreground rounded" aria-hidden="true">
              ⌘K
            </kbd>
          </button>

          {/* History button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            data-history-trigger
            className="relative px-2 py-2 rounded-md text-sm text-foreground hover:bg-primary/10 hover:backdrop-blur-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <HugeiconsIcon icon={HistoryIcon} size={16} aria-hidden="true" />
            <span>تاریخچه</span>
            {items.length > 0 && (
              <span className="relative bg-muted text-muted-foreground text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer" aria-label={`${toPersianDigits(items.length)} مورد`}>
                {items.length > 9 ? '9+' : items.length}
              </span>
            )}
          </button>

          {/* Bookmarks button */}
          <Link
            href="/bookmarks"
            data-bookmark-trigger
            className="relative px-2 py-2 rounded-md text-sm text-foreground hover:bg-primary/10 hover:backdrop-blur-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <HugeiconsIcon icon={HeartIcon} size={16} aria-hidden="true" />
            <span>علاقه‌مندی‌ها</span>
            {bookmarks.length > 0 && (
              <span className="relative bg-destructive/20 text-destructive text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer">
                {bookmarks.length > 9 ? '9+' : bookmarks.length}
              </span>
            )}
          </Link>

          <PoetsDropdown />
        </nav>
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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden mobile-touch"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Mobile Menu Slide-in */}
          <div
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-card/95 backdrop-blur-sm shadow-xl transform transition-transform duration-300 ease-in-out mobile-optimize"
            style={{ transition: 'transform 0.3s ease-in-out' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 id="mobile-menu-title" className="text-xl font-bold text-foreground">منو</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-lg text-muted-foreground hover:bg-muted dark:hover:bg-secondary active:bg-muted dark:active:bg-muted transition-colors touch-manipulation"
                aria-label="بستن منو"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={24} aria-hidden="true" />
              </button>
            </div>

                  {/* Mobile Search */}
                  <div className="p-4 border-b border-border">
                    <div className="relative">
                      <HugeiconsIcon icon={Search01Icon} size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="جستجو در شاعران..."
                        value={mobileSearchQuery}
                        onChange={(e) => setMobileSearchQuery(e.target.value)}
                        aria-label="جستجو در شاعران"
                        className="w-full pr-12 pl-4 py-3 text-base border border-input rounded-xl bg-card dark:bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent touch-manipulation"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                    </div>

                    {/* Search Results */}
                    {mobileSearchQuery.trim() && (
                      <div className="mt-3 max-h-60 overflow-y-auto">
                        {mobileSearchResults.length > 0 ? (
                          <div className="space-y-1">
                            {mobileSearchResults.map((poet) => (
                              <Link
                                key={poet.id}
                                href={`/poet/${poet.id}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-4 py-3 text-base text-secondary-foreground hover:bg-muted dark:hover:bg-secondary active:bg-muted dark:active:bg-muted rounded-lg transition-colors touch-manipulation"
                              >
                                {poet.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-base text-muted-foreground text-center">
                            هیچ شاعری با &quot;{mobileSearchQuery}&quot; یافت نشد
                          </div>
                        )}
                      </div>
                    )}
                  </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto mobile-scroll">
              <nav className="p-4 space-y-1">

                {/* History Button */}
                <button
                  onClick={() => {
                    setIsHistoryOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  aria-label="تاریخچه بازدیدها"
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-secondary-foreground hover:bg-muted dark:hover:bg-secondary active:bg-muted dark:active:bg-muted transition-colors touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={HistoryIcon} size={24} />
                    <span className="text-lg font-medium">تاریخچه</span>
                  </div>
                  {items.length > 0 && (
                    <span className="relative bg-muted text-muted-foreground text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer">
                {items.length > 9 ? '۹+' : toPersianDigits(items.length)}
                    </span>
                  )}
                </button>

                {/* Bookmarks Link */}
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-secondary-foreground hover:bg-muted dark:hover:bg-secondary active:bg-muted dark:active:bg-muted transition-colors touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={HeartIcon} size={24} />
                    <span className="text-lg font-medium">علاقه‌مندی‌ها</span>
                  </div>
                  {bookmarks.length > 0 && (
                    <span className="relative bg-destructive/20 text-destructive text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer">
                {bookmarks.length > 9 ? '۹+' : toPersianDigits(bookmarks.length)}
                    </span>
                  )}
                </Link>

                {/* Poets Section */}
                <div className="pt-4 border-t border-border">
                  <h3 className="px-4 py-2 text-sm font-medium text-muted-foreground mb-2">
                    محبوب‌ترین شاعرها
                  </h3>

                  {/* Mobile Poets Dropdown Content */}
                  <div className="space-y-1">
                    {/* Famous Poets */}
                    <div className="px-4 py-2">
                      <div className="space-y-1">
                        {[
                          { id: 2, name: 'حافظ' },
                          { id: 7, name: 'سعدی' },
                          { id: 5, name: 'مولانا' },
                          { id: 4, name: 'فردوسی' },
                          { id: 3, name: 'خیام' },
                          { id: 9, name: 'عطار' },
                          { id: 6, name: 'نظامی' },
                          { id: 12, name: 'رودکی' },
                          { id: 26, name: 'ابوسعید ابوالخیر' },
                        ].map((poet) => (
                          <Link
                            key={poet.id}
                            href={`/poet/${poet.id}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-0 py-2 text-base font-medium text-muted-foreground transition-colors"
                          >
                            {poet.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
