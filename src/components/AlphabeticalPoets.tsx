'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Poet } from '@/lib/types';
import PoetCard from './PoetCard';

interface AlphabeticalPoetsProps {
  poets: Poet[];
  famousPoetSlugs: string[];
  onAvailableLettersChange?: (letters: string[]) => void;
}

// Persian alphabet letters
const PERSIAN_LETTERS = [
  'الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی'
];

export default function AlphabeticalPoets({ poets, famousPoetSlugs, onAvailableLettersChange }: AlphabeticalPoetsProps) {
  const [activeLetter, setActiveLetter] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Filter out famous poets
  const otherPoets = poets.filter(poet => 
    !famousPoetSlugs.includes(poet.slug?.toLowerCase() || '')
  );

  // Group poets by first letter of their name
  const groupedPoets = otherPoets.reduce((groups, poet) => {
    const firstLetter = poet.name.charAt(0);
    const letterKey = firstLetter;
    
    if (!groups[letterKey]) {
      groups[letterKey] = [];
    }
    groups[letterKey].push(poet);
    
    return groups;
  }, {} as { [key: string]: Poet[] });

  // Memoize sortedGroups to prevent infinite re-renders
  const sortedGroups = useMemo(() => {
    return Object.keys(groupedPoets)
      .sort((a, b) => {
        const aIndex = PERSIAN_LETTERS.indexOf(a);
        const bIndex = PERSIAN_LETTERS.indexOf(b);
        return aIndex - bIndex;
      });
  }, [groupedPoets]);

  // Notify parent about available letters
  useEffect(() => {
    if (onAvailableLettersChange) {
      onAvailableLettersChange(sortedGroups);
    }
  }, [sortedGroups, onAvailableLettersChange]);

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    const element = sectionRefs.current[letter];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Update active letter based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      for (const letter of sortedGroups) {
        const element = sectionRefs.current[letter];
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveLetter(letter);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sortedGroups]);

  return (
    <div className="w-full">
      <h2 className="font-doran text-xl font-bold text-stone-900 dark:text-stone-100 mb-8 text-right">
        شاعرهای دیگر
      </h2>
      
      <div className="space-y-8">
        {sortedGroups.map((letter) => (
          <div
            key={letter}
            ref={(el) => {
              sectionRefs.current[letter] = el;
            }}
            data-letter={letter}
            className="scroll-mt-20"
          >
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
                {letter}
              </h3>
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700 mr-4"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {groupedPoets[letter].map((poet) => (
                <PoetCard key={poet.id} poet={poet} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
