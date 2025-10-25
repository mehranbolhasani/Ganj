'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, Star } from 'lucide-react';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { Poet } from '@/lib/types';

// Hook to get window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export default function PoetsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [poets, setPoets] = useState<Poet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowSize();


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  // Famous poets for quick access
  const famousPoets = [
    'hafez',      // حافظ
    'saadi',      // سعدی
    'moulavi',    // مولانا
    'ferdousi',   // فردوسی
    'khayyam',    // خیام
    'saeb',       // صائب
    'attar',      // عطار
    'nezami',     // نظامی
    'shahriar'    // شهریار
  ];

  useEffect(() => {
    const fetchPoets = async () => {
      if (poets.length > 0) return; // Already loaded
      
      setLoading(true);
      try {
        const allPoets = await ganjoorApi.getPoets();
        setPoets(allPoets);
      } catch (error) {
        console.error('Error fetching poets for dropdown:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoets();
  }, [poets.length]);

  // Filter and sort poets
  const { filteredPoets, famousPoetsList } = useMemo(() => {
    if (!poets.length) return { filteredPoets: [], famousPoetsList: [] };

    // Separate famous poets
    const famous = poets.filter(poet => 
      poet.slug && famousPoets.includes(poet.slug)
    );

    // Filter other poets based on search
    let others = poets.filter(poet => {
      if (poet.slug && famousPoets.includes(poet.slug)) return false;
      
      if (!searchQuery) return true;
      
      return poet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (poet.slug && poet.slug.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    // If no search query, shuffle the poets for random display
    if (!searchQuery) {
      // Create a shuffled copy using Fisher-Yates algorithm
      const shuffled = [...others];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      others = shuffled;
    } else {
      // Sort alphabetically when searching
      others.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    }

    return {
      filteredPoets: others,
      famousPoetsList: famous
    };
  }, [poets, searchQuery, famousPoets]);

  return (
    <div className="relative poets-dropdown">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-4 py-2 rounded-md text-md font-normal transition-colors z-2 relative ${
          isOpen 
            ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100' 
            : 'text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800'
        }`}
      >
        <span>شاعرها</span>
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay/Backdrop - Only on mobile */}
          {width < 640 && (
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-1"
              onClick={() => setIsOpen(false)}
            />
          )}
          
          {/* Dropdown Content */}
          <div 
            className={`mt-0 bg-white dark:bg-stone-800 shadow-lg border border-stone-200 dark:border-stone-700 z-20 overflow-hidden ${
              width < 640 
                ? 'rounded-lg' 
                : 'absolute top-full left-0 rounded-b-lg border-t-0'
            }`}
            style={width < 640 ? {
              position: 'fixed',
              top: '65px',
              left: '50%',
              right: '50%',
              transform: 'translateX(50%)',
              width: 'calc(100vw - 1rem)',
              maxWidth: 'calc(100vw - 1rem)'
            } : {
              width: '20rem',
              maxWidth: '20rem'
            }}
          >
          {/* Visual connection line */}
          <div className="h-px bg-stone-200 dark:bg-stone-700"></div>
          
          {/* Search Input */}
          <div className="p-3 border-b border-stone-200 dark:border-stone-700" data-extension-ignore="true">
            <div className="relative" style={{ isolation: 'isolate' }}>
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="جستجو در شاعران..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2.5 sm:py-2 text-sm bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600 text-stone-900 dark:text-stone-300 touch-manipulation"
                autoFocus
                autoComplete="off"
                spellCheck="false"
                data-extension-ignore="true"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                style={{ 
                  isolation: 'isolate',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </div>
          </div>

            {/* Content */}
            <div className={`overflow-y-auto ${width < 640 ? 'max-h-136' : 'max-h-96'}`}>
            {loading ? (
              <div className="px-4 py-3 text-sm text-stone-600 dark:text-stone-300 text-center">
                در حال بارگذاری...
              </div>
            ) : (
              <>
                {/* Famous Poets Section */}
                {!searchQuery && famousPoetsList.length > 0 && (
                  <div className="px-3 py-2 bg-stone-50 dark:bg-stone-700/50">
                    <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 mb-2">
                      <Star className="w-3 h-3" />
                      شاعران برجسته
                    </div>
                    {famousPoetsList.map((poet) => (
                      <Link
                        key={poet.id}
                        href={`/poet/${poet.id}`}
                        className="block px-2 py-2.5 sm:py-1.5 text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors touch-manipulation"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{poet.name}</span>
                          {(poet.birthYear || poet.deathYear) && (
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              {poet.birthYear && poet.deathYear
                                ? `${poet.birthYear} - ${poet.deathYear}`
                                : poet.birthYear || poet.deathYear
                              }
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* All Poets Section */}
                {filteredPoets.length > 0 ? (
                  <div className="py-1">
                    {!searchQuery && (
                      <div className="px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 border-b border-stone-100 dark:border-stone-700">
                        همه شاعران ({filteredPoets.length})
                      </div>
                    )}
                    {filteredPoets.slice(0, searchQuery ? 50 : 20).map((poet) => (
                      <Link
                        key={poet.id}
                        href={`/poet/${poet.id}`}
                        className="block px-3 py-3 sm:py-2 text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors touch-manipulation"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{poet.name}</span>
                          {(poet.birthYear || poet.deathYear) && (
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              {poet.birthYear && poet.deathYear
                                ? `${poet.birthYear} - ${poet.deathYear}`
                                : poet.birthYear || poet.deathYear
                              }
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                    {!searchQuery && filteredPoets.length > 20 && (
                      <div className="px-3 py-2 text-xs text-stone-500 dark:text-stone-400 text-center border-t border-stone-100 dark:border-stone-700">
                        و {filteredPoets.length - 20} شاعر دیگر... برای دیدن همه جستجو کنید
                      </div>
                    )}
                    {searchQuery && filteredPoets.length > 50 && (
                      <div className="px-3 py-2 text-xs text-stone-500 dark:text-stone-400 text-center border-t border-stone-100 dark:border-stone-700">
                        {filteredPoets.length - 50} نتیجه دیگر... جستجوی دقیق‌تری انجام دهید
                      </div>
                    )}
                  </div>
                ) : searchQuery ? (
                  <div className="px-4 py-3 text-sm text-stone-600 dark:text-stone-300 text-center">
                    هیچ شاعری با "{searchQuery}" یافت نشد
                  </div>
                ) : null}
              </>
            )}
          </div>
          </div>
        </>
      )}
    </div>
  );
}
