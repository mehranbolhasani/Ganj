'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Poem, Category } from '@/lib/types';
import { hybridApi } from '@/lib/hybrid-api';
import { FaalState, FaalContextValue } from '@/lib/faal-types';
import { FaalProvider } from '@/contexts/FaalContext';
import {
  waitForInitialTransition,
  waitForPanelResize,
  waitForSpinnerDelay,
  waitForMinimumLoading,
  waitForPoemReveal,
} from '@/lib/faal-timing';

// Hafez poet ID in Ganjoor API
const HAFEZ_POET_ID = 2;
// Ghazaliat category title to search for
const GHAZALIAT_TITLE = 'غزلیات';

// Cache for Hafez categories to avoid repeated API calls
interface HafezCache {
  categories: Category[];
  ghazaliatCategoryId: number | null;
  timestamp: number;
}

const HAFEZ_CACHE_KEY = 'faal-hafez-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getHafezCache(): HafezCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(HAFEZ_CACHE_KEY);
    if (!cached) return null;
    const data: HafezCache = JSON.parse(cached);
    // Check if cache is still valid
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(HAFEZ_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setHafezCache(categories: Category[], ghazaliatCategoryId: number | null): void {
  if (typeof window === 'undefined') return;
  try {
    const cache: HafezCache = {
      categories,
      ghazaliatCategoryId,
      timestamp: Date.now(),
    };
    localStorage.setItem(HAFEZ_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore localStorage errors (private browsing, etc.)
  }
}

interface FaalProviderWrapperProps {
  children: React.ReactNode;
}

export function FaalProviderWrapper({ children }: FaalProviderWrapperProps) {
  const [state, setState] = useState<FaalState>('landing');
  const [poem, setPoem] = useState<Poem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingStartTime = useRef<number | null>(null);

  const fetchRandomGhazal = useCallback(async () => {
    // Step 1: Start transition
    setState('transitioning');
    setError(null);
    
    // Wait for initial transition
    await waitForInitialTransition();
    
    // Step 2: Move to loading state - this triggers panel resize
    setState('loading');
    
    // Wait for panel resize to complete
    await waitForPanelResize();
    
    // Step 3: Small delay before showing spinner (for smoother transition)
    await waitForSpinnerDelay();
    
    // Start loading timer
    loadingStartTime.current = Date.now();

    try {
      // Step 1: Get Hafez's categories (use cache if available)
      let categories: Category[];
      let ghazaliatCategoryId: number | null = null;
      
      const cached = getHafezCache();
      if (cached && cached.ghazaliatCategoryId) {
        // Use cached category ID
        ghazaliatCategoryId = cached.ghazaliatCategoryId;
        categories = cached.categories;
      } else {
        // Fetch from API
        const { categories: fetchedCategories } = await hybridApi.getPoet(HAFEZ_POET_ID);
        categories = fetchedCategories;
        
        // Find Ghazaliat category
        const ghazaliatCategory = categories.find(
          (cat) => cat.title === GHAZALIAT_TITLE || cat.title.includes(GHAZALIAT_TITLE)
        );

        if (!ghazaliatCategory) {
          throw new Error('دسته‌بندی غزلیات یافت نشد');
        }

        ghazaliatCategoryId = ghazaliatCategory.id;
        
        // Cache the result
        setHafezCache(categories, ghazaliatCategoryId);
      }

      // Step 3: Get poems from Ghazaliat category
      const poems = await hybridApi.getCategoryPoems(HAFEZ_POET_ID, ghazaliatCategoryId);

      if (!poems || poems.length === 0) {
        throw new Error('غزلی یافت نشد');
      }

      // Step 4: Pick a random poem
      const randomIndex = Math.floor(Math.random() * poems.length);
      const randomPoemSummary = poems[randomIndex];

      // Step 5: Get full poem details
      const fullPoem = await hybridApi.getPoem(randomPoemSummary.id);
      
      // Step 4: Ensure minimum loading time has passed
      const elapsed = Date.now() - (loadingStartTime.current || 0);
      await waitForMinimumLoading(elapsed);
      
      // Step 5: Set poem and move to result state
      setPoem(fullPoem);
      setState('result');
      
      // Step 6: Wait before revealing poem (allows any transitions to complete)
      // The FaalHafez component will handle the reveal animation
      await waitForPoemReveal();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching faal:', err);
      }
      setError(err instanceof Error ? err.message : 'خطا در دریافت فال');
      setState('error');
    }
  }, []);

  const handleTryAgain = useCallback(() => {
    fetchRandomGhazal();
  }, [fetchRandomGhazal]);

  // Context value - expose state and handlers to child components
  const contextValue: FaalContextValue = {
    state,
    poem,
    error,
    fetchRandomGhazal,
    handleTryAgain,
  };

  // Notify layout of state changes (for panel resizing)
  useEffect(() => {
    if (typeof window !== 'undefined' && state !== 'transitioning') {
      window.dispatchEvent(new CustomEvent('faal-state-change', { 
        detail: { state: state as Exclude<FaalState, 'transitioning'> }
      }));
    }
  }, [state]);

  return (
    <FaalProvider value={contextValue}>
      {children}
    </FaalProvider>
  );
}

