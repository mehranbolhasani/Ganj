'use client';

import { useState, useEffect } from 'react';
import PoetCard from './PoetCard';
import { simpleApi } from '@/lib/simple-api';
import { Poet } from '@/lib/types';

export default function PoetsGrid() {
  const [poets, setPoets] = useState<Poet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPoets = async () => {
      try {
        setLoading(true);
        const poetsData = await simpleApi.getPoets();
        setPoets(poetsData);
        console.log(`Loaded ${poetsData.length} poets from Ganjoor API`);
      } catch (err) {
        console.error('Error loading poets:', err);
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری شاعران');
      } finally {
        setLoading(false);
      }
    };

    loadPoets();
  }, []);

  if (loading) {
    return (
      <div className="relative w-full">
        <div className="text-center py-8">
          <div className="text-stone-600 dark:text-stone-300">در حال بارگذاری شاعران...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            خطا در بارگذاری
          </h2>
          <p className="text-stone-600 dark:text-stone-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-wrap gap-4 justify-end">
        {poets.map((poet) => (
          <PoetCard key={poet.id} poet={poet} />
        ))}
      </div>
    </div>
  );
}
