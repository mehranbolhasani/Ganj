import type { Poet } from '@/lib/types';

/**
 * Static featured poets when the API is empty or unavailable.
 * IDs match Ganjoor; links use /poet/{id} (site archive pages).
 */
export const FEATURED_POETS_FALLBACK: Poet[] = [
  { id: 1, name: 'حافظ', slug: 'hafez', birthYear: 726, deathYear: 792 },
  { id: 2, name: 'سعدی', slug: 'saadi', birthYear: 606, deathYear: 691 },
  { id: 3, name: 'مولوی', slug: 'moulavi', birthYear: 604, deathYear: 672 },
  { id: 4, name: 'فردوسی', slug: 'ferdousi', birthYear: 329, deathYear: 411 },
  { id: 5, name: 'عطار', slug: 'attar', birthYear: 513, deathYear: 618 },
  { id: 6, name: 'نظامی', slug: 'nezami', birthYear: 535, deathYear: 598 },
];
