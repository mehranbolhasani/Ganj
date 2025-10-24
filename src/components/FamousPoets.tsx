'use client';

import { Poet } from '@/lib/types';
import Link from 'next/link';

interface FamousPoetsProps {
  poets: Poet[];
}

// Define the 6 most famous poets by their slugs (from Ganjoor website)
const FAMOUS_POET_SLUGS = [
  'hafez',
  'saadi', 
  'moulavi',
  'ferdousi',
  'attar',
  'nezami'
];

export default function FamousPoets({ poets }: FamousPoetsProps) {
  console.log('FamousPoets component rendered with', poets.length, 'poets');
  
  // Debug: Log all poet slugs to see what's available
  console.log('All poet slugs:', poets.map(p => p.slug).slice(0, 10));
  
  // Filter to get only the famous poets
  const famousPoets = poets.filter(poet => 
    FAMOUS_POET_SLUGS.includes(poet.slug?.toLowerCase() || '')
  );
  
  console.log('Found famous poets:', famousPoets.length, famousPoets.map(p => p.name));

  return (
    <div className="w-full mb-24">
      <h2 className="font-doran text-2xl font-bold text-stone-900 dark:text-stone-100 mb-8 text-right">
        شاعرهای پرمخاطب
      </h2>
      
      <div className="grid grid-cols-3 md:grid-cols-3 gap-6">
        {famousPoets.map((poet) => (
          <Link 
            key={poet.id} 
            href={`/poet/${poet.id}`}
            className="flex flex-col items-center group cursor-pointer w-full bg-white/50 dark:bg-stone-800/50 border border-white rounded-xl shadow-lg/5 hover:shadow-sm transition-all duration-200 min-h-[230px] gap-1"
          >
            {/* Image Placeholder */}
            <div className="w-full h-full rounded-xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center group-hover:bg-stone-300 dark:group-hover:bg-stone-600 transition-colors">
              <div className="text-stone-500 dark:text-stone-400 text-xs text-center">
                تصویر<br />شاعر
              </div>
            </div>
            
            {/* Poet Name */}
            <div className="text-center py-4">
              <h3 className="font-doran text-sm md:text-base font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                {poet.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
