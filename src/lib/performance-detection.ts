/**
 * Performance detection utilities for optimizing based on device capabilities
 */

// Type definitions for extended Navigator properties
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

interface NetworkInformation {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

/**
 * Check if device is considered low-end based on hardware capabilities
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  
  // Check device memory if available
  const navWithMemory = navigator as NavigatorWithMemory;
  const memory = navWithMemory.deviceMemory || 4;
  
  // Check connection speed if available
  const navWithConnection = navigator as NavigatorWithConnection;
  const connection = navWithConnection.connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  // Consider low-end if:
  // - Less than 4 CPU cores, OR
  // - Less than 4GB RAM, OR
  // - Slow connection (2g or 3g)
  return cores < 4 || memory < 4 || ['2g', '3g'].includes(effectiveType);
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Get recommended particle count based on device capabilities
 */
export function getRecommendedParticleCount(defaultCount: number = 250): number {
  if (isLowEndDevice() || isMobileDevice()) {
    // Reduce particles by 50% on low-end or mobile devices
    return Math.floor(defaultCount * 0.5);
  }
  return defaultCount;
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') || 
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

