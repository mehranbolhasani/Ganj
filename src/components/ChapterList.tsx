'use client';

import Link from 'next/link';
import { Chapter } from '@/lib/types';
import { toPersianDigits } from '@/lib/persian-digits';
import { motion, useReducedMotion, Variants } from 'motion/react';

interface ChapterListProps {
  chapters: Chapter[];
  categoryTitle: string;
  poetId: number;
  categoryId: number;
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

export default function ChapterList({ chapters, categoryTitle, poetId, categoryId }: ChapterListProps) {
  const shouldReduce = useReducedMotion();

  if (!chapters || chapters.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-foreground mb-4 text-right">
        فصول {categoryTitle}
      </h3>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4"
        variants={shouldReduce ? undefined : gridContainerVariants}
        initial={shouldReduce ? false : 'hidden'}
        animate="show"
      >
        {chapters.map((chapter) => (
          <motion.div
            key={chapter.id}
            variants={shouldReduce ? undefined : gridItemVariants}
            whileHover={shouldReduce ? {} : { y: -2, scale: 1.01 }}
            whileTap={shouldReduce ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <Link
              href={`/poet/${poetId}/category/${categoryId}/chapter/${chapter.id}`}
              className="block p-4 bg-card rounded-xl shadow-xl shadow-primary/10 dark:shadow-none"
            >
              <h4 className="text-base font-medium text-foreground mb-2 text-right">
                {chapter.title}
              </h4>
              {chapter.poemCount && chapter.poemCount > 0 && (
                <p className="text-sm text-muted-foreground text-right">
                  {toPersianDigits(chapter.poemCount)} شعر
                </p>
              )}
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
