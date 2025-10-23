'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { Poet } from '@/lib/types';

export default function PoetsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [poets, setPoets] = useState<Poet[]>([]);
  const [loading, setLoading] = useState(false);

  // Phase 1: Same poets as in the main page
  const targetPoets = [
    'hafez',      // حافظ
    'saadi',      // سعدی
    'moulavi',    // مولانا
    'ferdousi',   // فردوسی
    'khayyam',    // خیام
    'saeb',       // صائب
    'attar',      // عطار
    'iraj',       // ایرج میرزا
    'nezami',     // نظامی
    'shahriar'    // شهریار
  ];

  useEffect(() => {
    const fetchPoets = async () => {
      if (poets.length > 0) return; // Already loaded
      
      setLoading(true);
      try {
        const allPoets = await ganjoorApi.getPoets();
        const filteredPoets = allPoets.filter(poet => 
          poet.slug && targetPoets.includes(poet.slug)
        );
        setPoets(filteredPoets);
      } catch (error) {
        console.error('Error fetching poets for dropdown:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoets();
  }, [poets.length]);

  return (
    <div className="relative">
      {/* Dropdown Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-4 py-2 rounded-md text-md font-normal text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors"
      >
        <span>شاعرها</span>
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-0 w-64 bg-white dark:bg-stone-800 rounded-b-lg shadow-lg border border-stone-200 dark:border-stone-700 border-t-0 z-50 overflow-hidden">
          {/* Visual connection line */}
          <div className="h-px bg-stone-200 dark:bg-stone-700"></div>
          <div className="py-1">
            {loading ? (
              <div className="px-4 py-2 text-sm text-stone-600 dark:text-stone-300">
                در حال بارگذاری...
              </div>
            ) : poets.length > 0 ? (
              poets.map((poet) => (
                <Link
                  key={poet.id}
                  href={`/poet/${poet.id}`}
                  className="block px-4 py-2 text-sm text-stone-900 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-700 last:border-b-0"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{poet.name}</span>
                    {(poet.birthYear || poet.deathYear) && (
                      <span className="text-xs text-stone-500 dark:text-stone-300">
                        {poet.birthYear && poet.deathYear
                          ? `${poet.birthYear} - ${poet.deathYear}`
                          : poet.birthYear || poet.deathYear
                        }
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-stone-600 dark:text-stone-300">
                هیچ شاعری یافت نشد
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
