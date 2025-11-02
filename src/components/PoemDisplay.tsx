'use client';

import { useState, useEffect } from 'react';
import { Poem } from '@/lib/types';
import { useFontSize } from '@/lib/user-preferences';
import FontSizeControl from './FontSizeControl';
import BookmarkButton from './BookmarkButton';
import { BookOpen, X, Palette } from 'lucide-react';

interface PoemDisplayProps {
  poem: Poem;
}

type ReadingTheme = 'default' | 'sepia' | 'night';

export default function PoemDisplay({ poem }: PoemDisplayProps) {
  const { poemClasses, fontSize } = useFontSize();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDistractFree, setIsDistractFree] = useState(false);
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>('default');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Get distract-free mode font sizes (larger than normal)
  const getDistractFreeFontSize = () => {
    switch (fontSize) {
      case 'small':
        return 'text-base sm:text-xl'; // Slightly larger than normal small
      case 'medium':
        return 'text-lg sm:text-2xl'; // Default distract-free size
      case 'large':
        return 'text-xl sm:text-3xl'; // Extra large for reading
      default:
        return 'text-lg sm:text-2xl';
    }
  };

  // Prevent hydration mismatch by only rendering after hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsHydrated(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Handle keyboard shortcuts for distract-free mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if focus is on an input element
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true'
      )) {
        return;
      }

      // F or R to enter distract-free mode
      if ((e.key === 'f' || e.key === 'F' || e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsDistractFree(true);
      }
      
      // ESC to exit distract-free mode
      if (e.key === 'Escape' && isDistractFree) {
        e.preventDefault();
        setIsDistractFree(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDistractFree]);

  // Prevent body scroll when distract-free mode is active
  useEffect(() => {
    if (isDistractFree) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isDistractFree]);

  // Track scroll progress in distract-free mode
  useEffect(() => {
    if (!isDistractFree) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight - target.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    const scrollContainer = document.querySelector('.distract-free-scroll');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isDistractFree]);

  // Get theme styles
  const getThemeStyles = () => {
    switch (readingTheme) {
      case 'sepia':
        return {
          bg: 'bg-[#f4ecd8] dark:bg-[#2d2416]', // Light: warm paper, Dark: warm dark brown
          text: 'text-[#5c4b37] dark:text-[#e8dcc4]', // Light: brown, Dark: light beige
          secondaryText: 'text-[#8b7355] dark:text-[#b8a888]', // Light: lighter brown, Dark: muted beige
          controlsBg: 'bg-[#e8dcc4]/90 dark:bg-[#3d3220]/90', // Light: light beige, Dark: darker brown
          filter: '',
        };
      case 'night':
        return {
          bg: 'bg-[#1a1a1a]',
          text: 'text-[#d4d4d4]',
          secondaryText: 'text-[#a3a3a3]',
          controlsBg: 'bg-[#2a2a2a]/90',
          filter: 'brightness(90%) contrast(90%)', // Blue light filter effect
        };
      default:
        return {
          bg: 'bg-stone-50 dark:bg-stone-900',
          text: 'text-stone-900 dark:text-stone-100',
          secondaryText: 'text-stone-500 dark:text-stone-400',
          controlsBg: 'bg-stone-200/80 dark:bg-stone-800/80',
          filter: '',
        };
    }
  };

  const theme = getThemeStyles();

  // Cycle through themes
  const cycleTheme = () => {
    const themes: ReadingTheme[] = ['default', 'sepia', 'night'];
    const currentIndex = themes.indexOf(readingTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setReadingTheme(themes[nextIndex]);
  };

  const getThemeLabel = () => {
    switch (readingTheme) {
      case 'sepia': return 'کاغذی';
      case 'night': return 'شب';
      default: return 'پیش‌فرض';
    }
  };

  // Distract-free reading mode
  if (isDistractFree) {
    return (
      <div 
        className={`fixed inset-0 z-50 overflow-y-auto animate-fadeIn distract-free-scroll ${theme.bg}`}
        style={{ filter: theme.filter }}
      >
        {/* Progress bar at top */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-stone-200/30 dark:bg-stone-700/30 z-50">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 transition-all duration-300 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Close button - always visible */}
        <button
          onClick={() => setIsDistractFree(false)}
          className={`fixed top-4 left-4 sm:top-6 sm:left-6 z-50 flex items-center justify-center w-12 h-12 rounded-full ${theme.controlsBg} backdrop-blur-sm ${theme.text} hover:scale-110 transition-all duration-200 shadow-lg group`}
          aria-label="بستن حالت تمرکز (ESC)"
          title="بستن (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating controls - bottom left */}
        {isHydrated && (
          <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
            {/* Font size control - vertical layout */}
            <div className={`${theme.controlsBg} backdrop-blur-sm rounded-xl shadow-lg p-2`}>
              <FontSizeControl showLabel={false} vertical={true} />
            </div>
            
            {/* Theme toggle button with color indicators */}
            <button
              onClick={cycleTheme}
              className={`${theme.controlsBg} backdrop-blur-sm rounded-xl shadow-lg p-3 flex flex-col items-center gap-2 hover:scale-105 transition-all duration-200`}
              aria-label="تغییر تم"
              title={`تم: ${getThemeLabel()}`}
            >
              <Palette className={`w-5 h-5 ${theme.text}`} />
              
              {/* Theme indicators - 3 colored dots */}
              <div className="flex items-center gap-1">
                {/* Default theme dot */}
                <div 
                  className={`rounded-full transition-all duration-200 ${
                    readingTheme === 'default' 
                      ? 'w-2.5 h-2.5 bg-stone-500 dark:bg-stone-400' 
                      : 'w-1.5 h-1.5 bg-stone-400/40 dark:bg-stone-600/40'
                  }`}
                />
                
                {/* Sepia theme dot */}
                <div 
                  className={`rounded-full transition-all duration-200 ${
                    readingTheme === 'sepia' 
                      ? 'w-2.5 h-2.5 bg-[#8b7355]' 
                      : 'w-1.5 h-1.5 bg-[#8b7355]/40'
                  }`}
                />
                
                {/* Night theme dot */}
                <div 
                  className={`rounded-full transition-all duration-200 ${
                    readingTheme === 'night' 
                      ? 'w-2.5 h-2.5 bg-blue-400' 
                      : 'w-1.5 h-1.5 bg-blue-400/40'
                  }`}
                />
              </div>
            </button>
          </div>
        )}

        {/* Content - centered and spacious */}
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-3xl w-full">
            {/* Title */}
            <h1 className={`font-abar abar-wght-700 text-3xl sm:text-5xl ${theme.text} text-center mb-4 sm:mb-6 leading-tight`}>
              {poem.title}
            </h1>

            {/* Poet name - subtle */}
            <p className={`text-center text-base sm:text-lg ${theme.secondaryText} mb-12 sm:mb-16 font-normal`}>
              {poem.poetName}
            </p>

            {/* Verses - large, spacious, centered */}
            <div className="space-y-4 sm:space-y-6">
              {poem.verses.map((verse, index) => (
                <p 
                  key={index}
                  className={`${theme.text} text-center leading-loose sm:leading-loose ${getDistractFreeFontSize()} ${index % 2 === 1 ? 'mb-8 sm:mb-12' : ''}`}
                  style={{ 
                    lineHeight: '2.5',
                  }}
                >
                  {verse}
                </p>
              ))}
            </div>

            {/* Subtle hint at bottom */}
            <p className={`text-center text-xs sm:text-sm ${theme.secondaryText} mt-16 sm:mt-20 font-normal opacity-60`}>
              برای خروج از حالت تمرکز کلید ESC را فشار دهید • پیمایش: {Math.round(scrollProgress)}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normal view
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="text-center mb-4 sm:mb-8">
        <div className="flex items-center mb-4 flex-row w-full">
          <div className="flex text-right justify-between w-full">
            <h1 className="font-hafez text-2xl sm:text-4xl font-normal text-stone-900 dark:text-stone-300 text-right leading-tight sm:leading-14">
              {poem.title}
            </h1>
          </div>
        </div>

        {/* Mobile-first responsive layout */}
        <div className="flex flex-col-reverse sm:flex-row-reverse gap-8 sm:gap-2 justify-between w-full align-end">
          {/* Controls - Mobile: full width, Desktop: right side */}
          <div className="flex flex-row gap-1 bg-white/75 dark:bg-yellow-900/20 rounded-xl shadow-sm p-1 h-fit w-fit sm:w-auto justify-center sm:justify-end self-end backdrop-blur-sm">
            {/* Font Size Control - only show after hydration */}
            {isHydrated && (
              <div className="flex justify-end border-l-yellow-900/40 dark:border-l-yellow-900/40 border-l pl-2">
                <FontSizeControl showLabel={false} />
              </div>
            )}

            <div className="flex gap-1 justify-center sm:justify-end">
              {/* Distract-free mode button */}
              {isHydrated && (
                <button
                  onClick={() => setIsDistractFree(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600 transition-all duration-200 cursor-pointer touch-target"
                  aria-label="حالت تمرکز (بدون حواس‌پرتی)"
                  title="حالت تمرکز (F)"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              )}

              {/* Bookmark button */}
              {isHydrated ? (
                <BookmarkButton
                  poemId={poem.id}
                  poetId={poem.poetId}
                  poetName={poem.poetName}
                  title={poem.title}
                  categoryId={poem.categoryId}
                  categoryTitle={poem.categoryTitle}
                  className="touch-target"
                />
              ) : (
                <div className="w-10 h-10" /> 
              )}
            </div>
          </div>
          
          {/* Poet info - Mobile: below controls, Desktop: left side */}
          <div className="text-right">
            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-normal">
              {poem.poetName}
            </p>
            {poem.categoryTitle && (
              <p className="text-sm text-stone-500 dark:text-stone-300 mt-1 font-normal">
                از مجموعه: {poem.categoryTitle}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-yellow-900/10 dark:border-yellow-900/40 p-4 sm:p-8 backdrop-blur-md">
        <div className="prose prose-lg max-w-none text-center">
          {poem.verses.map((verse, index) => (
            <p 
              key={index}
              className={`text-stone-900 dark:text-stone-300 leading-relaxed mb-3 even:mb-9 text-right mobile-leading-relaxed ${isHydrated ? poemClasses : ''}`}
            >
              {verse}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
