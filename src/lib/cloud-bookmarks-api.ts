import { createSupabaseBrowserClient } from './supabase-browser';
import { hydrateBookmarks, type BookmarkRowLite } from './bookmark-hydration';
import type { BookmarkItem } from './bookmarks-manager';

/**
 * Phase 5: the bookmark rows and the poem metadata live in two backends, so the
 * old single embedded join (bookmarks + poems + poets + categories) is split:
 * step 1 reads only the bookmark rows from Supabase (id, poem_id, created_at),
 * step 2 hydrates poem metadata in batches of at most 100 ids through the
 * same-origin /api/content/poems handler (bookmark-hydration.ts). Ordering
 * (created_at desc) and the BookmarkItem shape are unchanged; rows whose poem
 * no longer exists are skipped (never deleted).
 */
export async function getCloudBookmarks(): Promise<BookmarkItem[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, poem_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('getCloudBookmarks error:', error.message);
    return [];
  }

  return hydrateBookmarks(data as unknown as BookmarkRowLite[]);
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
