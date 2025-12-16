'use client';

import { createContext, useContext, ReactNode } from 'react';
import { FaalContextValue } from '@/lib/faal-types';

const FaalContext = createContext<FaalContextValue | null>(null);

interface FaalProviderProps {
  children: ReactNode;
  value: FaalContextValue;
}

export function FaalProvider({ children, value }: FaalProviderProps) {
  return <FaalContext.Provider value={value}>{children}</FaalContext.Provider>;
}

export function useFaalContext(): FaalContextValue {
  const context = useContext(FaalContext);
  if (!context) {
    throw new Error('useFaalContext must be used within FaalProvider');
  }
  return context;
}

