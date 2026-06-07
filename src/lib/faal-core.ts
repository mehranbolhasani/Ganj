import { SupabaseClient } from '@supabase/supabase-js';
import { Poem } from '@/lib/types';

const HAFEZ_GHAZALIAT_CATEGORY_ID = 24; // Hafez's غزلیات; verified in DB

export async function getRandomHafezGhazal(supabase: SupabaseClient): Promise<Poem | null> {
  // Get total count of ghazals first
  const { count, error: countError } = await supabase
    .from('poems')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', HAFEZ_GHAZALIAT_CATEGORY_ID);

  if (countError || !count || count === 0) {
    console.error('Faal count error:', countError);
    return null;
  }

  const randomOffset = Math.floor(Math.random() * count);

  const { data: poems, error } = await supabase
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
    .eq('category_id', HAFEZ_GHAZALIAT_CATEGORY_ID)
    .range(randomOffset, randomOffset);

  if (error || !poems || poems.length === 0) {
    console.error('Faal fetch error:', error);
    return null;
  }

  const poem = poems[0];
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
