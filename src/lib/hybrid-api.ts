/**
 * Hybrid API Client
 * Smart fallback between Supabase (fast, for migrated poets) and Ganjoor API (comprehensive, for all poets)
 * 
 * Strategy:
 * 1. Try Supabase first (50-200ms response time)
 * 2. Fallback to Ganjoor API if data not found (500-2000ms response time)
 */

import { Poet, Category, Poem, Chapter } from './types';
import { supabaseApi, isSupabaseAvailable } from './supabase-api';
import { ganjoorApi } from './ganjoor-api';

// Module-level cache for migrated poet ID Set
let migratedPoetSetCache: Set<number> | null = null;
let migratedPoetSetCacheExpiresAt = 0;
const MIGRATED_SET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getMigratedPoetIdSet(): Promise<Set<number>> {
  if (!isSupabaseAvailable()) {
    return new Set<number>();
  }

  const now = Date.now();
  if (migratedPoetSetCache && now < migratedPoetSetCacheExpiresAt) {
    return migratedPoetSetCache;
  }

  const ids = await supabaseApi.listMigratedPoetIds();
  migratedPoetSetCache = new Set(ids);
  migratedPoetSetCacheExpiresAt = now + MIGRATED_SET_CACHE_TTL_MS;
  return migratedPoetSetCache;
}

export async function isMigratedPoet(id: number): Promise<boolean> {
  if (!isSupabaseAvailable()) {
    return false;
  }
  const migratedSet = await getMigratedPoetIdSet();
  return migratedSet.has(id);
}

/**
 * Hybrid API client with smart fallback
 */
export const hybridApi = {
  /**
   * Get all poets (prefer Supabase, fallback to Ganjoor)
   */
  async getPoets(): Promise<Poet[]> {
    if (isSupabaseAvailable()) {
      try {
        const poets = await supabaseApi.getPoets();
        if (poets.length > 0) {
          return poets;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Supabase getPoets failed, falling back to Ganjoor API:', error);
        }
      }
    }
    return ganjoorApi.getPoets();
  },

  /**
   * Get poet details (prefer Supabase, fallback to Ganjoor)
   */
  async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }> {
    if (isSupabaseAvailable()) {
      try {
        // Check if poet exists in Supabase first (fast check)
        const hasPoet = await supabaseApi.hasPoet(id);
        
        if (hasPoet) {
          const data = await supabaseApi.getPoet(id);
          // If Supabase has the poet but returns no categories, the data is
          // incomplete — fall back to Ganjoor API so callers like the Faal page
          // can still find the category they need.
          if (data.categories.length > 0) {
            return data;
          }
          console.warn(
            `Poet ${id} found in Supabase but has no categories, falling back to Ganjoor API`
          );
        } else {
          console.log(`Poet ${id} not in Supabase, using Ganjoor API`);
        }
      } catch (error) {
        console.warn(`Supabase getPoet(${id}) failed, falling back to Ganjoor API:`, error);
      }
    }

    // Fallback to Ganjoor API
    return ganjoorApi.getPoet(id);
  },

  /**
   * Get category poems (prefer Supabase, fallback to Ganjoor)
   */
  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]> {
    const migratedPoet = await isMigratedPoet(poetId);

    if (migratedPoet) {
      const poems = await supabaseApi.getCategoryPoems(poetId, categoryId);
      // Intentionally return Supabase result (even if empty) for migrated poets.
      return poems;
    }

    // Try Supabase first for better performance
    if (isSupabaseAvailable()) {
      try {
        const poems = await supabaseApi.getCategoryPoems(poetId, categoryId);
        
        // Only use Supabase data if we got results
        if (poems.length > 0) {
          return poems;
        } else {
          console.log(`Category ${categoryId} has no poems in Supabase, using Ganjoor API`);
        }
      } catch (error) {
        console.warn(`Supabase getCategoryPoems(${categoryId}) failed, falling back to Ganjoor API:`, error);
      }
    }

    // Fallback to Ganjoor API
    return ganjoorApi.getCategoryPoems(poetId, categoryId);
  },

  /**
   * Get individual poem (prefer Supabase, fallback to Ganjoor)
   */
  async getPoem(id: number): Promise<Poem> {
    // Try Supabase first for better performance
    if (isSupabaseAvailable()) {
      try {
        // Check if poem exists in Supabase first (fast check)
        const hasPoem = await supabaseApi.hasPoem(id);
        
        if (hasPoem) {
          const poem = await supabaseApi.getPoem(id);
          if (poem.verses && poem.verses.length > 0) {
            return poem;
          }
          console.log(`Poem ${id} has no verses in Supabase, using Ganjoor API`);
        } else {
          console.log(`Poem ${id} not in Supabase, using Ganjoor API`);
        }
      } catch (error) {
        console.warn(`Supabase getPoem(${id}) failed, falling back to Ganjoor API:`, error);
      }
    }

    // Fallback to Ganjoor API
    return ganjoorApi.getPoem(id);
  },

  /**
   * Get chapter details.
   * Try Supabase first (chapters are child categories), fallback to Ganjoor API.
   */
  async getChapter(poetId: number, categoryId: number, chapterId: number): Promise<{ chapter: Chapter; poems: Poem[] }> {
    if (isSupabaseAvailable() && await isMigratedPoet(poetId)) {
      try {
        const data = await supabaseApi.getChapter(poetId, categoryId, chapterId);
        if (data && data.poems.length > 0) {
          return data;
        }
        // empty result — fall through to Ganjoor as a safety net
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Supabase getChapter failed, falling back to Ganjoor:`, error);
        }
      }
    }
    return ganjoorApi.getChapter(poetId, categoryId, chapterId);
  },

  async getMigratedPoetIds(): Promise<number[]> {
    return supabaseApi.listMigratedPoetIds();
  },

  async isPoetMigrated(id: number): Promise<boolean> {
    return isMigratedPoet(id);
  },
};

/**
 * Given the categories array from getPoet and a target categoryId,
 * determine whether categoryId is a container (top-level with chapters).
 */
export function isContainerCategory(categories: Category[], categoryId: number): boolean {
  const cat = categories.find(c => c.id === categoryId);
  return Boolean(cat?.hasChapters && cat.chapters && cat.chapters.length > 0);
}

/**
 * Given categories from getPoet and a chapterId, find the chapter and its container.
 * Returns { chapter, containerId } or null if not found.
 */
export function findChapterById(
  categories: Category[],
  chapterId: number
): { chapter: Chapter; containerId: number } | null {
  for (const cat of categories) {
    if (cat.chapters) {
      const chapter = cat.chapters.find(ch => ch.id === chapterId);
      if (chapter) return { chapter, containerId: cat.id };
    }
  }
  return null;
}
