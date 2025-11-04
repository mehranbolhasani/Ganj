/**
 * Supabase API Client
 * Direct database queries for poets, categories, and poems stored in Supabase
 * Provides same interface as ganjoor-api.ts for easy migration
 */

import { createClient } from '@supabase/supabase-js';
import { Poet, Category, Poem, Chapter } from './types';
import { withCache } from './api-cache';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found. Supabase API will not be available.');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

class SupabaseApiError extends Error {
  constructor(message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'SupabaseApiError';
  }
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
      // Fetch poet data with categories in a single query using join
      const { data: poetData, error: poetError } = await supabase
        .from('poets')
        .select(`
          id,
          name,
          slug,
          description,
          birth_year,
          death_year,
          categories (
            id,
            title,
            url_slug,
            description,
            poem_count
          )
        `)
        .eq('id', id)
        .single();

      if (poetError) {
        throw new SupabaseApiError(
          `Failed to fetch poet ${id} from Supabase`,
          poetError.code,
          poetError
        );
      }

      if (!poetData) {
        throw new SupabaseApiError(`Poet ${id} not found in Supabase`, 'PGRST116');
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

      // Transform categories data
      const categories: Category[] = ((poetData.categories as unknown[]) || []).map((cat: unknown) => {
        const category = cat as {
          id: number;
          title: string;
          url_slug?: string;
          description?: string;
          poem_count?: number;
        };
        return {
          id: category.id,
          title: category.title,
          description: category.description || '',
          poetId: id,
          poemCount: category.poem_count || 0,
        };
      });

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

      return (data || []).map(poem => {
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
   * Get chapter details (not implemented in Supabase yet, returns empty)
   */
  async getChapter(_poetId: number, _categoryId: number, _chapterId: number): Promise<{ chapter: Chapter; poems: Poem[] }> {
    throw new SupabaseApiError('Chapters are not yet implemented in Supabase');
  },

  /**
   * Get random poem (not implemented in Supabase yet)
   */
  async getRandomPoem(): Promise<Poem> {
    throw new SupabaseApiError('Random poem is not yet implemented in Supabase');
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

