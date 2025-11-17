/**
 * Supabase API Client
 * Direct database queries for poets, categories, and poems stored in Supabase
 * Provides same interface as ganjoor-api.ts for easy migration
 */

import { createClient } from '@supabase/supabase-js';
import { Poet, Category, Poem, Chapter } from './types';
import { withCache } from './api-cache';

// Initialize Supabase client
// On server: prefer service role key (more permissions)
// On client: use anon key (public)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
const supabaseKey = typeof window === 'undefined'
  // Server-side: prefer service role key for full access
  ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  // Client-side: use anon key only
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging (only in development, and only once)
let hasWarnedAboutCredentials = false;
if (process.env.NODE_ENV === 'development' && !hasWarnedAboutCredentials) {
  if (!supabaseUrl || !supabaseKey) {
    hasWarnedAboutCredentials = true;
    // Only warn on server-side (client-side will use fallback anyway)
    if (typeof window === 'undefined') {
      console.warn('⚠️  Supabase credentials not found on server. Using Ganjoor API fallback.');
      console.warn('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local for Supabase access.');
    }
  }
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
        .select('id, title, url_slug, poem_count, poet_id')
        .eq('poet_id', id)
        .order('id', { ascending: true });

      if (categoriesError) {
        console.error('[Supabase] Categories query error:', categoriesError);
        // Continue with empty categories array rather than failing
      }
      
      // Verbose logs (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('='.repeat(60));
        console.log(`[Supabase] POET ID: ${id}`);
        console.log(`[Supabase] Categories error:`, categoriesError);
        console.log(`[Supabase] Categories count:`, categoriesData?.length || 0);
        if (categoriesData && categoriesData.length > 0) {
          console.log(`[Supabase] First category:`, categoriesData[0]);
          console.log(`[Supabase] All category titles:`, categoriesData.map(c => c.title));
        }
        console.log('='.repeat(60));
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
      
      // Debug logging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Supabase] Poet data:`, {
          name: poet.name,
          hasDescription: !!poet.description,
          descriptionLength: poet.description?.length || 0,
          birthYear: poet.birthYear,
          deathYear: poet.deathYear,
        });
      }

      // Transform categories data
      let categories: Category[] = (categoriesData || []).map((cat) => {
        return {
          id: cat.id,
          title: cat.title,
          description: '',
          poetId: id,
          poemCount: cat.poem_count || undefined,
        };
      });

      // Filter out categories that match the poet's name (these are usually parent/root categories)
      // Also filter out categories with 0 poems (either not imported or genuinely empty)
      const poetName = poetData.name;
      categories = categories.filter(category => {
        // Exclude if poem count is 0 or undefined
        if (!category.poemCount || category.poemCount === 0) {
          return false;
        }
        
        // Normalize both strings for comparison (remove extra spaces, diacritics, etc.)
        const normalizeString = (str: string) => {
          return str.trim().replace(/\s+/g, ' ').toLowerCase();
        };
        
        const normalizedCategoryTitle = normalizeString(category.title);
        const normalizedPoetName = normalizeString(poetName);
        
        // Exclude if they match
        if (normalizedCategoryTitle === normalizedPoetName) {
          return false;
        }
        
        // Also check if category title contains only the poet name (sometimes has extra words)
        // But only if the category title is very similar (< 5 chars difference)
        const lengthDiff = Math.abs(normalizedCategoryTitle.length - normalizedPoetName.length);
        if (lengthDiff < 5 && normalizedCategoryTitle.includes(normalizedPoetName)) {
          return false;
        }
        
        return true;
      });
      
      // Debug logging for category filtering (development only)
      if (process.env.NODE_ENV === 'development') {
        const originalCount = categoriesData?.length || 0;
        console.log(`[Supabase] FILTERED: ${originalCount} -> ${categories.length}`);
        if (originalCount !== categories.length) {
          console.log(`[Supabase] Removed poet name category from list`);
        }
        console.log(`[Supabase] Final categories:`, categories.map(c => `${c.title} (${c.poemCount || 0})`));
      }

      categories = categories.map(category => ({
        ...category,
        poemCount: category.poemCount || 0,
      }));

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
