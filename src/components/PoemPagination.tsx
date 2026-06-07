'use client';

import { Poem } from '@/lib/types';
import Link from 'next/link';
import { toPersianDigits } from '@/lib/persian-digits';
import { motion, useReducedMotion, Variants } from 'motion/react';

interface PoemPaginationProps {
  poems: Poem[];
  itemsPerPage?: number;
  currentPage?: number;
  baseUrl: string;
}

const gridContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function PoemPagination({
  poems,
  itemsPerPage = 20,
  currentPage = 1,
  baseUrl
}: PoemPaginationProps) {
  const totalPages = Math.ceil(poems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentPoems = poems.slice(startIndex, endIndex);

  const generatePageUrl = (page: number) => {
    return `${baseUrl}?page=${page}`;
  };

  const shouldReduce = useReducedMotion();

  if (poems.length === 0) {
    return null;
  }

  if (totalPages <= 1) {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6"
        variants={shouldReduce ? undefined : gridContainerVariants}
        initial={shouldReduce ? false : 'hidden'}
        animate="show"
      >
        {poems.map((poem) => (
          <motion.div
            key={poem.id}
            variants={shouldReduce ? undefined : gridItemVariants}
            whileHover={shouldReduce ? {} : { y: -2, scale: 1.01 }}
            whileTap={shouldReduce ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <Link
              href={`/poem/${poem.id}`}
              className="block p-4 bg-card rounded-xl shadow-xl shadow-primary/10 dark:shadow-none hover:shadow-primary/15 touch-manipulation"
            >
              <h3 className="text-lg font-semibold mb-2 text-right leading-tight">
                {poem.title}
              </h3>
              <p className="text-muted-foreground dark:text-secondary-foreground text-sm sm:text-base text-right flex items-center justify-start gap-2">
                <span className="font-medium">{poem.poetName}</span>
                {poem.chapterTitle && (
                  <span className="block text-xs sm:text-sm text-muted-foreground mt-1">
                    {poem.chapterTitle}
                  </span>
                )}
              </p>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div>
      {/* Poems Grid */}
      <motion.div
        key={currentPage}
        className="grid grid-cols-1 gap-4 mb-12"
        variants={shouldReduce ? undefined : gridContainerVariants}
        initial={shouldReduce ? false : 'hidden'}
        animate="show"
      >
        {currentPoems.map((poem) => (
          <motion.div
            key={poem.id}
            variants={shouldReduce ? undefined : gridItemVariants}
            whileHover={shouldReduce ? {} : { y: -2, scale: 1.01 }}
            whileTap={shouldReduce ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <Link
              href={`/poem/${poem.id}`}
              className="flex items-center justify-between p-5 bg-card rounded-xl shadow-xl shadow-primary/5 dark:shadow-none hover:shadow-primary/15 touch-manipulation hover:bg-accent/50"
            >
              <h3 className="font-medium text-lg mb-0 text-right leading-tight [word-spacing:-0.2rem] flex-1 pl-4">
                {poem.title}
              </h3>
              <p className="text-xs text-right text-primary/50 flex items-center justify-start gap-2">
                {poem.chapterTitle && (
                  <span className="block text-xs text-muted-foreground">
                    {poem.chapterTitle}
                  </span>
                )}
              </p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 text-sm mb-4">
        {currentPage > 1 && (
          <Link
            href={generatePageUrl(currentPage - 1)}
            className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-muted text-secondary-foreground hover:bg-muted dark:hover:bg-muted active:bg-muted dark:active:bg-muted transition-colors touch-manipulation font-medium"
          >
            قبلی
          </Link>
        )}

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Link
                key={pageNum}
                href={generatePageUrl(pageNum)}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg transition-colors touch-manipulation font-medium ${
                  currentPage === pageNum
                    ? 'bg-accent/70 text-primary'
                    : 'bg-muted text-secondary-foreground hover:bg-muted dark:hover:bg-secondary active:bg-muted dark:active:bg-muted'
                }`}
              >
                {toPersianDigits(pageNum)}
              </Link>
            );
          })}
        </div>

        {currentPage < totalPages && (
          <Link
            href={generatePageUrl(currentPage + 1)}
            className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-muted text-secondary-foreground hover:bg-muted dark:hover:bg-muted active:bg-muted dark:active:bg-muted transition-colors touch-manipulation font-medium"
          >
            بعدی
          </Link>
        )}
      </div>

      {/* Page Info */}
      <div className="text-center text-sm text-muted-foreground mt-2">
        صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)} • {toPersianDigits(poems.length)} شعر
      </div>
    </div>
  );
}
