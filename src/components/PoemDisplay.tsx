'use client';

import { useState, useEffect } from 'react';
import { Poem } from '@/lib/types';
import { useFontSize } from '@/lib/user-preferences';
import FontSizeControl from './FontSizeControl';
import BookmarkButton from './BookmarkButton';

interface PoemDisplayProps {
  poem: Poem;
}

export default function PoemDisplay({ poem }: PoemDisplayProps) {
  const { poemClasses } = useFontSize();
  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="flex items-center mb-4 flex-row w-full">
          <div className="flex text-right justify-between w-full">
            <h1 className="font-doran text-4xl font-black text-stone-900 dark:text-stone-300 text-right">
              {poem.title}
            </h1>

            <div className="flex flex-row gap-2 bg-white/75 dark:bg-stone-800/80 rounded-xl shadow-sm p-1">
            {/* Font Size Control - only show after hydration */}
            {isHydrated && (
              <div className="flex justify-end border-l-stone-200 dark:border-l-stone-700 border-l-1 pl-2">
                <FontSizeControl showLabel={false} />
              </div>
            )}

              <div className="flex-1 flex justify-end">
                  {isHydrated ? (
                    <BookmarkButton
                      poemId={poem.id}
                      poetId={poem.poetId}
                      poetName={poem.poetName}
                      title={poem.title}
                      categoryId={poem.categoryId}
                      categoryTitle={poem.categoryTitle}
                    />
                  ) : (
                    <div className="w-10 h-10" /> // Placeholder to maintain layout
                  )}
                </div>

            </div>
          </div>
          
        </div>
        <p className="text-lg text-stone-600 dark:text-stone-300 font-normal text-right">
          {poem.poetName}
        </p>
        {poem.categoryTitle && (
          <p className="text-sm text-stone-500 dark:text-stone-300 mt-1 font-normal text-right">
            از مجموعه: {poem.categoryTitle}
          </p>
        )}
      </div>
      
      <div className="bg-white/50 border border-white rounded-2xl shadow-lg/5 dark:bg-stone-800/50 dark:border-stone-700 p-8">
        <div className="prose prose-lg max-w-none text-center">
          {poem.verses.map((verse, index) => (
            <p 
              key={index}
              className={`text-stone-900 dark:text-stone-300 leading-relaxed mb-4 text-right ${isHydrated ? poemClasses : ''}`}
            >
              {verse}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
