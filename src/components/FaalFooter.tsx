'use client';

import { useFaalContext } from '@/contexts/FaalContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { RefreshIcon } from '@hugeicons/core-free-icons';

export default function FaalFooter() {
  const { state, fetchRandomGhazal, handleTryAgain } = useFaalContext();

  return (
    <footer className="flex flex-col items-center justify-between px-0 py-8 md:py-24 w-full gap-6">
      <div className="flex flex-col items-center justify-between w-full text-center gap-2">

        <h1 className="text-8xl md:text-[8rem] text-amber-100 dark:text-amber-100 text-center flex relative">
          <span className="relative">
            <span className="-ml-1 md:-ml-2">فا</span>
            <span className="">ل</span>
          </span>
          <span className="relative -mr-14 md:-mr-18 -mt-6 text-amber-300">
            <span className="-ml-2">حا</span>
            <span>فظ</span>
          </span>

          <span className="absolute text-3xl md:text-[2.7rem] bottom-3 left-3 opacity-50">شیرازی</span>
        </h1>
      </div>

      <div className="faal-ctas min-h-20 flex items-center">
        {/* CTA Button - Show when landing */}
        {state === 'landing' && (
          <div>
            <button
              onClick={fetchRandomGhazal}
              className="group relative px-12 py-5 bg-amber-800/40 border border-amber-500 text-amber-100 rounded-full text-xl backdrop-blur-md hover:bg-amber-600 hover:border-amber-600 cursor-pointer hover:scale-105 active:scale-100"
            >
              <span className="relative z-10 flex items-center gap-3 translate-y-0.5">
                نمایش فال
              </span>
            </button>
          </div>
        )}

        {/* Action Button - Show when result */}
        {state === 'result' && (
          <div>
            <button
              onClick={handleTryAgain}
              className="flex items-center justify-center gap-4 group relative px-8 py-4 bg-amber-800/40 border border-amber-500 text-amber-100 rounded-full text-lg backdrop-blur-md hover:bg-amber-600 hover:border-amber-600 cursor-pointer hover:scale-105 active:scale-100"
            >
              <HugeiconsIcon icon={RefreshIcon} size={20} />
              فال دیگر
            </button>
          </div>
        )}
      </div>

    </footer>
  );
}
