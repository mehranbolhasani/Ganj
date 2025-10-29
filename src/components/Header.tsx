'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import PoetsDropdown from './PoetsDropdown';
import ViewHistory from './ViewHistory';
import GlobalSearch from './GlobalSearch';
import { useViewHistory } from '@/lib/history-manager';
import { useBookmarks } from '@/lib/bookmarks-manager';
import { History, Heart, Menu, X, Search } from 'lucide-react';
import { simpleApi } from '@/lib/simple-api';
import { Poet } from '@/lib/types';

export default function Header() {
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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden p-2 rounded-md text-stone-900 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
        aria-label="منوی موبایل"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Left side - Navigation (Desktop) */}
      <div className="hidden md:flex items-center gap-4 flex-row-reverse">
        {/* Navigation menu */}
        <nav className="flex items-center gap-0 flex-row-reverse">
          {/* Search button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-4 py-2 rounded-md text-sm font-normal text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors flex items-center gap-2"
            aria-label="جستجو"
          >
            <Search className="w-4 h-4" />
            {/* <span>جستجو</span> */}
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/about"
            className="px-4 py-2 rounded-md text-sm font-normal text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
          >
            درباره
          </Link>
          
          {/* History button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            data-history-trigger
            className="relative px-4 py-2 rounded-md text-sm font-normal text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors flex items-center gap-2 cursor-pointer"
            aria-label="تاریخچه بازدیدها"
          >
            <History className="w-4 h-4" />
            <span>تاریخچه</span>
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-stone-600 dark:bg-stone-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {items.length > 9 ? '9+' : items.length}
              </span>
            )}
          </button>

          {/* Bookmarks button */}
          <Link
            href="/bookmarks"
            data-bookmark-trigger
            className="relative px-4 py-2 rounded-md text-sm font-normal text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors flex items-center gap-2 cursor-pointer"
            aria-label="علاقه‌مندی‌ها"
          >
            <Heart className="w-4 h-4" />
            <span>علاقه‌مندی‌ها</span>
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
          <span className="text-lg font-bold text-stone-900 dark:text-stone-300 translate-y-0.5">دفتر گنج</span>
          <div className="w-8 h-8 grid items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><path fill="currentColor" fillRule="evenodd" d="M5.333 0A5.333 5.333 0 0 0 0 5.333v13.334A5.333 5.333 0 0 0 5.333 24h13.334A5.333 5.333 0 0 0 24 18.667V5.333A5.333 5.333 0 0 0 18.667 0H5.333Zm0 3.333a2 2 0 0 0-2 2v13.334a2 2 0 0 0 2 2H10a2 2 0 0 0 2-2V5.333a2 2 0 0 0-2-2H5.333Z" clipRule="evenodd"/></svg>
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
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Mobile Menu Slide-in */}
          <div 
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-stone-800 shadow-xl transform transition-transform duration-300 ease-in-out"
            style={{ transition: 'transform 0.3s ease-in-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">منو</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

                  {/* Mobile Search */}
                  <div className="p-4 border-b border-stone-200 dark:border-stone-700">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        placeholder="جستجو در شاعران..."
                        value={mobileSearchQuery}
                        onChange={(e) => setMobileSearchQuery(e.target.value)}
                        className="w-full pr-10 pl-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                      />
                    </div>
                    
                    {/* Search Results */}
                    {mobileSearchQuery.trim() && (
                      <div className="mt-3 max-h-48 overflow-y-auto">
                        {mobileSearchResults.length > 0 ? (
                          <div className="space-y-1">
                            {mobileSearchResults.map((poet) => (
                              <Link
                                key={poet.id}
                                href={`/poet/${poet.id}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-md transition-colors"
                              >
                                {poet.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-stone-500 dark:text-stone-400">
                            هیچ شاعری با &quot;{mobileSearchQuery}&quot; یافت نشد
                          </div>
                        )}
                      </div>
                    )}
                  </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4 space-y-2">
                {/* About Link */}
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  <span className="text-base">درباره</span>
                </Link>

                {/* History Button */}
                <button
                  onClick={() => {
                    setIsHistoryOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5" />
                    <span className="text-base">تاریخچه</span>
                  </div>
                  {items.length > 0 && (
                    <span className="bg-stone-600 dark:bg-stone-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {items.length > 9 ? '9+' : items.length}
                    </span>
                  )}
                </button>

                {/* Bookmarks Link */}
                <Link
                  href="/bookmarks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5" />
                    <span className="text-base">علاقه‌مندی‌ها</span>
                  </div>
                  {bookmarks.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {bookmarks.length > 9 ? '9+' : bookmarks.length}
                    </span>
                  )}
                </Link>

                {/* Poets Section */}
                <div className="pt-4 border-t border-stone-200 dark:border-stone-700">
                  <h3 className="px-4 py-2 text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">
                    شاعران
                  </h3>
                  
                  {/* Mobile Poets Dropdown Content */}
                  <div className="space-y-1">
                    {/* Famous Poets */}
                    <div className="px-4 py-2">
                      <h4 className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">شاعران مشهور</h4>
                      <div className="space-y-1">
                        {['hafez', 'saadi', 'moulavi', 'ferdousi', 'khayyam', 'saeb', 'attar', 'nezami', 'shahriar'].map((poet) => (
                          <Link
                            key={poet}
                            href={`/poet/${poet}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-3 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-md transition-colors"
                          >
                            {poet === 'hafez' && 'حافظ'}
                            {poet === 'saadi' && 'سعدی'}
                            {poet === 'moulavi' && 'مولانا'}
                            {poet === 'ferdousi' && 'فردوسی'}
                            {poet === 'khayyam' && 'خیام'}
                            {poet === 'saeb' && 'صائب'}
                            {poet === 'attar' && 'عطار'}
                            {poet === 'nezami' && 'نظامی'}
                            {poet === 'shahriar' && 'شهریار'}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* All Poets Link */}
                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-md transition-colors"
                    >
                      همه شاعران
                    </Link>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}