/**
 * Timing utilities for Faal feature animations and transitions
 */

// Animation timing constants (in milliseconds)
export const FAAL_TIMING = {
  // Initial transition delay before panel resize starts
  INITIAL_TRANSITION: 500,
  // Panel resize duration (should match CSS transition in layout.tsx)
  PANEL_RESIZE: 1000,
  // Delay after panel resize before showing spinner
  SPINNER_DELAY: 200,
  // Minimum loading time with spinner visible (creates anticipation)
  MIN_LOADING_TIME: 3000,
  // Delay after result state before showing poem (allows panel to settle)
  POEM_REVEAL_DELAY: 500,
} as const;

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for initial transition before starting panel resize
 */
export function waitForInitialTransition(): Promise<void> {
  return wait(FAAL_TIMING.INITIAL_TRANSITION);
}

/**
 * Wait for panel resize animation to complete
 */
export function waitForPanelResize(): Promise<void> {
  return wait(FAAL_TIMING.PANEL_RESIZE);
}

/**
 * Wait before showing spinner (smoother transition)
 */
export function waitForSpinnerDelay(): Promise<void> {
  return wait(FAAL_TIMING.SPINNER_DELAY);
}

/**
 * Wait for minimum loading time, accounting for elapsed time
 */
export function waitForMinimumLoading(elapsed: number): Promise<void> {
  const remainingTime = Math.max(0, FAAL_TIMING.MIN_LOADING_TIME - elapsed);
  return wait(remainingTime);
}

/**
 * Wait before revealing poem (allows transitions to complete)
 */
export function waitForPoemReveal(): Promise<void> {
  return wait(FAAL_TIMING.POEM_REVEAL_DELAY);
}

