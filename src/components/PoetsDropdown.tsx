'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { hybridApi } from '@/lib/hybrid-api';
import { Poet } from '@/lib/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Search01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { toPersianDigits } from '@/lib/persian-digits';

const POETS_CACHE_KEY = 'ganjeh-poets-cache-v1';
const POETS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedPoetsPayload {
  poets: Poet[];
  timestamp: number;
}

const getCachedPoets = (): Poet[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(POETS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPoetsPayload;
    if (!Array.isArray(parsed.poets)) return null;
    if (Date.now() - parsed.timestamp > POETS_CACHE_TTL_MS) {
      localStorage.removeItem(POETS_CACHE_KEY);
      return null;
    }
    return parsed.poets;
  } catch {
    return null;
  }
};

const setCachedPoets = (poets: Poet[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedPoetsPayload = { poets, timestamp: Date.now() };
    localStorage.setItem(POETS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
};

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
    const handleClickOutside = () => {
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
  const famousPoets = useMemo(() => [
    'hafez',      // حافظ
    'saadi',      // سعدی
    'moulavi',    // مولانا
    'ferdousi',   // فردوسی
    'khayyam',    // خیام
    'saeb',       // صائب
    'attar',      // عطار
    'nezami',     // نظامی
    'shahriar'    // شهریار
  ], []);

  useEffect(() => {
    const fetchPoets = async () => {
      const cachedPoets = getCachedPoets();
      if (cachedPoets && cachedPoets.length > 0) {
        setPoets(cachedPoets);
      }

      if (poets.length > 0) return; // Already loaded

      setLoading(true);
      try {
        const allPoets = await hybridApi.getPoets();
        setPoets(allPoets);
        setCachedPoets(allPoets);
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
        className={`flex items-center gap-1 px-2 py-2 rounded-md text-sm transition-colors z-20 relative cursor-pointer ${
          isOpen
            ? 'bg-primary/10 text-foreground hover:bg-primary/10 hover:backdrop-blur-xs'
            : 'text-foreground hover:bg-primary/10 hover:backdrop-blur-xs'
        }`}
      >
        <span>شاعرها</span>
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay/Backdrop - Only on mobile */}
          {width < 640 && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Dropdown Content */}
          <div
            className={`mt-0 bg-card shadow-lg border border-border z-80 overflow-hidden ${
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
          <div className="h-px bg-muted"></div>

          {/* Search Input */}
          <div className="p-3 border-b border-border" data-extension-ignore="true">
            <div className="relative" style={{ isolation: 'isolate' }}>
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="جستجو در شاعران..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2.5 sm:py-2 text-sm bg-background dark:bg-secondary border border-border dark:border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground touch-manipulation"
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
              <div className="px-4 py-3 text-sm text-muted-foreground dark:text-secondary-foreground text-center">
                در حال بارگذاری...
              </div>
            ) : (
              <>
                {/* Famous Poets Section */}
                {!searchQuery && famousPoetsList.length > 0 && (
                  <div className="px-3 py-2 bg-background dark:bg-secondary/50">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                      <HugeiconsIcon icon={StarIcon} size={14} />
                      شاعران برجسته
                    </div>
                    {famousPoetsList.map((poet) => (
                      <Link
                        key={poet.id}
                        href={`/poet/${poet.id}`}
                        className="block px-2 py-2.5 sm:py-1.5 text-sm text-foreground hover:bg-muted dark:hover:bg-muted rounded transition-colors touch-manipulation"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{poet.name}</span>
                          {(poet.birthYear || poet.deathYear) && (
                            <span className="text-xs text-muted-foreground">
                              {poet.birthYear && poet.deathYear
                                ? `${toPersianDigits(poet.birthYear)} - ${toPersianDigits(poet.deathYear)}`
                                : poet.birthYear ? toPersianDigits(poet.birthYear) : poet.deathYear ? toPersianDigits(poet.deathYear) : ''
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
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border dark:border-border">
                        همه شاعران ({toPersianDigits(filteredPoets.length)})
                      </div>
                    )}
                    {filteredPoets.slice(0, searchQuery ? 50 : 20).map((poet) => (
                      <Link
                        key={poet.id}
                        href={`/poet/${poet.id}`}
                        className="block px-3 py-3 sm:py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-secondary transition-colors touch-manipulation"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{poet.name}</span>
                          {(poet.birthYear || poet.deathYear) && (
                            <span className="text-xs text-muted-foreground">
                              {poet.birthYear && poet.deathYear
                                ? `${toPersianDigits(poet.birthYear)} - ${toPersianDigits(poet.deathYear)}`
                                : poet.birthYear ? toPersianDigits(poet.birthYear) : poet.deathYear ? toPersianDigits(poet.deathYear) : ''
                              }
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                    {!searchQuery && filteredPoets.length > 20 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border dark:border-border">
                        و {toPersianDigits(filteredPoets.length - 20)} شاعر دیگر... برای دیدن همه جستجو کنید
                      </div>
                    )}
                    {searchQuery && filteredPoets.length > 50 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t border-border dark:border-border">
                        {toPersianDigits(filteredPoets.length - 50)} نتیجه دیگر... جستجوی دقیق‌تری انجام دهید
                      </div>
                    )}
                  </div>
                ) : searchQuery ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground dark:text-secondary-foreground text-center">
                    هیچ شاعری با &quot;{searchQuery}&quot; یافت نشد
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
