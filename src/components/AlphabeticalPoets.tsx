'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Poet } from '@/lib/types';
import PoetCard from './PoetCard';
import { motion, useReducedMotion, Variants } from 'motion/react';

interface AlphabeticalPoetsProps {
  poets: Poet[];
  famousPoetSlugs: string[];
  onAvailableLettersChange?: (letters: string[]) => void;
}

// Persian alphabet letters
const PERSIAN_LETTERS = [
  'الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی'
];

const groupVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const AlphabeticalPoets = ({ poets, famousPoetSlugs, onAvailableLettersChange }: AlphabeticalPoetsProps) => {
  const [, setActiveLetter] = useState<string>('');
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Filter out famous poets - memoized
  const otherPoets = useMemo(() => {
    return poets.filter(poet =>
      !famousPoetSlugs.includes(poet.slug?.toLowerCase() || '')
    );
  }, [poets, famousPoetSlugs]);

  // Group poets by first letter of their name - memoized
  const groupedPoets = useMemo(() => {
    return otherPoets.reduce((groups, poet) => {
      const firstLetter = poet.name.charAt(0);
      const letterKey = firstLetter;

      if (!groups[letterKey]) {
        groups[letterKey] = [];
      }
      groups[letterKey].push(poet);

      return groups;
    }, {} as { [key: string]: Poet[] });
  }, [otherPoets]);

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

  // Update active letter based on scroll position
  useEffect(() => {
    const handleScroll = () => {
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

  const shouldReduce = useReducedMotion();

  return (
    <div className="w-full">
      <h2 className="text-xl abar-wght-700 text-foreground mb-8 text-right">
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
            <div className="flex items-center mb-4 sticky top-1 z-2 bg-card/80 dark:bg-warning/30 px-6 py-2 rounded-full backdrop-blur-md w-fit mr-2">
              <h3 className="text-xl text-foreground">
                {letter}
              </h3>
              <div className="h-px bg-muted mr-4 w-8"></div>
            </div>

            <motion.div
              className="grid md:grid-cols-2 sm:grid-cols-1 gap-4"
              variants={groupVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
            >
              {groupedPoets[letter].map((poet) => (
                <motion.div
                  key={poet.id}
                  variants={shouldReduce ? undefined : cardVariants}
                >
                  <PoetCard poet={poet} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlphabeticalPoets;
