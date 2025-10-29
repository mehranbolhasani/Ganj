import Link from 'next/link';
import { Poet } from '@/lib/types';
import React from 'react';

import { CalendarRange } from 'lucide-react';

interface PoetCardProps {
  poet: Poet;
}

function PoetCard({ poet }: PoetCardProps) {
  // Format birth and death years
  const formatYear = (year?: number) => {
    if (!year) return '';
    // Convert to Persian numerals if needed
    return year.toString();
  };

  const birthYear = formatYear(poet.birthYear);
  const deathYear = formatYear(poet.deathYear);
  const yearRange = birthYear && deathYear ? `${birthYear} - ${deathYear}` : '';

  return (
    <Link 
      href={`/poet/${poet.id}`}
      className="block backdrop-blur-md bg-white/50 dark:bg-yellow-950/20 border border-white rounded-xl shadow-lg/5 hover:shadow-sm transition-all duration-200 w-full flex-1 min-w-[310px] dark:border-yellow-900/50 hover:bg-stone-100 dark:hover:bg-yellow-950/80 active:scale-[0.98] touch-manipulation"
    >
      <div className="flex items-center justify-between p-4 sm:p-6 flex-row-reverse">
        {/* Arrow icon */}
        <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rotate-180">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-stone-400 dark:text-stone-300">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Poet info */}
        <div className="flex flex-col gap-3 sm:gap-4 items-start w-full">
          <h3 className="font-doran text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-300 text-right leading-tight">
            {poet.name}
          </h3>
          
          {yearRange && (
            <div className="flex items-center gap-2 w-full justify-end flex-row-reverse">
              <span className="text-sm sm:text-base text-stone-500 dark:text-stone-300 text-right leading-tight font-medium">
                {yearRange}
              </span>
              <CalendarRange className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 dark:text-stone-300" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PoetCard);
