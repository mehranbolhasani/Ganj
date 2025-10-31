/**
 * Unified Search API
 * Searches poets, categories, and poems using PostgreSQL full-text search
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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
    type PoemResult = { id: number; title: string; verses: string[]; poetId: number; poetName: string; categoryId?: number; categoryTitle?: string };
    
    const results: {
      poets?: PoetResult[];
      categories?: CategoryResult[];
      poems?: PoemResult[];
    } = {};
    
    // Search poets (if requested)
    if (type === 'all' || type === 'poets') {
      const { data: poets, error: poetsError } = await supabase
        .from('poets')
        .select('id, name, slug, description, birth_year, death_year')
        .or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
        .limit(limit);
      
      if (poetsError) {
        console.error('Error searching poets:', poetsError);
      } else {
        results.poets = poets || [];
      }
    }
    
    // Search categories (if requested)
    if (type === 'all' || type === 'categories') {
      const { data: categories, error: categoriesError } = await supabase
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
        `)
        .ilike('title', `%${cleanQuery}%`)
        .limit(limit);
      
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
      }
    }
    
    // Search poems (if requested) - using full-text search
    if (type === 'all' || type === 'poems') {
      // Use both title match and full-text search on verses
      const { data: poems, error: poemsError } = await supabase
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
        `)
        .or(`title.ilike.%${cleanQuery}%,verses.ilike.%${cleanQuery}%`)
        .order('id', { ascending: false }) // Recent poems first
        .limit(limit);
      
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

