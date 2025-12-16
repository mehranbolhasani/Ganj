import { useMemo } from 'react';
import { FaalState } from '@/lib/faal-types';

interface PanelStyles {
  rightPanelWidth?: string;
  leftPanelWidth?: string;
  rightPanelHeight?: string;
  rightPanelMinHeight?: string;
  leftPanelHeight?: string;
  leftPanelMinHeight?: string;
  shouldResize: boolean;
}

export function usePanelStyles(
  faalState: FaalState,
  isMounted: boolean,
  isMobile: boolean
): PanelStyles {
  return useMemo(() => {
    // Panel resizes when loading or result (not landing) - Responsive
    const shouldResize = faalState === 'loading' || faalState === 'result';

    // Custom width for right/left panels on medium+ screens
    const rightPanelWidth =
      isMounted && !isMobile
        ? (shouldResize ? '25%' : '90%')
        : undefined;
    const leftPanelWidth =
      isMounted && !isMobile
        ? (shouldResize ? '70%' : '10%')
        : undefined;

    // Custom height for right/left panels on mobile screens
    const rightPanelHeight =
      isMounted && isMobile
        ? (shouldResize ? 'auto' : '80vh')
        : undefined;
    // Always provide min-height on mobile for smooth transitions
    const rightPanelMinHeight =
      isMounted && isMobile
        ? (shouldResize ? '300px' : '80vh')
        : undefined;
    const leftPanelHeight =
      isMounted && isMobile
        ? 'auto'
        : undefined;
    const leftPanelMinHeight =
      isMounted && isMobile
        ? (shouldResize ? '90vh' : '80px')
        : undefined;

    return {
      rightPanelWidth,
      leftPanelWidth,
      rightPanelHeight,
      rightPanelMinHeight,
      leftPanelHeight,
      leftPanelMinHeight,
      shouldResize,
    };
  }, [faalState, isMounted, isMobile]);
}

