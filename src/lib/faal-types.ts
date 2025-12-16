/**
 * Shared types for Faal feature
 */

import { Poem } from './types';

export type FaalState = 'landing' | 'transitioning' | 'loading' | 'result' | 'error';

export interface FaalHandlers {
  fetchRandomGhazal: () => Promise<void>;
  handleTryAgain: () => void;
  state: FaalState;
  poem: Poem | null;
}

export interface FaalContextValue {
  state: FaalState;
  poem: Poem | null;
  error: string | null;
  fetchRandomGhazal: () => Promise<void>;
  handleTryAgain: () => void;
}

