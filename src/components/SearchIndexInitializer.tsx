'use client';

import React from 'react';
import { searchIndex } from '@/lib/search-index';

/**
 * Initializes the search index in the background on app startup
 * This component runs silently and doesn't render anything
 */
export default function SearchIndexInitializer() {
  React.useEffect(() => {
    // Initialize search index more aggressively for faster search availability
    const initializeIndex = () => {
      console.log('[SearchIndexInitializer] Starting index initialization...');
      searchIndex.initialize()
        .then(() => {
          console.log('[SearchIndexInitializer] Index initialized successfully');
        })
        .catch((error) => {
          console.warn('[SearchIndexInitializer] Failed to initialize search index:', error);
          // Index will fall back to API search if initialization fails
        });
    };

    // Start immediately for faster index availability
    // Use minimal delay to prioritize index initialization
    setTimeout(initializeIndex, 50); // Reduced from 100ms to 50ms
    
    // Also try immediately in idle time as backup (if available)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initializeIndex, { timeout: 1000 }); // Reduced timeout from 5000ms to 1000ms
    }
  }, []);

  return null;
}

