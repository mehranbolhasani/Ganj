'use client';

import { useMemo } from 'react';
import { useFaalContext } from '@/contexts/FaalContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon } from '@hugeicons/core-free-icons';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'motion/react';

// ─── Variants (mirroring PoemDisplay / CategoryList patterns) ───────────────

const beytContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const beytVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function FaalHafez() {
  const { state, poem, error, handleTryAgain } = useFaalContext();
  const shouldReduce = useReducedMotion();

  const verseGroups = useMemo(() => {
    if (!poem) return [];
    return Array.from(
      { length: Math.ceil(poem.verses.length / 2) },
      (_, beytIndex) => ({
        beytIndex,
        firstVerseIndex: beytIndex * 2,
        secondVerseIndex: beytIndex * 2 + 1,
      })
    );
  }, [poem]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduce ? 0 : 0.3 }}
        className="w-full min-h-12"
      >
        {/* Landing State */}
        {state === 'landing' && <></>}

        {/* Transitioning State */}
        {state === 'transitioning' && (
          <div className="flex flex-col items-center justify-center px-4 min-h-[60vh]" />
        )}

        {/* Loading State */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-start px-4 min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex flex-col items-center"
            >
              {/* Spinner */}
              <div className="relative mb-8">
                <motion.div
                  className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                  animate={shouldReduce ? {} : { opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="relative"
                  animate={shouldReduce ? {} : { rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    size={64}
                    className="sm:w-20 sm:h-20 text-warning"
                  />
                </motion.div>
              </div>

              {/* Loading text */}
              <motion.p
                className="text-xl mb-4 text-center text-background"
                animate={shouldReduce ? {} : { opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                در حال گشودن دیوان...
              </motion.p>
            </motion.div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center px-4 min-h-[60vh]">
            <div className="bg-destructive/10 border border-destructive rounded-2xl p-8 max-w-md text-center">
              <p className="text-destructive text-lg mb-6">
                {error || 'خطایی رخ داده است'}
              </p>
              <motion.button
                onClick={handleTryAgain}
                className="px-6 py-3 bg-destructive/100 hover:bg-red-600 text-primary-foreground rounded-xl font-medium cursor-pointer"
                whileHover={shouldReduce ? {} : { scale: 1.05 }}
                whileTap={shouldReduce ? {} : { scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                تلاش مجدد
              </motion.button>
            </div>
          </div>
        )}

        {/* Result State */}
        {state === 'result' && poem && (
          <div className="flex flex-col items-end pb-24 px-6 md:px-4 justify-center md:gap-12 gap-6 w-full max-w-4xl mx-auto">
            {/* Header with title */}
            <motion.div
              className="text-center w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: shouldReduce ? 0 : 1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <span className="block text-warning font-medium mb-2">فال شما</span>
              <h2 className="text-3xl font-bold text-background">
                {poem.title}
              </h2>
            </motion.div>

            {/* Poem content */}
            <motion.div
              className="faal-card w-full"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduce ? 0 : 1.2,
                delay: shouldReduce ? 0 : 0.2,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <motion.div
                className="space-y-5 md:space-y-1"
                variants={shouldReduce ? undefined : beytContainerVariants}
                initial={shouldReduce ? false : 'hidden'}
                animate="show"
              >
                {verseGroups.map(
                  ({ beytIndex, firstVerseIndex, secondVerseIndex }) => (
                    <motion.div
                      key={beytIndex}
                      variants={shouldReduce ? undefined : beytVariants}
                      className="flex flex-col md:flex-row md:gap-4 gap-0 justify-center"
                    >
                      <p
                        className="text-background text-lg leading-loose text-right md:text-left w-full md:w-1/2"
                        style={{ lineHeight: '2.4' }}
                      >
                        {poem.verses[firstVerseIndex]}
                      </p>
                      {poem.verses[secondVerseIndex] && (
                        <p
                          className="text-background text-lg leading-loose text-left md:text-right w-full md:w-1/2"
                          style={{ lineHeight: '2.4' }}
                        >
                          {poem.verses[secondVerseIndex]}
                        </p>
                      )}
                    </motion.div>
                  )
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
