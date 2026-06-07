import Link from 'next/link';
import { Poet } from '@/lib/types';
import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { toPersianDigits } from '@/lib/persian-digits';

interface PoetCardProps {
  poet: Poet;
}

function PoetCard({ poet }: PoetCardProps) {
  const [isNavigating, setIsNavigating] = React.useState(false);
  // Format birth and death years
  const formatYear = (year?: number) => {
    if (!year) return '';
    // Convert to Persian numerals
    return toPersianDigits(year);
  };

  const birthYear = formatYear(poet.birthYear);
  const deathYear = formatYear(poet.deathYear);
  const yearRange = birthYear && deathYear ? `${birthYear} - ${deathYear}` : '';

  return (
    <Link
      href={`/poet/${poet.id}`}
      prefetch
      onClick={() => {
        // Ensure visible feedback immediately
        if (!isNavigating) setIsNavigating(true);
      }}
      className={`relative block backdrop-blur-md bg-card/70 dark:bg-warning/20 border border-white rounded-xl shadow-lg/5 hover:shadow-sm transition-all duration-200 w-full flex-1 min-w-[310px] dark:border-warning/50 hover:bg-muted dark:hover:bg-warning/80 active:scale-[0.98] touch-manipulation ${isNavigating ? 'opacity-75' : ''}`}
    >
      <div className="flex items-center justify-between p-4 sm:p-6 flex-row-reverse">
        {/* Arrow icon */}
        <div className="w-8 h-8 flex items-center justify-center rotate-180 rounded-full bg-muted/70 dark:bg-secondary aspect-square">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground dark:text-secondary-foreground">
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
          <h3 className="text-lg sm:text-base abar-wght-600 text-foreground text-right leading-tight">
            {poet.name}
          </h3>

          {yearRange && (
            <div className="flex items-center gap-2 w-full justify-end flex-row-reverse">
              <span className="text-sm sm:text-base text-muted-foreground dark:text-secondary-foreground text-right leading-tight font-medium">
                {yearRange}
              </span>
              <HugeiconsIcon icon={Calendar03Icon} size={16} className="sm:w-5 sm:h-5 text-muted-foreground dark:text-secondary-foreground" />
            </div>
          )}
        </div>
      </div>
      {isNavigating && (
        <div className="absolute inset-0 rounded-xl bg-card/40 dark:bg-primary/30 backdrop-blur-[1px] flex items-center justify-center">
          <span className="inline-block w-4 h-4 rounded-full border-2 border-input border-t-transparent animate-spin" />
        </div>
      )}
    </Link>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PoetCard);
