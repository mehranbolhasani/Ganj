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
        >
          <Search className="w-6 h-6" aria-hidden="true" />
          <span className="sr-only">جستجو</span>
        </button>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 rounded-lg text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-200 dark:active:bg-red-800 transition-colors touch-manipulation"
        >
          <Menu className="w-6 h-6" aria-hidden="true" />
          <span className="sr-only">منوی موبایل</span>
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
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only">جستجو</span>
            <span className="hidden sm:inline">جستجو</span>
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded" aria-hidden="true">
              ⌘K
            </kbd>
          </button>
          
          {/* History button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            data-history-trigger
            className="relative px-2 py-2 rounded-md text-sm font-semibold text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-600/20 dark:active:bg-red-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <History className="w-4 h-4" aria-hidden="true" />
            <span>تاریخچه</span>
            {items.length > 0 && (
              <span className="relative bg-stone-200 text-stone-500 text-xs rounded-md w-5 h-5 flex items-center justify-center font-bold cursor-pointer" aria-label={`${items.length} مورد`}>
                {items.length > 9 ? '9+' : items.length}
              </span>
            )}
          </button>

          {/* Bookmarks button */}
          <Link
            href="/bookmarks"
            data-bookmark-trigger
            className="relative px-2 py-2 rounded-md text-sm font-semibold text-stone-900 dark:text-stone-300 hover:bg-yellow-600/20 dark:hover:bg-red-900 active:bg-yellow-600/20 dark:active:bg-red-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Heart className="w-4 h-4" aria-hidden="true" />
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
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" color="currentColor" viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="M19.543 1.25c.4142 0 .75.336.75.75s-.3358.75-.75.75H6.5c-.9534 0-1.7283.762-1.749 1.711.0007.013.0029.027.003.04v.104c.0541.918.815 1.645 1.746 1.645H16c.4538 0 .87-.001 1.248.009-.001-.352-.0049-.582-.0283-.756-.013-.097-.0281-.145-.0371-.167a.1506.1506 0 0 0-.0049-.011l-.0009-.002-.002-.001c-.0019-.001-.0057-.003-.0107-.005-.0218-.009-.0705-.024-.167-.037-.2107-.028-.5047-.03-.9971-.03H6.5a.7501.7501 0 0 1-.75-.75c0-.414.3358-.75.75-.75H16c.4502 0 .8634-.002 1.1973.043.3554.048.731.161 1.04.47.309.309.4219.684.4697 1.04.0421.312.042.694.042 1.111.4472.109.8527.299 1.1953.642.4554.455.6412 1.021.7256 1.649.0815.606.0801 1.373.0801 2.295v7c0 .922.0014 1.689-.0801 2.295-.0844.628-.2702 1.194-.7256 1.649-.4553.456-1.0218.641-1.6494.726-.6062.081-1.3733.08-2.2949.08h-5.9961c-1.3927 0-2.5131.002-3.3916-.116-.9001-.121-1.6588-.381-2.2607-.983-.6017-.601-.8605-1.359-.9815-2.259-.118-.879-.1162-1.999-.1162-3.392V4.636C3.2521 4.591 3.25 4.545 3.25 4.5c0-1.795 1.455-3.25 3.25-3.25h13.043ZM4.754 16c0 1.435.001 2.436.1025 3.191.0986.734.2798 1.123.5566 1.4.2767.276.665.457 1.3984.555.7554.102 1.757.104 3.1924.104H16c.964 0 1.6117-.001 2.0947-.066.4614-.062.6588-.17.7891-.3.1303-.131.2378-.328.2998-.789.0325-.242.0491-.525.0576-.867L19.25 18v-7c0-.964-.0015-1.612-.0664-2.095-.0621-.461-.1695-.658-.2998-.789-.1303-.13-.3277-.238-.7891-.3-.483-.065-1.1307-.066-2.0947-.066H6.5c-.643 0-1.2416-.188-1.746-.51V16Zm7.746-.25c.4142 0 .75.336.75.75s-.3358.75-.75.75h-4a.7501.7501 0 0 1-.75-.75c0-.414.3358-.75.75-.75h4Zm3-4c.4142 0 .75.336.75.75s-.3358.75-.75.75h-7a.7501.7501 0 0 1-.75-.75c0-.414.3358-.75.75-.75h7Z" clipRule="evenodd"/></svg>
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