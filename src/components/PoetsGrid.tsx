'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { hybridApi } from '@/lib/hybrid-api';
import { Poet } from '@/lib/types';
import FamousPoets from './FamousPoets';
import AlphabeticalPoets from './AlphabeticalPoets';
import AlphabeticalNav from './AlphabeticalNav';

// Define the 6 most famous poets by their slugs (from Ganjoor website)
const FAMOUS_POET_SLUGS = [
  'hafez',
  'saadi', 
  'moulavi',
  'ferdousi',
  'attar',
  'nezami'
];

const PoetsGrid = () => {
  const [poets, setPoets] = useState<Poet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);

  console.log('PoetsGrid component rendered');

  useEffect(() => {
    const loadPoets = async () => {
      try {
        console.log('Starting to load poets...');
        setLoading(true);
        const poetsData = await hybridApi.getPoets();
        console.log('API response:', poetsData.slice(0, 3)); // Log first 3 poets
        setPoets(poetsData);
        console.log(`Loaded ${poetsData.length} poets from Hybrid API`);
      } catch (err) {
        console.error('Error loading poets:', err);
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری شاعران');
      } finally {
        setLoading(false);
      }
    };

    loadPoets();
  }, []);

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    // Find the section with this letter and scroll to it
    const element = document.querySelector(`[data-letter="${letter}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAvailableLettersChange = useCallback((letters: string[]) => {
    setAvailableLetters(letters);
  }, []);

  // Memoize famous poets to prevent unnecessary recalculations
  const famousPoets = useMemo(() => {
    return poets.filter(poet => poet.slug && FAMOUS_POET_SLUGS.includes(poet.slug));
  }, [poets]);

  // Memoize other poets (non-famous)
  const otherPoets = useMemo(() => {
    return poets.filter(poet => !poet.slug || !FAMOUS_POET_SLUGS.includes(poet.slug));
  }, [poets]);

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
      {/* Famous Poets Section */}
      <FamousPoets poets={famousPoets} />
      
      {/* Alphabetical Poets Section */}
      <AlphabeticalPoets 
        poets={otherPoets} 
        famousPoetSlugs={FAMOUS_POET_SLUGS}
        onAvailableLettersChange={handleAvailableLettersChange}
      />
      
      {/* Sticky Alphabetical Navigation */}
      <AlphabeticalNav 
        onLetterClick={handleLetterClick}
        activeLetter={activeLetter}
        availableLetters={availableLetters}
      />
    </div>
  );
};

export default PoetsGrid;
