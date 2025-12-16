import { useState, useCallback } from 'react';
import {
  waitForInitialTransition,
  waitForPanelResize,
  waitForSpinnerDelay,
  waitForMinimumLoading,
  waitForPoemReveal,
} from '@/lib/faal-timing';

interface UseFaalAnimationReturn {
  showPoem: boolean;
  showSpinner: boolean;
  startTransition: () => Promise<void>;
  startLoading: () => Promise<void>;
  showSpinnerAfterDelay: () => Promise<void>;
  completeLoading: (elapsed: number) => Promise<void>;
  revealPoem: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook to manage faal animation states and timing
 */
export function useFaalAnimation(): UseFaalAnimationReturn {
  const [showPoem, setShowPoem] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const startTransition = useCallback(async () => {
    setShowPoem(false);
    await waitForInitialTransition();
  }, []);

  const startLoading = useCallback(async () => {
    setShowSpinner(false);
    await waitForPanelResize();
  }, []);

  const showSpinnerAfterDelay = useCallback(async () => {
    await waitForSpinnerDelay();
    setShowSpinner(true);
  }, []);

  const completeLoading = useCallback(async (elapsed: number) => {
    await waitForMinimumLoading(elapsed);
  }, []);

  const revealPoem = useCallback(async () => {
    await waitForPoemReveal();
    setShowPoem(true);
  }, []);

  const reset = useCallback(() => {
    setShowPoem(false);
    setShowSpinner(false);
  }, []);

  return {
    showPoem,
    showSpinner,
    startTransition,
    startLoading,
    showSpinnerAfterDelay,
    completeLoading,
    revealPoem,
    reset,
  };
}

