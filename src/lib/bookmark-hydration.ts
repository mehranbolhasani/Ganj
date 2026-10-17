/**
 * Bookmark hydration, step 2 of the two-step split (Phase 5).
 *
 * Step 1 (cloud-bookmarks-api.ts) reads only the Supabase bookmark rows
 * (id, poem_id, created_at). This module then fetches poem metadata in batches of
 * at most 100 ids through GET /api/content/poems?ids= (same-origin, server side it
 * resolves through hybridApiServer, so the data source follows CONTENT_BACKEND).
 *
 * Ordering and shape rules, kept identical to the old embedded-join behavior:
 * - output order is the bookmark-row order (created_at desc), never the backend order;
 * - bookmark rows whose poem no longer exists in the content backend are skipped
 *   silently; the omission is logged once per response (never per row);
 * - bookmark rows are never deleted here.
 *
 * Client-safe: plain same-origin fetch, injected so tests can run offline.
 */

import type { Poem } from './types';
import type { BookmarkItem } from './bookmarks-manager';

/** Mirrors MAX_HYDRATE_IDS (content-routes.ts) and the Worker cap. */
export const HYDRATE_CHUNK = 100;

export interface BookmarkRowLite {
  id: string;
  poem_id: number;
  created_at: string;
}

export type PoemFetcher = (path: string) => Promise<Poem[]>;

/** Default fetcher for the browser: same-origin GET returning a poem array. */
export const fetchPoemsDefault: PoemFetcher = async (path) => {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`content api: ${res.status} (${path})`);
  }
  return (await res.json()) as Poem[];
};

/**
 * Build BookmarkItem[] from bookmark rows plus hydrated poem metadata.
 * `fetchPoems` receives /api/content/poems?ids=... paths with at most 100 ids each.
 */
export async function hydrateBookmarks(
  rows: BookmarkRowLite[],
  fetchPoems: PoemFetcher = fetchPoemsDefault
): Promise<BookmarkItem[]> {
  if (rows.length === 0) return [];

  // Dedupe ids for transport (a poem is bookmarked once per user, but stay safe),
  // then map results back by id.
  const uniqueIds: number[] = [];
  const seen = new Set<number>();
  for (const row of rows) {
    if (!seen.has(row.poem_id)) {
      seen.add(row.poem_id);
      uniqueIds.push(row.poem_id);
    }
  }

  const byId = new Map<number, Poem>();
  const missingFromResponse: number[] = [];
  for (let i = 0; i < uniqueIds.length; i += HYDRATE_CHUNK) {
    const chunk = uniqueIds.slice(i, i + HYDRATE_CHUNK);
    let poems: Poem[];
    try {
      poems = await fetchPoems(`/api/content/poems?ids=${chunk.join(',')}`);
    } catch {
      // One failed batch must not drop the whole list: those poems render as
      // skipped, matching the missing-id contract.
      console.warn(`[bookmark-hydrate] batch failed ids=${chunk.length}`);
      continue;
    }
    const returned = new Set<number>();
    for (const poem of poems) {
      byId.set(poem.id, poem);
      returned.add(poem.id);
    }
    for (const id of chunk) {
      if (!returned.has(id)) missingFromResponse.push(id);
    }
  }

  if (missingFromResponse.length > 0) {
    // Once per response, counts only: no ids, no user data.
    console.warn(`[bookmark-hydrate] missing poems count=${missingFromResponse.length}`);
  }

  const items: BookmarkItem[] = [];
  for (const row of rows) {
    const poem = byId.get(row.poem_id);
    if (!poem) continue; // unknown poem: skip the bookmark, keep the row on the server
    items.push({
      id: row.id,
      poemId: poem.id,
      poetId: poem.poetId,
      poetName: poem.poetName,
      title: poem.title,
      categoryId: poem.categoryId,
      categoryTitle: poem.categoryTitle,
      timestamp: new Date(row.created_at).getTime(),
      url: `/poem/${poem.id}`,
    });
  }
  return items;
}
