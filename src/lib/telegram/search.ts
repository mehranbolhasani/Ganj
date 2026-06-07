import { botSupabase } from './supabase-bot-client';
import { Poem } from '@/lib/types';

export async function searchPoems(query: string): Promise<Poem[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) {
    return [];
  }

  // Intentionally matches web search behavior: % and _ act as LIKE wildcards.
  const { data: poems, error } = await botSupabase
    .from('poems')
    .select(
      `
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
    `
    )
    .or(`title.ilike.%${cleanQuery}%,verses.ilike.%${cleanQuery}%`)
    .order('id', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Bot poem search error:', error);
    return [];
  }

  return (poems || []).map((poem) => {
    const poetData = poem.poets as unknown;
    const categoryData = poem.categories as unknown;
    const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as
      | { id: number; name: string }
      | null
      | undefined;
    const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as
      | { id: number; title: string }
      | null
      | undefined;

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
}

export async function getPoemById(id: number): Promise<Poem | null> {
  const { data: poem, error } = await botSupabase
    .from('poems')
    .select(
      `
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
    `
    )
    .eq('id', id)
    .single();

  if (error || !poem) {
    console.error('Bot poem fetch error:', error);
    return null;
  }

  const poetData = poem.poets as unknown;
  const categoryData = poem.categories as unknown;
  const poet = (Array.isArray(poetData) ? poetData[0] : poetData) as
    | { id: number; name: string }
    | null
    | undefined;
  const category = (Array.isArray(categoryData) ? categoryData[0] : categoryData) as
    | { id: number; title: string }
    | null
    | undefined;

  return {
    id: poem.id,
    title: poem.title,
    verses: poem.verses_array || [],
    poetId: poem.poet_id,
    poetName: poet?.name || '',
    categoryId: poem.category_id || undefined,
    categoryTitle: category?.title || '',
  };
}
