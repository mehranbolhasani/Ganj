import { createSupabaseBrowserClient } from './supabase-browser';
import type { BookmarkItem } from './bookmarks-manager';

// Shape returned by Supabase join query
interface BookmarkRow {
  id: string;
  poem_id: number;
  created_at: string;
  poems: {
    id: number;
    title: string;
    poet_id: number;
    category_id: number | null;
    poets: {
      id: number;
      name: string;
    };
    categories: {
      id: number;
      title: string;
    } | null;
  };
}

function rowToBookmarkItem(row: BookmarkRow): BookmarkItem {
  return {
    id: row.id,
    poemId: row.poems.id,
    poetId: row.poems.poet_id,
    poetName: row.poems.poets.name,
    title: row.poems.title,
    categoryId: row.poems.category_id ?? undefined,
    categoryTitle: row.poems.categories?.title ?? undefined,
    timestamp: new Date(row.created_at).getTime(),
    url: `/poem/${row.poems.id}`,
  };
}

export async function getCloudBookmarks(): Promise<BookmarkItem[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      poem_id,
      created_at,
      poems (
        id,
        title,
        poet_id,
        category_id,
        poets ( id, name ),
        categories ( id, title )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('getCloudBookmarks error:', error.message);
    return [];
  }

  return (data as unknown as BookmarkRow[]).map(rowToBookmarkItem);
}

export async function addCloudBookmark(poemId: number): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('bookmarks')
    .insert({ poem_id: poemId });

  if (error) {
    // 23505 = unique_violation (already bookmarked) - not a real error
    if (error.code === '23505') return true;
    console.warn('addCloudBookmark error:', error.message);
    return false;
  }
  return true;
}

export async function removeCloudBookmark(poemId: number): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('poem_id', poemId);

  if (error) {
    console.warn('removeCloudBookmark error:', error.message);
    return false;
  }
  return true;
}

export async function isCloudBookmarked(poemId: number): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('poem_id', poemId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
}

export async function bulkImportBookmarks(poemIds: number[]): Promise<number> {
  // Returns count of successfully imported bookmarks
  if (poemIds.length === 0) return 0;
  const supabase = createSupabaseBrowserClient();
  const rows = poemIds.map((poem_id) => ({ poem_id }));

  const { data, error } = await supabase
    .from('bookmarks')
    .upsert(rows, { onConflict: 'user_id,poem_id', ignoreDuplicates: true })
    .select('id');

  if (error) {
    console.warn('bulkImportBookmarks error:', error.message);
    return 0;
  }
  return data?.length ?? 0;
}
