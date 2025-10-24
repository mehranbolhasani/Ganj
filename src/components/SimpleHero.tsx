'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Poem } from '@/lib/types';

export default function SimpleHero() {
  const [poem, setPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ultra-simple hardcoded approach
    const poems = [
      {
        id: 2133,
        title: 'غزل',
        verses: ['صبا به لُطف بگو آن غزالِ رَعنا را', 'که سَر به کوه و بیابان تو داده‌ای ما را'],
        poetId: 2,
        poetName: 'حافظ',
        categoryId: 24,
        categoryTitle: 'غزلیات',
      }
    ];

    const timer = setTimeout(() => {
      setPoem(poems[0]);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/50 border border-white rounded-2xl h-48 w-full mt-16 flex items-center justify-center dark:bg-stone-800/50 dark:border-stone-700/50">
        <div className="text-stone-600 dark:text-stone-300">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="bg-white/50 border border-white rounded-2xl h-48 w-full mt-16 flex items-center justify-center dark:bg-stone-800/50 dark:border-stone-700/50">
        <div className="text-stone-600 dark:text-stone-300">خطا در بارگذاری شعر</div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/50 border border-white rounded-2xl h-64 w-full relative overflow-hidden shadow-md dark:bg-stone-800/50 dark:border-stone-700/50">
      {/* Background decoration */}
      <div className="absolute right-1/2 top-2 transform translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-500 rounded-full opacity-10 blur-3xl"></div>
      
      {/* Daily poem badge */}
      <div className="absolute top-[-4px] right-4 bg-stone-200 px-2.5 py-2.5 rounded-lg dark:bg-stone-700/50 dark:border-stone-600">
        <span className="text-xs text-stone-600 dark:text-stone-300">شعر امروز</span>
      </div>

      {/* Poem content - One beyt (couplet) */}
      <div className="relative top-1/2 transform -translate-y-1/2 flex flex-col items-center justify-center px-8 gap-2">
        <p className="text-lg font-bold text-stone-900 text-center tracking-tight font-doran dark:text-stone-300 leading-relaxed">
          {poem.verses[0] || 'صبا به لُطف بگو آن غزالِ رَعنا را'}
        </p>
        {poem.verses[1] && (
          <p className="text-lg font-bold text-stone-900 text-center tracking-tight font-doran dark:text-stone-300 leading-relaxed">
            {poem.verses[1]}
          </p>
        )}
      </div>

      {/* Poet name - Clickable link */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 flex-row-reverse">
        <Link 
          href={`/poet/${poem.poetId}`}
          className="flex items-center gap-1 flex-row-reverse hover:bg-stone-200 dark:hover:bg-stone-700 px-2 py-1 rounded-md transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180 text-stone-600 dark:text-stone-300">
            <path
              d="M6 4L10 8L6 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xs text-stone-600 dark:text-stone-300 font-normal tracking-tight hover:text-stone-900 dark:hover:text-stone-100">
            {poem.poetName || 'حافظ'}
          </span>
        </Link>
      </div>
    </div>
  );
}
