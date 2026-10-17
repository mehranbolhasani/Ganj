/**
 * Browser-side HybridBackend over the same-origin /api/content/* route handlers.
 *
 * The browser never sees D1_WORKER_URL or D1_WORKER_SECRET and never calls Supabase
 * for content: the handlers run hybridApiServer, whose data source follows
 * CONTENT_BACKEND (supabase by default). On non-2xx the method throws and the shared
 * createHybridApi logic falls back to the Ganjoor API exactly as before.
 *
 * Client-safe by design (no server-only import, no secrets, same-origin fetch).
 */

import type { Poet, Category, Poem, Chapter } from './types';
import type { HybridBackend } from './hybrid-api';

/** Bookmark hydration and faal fetches chunk id lists to the shared 100 limit. */
export const CLIENT_MAX_IDS = 100;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * The full client surface (with injectable fetch for tests). Structurally a
 * HybridBackend: the optional trailing fetchImpl params keep it assignable to
 * the shared interface the createHybridApi factory consumes.
 */
export interface ContentApiClient extends HybridBackend {
  getPoets(fetchImpl?: FetchLike): Promise<Poet[]>;
  getPoet(id: number, fetchImpl?: FetchLike): Promise<{ poet: Poet; categories: Category[] }>;
  getCategoryPoems(poetId: number, categoryId: number, fetchImpl?: FetchLike): Promise<Poem[]>;
  getPoem(id: number, fetchImpl?: FetchLike): Promise<Poem>;
  getChapter(
    poetId: number,
    categoryId: number,
    chapterId: number,
    fetchImpl?: FetchLike
  ): Promise<{ chapter: Chapter; poems: Poem[] }>;
  getPoemNeighbors(
    poemId: number,
    poetId: number,
    categoryId: number,
    chapterId?: number,
    fetchImpl?: FetchLike
  ): Promise<{ previousPoem: Poem | null; nextPoem: Poem | null }>;
  listMigratedPoetIds(fetchImpl?: FetchLike): Promise<number[]>;
  getPoemsByIds(ids: number[], fetchImpl?: FetchLike): Promise<Poem[]>;
}

async function getJson<T>(path: string, fetchImpl?: FetchLike): Promise<T> {
  const doFetch = fetchImpl ?? fetch;
  const res = await doFetch(path, { headers: { accept: 'application/json' } });
  if (res.status === 404) {
    throw new Error(`content api: not found (${path})`);
  }
  if (!res.ok) {
    throw new Error(`content api: ${res.status} (${path})`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(`content api: invalid json (${path})`);
  }
}

export const contentApiClient: ContentApiClient = {
  getPoets(fetchImpl?: FetchLike): Promise<Poet[]> {
    return getJson<Poet[]>('/api/content/poets', fetchImpl);
  },

  getPoet(id: number, fetchImpl?: FetchLike): Promise<{ poet: Poet; categories: Category[] }> {
    return getJson<{ poet: Poet; categories: Category[] }>(`/api/content/poets/${id}`, fetchImpl);
  },

  getCategoryPoems(poetId: number, categoryId: number, fetchImpl?: FetchLike): Promise<Poem[]> {
    return getJson<Poem[]>(`/api/content/categories/${categoryId}/poems?poetId=${poetId}`, fetchImpl);
  },

  getPoem(id: number, fetchImpl?: FetchLike): Promise<Poem> {
    return getJson<Poem>(`/api/content/poems/${id}`, fetchImpl);
  },

  /**
   * Not reachable from the browser: no client component calls this today (chapter
   * pages and poem navigation run server side). Kept as a loud error so a future
   * caller fails visibly instead of silently returning wrong data.
   */
  getChapter(): Promise<{ chapter: Chapter; poems: Poem[] }> {
    return Promise.reject(new Error('content api: getChapter is server-side only'));
  },

  /** Same reasoning as getChapter: poem navigation never runs in the browser. */
  getPoemNeighbors(): Promise<{ previousPoem: Poem | null; nextPoem: Poem | null }> {
    return Promise.reject(new Error('content api: getPoemNeighbors is server-side only'));
  },
  listMigratedPoetIds(fetchImpl?: FetchLike): Promise<number[]> {
    return getJson<number[]>('/api/content/migrated-poet-ids', fetchImpl);
  },

  async getPoemsByIds(ids: number[], fetchImpl?: FetchLike): Promise<Poem[]> {
    if (ids.length === 0) return [];
    const out: Poem[] = [];
    for (let i = 0; i < ids.length; i += CLIENT_MAX_IDS) {
      const part = ids.slice(i, i + CLIENT_MAX_IDS);
      const poems = await getJson<Poem[]>(`/api/content/poems?ids=${part.join(',')}`, fetchImpl);
      out.push(...poems);
    }
    return out;
  },
};
