'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PoetsDropdown from './PoetsDropdown';
import { useViewHistory } from '@/lib/history-manager';
import { useBookmarks } from '@/lib/bookmarks-manager';
import { History, Heart, Menu, X, Search } from 'lucide-react';
import { simpleApi } from '@/lib/simple-api';
import { Poet } from '@/lib/types';

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
    <header className="w-full sm:container-responsive min-h-[80px] h-[80px] md:min-h-[128px] md:h-[128px] flex items-center justify-between z-10 flex-row-reverse relative">
      {/* Mobile Menu & Search Buttons */}
      <div className="md:hidden flex items-center gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-3 rounded-lg text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-200 dark:active:bg-red-800 transition-colors touch-manipulation"
          aria-label="جستجو"
        >
          <Search className="w-6 h-6" />
        </button>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 rounded-lg text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-200 dark:active:bg-red-800 transition-colors touch-manipulation"
          aria-label="منوی موبایل"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Left side - Navigation (Desktop) */}
      <div className="hidden md:flex items-center gap-4 flex-row-reverse">
        {/* Navigation menu */}
        <nav className="flex items-center gap-0 flex-row-reverse">
          {/* Search button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-2 py-2 rounded-md text-sm font-normal text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-200 dark:active:bg-red-800 transition-colors flex items-center gap-2 cursor-pointer"
            aria-label="جستجو"
          >
            <Search className="w-4 h-4" />
            {/* <span>جستجو</span> */}
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded">
              ⌘K
            </kbd>
          </button>
          
          {/* History button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            data-history-trigger
            className="relative px-2 py-2 rounded-md text-sm font-semibold text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-600/20 dark:active:bg-red-800 transition-colors flex items-center gap-1 cursor-pointer"
            aria-label="تاریخچه بازدیدها"
          >
            <History className="w-4 h-4" />
            <span>تاریخچه</span>
            {items.length > 0 && (
              <span className="relative bg-stone-200 text-stone-500 text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer">
                {items.length > 9 ? '9+' : items.length}
              </span>
            )}
          </button>

          {/* Bookmarks button */}
          <Link
            href="/bookmarks"
            data-bookmark-trigger
            className="relative px-2 py-2 rounded-md text-sm font-semibold text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-600/20 dark:active:bg-red-800 transition-colors flex items-center gap-1 cursor-pointer"
            aria-label="علاقه‌مندی‌ها"
          >
            <Heart className="w-4 h-4" />
            <span>علاقه‌مندی‌ها</span>
            {bookmarks.length > 0 && (
              <span className="relative bg-red-200 text-red-500 text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer">
                {bookmarks.length > 9 ? '9+' : bookmarks.length}
              </span>
            )}
          </Link>
          
          <PoetsDropdown />
        </nav>
      </div>

      {/* Right side - Logo */}
      <div className="flex items-center gap-1 flex-row-reverse">
        <Link href="/" className="flex items-center gap-1 flex-row-reverse text-stone-900 dark:text-stone-300">
          <span className="text-md font-abar abar-wght-700 text-stone-900 dark:text-stone-300 translate-y-0.5">دفتر گنج</span>
          <div className="w-8 h-8 grid items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><path fill="#d97706" fillRule="evenodd" d="M5.333 0A5.333 5.333 0 0 0 0 5.333v13.334A5.333 5.333 0 0 0 5.333 24h13.334A5.333 5.333 0 0 0 24 18.667V5.333A5.333 5.333 0 0 0 18.667 0H5.333Zm0 3.333a2 2 0 0 0-2 2v13.334a2 2 0 0 0 2 2H10a2 2 0 0 0 2-2V5.333a2 2 0 0 0-2-2H5.333Z" clipRule="evenodd"/></svg>
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
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white/95 dark:bg-stone-800/95 backdrop-blur-sm shadow-xl transform transition-transform duration-300 ease-in-out mobile-optimize"
            style={{ transition: 'transform 0.3s ease-in-out' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
              <h2 id="mobile-menu-title" className="text-xl font-bold text-stone-900 dark:text-stone-100">منو</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-3 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 transition-colors touch-manipulation"
                aria-label="بستن منو"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

                  {/* Mobile Search */}
                  <div className="p-4 border-b border-stone-200 dark:border-stone-700">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="جستجو در شاعران..."
                        value={mobileSearchQuery}
                        onChange={(e) => setMobileSearchQuery(e.target.value)}
                        aria-label="جستجو در شاعران"
                        className="w-full pr-12 pl-4 py-3 text-base border border-stone-300 dark:border-stone-600 rounded-xl bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent touch-manipulation"
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
                                className="block px-4 py-3 text-base text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 rounded-lg transition-colors touch-manipulation"
                              >
                                {poet.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-base text-stone-500 dark:text-stone-400 text-center">
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
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 transition-colors touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-6 h-6" />
                    <span className="text-lg font-medium">تاریخچه</span>
                  </div>
                  {items.length > 0 && (
                    <span className="relative bg-stone-200 text-stone-500 text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer">
                      {items.length > 9 ? '9+' : items.length}
                    </span>
                  )}
                </button>

                {/* Bookmarks Link */}
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 active:bg-stone-200 dark:active:bg-stone-600 transition-colors touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6" />
                    <span className="text-lg font-medium">علاقه‌مندی‌ها</span>
                  </div>
                  {bookmarks.length > 0 && (
                    <span className="relative bg-red-200 text-red-500 text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer">
                      {bookmarks.length > 9 ? '9+' : bookmarks.length}
                    </span>
                  )}
                </Link>

                {/* Poets Section */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
                  <h3 className="px-4 py-2 text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
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
                            className="block px-0 py-2 text-base font-medium text-stone-600 dark:text-stone-400 transition-colors"
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