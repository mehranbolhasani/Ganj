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

interface PerformanceEntry {
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
      console.log('CLS:', metric);
      sendToAnalytics(metric);
    });

    // onFID is deprecated, use onINP instead
    onINP((metric: PerformanceMetric) => {
      console.log('INP:', metric);
      sendToAnalytics(metric);
    });

    onFCP((metric: PerformanceMetric) => {
      console.log('FCP:', metric);
      sendToAnalytics(metric);
    });

    onLCP((metric: PerformanceMetric) => {
      console.log('LCP:', metric);
      sendToAnalytics(metric);
    });

    onTTFB((metric: PerformanceMetric) => {
      console.log('TTFB:', metric);
      sendToAnalytics(metric);
    });
  });
}

/**
 * Send metrics to analytics service
 */
function sendToAnalytics(metric: PerformanceMetric) {
  // In production, you would send this to your analytics service
  // For now, we'll just log it
  console.log('Performance Metric:', {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // Example: Send to Google Analytics
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

  console.log('Custom Metric:', metric);
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
export function trackUserInteraction(action: string, target: string) {
  trackCustomMetric(`interaction-${action}`, 1, 1);
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
  
  const memory = (performance as any).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  };
}
