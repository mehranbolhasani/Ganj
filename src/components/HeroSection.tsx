'use client';

import { useState, useEffect } from 'react';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { Poem } from '@/lib/types';

export default function HeroSection() {
  const [randomPoem, setRandomPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRandomPoem = async () => {
      try {
        // For now, we'll use a hardcoded poem ID. In the future, we can implement a random poem API
        const poem = await ganjoorApi.getPoem(2133); // Using Hafez poem ID as example
        setRandomPoem(poem);
      } catch (error) {
        console.error('Error fetching random poem:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomPoem();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/50 border border-white rounded-2xl h-48 w-full max-w-[640px] mx-auto mt-16 flex items-center justify-center dark:bg-stone-800/50 dark:border-stone-700/50">
        <div className="text-stone-600 dark:text-stone-300">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!randomPoem) {
    return null;
  }

  return (
    <div className="backdrop-blur-md bg-white/50 border border-white rounded-2xl h-64 w-full max-w-[640px] mx-auto relative overflow-hidden shadow-md dark:bg-stone-800/50 dark:border-stone-700/50">
      {/* Background decoration */}
      <div className="absolute right-1/2 top-2 transform translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-500 rounded-full opacity-10 blur-3xl"></div>
      
      {/* Random poem badge */}
      <div className="absolute top-[-4px] right-4 bg-stone-200 px-2.5 py-2.5 rounded-lg dark:bg-stone-700/50 dark:border-stone-600">
        <span className="text-xs text-stone-600 dark:text-stone-300">شعر تصادفی</span>
      </div>

      {/* Poem content */}
      <div className="relative top-1/2 transform -translate-y-1/2 flex items-center gap-6 justify-center">
        <p className="text-lg font-bold text-stone-900 text-right tracking-tight font-doran dark:text-stone-300">
          {randomPoem.verses[0] || 'صبا به لُطف بگو آن غزالِ رَعنا را'}
        </p>
        
        {/* Decorative line */}
        <div className="w-6 h-px bg-stone-600 dark:bg-stone-400"></div>
        
        <p className="text-lg font-bold text-stone-900 text-right tracking-tight font-doran dark:text-stone-300">
          {randomPoem.verses[1] || 'که سَر به کوه و بیابان تو داده‌ای ما را'}
        </p>
      </div>

      {/* Poet name */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 flex-row-reverse">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180 text-stone-600 dark:text-stone-300">
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-xs text-stone-600 dark:text-stone-300 font-normal tracking-tight">
          {randomPoem.poetName || 'حافظ'}
        </span>
      </div>
    </div>
  );
}
