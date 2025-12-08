/**
 * Unified Search API
 * Searches poets, categories, and poems using PostgreSQL full-text search
 * For non-famous poets, falls back to Ganjoor API
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ganjoorApi } from '@/lib/ganjoor-api';
import { supabaseApi } from '@/lib/supabase-api';

export async function GET(request: NextRequest) {
  // Initialize Supabase client with runtime env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Search service not configured. Please set up Supabase credentials.' },
      { status: 503 }
    );
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // 'poets', 'categories', 'poems', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const getCount = searchParams.get('count') === 'true'; // Whether to get total count
    const poetId = searchParams.get('poetId'); // Optional poet ID filter
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        poets: [],
        categories: [],
        poems: [],
        message: 'Query too short',
      });
    }
    
    const cleanQuery = query.trim();
    
    // Define return types
    type PoetResult = { id: number; name: string; slug: string; description?: string; birth_year?: number; death_year?: number };
    type CategoryResult = { id: number; title: string; poetId: number; poetName: string; poemCount?: number };
    type PoemResult = { id: number; title: string; verses: string[]; poetId: number; poetName: string; categoryId?: number; categoryTitle?: string; chapterId?: number; chapterTitle?: string };
    
    const results: {
      poets?: PoetResult[];
      categories?: CategoryResult[];
      poems?: PoemResult[];
      totalPoets?: number;
      totalCategories?: number;
      totalPoems?: number;
    } = {};
    
    // Search poets (if requested)
    if (type === 'all' || type === 'poets') {
      // Build query
      let poetsQuery = supabase
        .from('poets')
        .select('id, name, slug, description, birth_year, death_year', { count: getCount ? 'exact' : undefined })
        .or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`);
      
      // Apply pagination
      if (offset > 0) {
        poetsQuery = poetsQuery.range(offset, offset + limit - 1);
      } else {
        poetsQuery = poetsQuery.limit(limit);
      }
      
      const { data: poets, error: poetsError, count: poetsCount } = await poetsQuery;
      
      if (poetsError) {
        console.error('Error searching poets:', poetsError);
      } else {
        results.poets = poets || [];
        if (getCount && poetsCount !== null) {
          results.totalPoets = poetsCount;
        }
      }
    }
    
    // Search categories (if requested)
    if (type === 'all' || type === 'categories') {
      // Build query
      let categoriesQuery = supabase
        .from('categories')
        .select(`
          id,
          poet_id,
          title,
          url_slug,
          poem_count,
          poets (
            id,
            name
          )
        `, { count: getCount ? 'exact' : undefined })
        .ilike('title', `%${cleanQuery}%`);
      
      // Apply pagination
      if (offset > 0) {
        categoriesQuery = categoriesQuery.range(offset, offset + limit - 1);
      } else {
        categoriesQuery = categoriesQuery.limit(limit);
      }
      
      const { data: categories, error: categoriesError, count: categoriesCount } = await categoriesQuery;
      
      if (categoriesError) {
        console.error('Error searching categories:', categoriesError);
      } else {
        // Transform to match expected format
        results.categories = categories?.map(cat => {
          const poetData = cat.poets as unknown;
          const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { id: number; name: string } | null | undefined;
          return {
            id: cat.id,
            title: cat.title,
            poetId: cat.poet_id,
            poetName: poet?.name || '',
            poemCount: cat.poem_count || 0,
          };
        }) || [];
        if (getCount && categoriesCount !== null) {
          results.totalCategories = categoriesCount;
        }
      }
    }
    
    // Search poems (if requested) - using full-text search
    if (type === 'all' || type === 'poems') {
      // If poetId is provided, check if it's a famous poet (in Supabase)
      if (poetId) {
        const poetIdNum = parseInt(poetId);
        if (!isNaN(poetIdNum)) {
          const isFamousPoet = await supabaseApi.hasPoet(poetIdNum);
          
          if (isFamousPoet) {
            // Search in Supabase for famous poets
            let poemsQuery = supabase
              .from('poems')
              .select(`
                id,
                poet_id,
                category_id,
                title,
                verses_array,
                poets (
                  id,
                  name
                ),
                categories (
                  id,
                  title
                )
              `, { count: getCount ? 'exact' : undefined })
              .or(`title.ilike.%${cleanQuery}%,verses.ilike.%${cleanQuery}%`)
              .eq('poet_id', poetIdNum)
              .order('id', { ascending: false });
            
            // Apply pagination
            if (offset > 0) {
              poemsQuery = poemsQuery.range(offset, offset + limit - 1);
            } else {
              poemsQuery = poemsQuery.limit(limit);
            }
            
            const { data: poems, error: poemsError, count: poemsCount } = await poemsQuery;
            
            if (poemsError) {
              console.error('Error searching poems in Supabase:', poemsError);
            } else {
              // Transform to match expected format
              results.poems = poems?.map(poem => {
                const poetData = poem.poets as unknown;
                const categoryData = poem.categories as unknown;
                const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { id: number; name: string } | null | undefined;
                const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as { id: number; title: string } | null | undefined;
                return {
                  id: poem.id,
                  title: poem.title,
                  verses: poem.verses_array || [],
                  poetId: poem.poet_id,
                  poetName: poet?.name || '',
                  categoryId: poem.category_id || undefined,
                  categoryTitle: category?.title || '',
                };
              }) || [];
              if (getCount && poemsCount !== null) {
                results.totalPoems = poemsCount;
              }
            }
          } else {
            // Non-famous poet: fetch from Ganjoor API and filter
            try {
              const { categories, poet } = await ganjoorApi.getPoet(poetIdNum);
              const allPoems: PoemResult[] = [];
              
              // Fetch poems from all categories and filter by search query
              const queryLower = cleanQuery.toLowerCase();
              const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
              
              // Limit number of categories to check to prevent timeout
              const maxCategories = 20;
              const categoriesToCheck = categories.slice(0, maxCategories);
              
              for (const category of categoriesToCheck) {
                try {
                  const categoryPoems = await ganjoorApi.getCategoryPoems(poetIdNum, category.id);
                  
                  // Filter poems that match the search query
                  const matchingPoems = categoryPoems.filter(poem => {
                    const titleLower = poem.title.toLowerCase();
                    
                    // Check title
                    if (titleLower.includes(queryLower)) {
                      return true;
                    }
                    
                    // Check verses
                    if (poem.verses && poem.verses.length > 0) {
                      const versesText = poem.verses.join(' ').toLowerCase();
                      // Exact phrase match
                      if (versesText.includes(queryLower)) {
                        return true;
                      }
                      // Multi-word match
                      if (queryWords.length > 1 && queryWords.every(word => versesText.includes(word))) {
                        return true;
                      }
                      // Single word match
                      if (queryWords.length === 1 && versesText.includes(queryWords[0])) {
                        return true;
                      }
                    }
                    return false;
                  });
                  
                  // Transform to match expected format
                  const transformedPoems: PoemResult[] = matchingPoems.map(poem => ({
                    id: poem.id,
                    title: poem.title,
                    verses: poem.verses || [],
                    poetId: poem.poetId,
                    poetName: poem.poetName || poet.name,
                    categoryId: poem.categoryId,
                    categoryTitle: poem.categoryTitle || category.title,
                  }));
                  
                  allPoems.push(...transformedPoems);
                  
                  // Stop if we have enough results (with some buffer for pagination)
                  if (allPoems.length >= (offset + limit) * 2) {
                    break;
                  }
                } catch (error) {
                  // Continue with next category if one fails
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(`Failed to fetch poems from category ${category.id}:`, error);
                  }
                }
              }
              
              // Sort by relevance (title matches first, then verse matches)
              allPoems.sort((a, b) => {
                const aTitleMatch = a.title.toLowerCase().includes(queryLower);
                const bTitleMatch = b.title.toLowerCase().includes(queryLower);
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                return 0;
              });
              
              // Apply pagination
              const paginatedPoems = allPoems.slice(offset, offset + limit);
              results.poems = paginatedPoems;
              
              if (getCount) {
                results.totalPoems = allPoems.length;
              }
            } catch (error) {
              console.error('Error searching poems from Ganjoor API:', error);
              results.poems = [];
            }
          }
        }
      } else {
        // No poetId filter: search all poems in Supabase (famous poets only)
        let poemsQuery = supabase
          .from('poems')
          .select(`
            id,
            poet_id,
            category_id,
            title,
            verses_array,
            poets (
              id,
              name
            ),
            categories (
              id,
              title
            )
          `, { count: getCount ? 'exact' : undefined })
          .or(`title.ilike.%${cleanQuery}%,verses.ilike.%${cleanQuery}%`)
          .order('id', { ascending: false });
        
        // Apply pagination
        if (offset > 0) {
          poemsQuery = poemsQuery.range(offset, offset + limit - 1);
        } else {
          poemsQuery = poemsQuery.limit(limit);
        }
        
        const { data: poems, error: poemsError, count: poemsCount } = await poemsQuery;
        
        if (poemsError) {
          console.error('Error searching poems:', poemsError);
        } else {
          // Transform to match expected format
          results.poems = poems?.map(poem => {
            const poetData = poem.poets as unknown;
            const categoryData = poem.categories as unknown;
            const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as { id: number; name: string } | null | undefined;
            const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as { id: number; title: string } | null | undefined;
            return {
              id: poem.id,
              title: poem.title,
              verses: poem.verses_array || [],
              poetId: poem.poet_id,
              poetName: poet?.name || '',
              categoryId: poem.category_id || undefined,
              categoryTitle: category?.title || '',
            };
          }) || [];
          if (getCount && poemsCount !== null) {
            results.totalPoems = poemsCount;
          }
        }
      }
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

