'use client';

import { useState, useEffect } from 'react';

// Persian alphabet letters
const PERSIAN_LETTERS = [
  'الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی'
];

interface AlphabeticalNavProps {
  onLetterClick: (letter: string) => void;
  activeLetter?: string;
  availableLetters?: string[];
}

export default function AlphabeticalNav({ onLetterClick, activeLetter, availableLetters = [] }: AlphabeticalNavProps) {
  const [isVisible, setIsVisible] = useState(false); // Hidden initially

  useEffect(() => {
    const handleScroll = () => {
      // Show nav when user scrolls past the famous poets section
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 300); // Show after scrolling past famous poets
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Mobile: Horizontal scrollable nav at bottom */}
      <div className={`md:hidden fixed bottom-4 left-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="bg-white dark:bg-stone-800 rounded-lg shadow-lg p-2 border border-stone-200 dark:border-stone-700">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => onLetterClick(letter)}
                className={`px-3 py-2 text-sm font-medium rounded transition-all duration-200 touch-manipulation whitespace-nowrap shrink-0 ${
                  activeLetter === letter
                    ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Vertical nav on right side */}
      <div className={`hidden md:block fixed right-4 top-1/2 transform -translate-y-1/2 z-50 transition-translate transition-opacity duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}>
        <div className="alphabetical-nav bg-white dark:bg-stone-800 rounded-lg shadow-lg p-2 border border-stone-200 dark:border-stone-700">
          <div className="flex flex-col space-y-1 max-h-96 overflow-y-auto">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                onClick={() => onLetterClick(letter)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                  activeLetter === letter
                    ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
