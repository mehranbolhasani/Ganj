'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { hybridApi } from '@/lib/hybrid-api';
import { Poet } from '@/lib/types';
import { normalizedPoetSlug } from '@/lib/ganjoor-slug';
import { FEATURED_POETS_FALLBACK } from '@/lib/featured-poets-fallback';
import FamousPoets from './FamousPoets';
import AlphabeticalPoets from './AlphabeticalPoets';
import AlphabeticalNav from './AlphabeticalNav';
import { ArrowLeftIcon } from 'lucide-react';

// Define the 6 most famous poets by their slugs (from Ganjoor website)
const FAMOUS_POET_SLUGS = [
  'hafez',
  'saadi', 
  'moulavi',
  'ferdousi',
  'attar',
  'nezami'
];

const PoetsGrid = () => {
  // Show the six featured cards immediately (no API wait); full list loads in background.
  const [poets, setPoets] = useState<Poet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);

  useEffect(() => {
    const loadPoets = async () => {
      try {
        setLoading(true);
        setError(null);
        const poetsData = await hybridApi.getPoets();
        setPoets(poetsData);
      } catch (err) {
        console.error('Error loading poets:', err);
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری شاعران');
      } finally {
        setLoading(false);
      }
    };

    loadPoets();
  }, []);

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    // Find the section with this letter and scroll to it
    const element = document.querySelector(`[data-letter="${letter}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAvailableLettersChange = useCallback((letters: string[]) => {
    setAvailableLetters(letters);
  }, []);

  // Memoize famous poets to prevent unnecessary recalculations
  const famousPoets = useMemo(() => {
    const matched = poets.filter((poet) => {
      const slug = normalizedPoetSlug(poet.slug);
      return slug && FAMOUS_POET_SLUGS.includes(slug);
    });
    if (matched.length > 0) {
      return matched;
    }
    if (poets.length === 0) {
      return FEATURED_POETS_FALLBACK;
    }
    const byId = new Map(poets.map((p) => [p.id, p]));
    const fromFallback = FEATURED_POETS_FALLBACK.map((fb) => byId.get(fb.id) ?? fb);
    return fromFallback;
  }, [poets]);

  // Memoize other poets (non-famous)
  const otherPoets = useMemo(() => {
    return poets.filter((poet) => {
      const slug = normalizedPoetSlug(poet.slug);
      return !slug || !FAMOUS_POET_SLUGS.includes(slug);
    });
  }, [poets]);

  if (error && poets.length === 0) {
    return (
      <div className="relative w-full">
        <p className="text-center text-sm text-stone-600 dark:text-stone-400 mb-6">
          فهرست شاعران از سرور بارگذاری نشد؛ شاعرهای پرمخاطب به صورت آفلاین نمایش داده می‌شوند.
        </p>
        <FamousPoets poets={FEATURED_POETS_FALLBACK} />
      </div>
    );
  }

  return (
    <div className="relative w-full">

      {/* Famous Poets Section — static data first frame; merges with API when loaded */}
      <FamousPoets poets={famousPoets} />

      {loading && poets.length === 0 && (
        <p className="mt-10 text-center text-sm text-stone-500 dark:text-stone-400">
          در حال بارگذاری فهرست کامل شاعران...
        </p>
      )}
      
      {/* Alphabetical Poets Section */}
      <AlphabeticalPoets 
        poets={otherPoets} 
        famousPoetSlugs={FAMOUS_POET_SLUGS}
        onAvailableLettersChange={handleAvailableLettersChange}
      />
      
      {/* Sticky Alphabetical Navigation (desktop only) */}
      <div className="hidden md:block">
        <AlphabeticalNav 
          onLetterClick={handleLetterClick}
          activeLetter={activeLetter}
          availableLetters={availableLetters}
        />
      </div>




        <div className="faal-banner-container max-w-full md:max-w-[640px] w-full mx-auto sticky bottom-0 z-50 h-28 md:h-36 flex items-center justify-center">
          <a href="/faal" className="faal-banner w-[80%] md:w-1/2 h-20 flex items-center justify-center bg-amber-950/90 rounded-full backdrop-blur-sm shadow-xl dark:shadow-md shadow-amber-900/60 z-30 overflow-hidden relative ring-2 ring-amber-500/20 hover:ring-2 hover:ring-amber-500/40 hover:w-[45%] transition-all duration-300 ease-in-out" target="_blank">
            <div className="faal-banner-content flex items-center justify-between w-full h-full px-6 relative z-20">
              <div className="faal-banner-content-title">
                <h3 className="relative text-4xl font-hafez text-amber-100 dark:text-amber-100 flex items-center justify-center translate-y-0.5">
                  <span>
                    <span>فا</span>
                    <span>ل</span>
                  </span>
                  <span className="relative -mr-4 text-amber-300">
                    <span>حا</span>
                    <span>فظ</span>
                  </span>
                  <span className="absolute font-estedad font-bold text-[0.7rem] bottom-0 left-0">شیرازی</span>
                </h3>
              </div>
    
              <div className="faal-banner-content-description flex items-center justify-center gap-1 text-amber-50">
                <span className="text-base font-bold">مشاهده</span>
                <ArrowLeftIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="w-1/2 h-24 absolute -bottom-12 flex left-1/2 -translate-x-1/2 blur-2xl z-10">
              <div className="w-1/2 h-full bg-amber-700 rounded-full aspect-square min-w-0 -translate-x-8 blur-3xl opacity-60"></div>
              <div className="w-1/2 h-full bg-amber-500 rounded-full aspect-square min-w-0 -translate-x-8 blur-3xl opacity-80"></div>
              <div className="w-1/2 h-full bg-amber-300 rounded-full aspect-square min-w-0 z-10 blur-3xl"></div>
              <div className="w-1/2 h-full bg-amber-500 rounded-full aspect-square min-w-0 translate-x-8 blur-3xl opacity-80"></div>
              <div className="w-1/2 h-full bg-amber-700 rounded-full aspect-square min-w-0 translate-x-8 blur-3xl opacity-60"></div>
            </div>
          </a>
        </div>
    </div>
  );
};

export default PoetsGrid;
