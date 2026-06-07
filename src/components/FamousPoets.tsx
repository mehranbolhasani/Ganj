'use client';

import { Poet } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { normalizedPoetSlug } from '@/lib/ganjoor-slug';
import { toPersianDigits } from '@/lib/persian-digits';
import { motion, useReducedMotion, Variants } from 'motion/react';

interface FamousPoetsProps {
  poets: Poet[];
}

function formatYear(year?: number) {
  if (!year) return '';
  // Convert to Persian numerals
  return toPersianDigits(year);
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

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6, scale: 0.99 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function FamousPoets({ poets }: FamousPoetsProps) {
  // Filter to get only the famous poets
  const famousPoets = poets.filter((poet) => {
    const slug = normalizedPoetSlug(poet.slug);
    return slug && FAMOUS_POET_SLUGS.includes(slug);
  });

  const shouldReduce = useReducedMotion();

  return (
    <div className="w-full mb-24 relative min-h-fit bg-primary/5 p-4 sm:p-6 rounded-3xl flex flex-col gap-4 backdrop-blur-md">
      <h2 className="sr-only mb-8 text-right">
        شاعرهای پرمخاطب
      </h2>

      <motion.div
        className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 xs:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {famousPoets.map((poet) => (
          <motion.div
            key={poet.id}
            variants={shouldReduce ? undefined : itemVariants}
          >
            <Link
              href={`/poet/${poet.id}`}
              className="grid grid-cols-4 sm:flex sm:flex-col items-center group cursor-pointer w-full h-full bg-card rounded-2xl shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/15 transition-all duration-200 min-h-fit sm:min-h-[230px] gap-1 p-1 active:scale-[0.98] touch-manipulation dark:shadow-none hover:bg-accent/50 dark:hover:bg-accent/50"
            >
              {/* Poet Image with explicit dimensions to prevent CLS */}
              <div className="w-fit h-fit sm:h-full sm:w-full aspect-square rounded-xl overflow-hidden mix-blend-normal dark:mix-blend-hard-light dark:opacity-70 col-span-1">
                <Image
                  src={`/images/${getPoetImage(normalizedPoetSlug(poet.slug))}`}
                  alt={`تصویر ${poet.name}`}
                  width={384}
                  height={384}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="w-full h-full object-cover scale-110 group-hover:scale-120 transition-transform duration-300"
                  priority
                />
              </div>

              {/* Poet Name */}
              <div className="text-right py-3 sm:py-3 w-full px-2 col-span-3">
                <h3 className="text-base font-medium transition-colors leading-tight [word-spacing:-0.2rem]">
                  {poet.name}
                </h3>

                {poet.birthYear && poet.deathYear && (
                  <div className="block w-full">
                    <span className="text-xs sm:text-sm text-warning leading-tight font-bold">
                      {formatYear(poet.birthYear)} - {formatYear(poet.deathYear)}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
