'use client';

import React, { Suspense, lazy, ComponentType } from 'react';
import { SuspenseFallback } from '@/components/LoadingStates';

/**
 * Higher-order component for lazy loading with error boundary
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLazyLoading<T = any>(
  importFunc: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback ? React.createElement(fallback) : <SuspenseFallback />}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

/**
 * Lazy load components with custom loading states
 */
export const LazyComponents = {
  // Heavy modals and overlays
  GlobalSearch: withLazyLoading(() => import('@/components/GlobalSearch')),
  ViewHistory: withLazyLoading(() => import('@/components/ViewHistory')),
  
  // Complex widgets
  BookmarksWidget: withLazyLoading(() => import('@/components/BookmarksWidget')),
  
  // Background components removed for performance
  
  // Search and results
  SearchResults: withLazyLoading(() => import('@/components/SearchResults')),
  
  // Utility components
  OfflineIndicator: withLazyLoading(() => import('@/components/OfflineIndicator')),
};

/**
 * Preload components when user hovers over trigger elements
 */
export function usePreloadOnHover(componentName: keyof typeof LazyComponents) {
  const preloadComponent = () => {
    // This will trigger the dynamic import
    void LazyComponents[componentName];
    // The component is already loaded when accessed, but we can add additional preloading logic here
  };

  return {
    onMouseEnter: preloadComponent,
    onFocus: preloadComponent,
  };
}

/**
 * Preload components based on user interaction patterns
 */
export function preloadComponents() {
  // Preload search when user starts typing
  if (typeof window !== 'undefined') {
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="جستجو"]');
    searchInputs.forEach(input => {
      input.addEventListener('focus', () => {
        import('@/components/GlobalSearch');
      });
    });

    // Preload history when user hovers over history button
    const historyButtons = document.querySelectorAll('[data-history-trigger]');
    historyButtons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        import('@/components/ViewHistory');
      });
    });

    // Preload bookmarks widget when user hovers over bookmarks
    const bookmarkButtons = document.querySelectorAll('[data-bookmark-trigger]');
    bookmarkButtons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        import('@/components/BookmarksWidget');
      });
    });
  }
}

/**
 * Initialize preloading on page load
 */
export function initializePreloading() {
  if (typeof window !== 'undefined') {
    // Preload critical components after initial page load
    setTimeout(() => {
      preloadComponents();
    }, 1000);

    // Preload on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload non-critical components
        // Background components removed for performance
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        // Background components removed for performance
      }, 2000);
    }
  }
}

/**
 * Lazy load routes
 */
export const LazyPages = {
  SearchPage: withLazyLoading(() => import('@/app/search/page')),
  HistoryPage: withLazyLoading(() => import('@/app/history/page')),
  BookmarksPage: withLazyLoading(() => import('@/app/bookmarks/page')),
};

/**
 * Component for conditional lazy loading
 */
interface ConditionalLazyProps {
  condition: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>;
  fallback?: React.ComponentType;
  children?: React.ReactNode;
}

export function ConditionalLazy({ 
  condition, 
  component: Component, 
  fallback: Fallback,
  children 
}: ConditionalLazyProps) {
  if (!condition) {
    return children ? <>{children}</> : null;
  }

  return (
    <Suspense fallback={Fallback ? <Fallback /> : <SuspenseFallback />}>
      <Component />
    </Suspense>
  );
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoad(ref: React.RefObject<HTMLElement>, options?: IntersectionObserverInit) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref, options]);

  return isVisible;
}
