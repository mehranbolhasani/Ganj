/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}


/**
 * Track Core Web Vitals
 */
export function trackCoreWebVitals() {
  if (typeof window === 'undefined') return;

  // Dynamically import web-vitals to avoid bundle bloat
  import('web-vitals').then((webVitals) => {
    // Use the correct function names from web-vitals v3+
    const { onCLS, onINP, onFCP, onLCP, onTTFB } = webVitals;
    
    onCLS((metric: PerformanceMetric) => {
      sendToAnalytics(metric);
    });

    // onFID is deprecated, use onINP instead
    onINP((metric: PerformanceMetric) => {
      sendToAnalytics(metric);
    });

    onFCP((metric: PerformanceMetric) => {
      sendToAnalytics(metric);
    });

    onLCP((metric: PerformanceMetric) => {
      sendToAnalytics(metric);
    });

    onTTFB((metric: PerformanceMetric) => {
      sendToAnalytics(metric);
    });
  });
}

/**
 * Send metrics to analytics service
 */
function sendToAnalytics(_metric: PerformanceMetric) {
  // Metrics are now tracked by Vercel Speed Insights
  // If you want to add custom analytics, implement here:
  // gtag('event', metric.name, {
  //   event_category: 'Web Vitals',
  //   event_label: metric.id,
  //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //   non_interaction: true,
  // });
}

/**
 * Track custom performance metrics
 */
export function trackCustomMetric(name: string, value: number, delta: number) {
  const metric: PerformanceMetric = {
    name,
    value,
    delta,
    id: `${name}-${Date.now()}`,
    navigationType: 'navigate',
  };

  sendToAnalytics(metric);
}

/**
 * Track API response times
 */
export function trackApiResponseTime(endpoint: string, duration: number) {
  trackCustomMetric(`api-${endpoint}`, duration, duration);
}

/**
 * Track component render times
 */
export function trackComponentRender(componentName: string, duration: number) {
  trackCustomMetric(`component-${componentName}`, duration, duration);
}

/**
 * Track user interactions
 */
export function trackUserInteraction(action: string) {
  trackCustomMetric(`interaction-${action}`, 1, 1);
}

/**
 * Track storage operations
 */
export function trackStorageOperation(operation: string, duration: number, size?: number) {
  trackCustomMetric(`storage-${operation}`, duration, duration);
  if (size) {
    trackCustomMetric(`storage-${operation}-size`, size, size);
  }
}

/**
 * Track font size changes
 */
export function trackFontSizeChange(fromSize: string, toSize: string, duration: number) {
  trackCustomMetric(`font-size-change`, duration, duration);
  trackCustomMetric(`font-size-${fromSize}-to-${toSize}`, 1, 1);
}

/**
 * Track bookmark operations
 */
export function trackBookmarkOperation(operation: 'add' | 'remove', duration: number) {
  trackCustomMetric(`bookmark-${operation}`, duration, duration);
}

/**
 * Track history operations
 */
export function trackHistoryOperation(operation: 'add' | 'get' | 'clear', duration: number, count?: number) {
  trackCustomMetric(`history-${operation}`, duration, duration);
  if (count) {
    trackCustomMetric(`history-${operation}-count`, count, count);
  }
}

/**
 * Get performance information
 */
export function getPerformanceInfo() {
  if (typeof window === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    firstByte: navigation.responseStart - navigation.requestStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    totalTime: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * Monitor memory usage (if available)
 */
export function getMemoryInfo() {
  if (typeof window === 'undefined') return null;
  
  const memory = (performance as Performance & {memory?: {usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number}}).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}
