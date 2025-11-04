/**
 * Hybrid API Client
 * Smart fallback between Supabase (fast, for migrated poets) and Ganjoor API (comprehensive, for all poets)
 * 
 * Strategy:
 * 1. Try Supabase first (50-200ms response time)
 * 2. Fallback to Ganjoor API if data not found (500-2000ms response time)
 * 3. Track performance metrics for monitoring
 */

import { Poet, Category, Poem, Chapter } from './types';
import { supabaseApi, isSupabaseAvailable } from './supabase-api';
import { ganjoorApi } from './ganjoor-api';

// Performance tracking
interface PerformanceMetric {
  source: 'supabase' | 'ganjoor' | 'hybrid';
  endpoint: string;
  duration: number;
  success: boolean;
  fallback: boolean;
  timestamp: number;
}

const performanceMetrics: PerformanceMetric[] = [];
const MAX_METRICS = 100; // Keep last 100 metrics

/**
 * Track API call performance
 */
function trackPerformance(metric: Omit<PerformanceMetric, 'timestamp'>) {
  performanceMetrics.push({
    ...metric,
    timestamp: Date.now(),
  });

  // Keep only last MAX_METRICS
  if (performanceMetrics.length > MAX_METRICS) {
    performanceMetrics.shift();
  }

  // Log performance in development
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[${metric.source}] ${metric.endpoint}: ${Math.round(metric.duration)}ms ${
        metric.fallback ? '(fallback)' : ''
      }`
    );
  }
}

/**
 * Get performance statistics
 */
export function getPerformanceStats() {
  if (performanceMetrics.length === 0) {
    return null;
  }

  const supabaseMetrics = performanceMetrics.filter(m => m.source === 'supabase' && m.success);
  const ganjoorMetrics = performanceMetrics.filter(m => m.source === 'ganjoor' && m.success);
  const fallbackCount = performanceMetrics.filter(m => m.fallback).length;

  return {
    totalRequests: performanceMetrics.length,
    supabase: {
      count: supabaseMetrics.length,
      avgDuration: supabaseMetrics.length > 0
        ? Math.round(supabaseMetrics.reduce((sum, m) => sum + m.duration, 0) / supabaseMetrics.length)
        : 0,
    },
    ganjoor: {
      count: ganjoorMetrics.length,
      avgDuration: ganjoorMetrics.length > 0
        ? Math.round(ganjoorMetrics.reduce((sum, m) => sum + m.duration, 0) / ganjoorMetrics.length)
        : 0,
    },
    fallbackRate: performanceMetrics.length > 0
      ? Math.round((fallbackCount / performanceMetrics.length) * 100)
      : 0,
  };
}

/**
 * Hybrid API client with smart fallback
 */
export const hybridApi = {
  /**
   * Get all poets (prefer Supabase, fallback to Ganjoor)
   */
  async getPoets(): Promise<Poet[]> {
    const startTime = performance.now();

    // Try Supabase first if available
    if (isSupabaseAvailable()) {
      try {
        const poets = await supabaseApi.getPoets();
        const duration = performance.now() - startTime;
        
        trackPerformance({
          source: 'supabase',
          endpoint: 'getPoets',
          duration,
          success: true,
          fallback: false,
        });

        return poets;
      } catch (error) {
        console.warn('Supabase getPoets failed, falling back to Ganjoor API:', error);
      }
    }

    // Fallback to Ganjoor API
    const fallbackStartTime = performance.now();
    const poets = await ganjoorApi.getPoets();
    const duration = performance.now() - fallbackStartTime;

    trackPerformance({
      source: 'ganjoor',
      endpoint: 'getPoets',
      duration,
      success: true,
      fallback: true,
    });

    return poets;
  },

  /**
   * Get poet details (prefer Supabase, fallback to Ganjoor)
   */
  async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }> {
    const startTime = performance.now();

    // Try Supabase first if available
    if (isSupabaseAvailable()) {
      try {
        // Check if poet exists in Supabase first (fast check)
        const hasPoet = await supabaseApi.hasPoet(id);
        
        if (hasPoet) {
          const data = await supabaseApi.getPoet(id);
          
          // If poet has no categories or data is incomplete, fallback to Ganjoor
          if (data.categories.length === 0) {
            console.log(`Poet ${id} has no categories in Supabase, using Ganjoor API`);
          } else {
            const duration = performance.now() - startTime;
            
            trackPerformance({
              source: 'supabase',
              endpoint: 'getPoet',
              duration,
              success: true,
              fallback: false,
            });

            return data;
          }
        } else {
          console.log(`Poet ${id} not in Supabase, using Ganjoor API`);
        }
      } catch (error) {
        console.warn(`Supabase getPoet(${id}) failed, falling back to Ganjoor API:`, error);
      }
    }

    // Fallback to Ganjoor API
    const fallbackStartTime = performance.now();
    const data = await ganjoorApi.getPoet(id);
    const duration = performance.now() - fallbackStartTime;

    trackPerformance({
      source: 'ganjoor',
      endpoint: 'getPoet',
      duration,
      success: true,
      fallback: true,
    });

    return data;
  },

  /**
   * Get category poems (prefer Supabase, fallback to Ganjoor)
   */
  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]> {
    const startTime = performance.now();

    // Try Supabase first if available
    if (isSupabaseAvailable()) {
      try {
        const poems = await supabaseApi.getCategoryPoems(poetId, categoryId);
        
        // Only use Supabase data if we got results
        if (poems.length > 0) {
          const duration = performance.now() - startTime;
          
          trackPerformance({
            source: 'supabase',
            endpoint: 'getCategoryPoems',
            duration,
            success: true,
            fallback: false,
          });

          return poems;
        } else {
          console.log(`Category ${categoryId} has no poems in Supabase, using Ganjoor API`);
        }
      } catch (error) {
        console.warn(`Supabase getCategoryPoems(${categoryId}) failed, falling back to Ganjoor API:`, error);
      }
    }

    // Fallback to Ganjoor API
    const fallbackStartTime = performance.now();
    const poems = await ganjoorApi.getCategoryPoems(poetId, categoryId);
    const duration = performance.now() - fallbackStartTime;

    trackPerformance({
      source: 'ganjoor',
      endpoint: 'getCategoryPoems',
      duration,
      success: true,
      fallback: true,
    });

    return poems;
  },

  /**
   * Get individual poem (prefer Supabase, fallback to Ganjoor)
   */
  async getPoem(id: number): Promise<Poem> {
    const startTime = performance.now();

    // Try Supabase first if available
    if (isSupabaseAvailable()) {
      try {
        // Check if poem exists in Supabase first (fast check)
        const hasPoem = await supabaseApi.hasPoem(id);
        
        if (hasPoem) {
          const poem = await supabaseApi.getPoem(id);
          const duration = performance.now() - startTime;
          
          trackPerformance({
            source: 'supabase',
            endpoint: 'getPoem',
            duration,
            success: true,
            fallback: false,
          });

          return poem;
        } else {
          console.log(`Poem ${id} not in Supabase, using Ganjoor API`);
        }
      } catch (error) {
        console.warn(`Supabase getPoem(${id}) failed, falling back to Ganjoor API:`, error);
      }
    }

    // Fallback to Ganjoor API
    const fallbackStartTime = performance.now();
    const poem = await ganjoorApi.getPoem(id);
    const duration = performance.now() - fallbackStartTime;

    trackPerformance({
      source: 'ganjoor',
      endpoint: 'getPoem',
      duration,
      success: true,
      fallback: true,
    });

    return poem;
  },

  /**
   * Get chapter details (Ganjoor API only, not in Supabase yet)
   */
  async getChapter(poetId: number, categoryId: number, chapterId: number): Promise<{ chapter: Chapter; poems: Poem[] }> {
    const startTime = performance.now();
    const data = await ganjoorApi.getChapter(poetId, categoryId, chapterId);
    const duration = performance.now() - startTime;

    trackPerformance({
      source: 'ganjoor',
      endpoint: 'getChapter',
      duration,
      success: true,
      fallback: false,
    });

    return data;
  },

  /**
   * Get random poem (Ganjoor API only, not in Supabase yet)
   */
  async getRandomPoem(): Promise<Poem> {
    const startTime = performance.now();
    const poem = await ganjoorApi.getRandomPoem();
    const duration = performance.now() - startTime;

    trackPerformance({
      source: 'ganjoor',
      endpoint: 'getRandomPoem',
      duration,
      success: true,
      fallback: false,
    });

    return poem;
  },
};

/**
 * Export for monitoring and debugging
 */
export { performanceMetrics };

