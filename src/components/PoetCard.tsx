'use client';

import Link from 'next/link';
import { Poet } from '@/lib/types';
import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';
import { toPersianDigits } from '@/lib/persian-digits';
import { motion, useReducedMotion } from 'motion/react';

interface PoetCardProps {
  poet: Poet;
}

function PoetCard({ poet }: PoetCardProps) {
  const [isNavigating, setIsNavigating] = React.useState(false);
  const shouldReduce = useReducedMotion();

  // Format birth and death years
  const formatYear = (year?: number) => {
    if (!year) return '';
    // Convert to Persian numerals
    return toPersianDigits(year);
  };

  const birthYear = formatYear(poet.birthYear);
  const deathYear = formatYear(poet.deathYear);
  const yearRange = birthYear && deathYear ? `${birthYear} - ${deathYear}` : '';

  const cardVariants = {
    rest: { scale: 1 },
    hover: { scale: shouldReduce ? 1 : 1.025 },
    tap: { scale: shouldReduce ? 1 : 0.95 },
  };

  return (
    <motion.div
      className="w-full flex-1 min-w-[310px]"
      variants={cardVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
    >
      <Link
        href={`/poet/${poet.id}`}
        prefetch
        onClick={() => {
          // Ensure visible feedback immediately
          if (!isNavigating) setIsNavigating(true);
        }}
        className={`relative block backdrop-blur-md bg-card rounded-2xl shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/15 dark:shadow-none [active:scale-[0.98]](active:scale-[0.98]) touch-manipulation hover:bg-accent/50 ${isNavigating ? 'opacity-75' : ''}`}
      >
        <div className="flex items-center justify-between p-4 flex-row-reverse">
          {/* Arrow icon */}
          <motion.div
            className="w-8 h-8 flex items-center justify-center rotate-180 rounded-full bg-muted/70 dark:bg-secondary aspect-square"
            variants={{ hover: { x: -3 }, rest: { x: 0 } }}
            initial="rest"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted-foreground dark:text-secondary-foreground">
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          {/* Poet info */}
          <div className="flex flex-col gap-3 sm:gap-4 items-start w-full">
            <h3 className="text-lg sm:text-base abar-wght-600 text-foreground text-right leading-tight">
              {poet.name}
            </h3>

            {yearRange && (
              <div className="flex items-center gap-2 w-full justify-end flex-row-reverse">
                <span className="text-sm text-muted-foreground dark:text-secondary-foreground text-right leading-tight font-medium">
                  {yearRange}
                </span>
                <HugeiconsIcon icon={Calendar03Icon} size={12} className="sm:w-4 sm:h-4 text-muted-foreground dark:text-secondary-foreground" />
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
    </motion.div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PoetCard);
