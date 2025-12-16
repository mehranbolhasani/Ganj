'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useFaalContext } from '@/contexts/FaalContext';

export default function FaalHafez() {
  const { state, poem, error, handleTryAgain } = useFaalContext();
  const [showPoem, setShowPoem] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [, startTransition] = useTransition();

  // Reset animation states when state changes
  useEffect(() => {
    // Reset states when transitioning away from result/loading
    if (state !== 'result' && state !== 'loading') {
      startTransition(() => {
        setShowPoem(false);
        setShowSpinner(false);
      });
    }
  }, [state, startTransition]);

  // Handle animation states based on context state
  useEffect(() => {
    if (state === 'loading') {
      // Show spinner after a delay (handled by provider)
      const timer = setTimeout(() => {
        startTransition(() => {
          setShowSpinner(true);
        });
      }, 1200); // Panel resize (1000ms) + small delay (200ms)
      return () => {
        clearTimeout(timer);
        startTransition(() => {
          setShowSpinner(false);
        });
      };
    } else if (state === 'result' && poem) {
      // Reset spinner when showing result
      startTransition(() => {
        setShowSpinner(false);
      });
      // Show poem after a delay
      const timer = setTimeout(() => {
        startTransition(() => {
          setShowPoem(true);
        });
      }, 500);
      return () => {
        clearTimeout(timer);
        startTransition(() => {
          setShowPoem(false);
        });
      };
    }
  }, [state, poem, startTransition]);

  // Memoize verse grouping to avoid recalculation on every render
  // MUST be called before any conditional returns to follow Rules of Hooks
  const verseGroups = useMemo(() => {
    if (!poem) return [];
    return Array.from({ length: Math.ceil(poem.verses.length / 2) }, (_, beytIndex) => ({
      beytIndex,
      firstVerseIndex: beytIndex * 2,
      secondVerseIndex: beytIndex * 2 + 1,
    }));
  }, [poem]);

  // Landing State - The initial view
  if (state === 'landing') {
    return <></>;
  }

  // Transitioning State - Panel expands
  if (state === 'transitioning') {
    return (
      <div className="flex flex-col items-center justify-center px-4 min-h-[60vh] transition-all duration-300 ease-out">
        {/* Empty state during transition */}
      </div>
    );
  }

  // Loading State - Show spinner only after panel resize
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center px-4 min-h-[60vh] transition-all duration-300 ease-out">
        {showSpinner ? (
          <>
            {/* Spinner */}
            <div className="relative mb-8">
              <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full animate-pulse" />
              <div className="relative">
                <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-amber-600 dark:text-amber-400 animate-spin" />
              </div>
            </div>

            {/* Loading text */}
            <p className="text-xl text-amber-700 dark:text-amber-300 mb-4 text-center animate-pulse">
              در حال گشودن دیوان...
            </p>
          </>
        ) : (
          // Empty state during panel resize
          <div className="opacity-0">
            <Loader2 className="w-16 h-16 text-transparent" />
          </div>
        )}
      </div>
    );
  }

  // Error State
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 text-lg mb-6">
            {error || 'خطایی رخ داده است'}
          </p>
          <button
            onClick={handleTryAgain}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // Result State - Display the poem with animation
  if (state === 'result' && poem) {
    return (
      <div className="flex flex-col items-center pt-24 pb-8 md:py-4 px-6 md:px-4 flex-1 justify-center md:gap-12 gap-6 min-h-[60vh] transition-all duration-300 ease-out">
        {/* Header with title - animated */}
        <div 
          className={`text-center w-full max-w-2xl transition-all duration-400 ease-out ${
            showPoem 
              ? 'opacity-100' 
              : 'opacity-0'
          }`}
        >
          <span className="block text-amber-600 dark:text-amber-400 font-medium mb-4">فال شما</span>
          <h2 className="font-hafez text-3xl md:text-5xl text-amber-100 dark:text-amber-100">
            {poem.title}
          </h2>
        </div>

        {/* Poem content - animated with stagger */}
        <div 
          className={`faal-card w-full max-w-2xl transition-all duration-700 ease-out delay-150 ${
            showPoem 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="space-y-5 md:space-y-1">
            {verseGroups.map(({ beytIndex, firstVerseIndex, secondVerseIndex }) => (
              <div 
                key={beytIndex} 
                className={`flex flex-col md:flex-row md:gap-4 gap-0 justify-center transition-all duration-500 ease-out  ${
                  showPoem 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-2'
                }`}
                style={{ 
                  transitionDelay: `${200 + beytIndex * 50}ms` 
                }}
              >
                <p
                  className="text-amber-50 dark:text-amber-100 text-lg leading-loose text-right md:text-left w-full md:w-1/2"
                  style={{ lineHeight: '2.4' }}
                >
                  {poem.verses[firstVerseIndex]}
                </p>
                {poem.verses[secondVerseIndex] && (
                  <p
                    className="text-amber-50 dark:text-amber-100 text-lg leading-loose text-left md:text-right w-full md:w-1/2"
                    style={{ lineHeight: '2.4' }}
                  >
                    {poem.verses[secondVerseIndex]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

