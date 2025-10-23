import Link from 'next/link';
import { Poet } from '@/lib/types';

import { CalendarRange } from 'lucide-react';

interface PoetCardProps {
  poet: Poet;
}

export default function PoetCard({ poet }: PoetCardProps) {
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
      className="block backdrop-blur-md bg-white/50 dark:bg-stone-800/50 border border-white rounded-xl shadow-lg/5 hover:shadow-sm transition-all duration-200 w-full flex-1 min-w-[310px] dark:border-stone-700/50"
    >
      <div className="flex items-center justify-between p-4 flex-row-reverse">
        {/* Arrow icon */}
        <div className="w-6 h-6 flex items-center justify-center rotate-180">
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
        <div className="flex flex-col gap-4 items-start w-full">
          <h3 className="font-doran text-md font-bold text-stone-900 dark:text-stone-300 text-right leading-4">
            {poet.name}
          </h3>
          
          {yearRange && (
            <div className="flex items-center gap-1 w-full justify-end flex-row-reverse">
              <span className="text-sm text-stone-500 dark:text-stone-300 text-right leading-4">
                {yearRange}
              </span>
              <CalendarRange className="w-4 h-4 text-stone-400 dark:text-stone-300" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
