'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Poem } from '@/lib/types';

interface PoemNavigationProps {
  currentPoem: Poem;
  previousPoem: Poem | null;
  nextPoem: Poem | null;
}

const PoemNavigation = ({ currentPoem, previousPoem, nextPoem }: PoemNavigationProps) => {
  const router = useRouter();

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, poemId: number) => {
    e.preventDefault();
    // Scroll to top immediately with instant behavior for faster navigation
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Navigate immediately
    router.push(`/poem/${poemId}`);
  };

  if (!previousPoem && !nextPoem) {
    return null;
  }

  return (
    <nav 
      className="flex items-center justify-between gap-4 mt-8 pt-8 border-t border-stone-200 dark:border-stone-700"
      aria-label="ناوبری بین اشعار"
    >
      {/* Previous Poem */}
      <div className="flex-1">
        {previousPoem ? (
          <Link
            href={`/poem/${previousPoem.id}`}
            onClick={(e) => handleNavigation(e, previousPoem.id)}
            className="group flex items-center gap-2 px-4 py-3 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            aria-label={`شعر قبلی: ${previousPoem.title}`}
          >
            <ChevronRight className="w-5 h-5 text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors" />
            <div className="flex-1 text-right min-w-0">
              <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">قبلی</div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                {previousPoem.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="px-4 py-3 opacity-50" aria-hidden="true">
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">قبلی</div>
            <div className="text-sm text-stone-400 dark:text-stone-600">—</div>
          </div>
        )}
      </div>

      {/* Next Poem */}
      <div className="flex-1">
        {nextPoem ? (
          <Link
            href={`/poem/${nextPoem.id}`}
            onClick={(e) => handleNavigation(e, nextPoem.id)}
            className="group flex items-center gap-2 px-4 py-3 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            aria-label={`شعر بعدی: ${nextPoem.title}`}
          >
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">بعدی</div>
              <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                {nextPoem.title}
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors" />
          </Link>
        ) : (
          <div className="px-4 py-3 opacity-50 text-left" aria-hidden="true">
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">بعدی</div>
            <div className="text-sm text-stone-400 dark:text-stone-600">—</div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PoemNavigation;

