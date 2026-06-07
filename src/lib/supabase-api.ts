/**
 * Supabase API Client
 * Direct database queries for poets, categories, and poems stored in Supabase
 * Provides same interface as ganjoor-api.ts for easy migration
 */

import { createClient } from '@supabase/supabase-js';
import { Poet, Category, Poem, Chapter } from './types';
import { withCache } from './api-cache';

// Initialize Supabase client (shared - safe for both client and server)
// Uses anon key only. For server-only elevated access, use supabase-server.ts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging (only in development, and only once)
let hasWarnedAboutCredentials = false;
if (process.env.NODE_ENV === 'development' && !hasWarnedAboutCredentials) {
  if (!supabaseUrl || !supabaseKey) {
    hasWarnedAboutCredentials = true;
    // Only warn on server-side (client-side will use fallback anyway)
    if (typeof window === 'undefined') {
      console.warn('⚠️  Supabase credentials not found on server. Using Ganjoor API fallback.');
      console.warn('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local for Supabase access.');
    }
  }
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

let migratedPoetIdsCache: number[] | null = null;
let migratedPoetIdsCacheExpiresAt = 0;
const MIGRATED_POETS_CACHE_TTL_MS = 5 * 60 * 1000;

class SupabaseApiError extends Error {
  constructor(message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'SupabaseApiError';
  }
}

/**
 * Get descendant category IDs up to a bounded depth.
 */
async function getDescendantCategoryIds(parentId: number, maxDepth = 3): Promise<number[]> {
  if (!supabase) return [];
  const ids: number[] = [];
  const seen = new Set<number>([parentId]);
  let currentIds = [parentId];
  let depth = 0;
  while (currentIds.length > 0 && depth < maxDepth) {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .in('parent_id', currentIds);
    const nextIds = (data || []).map(c => c.id).filter(id => !seen.has(id));
    ids.push(...nextIds);
    nextIds.forEach(id => seen.add(id));
    currentIds = nextIds;
    depth++;
  }
  return ids;
}

/**
 * Check if Supabase is available
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

/**
 * Supabase API client with same interface as ganjoorApi
 */
export const supabaseApi = {
  /**
   * Get all poets from Supabase
   */
  async getPoets(): Promise<Poet[]> {
    if (!supabase) {
      throw new SupabaseApiError('Supabase client not initialized');
    }

    return withCache('supabase:/poets', async () => {
      const { data, error } = await supabase
        .from('poets')
        .select('id, name, slug, description, birth_year, death_year')
        .order('name', { ascending: true });

      if (error) {
        throw new SupabaseApiError('Failed to fetch poets from Supabase', error.code, error);
      }

      return (data || []).map(poet => ({
        id: poet.id,
        name: poet.name,
        slug: poet.slug || '',
        description: poet.description || undefined,
        birthYear: poet.birth_year || undefined,
        deathYear: poet.death_year || undefined,
      }));
    }, 60 * 60 * 1000); // Cache for 1 hour (Supabase data is more reliable)
  },

  /**
   * Get poet details and categories from Supabase
   */
  async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }> {
    if (!supabase) {
      throw new SupabaseApiError('Supabase client not initialized');
    }

    return withCache(`supabase:/poet/${id}`, async () => {
      // Fetch poet data first
      const { data: poetData, error: poetError } = await supabase
        .from('poets')
        .select('id, name, slug, description, birth_year, death_year')
        .eq('id', id)
        .single();

      if (poetError) {
        // Log detailed error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Supabase getPoet error:', {
            code: poetError.code,
            message: poetError.message,
            details: poetError.details,
            hint: poetError.hint,
          });
        }
        throw new SupabaseApiError(
          `Failed to fetch poet ${id} from Supabase: ${poetError.message}`,
          poetError.code,
          poetError
        );
      }

      if (!poetData) {
        throw new SupabaseApiError(`Poet ${id} not found in Supabase`, 'PGRST116');
      }
      
      // Fetch categories separately (more reliable than nested query)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, title, poem_count, poet_id, parent_id')
        .eq('poet_id', id)
        .order('id', { ascending: true });

      if (categoriesError) {
        console.error('[Supabase] Categories query error:', categoriesError);
        // Continue with empty categories array rather than failing
      }

      // Transform poet data
      const poet: Poet = {
        id: poetData.id,
        name: poetData.name,
        slug: poetData.slug || '',
        description: poetData.description || undefined,
        birthYear: poetData.birth_year || undefined,
        deathYear: poetData.death_year || undefined,
      };

      const allRows = (categoriesData || []).map(cat => ({
        id: cat.id,
        title: cat.title,
        poemCount: cat.poem_count ?? 0,
        parentId: cat.parent_id,
      }));

      const topLevelRows = allRows.filter(c => c.parentId === null);
      const childRows = allRows.filter(c => c.parentId !== null);

      const categories: Category[] = [];
      for (const top of topLevelRows) {
        const children = childRows.filter(c => c.parentId === top.id);

        if (children.length > 0 && top.poemCount === 0) {
          // Root container (e.g. "حافظ") with no direct poems — promote
          // children to top-level categories so they match the Ganjoor API
          // flat structure that callers like the Faal page expect.
          for (const child of children) {
            categories.push({
              id: child.id,
              title: child.title,
              description: '',
              poetId: id,
              poemCount: child.poemCount,
              hasChapters: false,
              chapters: undefined,
            });
          }
          continue;
        }

        if (children.length > 0) {
          // Real container with chapters
          const chapters: Chapter[] = children.map(child => ({
            id: child.id,
            title: child.title,
            categoryId: top.id,
            poemCount: child.poemCount,
          }));
          const totalPoemCount = children.reduce((sum, c) => sum + c.poemCount, 0);
          categories.push({
            id: top.id,
            title: top.title,
            description: '',
            poetId: id,
            poemCount: totalPoemCount,
            hasChapters: true,
            chapters,
          });
          continue;
        }

        // Flat category
        categories.push({
          id: top.id,
          title: top.title,
          description: '',
          poetId: id,
          poemCount: top.poemCount,
          hasChapters: false,
          chapters: undefined,
        });
      }

      return { poet, categories };
    }, 30 * 60 * 1000); // Cache for 30 minutes
  },

  /**
   * Get poems from a category from Supabase
   */
  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]> {
    if (!supabase) {
      throw new SupabaseApiError('Supabase client not initialized');
    }

    return withCache(`supabase:/cat/${categoryId}`, async () => {
      // Fetch poems with poet and category info in a single query
      const { data, error } = await supabase
        .from('poems')
        .select(`
          id,
          title,
          verses_array,
          poet_id,
          category_id,
          poets (
            name
          ),
          categories (
            title
          )
        `)
        .eq('category_id', categoryId)
        .eq('poet_id', poetId)
        .order('id', { ascending: true });

      if (error) {
        throw new SupabaseApiError(
          `Failed to fetch poems for category ${categoryId}`,
          error.code,
          error
        );
      }

      const poems = (data || []).map(poem => {
        const poetData = poem.poets as unknown;
        const categoryData = poem.categories as unknown;
        const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { name: string } | null;
        const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as { title: string } | null;

        return {
          id: poem.id,
          title: poem.title,
          verses: poem.verses_array || [],
          poetId: poem.poet_id,
          poetName: poet?.name || '',
          categoryId: poem.category_id || undefined,
          categoryTitle: category?.title || '',
        };
      });

      // If direct poems exist, return them (flat poets)
      if (poems.length > 0) {
        return poems;
      }

      // Zero direct poems — check if this category is a container (has children)
      const { data: childCategories, error: childError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId)
        .limit(1);

      if (childError) {
        throw new SupabaseApiError(
          `Failed to check child categories for ${categoryId}`,
          childError.code,
          childError
        );
      }

      if (childCategories && childCategories.length > 0) {
        // Container category — return empty so UI shows chapter list
        return [];
      }

      return poems;
    }, 30 * 60 * 1000); // Cache for 30 minutes
  },

  /**
   * Get individual poem from Supabase
   */
  async getPoem(id: number): Promise<Poem> {
    if (!supabase) {
      throw new SupabaseApiError('Supabase client not initialized');
    }

    return withCache(`supabase:/poem/${id}`, async () => {
      // Fetch poem with poet and category info
      const { data, error } = await supabase
        .from('poems')
        .select(`
          id,
          title,
          verses_array,
          poet_id,
          category_id,
          poets (
            id,
            name
          ),
          categories (
            id,
            title
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new SupabaseApiError(
          `Failed to fetch poem ${id} from Supabase`,
          error.code,
          error
        );
      }

      if (!data) {
        throw new SupabaseApiError(`Poem ${id} not found in Supabase`, 'PGRST116');
      }

      const poetData = data.poets as unknown;
      const categoryData = data.categories as unknown;
      const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { id: number; name: string } | null;
      const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as { id: number; title: string } | null;

      return {
        id: data.id,
        title: data.title,
        verses: data.verses_array || [],
        poetId: data.poet_id,
        poetName: poet?.name || '',
        categoryId: data.category_id || undefined,
        categoryTitle: category?.title || '',
      };
    }, 60 * 60 * 1000); // Cache for 1 hour (poems don't change)
  },

  /**
   * Check if a poet exists in Supabase
   */
  async hasPoet(id: number): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('poets')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      return !error && data !== null;
    } catch {
      return false;
    }
  },

  /**
   * Check if a poem exists in Supabase
   */
  async hasPoem(id: number): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('poems')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      return !error && data !== null;
    } catch {
      return false;
    }
  },

  /**
   * List all poet IDs currently migrated into Supabase.
   * Uses short in-memory memoization to avoid repeated queries.
   */
  async listMigratedPoetIds(): Promise<number[]> {
    if (!supabase) {
      return [];
    }

    const now = Date.now();
    if (migratedPoetIdsCache && now < migratedPoetIdsCacheExpiresAt) {
      return migratedPoetIdsCache;
    }

    try {
      const { data, error } = await supabase
        .from('poets')
        .select('id')
        .order('id', { ascending: true });

      if (error) {
        throw new SupabaseApiError(
          'Failed to fetch migrated poet IDs from Supabase',
          error.code,
          error
        );
      }

      migratedPoetIdsCache = (data || []).map((row) => row.id);
      migratedPoetIdsCacheExpiresAt = now + MIGRATED_POETS_CACHE_TTL_MS;
      return migratedPoetIdsCache;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to list migrated poet IDs:', error);
      }
      return [];
    }
  },

  /**
   * Get chapter details and poems from Supabase.
   * A chapter is a child category (parent_id points to the top-level category).
   */
  async getChapter(poetId: number, categoryId: number, chapterId: number): Promise<{ chapter: Chapter; poems: Poem[] }> {
    if (!supabase) {
      throw new SupabaseApiError('Supabase client not initialized');
    }

    return withCache(`supabase:/chapter/${chapterId}`, async () => {
      // 1. Fetch the chapter row
      const { data: chapterRow, error: chapterError } = await supabase
        .from('categories')
        .select('id, title, poem_count, parent_id')
        .eq('id', chapterId)
        .single();

      if (chapterError || !chapterRow) {
        throw new SupabaseApiError(
          `Chapter ${chapterId} not found in Supabase`,
          chapterError?.code
        );
      }

      // 2. Gather poems from the chapter and its descendants
      const descendantIds = await getDescendantCategoryIds(chapterId);
      const allCategoryIds = [chapterId, ...descendantIds];

      const { data: poemsData, error: poemsError } = await supabase
        .from('poems')
        .select(`
          id,
          title,
          verses_array,
          poet_id,
          category_id,
          poets (
            name
          ),
          categories (
            title
          )
        `)
        .in('category_id', allCategoryIds)
        .eq('poet_id', poetId)
        .order('id', { ascending: true });

      if (poemsError) {
        throw new SupabaseApiError(
          `Failed to fetch poems for chapter ${chapterId}`,
          poemsError.code,
          poemsError
        );
      }

      const poems = (poemsData || []).map(poem => {
        const poetData = poem.poets as unknown;
        const categoryData = poem.categories as unknown;
        const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { name: string } | null;
        const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as { title: string } | null;

        return {
          id: poem.id,
          title: poem.title,
          verses: poem.verses_array || [],
          poetId: poem.poet_id,
          poetName: poet?.name || '',
          categoryId: poem.category_id || undefined,
          categoryTitle: category?.title || '',
          chapterId: chapterId,
          chapterTitle: chapterRow.title,
        };
      });

      const chapter: Chapter = {
        id: chapterId,
        title: chapterRow.title,
        categoryId: categoryId,
        poemCount: chapterRow.poem_count ?? 0,
      };

      return { chapter, poems };
    }, 30 * 60 * 1000);
  },

};

/**
 * Get statistics about Supabase data
 */
export async function getSupabaseStats() {
  if (!supabase) {
    return null;
  }

  try {
    const [poetsCount, categoriesCount, poemsCount] = await Promise.all([
      supabase.from('poets').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('poems').select('id', { count: 'exact', head: true }),
    ]);

    return {
      poets: poetsCount.count || 0,
      categories: categoriesCount.count || 0,
      poems: poemsCount.count || 0,
      available: true,
    };
  } catch (error) {
    console.error('Failed to get Supabase stats:', error);
    return {
      poets: 0,
      categories: 0,
      poems: 0,
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
