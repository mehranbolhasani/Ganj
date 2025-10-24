'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Poem } from '@/lib/types';
import { ganjoorApi } from '@/lib/ganjoor-api';

// Daily poem cache - changes every 24 hours
const DAILY_POEM_CACHE_KEY = 'daily-poem-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface DailyPoemCache {
  poem: Poem;
  date: string; // YYYY-MM-DD format
  timestamp: number;
}

export default function HeroSection() {
  const [dailyPoem, setDailyPoem] = useState<Poem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDailyPoem = async () => {
      try {
        setLoading(true);
        
        // Check if we have today's poem cached
        const cached = getCachedDailyPoem();
        if (cached) {
          setDailyPoem(cached);
          setLoading(false);
          return;
        }
        
        // Load fresh poem for today
        await loadTodaysPoem();
      } catch (error) {
        console.error('Error loading daily poem:', error);
        setDailyPoem(getFallbackPoem());
        setLoading(false);
      }
    };

    loadDailyPoem();
  }, []);

  const getCachedDailyPoem = (): Poem | null => {
    try {
      const cached = localStorage.getItem(DAILY_POEM_CACHE_KEY);
      if (!cached) return null;
      
      const data: DailyPoemCache = JSON.parse(cached);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if cache is for today
      if (data.date !== today) {
        localStorage.removeItem(DAILY_POEM_CACHE_KEY);
        return null;
      }
      
      return data.poem;
    } catch (error) {
      console.error('Error reading daily poem cache:', error);
      return null;
    }
  };

  const saveDailyPoemCache = (poem: Poem) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data: DailyPoemCache = {
        poem,
        date: today,
        timestamp: Date.now(),
      };
      localStorage.setItem(DAILY_POEM_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving daily poem cache:', error);
    }
  };

  const loadTodaysPoem = async () => {
    try {
      // Get Hafez (poet ID 2) and his categories
      const { categories } = await ganjoorApi.getPoet(2);
      
      if (categories.length === 0) {
        setDailyPoem(getFallbackPoem());
        setLoading(false);
        return;
      }
      
      // Pick a random category from Hafez
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      // Get poems from that category
      const poems = await ganjoorApi.getCategoryPoems(2, randomCategory.id);
      
      if (poems.length === 0) {
        setDailyPoem(getFallbackPoem());
        setLoading(false);
        return;
      }
      
      // Pick a random poem from Hafez
      const randomPoem = poems[Math.floor(Math.random() * poems.length)];
      
      // Get full poem details
      const fullPoem = await ganjoorApi.getPoem(randomPoem.id);
      
      // Ensure it's from Hafez
      const hafezPoem = {
        ...fullPoem,
        poetId: 2,
        poetName: 'حافظ',
      };
      
      // Save to cache
      saveDailyPoemCache(hafezPoem);
      setDailyPoem(hafezPoem);
    } catch (error) {
      console.error('Error loading today\'s poem:', error);
      setDailyPoem(getFallbackPoem());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackPoem = (): Poem => ({
    id: 2133,
    title: 'غزل',
    verses: ['صبا به لُطف بگو آن غزالِ رَعنا را', 'که سَر به کوه و بیابان تو داده‌ای ما را'],
    poetId: 2,
    poetName: 'حافظ',
    categoryId: 24,
    categoryTitle: 'غزلیات',
  });


  if (loading) {
    return (
      <div className="bg-white/50 border border-white rounded-2xl h-48 w-full mt-16 flex items-center justify-center dark:bg-stone-800/50 dark:border-stone-700/50">
        <div className="text-stone-600 dark:text-stone-300">در حال بارگذاری...</div>
      </div>
    );
  }

  if (!dailyPoem) {
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
          {dailyPoem.verses[0] || 'صبا به لُطف بگو آن غزالِ رَعنا را'}
        </p>
        {dailyPoem.verses[1] && (
          <p className="text-lg font-bold text-stone-900 text-center tracking-tight font-doran dark:text-stone-300 leading-relaxed">
            {dailyPoem.verses[1]}
          </p>
        )}
      </div>

      {/* Poet name - Clickable link */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 flex-row-reverse">
        <Link 
          href={`/poet/${dailyPoem.poetId}`}
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
            {dailyPoem.poetName || 'حافظ'}
          </span>
        </Link>
      </div>
    </div>
  );
}
