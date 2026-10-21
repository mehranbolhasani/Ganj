import { botSupabase } from './supabase-bot-client';
import { isD1Available } from '../d1-api';
import { logD1Fallback } from '../fallback-log';
import { reasonOf, workerConfigFromEnv, workerGet } from '../worker-client';
import { mapWorkerSearchToPoems } from './worker-poems';
import type { WorkerSearchRaw } from '../search/handler';
import { Poem } from '@/lib/types';

/** Same gate as the server content pages: D1 only when both flag and env vars are set. */
function d1Enabled(): boolean {
  return process.env.CONTENT_BACKEND === 'd1' && isD1Available();
}

export async function searchPoems(query: string): Promise<Poem[]> {
  if (d1Enabled()) {
    try {
      const params = new URLSearchParams({ q: query, type: 'poems', limit: '5' });
      const raw = await workerGet<WorkerSearchRaw>(`/search?${params.toString()}`, {
        config: workerConfigFromEnv(),
        cache: 'no-store',
      });
      return mapWorkerSearchToPoems(raw);
    } catch (error) {
      logD1Fallback('search', reasonOf(error), { method: 'telegram.searchPoems' });
      // fall through to the Supabase path
    }
  }

  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) {
    return [];
  }

  // Intentionally matches web search behavior: % and _ act as LIKE wildcards.
  // List is reduced to keyboard labels (title — poet name); full poem text is
  // fetched separately via getPoemById when the user selects a result.
  const { data: poems, error } = await botSupabase
    .from('poems')
    .select(
      `
      id,
      poet_id,
      category_id,
      title,
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
    // SQLSTATE only: the PostgREST message for a malformed `.or()` filter can
    // echo the filter text, which embeds the user's search query.
    console.error('Bot poem search error:', error.code);
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
      verses: [],
      poetId: poem.poet_id,
      poetName: poet?.name || '',
      categoryId: poem.category_id || undefined,
      categoryTitle: category?.title || '',
    };
  });
}

export async function getPoemById(id: number): Promise<Poem | null> {
  if (d1Enabled()) {
    try {
      // Full verses from D1, so formatPoem output stays byte-identical.
      return await workerGet<Poem>(`/poems/${id}`, {
        config: workerConfigFromEnv(),
        cache: 'no-store',
      });
    } catch (error) {
      const reason = reasonOf(error);
      // A genuinely missing poem answers null in both backends (same bot reply).
      if (reason === 'not-found') return null;
      logD1Fallback('content', reason, { method: 'telegram.getPoemById' });
      // fall through to the Supabase path
    }
  }

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
    // SQLSTATE only (no user text in an id lookup, but keep the line uniform).
    console.error('Bot poem fetch error:', error ? error.code : 'no-row');
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
