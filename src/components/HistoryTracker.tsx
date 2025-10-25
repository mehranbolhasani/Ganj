'use client';

import { useEffect } from 'react';
import { addToHistory } from '@/lib/history-manager';
import { Poem } from '@/lib/types';

interface HistoryTrackerProps {
  poem: Poem;
}

export default function HistoryTracker({ poem }: HistoryTrackerProps) {
  useEffect(() => {
    const trackHistory = async () => {
      try {
        await addToHistory({
          poemId: poem.id,
          poetId: poem.poetId,
          poetName: poem.poetName,
          title: poem.title,
          categoryId: poem.categoryId,
          categoryTitle: poem.categoryTitle,
          url: `/poem/${poem.id}`,
        });
      } catch (error) {
        console.warn('Failed to track poem in history:', error);
      }
    };

    trackHistory();
  }, [poem]);

  return null; // This component doesn't render anything
}
