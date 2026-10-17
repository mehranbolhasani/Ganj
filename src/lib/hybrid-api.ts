/**
 * Hybrid API Client (factory)
 * Smart fallback between Supabase (fast, for migrated poets) and Ganjoor API
 * (comprehensive, for all poets)
 *
 * Strategy:
 * 1. Try Supabase first (50-200ms response time)
 * 2. Fallback to Ganjoor API if data not found (500-2000ms response time)
 *
 * The fallback logic is shared between:
 * - the client bundle (default export, uncached supabaseApi), used by
 *   PoetsGrid / FaalProviderWrapper, and
 * - server pages, via ./hybrid-api-server which plugs in Data-Cache-wrapped
 *   Supabase fetchers (unstable_cache + React cache()).
 */

import { Poet, Category, Poem, Chapter } from './types';
import { isSupabaseAvailable } from './supabase-api';
import { ganjoorApi } from './ganjoor-api';
import { logD1Fallback } from './fallback-log';
import { reasonOf } from './worker-client';
import { contentApiClient } from './content-api-client';

/** Logs one [d1-fallback] line when a D1 content read falls back to Ganjoor. Supabase is silent. */
function fallbackLog(label: 'd1' | 'supabase', method: string, error: unknown): void {
  if (label === 'd1') logD1Fallback('content', reasonOf(error), { method });
}

/**
 * Subset of the supabaseApi surface the hybrid client needs.
 * Server variant swaps this for a cached implementation with the same shape.
 */
export interface HybridBackend {
  getPoets(): Promise<Poet[]>;
  getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }>;
  getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]>;
  getPoem(id: number): Promise<Poem>;
  getChapter(poetId: number, categoryId: number, chapterId: number): Promise<{ chapter: Chapter; poems: Poem[] }>;
  getPoemNeighbors(
    poemId: number,
    poetId: number,
    categoryId: number,
    chapterId?: number
  ): Promise<{ previousPoem: Poem | null; nextPoem: Poem | null }>;
  listMigratedPoetIds(): Promise<number[]>;
  /**
   * Poem metadata (title + names, no text) for a list of ids, used by bookmark
   * hydration. Returns only rows the backend knows; missing ids are skipped by
   * the backend, never created or deleted. The factory exposes this unchanged
   * (no Ganjoor fallback: a backend miss is a legitimate "unknown poem").
   */
  getPoemsByIds(ids: number[]): Promise<Poem[]>;
}

export function createHybridApi(
  backend: HybridBackend,
  /**
   * Whether the injected backend should be tried first.
   * Defaults to the Supabase availability check, preserving the original behaviour.
   * The server entry point passes a D1-aware check so `CONTENT_BACKEND=d1` works even
   * when only the D1 env vars are configured.
   */
  isBackendAvailable: () => boolean = isSupabaseAvailable,
  backendLabel: 'd1' | 'supabase' = 'supabase'
) {
  let migratedPoetSetCache: Set<number> | null = null;
  let migratedPoetSetCacheExpiresAt = 0;
  const MIGRATED_SET_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  async function getMigratedPoetIdSet(): Promise<Set<number>> {
    if (!isBackendAvailable()) {
      return new Set<number>();
    }

    const now = Date.now();
    if (migratedPoetSetCache && now < migratedPoetSetCacheExpiresAt) {
      return migratedPoetSetCache;
    }

    try {
      const ids = await backend.listMigratedPoetIds();
      migratedPoetSetCache = new Set(ids);
      migratedPoetSetCacheExpiresAt = now + MIGRATED_SET_CACHE_TTL_MS;
      return migratedPoetSetCache;
    } catch (error) {
      // A failed lookup is not cached. Treat every poet as not migrated for this call, which
      // routes reads to the Ganjoor fallback instead of failing the page.
      fallbackLog(backendLabel, 'listMigratedPoetIds', error);
      return new Set<number>();
    }
  }

  async function isMigratedPoet(id: number): Promise<boolean> {
    if (!isBackendAvailable()) {
      return false;
    }
    const migratedSet = await getMigratedPoetIdSet();
    return migratedSet.has(id);
  }

  return {
    /**
     * Get all poets (prefer Supabase, fallback to Ganjoor)
     */
    async getPoets(): Promise<Poet[]> {
      if (isBackendAvailable()) {
        try {
          const poets = await backend.getPoets();
          if (poets.length > 0) {
            return poets;
          }
        } catch (error) {
          fallbackLog(backendLabel, 'getPoets', error);
          if (process.env.NODE_ENV === 'development') {
            console.warn('Supabase getPoets failed, falling back to Ganjoor API:', error);
          }
        }
      }
      return ganjoorApi.getPoets();
    },

    /**
     * Get poet details (prefer Supabase, fallback to Ganjoor).
     * A missing poet in Supabase (the fn throws) falls back to Ganjoor —
     * this replaces the old hasPoet pre-check with the same outcome
     * (the poet row itself acts as the existence check).
     */
    async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }> {
      if (isBackendAvailable()) {
        try {
          const data = await backend.getPoet(id);
          // If Supabase has the poet but returns no categories, the data is
          // incomplete — fall back to Ganjoor API so callers like the Faal page
          // can still find the category they need.
          if (data.categories.length > 0) {
            return data;
          }
          console.warn(`Poet ${id} found in Supabase but has no categories, falling back to Ganjoor API`);
        } catch (error) {
          fallbackLog(backendLabel, 'getPoet', error);
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Supabase getPoet(${id}) failed, falling back to Ganjoor API:`, error);
          }
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
        const poems = await backend.getCategoryPoems(poetId, categoryId);
        // Intentionally return Supabase result (even if empty) for migrated poets.
        return poems;
      }

      // Try Supabase first for better performance
      if (isBackendAvailable()) {
        try {
          const poems = await backend.getCategoryPoems(poetId, categoryId);

          // Only use Supabase data if we got results
          if (poems.length > 0) {
            return poems;
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Category ${categoryId} has no poems in Supabase, using Ganjoor API`);
            }
          }
        } catch (error) {
          fallbackLog(backendLabel, 'getCategoryPoems', error);
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Supabase getCategoryPoems(${categoryId}) failed, falling back to Ganjoor API:`, error);
          }
        }
      }

      // Fallback to Ganjoor API
      return ganjoorApi.getCategoryPoems(poetId, categoryId);
    },

    /**
     * Get individual poem (prefer Supabase, fallback to Ganjoor).
     * A missing poem in Supabase (the fn throws) falls back to Ganjoor —
     * this replaces the old hasPoem pre-check with the same outcome
     * (the poem row itself acts as the existence check).
     */
    async getPoem(id: number): Promise<Poem> {
      // Try Supabase first for better performance
      if (isBackendAvailable()) {
        try {
          const poem = await backend.getPoem(id);
          if (poem.verses && poem.verses.length > 0) {
            return poem;
          }
          if (process.env.NODE_ENV === 'development') {
            console.log(`Poem ${id} has no verses in Supabase, using Ganjoor API`);
          }
        } catch (error) {
          fallbackLog(backendLabel, 'getPoem', error);
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Supabase getPoem(${id}) failed, falling back to Ganjoor API:`, error);
          }
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
      if (isBackendAvailable() && await isMigratedPoet(poetId)) {
        try {
          const data = await backend.getChapter(poetId, categoryId, chapterId);
          if (data && data.poems.length > 0) {
            return data;
          }
          // empty result — fall through to Ganjoor as a safety net
        } catch (error) {
          fallbackLog(backendLabel, 'getChapter', error);
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Supabase getChapter failed, falling back to Ganjoor:`, error);
          }
        }
      }
      return ganjoorApi.getChapter(poetId, categoryId, chapterId);
    },

    /**
     * Resolve prev/next navigation for a poem page.
     * For poems stored in Supabase, uses targeted neighbor queries (2 tiny rows)
     * instead of loading the whole category; otherwise falls back to the same
     * category/chapter lists the poem page used before (Ganjoor API).
     */
    async getPoemNavigation(
      poem: Poem
    ): Promise<{ previousPoem: Poem | null; nextPoem: Poem | null }> {
      if (!poem.categoryId) {
        return { previousPoem: null, nextPoem: null };
      }

      if (poem.chapterId) {
        if (isBackendAvailable() && await isMigratedPoet(poem.poetId)) {
          try {
            return await backend.getPoemNeighbors(poem.id, poem.poetId, poem.categoryId, poem.chapterId);
          } catch (error) {
            fallbackLog(backendLabel, 'getPoemNeighbors', error);
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Supabase getPoemNeighbors failed, falling back to Ganjoor:`, error);
            }
          }
        }
        try {
          const { poems } = await ganjoorApi.getChapter(poem.poetId, poem.categoryId, poem.chapterId);
          return neighborsFromPoems(poems, poem.id);
        } catch {
          return { previousPoem: null, nextPoem: null };
        }
      }

      if (isBackendAvailable() && await isMigratedPoet(poem.poetId)) {
        try {
          return await backend.getPoemNeighbors(poem.id, poem.poetId, poem.categoryId);
        } catch (error) {
          fallbackLog(backendLabel, 'getPoemNeighbors', error);
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Supabase getPoemNeighbors failed, falling back to category list:`, error);
          }
        }
      }

      // Poem not migrated (or Supabase lookup failed): list usually comes from
      // the Ganjoor API, so keep the previous list-based behavior.
      try {
        const poems = await this.getCategoryPoems(poem.poetId, poem.categoryId);
        return neighborsFromPoems(poems, poem.id);
      } catch {
        return { previousPoem: null, nextPoem: null };
      }
    },

    async getMigratedPoetIds(): Promise<number[]> {
      return backend.listMigratedPoetIds();
    },

    async getPoemsByIds(ids: number[]): Promise<Poem[]> {
      return backend.getPoemsByIds(ids);
    },

    async isPoetMigrated(id: number): Promise<boolean> {
      return isMigratedPoet(id);
    },
  };
}

/**
 * Client instance. Since Phase 5 it talks to the same-origin /api/content/* route
 * handlers instead of Supabase directly (the handlers honor CONTENT_BACKEND, so the
 * data source stays Supabase by default). The backend label is 'supabase' so the
 * shared fallback logic keeps its silent-Supabase behavior in the browser console;
 * only the D1 server path emits [d1-fallback] lines.
 */
export const hybridApi = createHybridApi(contentApiClient, () => true, 'supabase');

/** Compatibility helper for callers that only need the migrated check. */
export async function isMigratedPoet(id: number): Promise<boolean> {
  return hybridApi.isPoetMigrated(id);
}

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

/** Compute prev/next poems from an id-ordered list (Ganjoor fallback path). */
export function neighborsFromPoems(
  poems: Poem[],
  poemId: number
): { previousPoem: Poem | null; nextPoem: Poem | null } {
  const currentIndex = poems.findIndex(p => p.id === poemId);
  if (currentIndex === -1) {
    return { previousPoem: null, nextPoem: null };
  }
  return {
    previousPoem: currentIndex > 0 ? poems[currentIndex - 1] : null,
    nextPoem: currentIndex < poems.length - 1 ? poems[currentIndex + 1] : null,
  };
}
