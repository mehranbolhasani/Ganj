'use client';

import { Poet } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

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

// Map poet slugs to their image filenames
const getPoetImage = (slug: string) => {
  const imageMap: { [key: string]: string } = {
    'hafez': 'hafez@2x.webp',
    'saadi': 'saadi@2x.webp',
    'moulavi': 'molana@2x.webp',
    'ferdousi': 'ferdowsi@2x.webp',
    'attar': 'attar@2x.webp',
    'nezami': 'nezami@2x.webp'
  };
  return imageMap[slug] || 'hafez@2x.webp'; // fallback to hafez image
};

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
      
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-2 xs:grid-cols-2 gap-6">
        {famousPoets.map((poet) => (
          <Link 
            key={poet.id} 
            href={`/poet/${poet.id}`}
            className="flex flex-col items-center group cursor-pointer w-full bg-white/50 dark:bg-yellow-950/80 border border-white rounded-2xl shadow-lg/5 hover:shadow-sm transition-all duration-200 min-h-[230px] gap-1 dark:border-yellow-900/50 p-1"
          >
            {/* Poet Image */}
            <div className="w-full h-full rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-700 group-hover:bg-stone-300 dark:group-hover:bg-stone-600 transition-colors">
              <Image
                src={`/images/${getPoetImage(poet.slug || '')}`}
                alt={`تصویر ${poet.name}`}
                width={200}
                height={200}
                className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-300 filter brightness-70 contrast-100 hover:brightness-80 hover:contrast-100"
                priority
              />
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
