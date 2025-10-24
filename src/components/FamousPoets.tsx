'use client';

import { Poet } from '@/lib/types';

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
    <div className="w-full mb-12">
      <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-8 text-center">
        محبوب‌ترین شاعرها
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {famousPoets.map((poet) => (
          <div key={poet.id} className="flex flex-col items-center group cursor-pointer">
            {/* Image Placeholder */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-stone-200 dark:bg-stone-700 mb-3 flex items-center justify-center group-hover:bg-stone-300 dark:group-hover:bg-stone-600 transition-colors">
              <div className="text-stone-500 dark:text-stone-400 text-xs text-center">
                تصویر<br />شاعر
              </div>
            </div>
            
            {/* Poet Name */}
            <div className="text-center">
              <h3 className="text-sm md:text-base font-medium text-stone-900 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                {poet.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
