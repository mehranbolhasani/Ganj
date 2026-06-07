'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Poem } from '@/lib/types';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface PoemNavigationProps {
  currentPoem: Poem;
  previousPoem: Poem | null;
  nextPoem: Poem | null;
}

const PoemNavigation = ({ previousPoem, nextPoem }: PoemNavigationProps) => {
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
      className="mt-8 flex w-full min-w-0 max-w-full flex-col gap-3 overflow-x-clip border-t border-border pt-8 dark:border-border md:flex-row md:items-stretch md:justify-between md:gap-4"
      aria-label="ناوبری بین اشعار"
    >
      {/* Previous Poem */}
      <div className="w-full min-w-0 shrink-0 md:flex-1 md:basis-0">
        {previousPoem ? (
          <Link
            href={`/poem/${previousPoem.id}`}
            onClick={(e) => handleNavigation(e, previousPoem.id)}
            className="group flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg bg-muted px-3 py-3 transition-colors hover:bg-muted sm:px-4"
            aria-label={`شعر قبلی: ${previousPoem.title}`}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground dark:text-muted-foreground dark:group-hover:text-secondary-foreground" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-right">
              <div className="mb-1 text-xs text-muted-foreground">قبلی</div>
              <div className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere] line-clamp-3">
                {previousPoem.title}
              </div>
            </div>
          </Link>
        ) : (
          <div className="px-4 py-3 opacity-50" aria-hidden="true">
            <div className="text-xs text-muted-foreground mb-1">قبلی</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">—</div>
          </div>
        )}
      </div>

      {/* Next Poem */}
      <div className="w-full min-w-0 shrink-0 md:flex-1 md:basis-0">
        {nextPoem ? (
          <Link
            href={`/poem/${nextPoem.id}`}
            onClick={(e) => handleNavigation(e, nextPoem.id)}
            className="group flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-lg bg-muted px-3 py-3 transition-colors hover:bg-muted sm:px-4"
            aria-label={`شعر بعدی: ${nextPoem.title}`}
          >
            <div className="min-w-0 flex-1 text-left">
              <div className="mb-1 text-xs text-muted-foreground">بعدی</div>
              <div className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere] line-clamp-3">
                {nextPoem.title}
              </div>
            </div>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground dark:text-muted-foreground dark:group-hover:text-secondary-foreground" aria-hidden="true" />
          </Link>
        ) : (
          <div className="px-4 py-3 opacity-50 text-left" aria-hidden="true">
            <div className="text-xs text-muted-foreground mb-1">بعدی</div>
            <div className="text-sm text-muted-foreground dark:text-muted-foreground">—</div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PoemNavigation;
