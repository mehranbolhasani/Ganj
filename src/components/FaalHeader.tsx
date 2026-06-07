'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { motion, useReducedMotion } from 'motion/react';

export default function FaalHeader() {
  const shouldReduce = useReducedMotion();

  return (
    <header className="w-full sm:container-responsive flex flex-col md:flex-row gap-4 md:gap-0 items-center justify-between z-10 relative">
      {/* Right side — Logo */}
      <motion.div
        className="flex items-center gap-1"
        whileHover={shouldReduce ? {} : { opacity: 0.8 }}
        transition={{ duration: 0.2 }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 flex-row-reverse text-background dark:text-background0"
        >
          <span className="sr-only text-md font-medium">دفتر گنج</span>
          <div className="w-8 h-8 grid items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 32 32" className="w-full h-full"><g clipPath="url(#a)"><path fill="#F19000" d="M0 12.8c0-4.48 0-6.72.872-8.432A8 8 0 0 1 4.368.872C6.08 0 8.32 0 12.8 0h6.4c4.48 0 6.72 0 8.432.872a8 8 0 0 1 3.496 3.496C32 6.08 32 8.32 32 12.8v6.4c0 4.48 0 6.72-.872 8.432a8 8 0 0 1-3.496 3.496C25.92 32 23.68 32 19.2 32h-6.4c-4.48 0-6.72 0-8.432-.872a8 8 0 0 1-3.496-3.496C0 25.92 0 23.68 0 19.2z"/><path stroke="#fffbeb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.705" d="M24.59 14.273H9.764a2.84 2.84 0 0 0-2.838 2.996m0 0a2.84 2.84 0 0 0 2.838 2.688h10.799c2.143 0 3.215 0 3.88.666.666.666.666 1.737.666 3.88v7.958c0 2.143 0 3.215-.666 3.88-.665.667-1.737.667-3.88.667h-6.817c-3.215 0-4.822 0-5.821-.999s-.999-2.606-.999-5.821zm0 0v-.152m2.838-.002h10.799c1.071 0 1.607 0 1.94.333s.333.869.333 1.94M19.994 26.209h-7.957m4.547 4.547h-4.547"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 12.8c0-4.48 0-6.72.872-8.432A8 8 0 0 1 4.368.872C6.08 0 8.32 0 12.8 0h6.4c4.48 0 6.72 0 8.432.872a8 8 0 0 1 3.496 3.496C32 6.08 32 8.32 32 12.8v6.4c0 4.48 0 6.72-.872 8.432a8 8 0 0 1-3.496 3.496C25.92 32 23.68 32 19.2 32h-6.4c-4.48 0-6.72 0-8.432-.872a8 8 0 0 1-3.496-3.496C0 25.92 0 23.68 0 19.2z"/></clipPath></defs></svg>
          </div>
        </Link>
      </motion.div>

      <motion.div
        whileHover={shouldReduce ? {} : { x: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <Link
          href="/"
          className="text-sm text-background flex items-center gap-1"
        >
          بازگشت به صفحه اصلی
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </Link>
      </motion.div>
    </header>
  );
}
