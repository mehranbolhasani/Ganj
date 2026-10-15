/**
 * D1 backend implementation of the `HybridBackend` interface.
 *
 * Calls the read-only `ganj-d1-worker` over HTTPS with the shared-secret header
 * `X-Ganj-Key`. The secret is server-only: this module imports `server-only` and must
 * never be imported from a client component. Env vars:
 *
 *   D1_WORKER_URL     - base URL of the Worker (e.g. https://ganj-d1-worker.<sub>.workers.dev)
 *   D1_WORKER_SECRET  - shared secret, mirrored as the Worker secret `GANJ_KEY`
 *
 * Behaviour mirrors `supabaseApi`:
 *  - a genuinely missing poem or poet throws (so the hybrid layer falls back to Ganjoor),
 *  - a network failure / timeout / non-2xx throws,
 *  - an empty (but valid) collection resolves to an empty array (no throw).
 */

import 'server-only';
import { Poet, Category, Poem, Chapter } from './types';
import type { HybridBackend } from './hybrid-api';

/** Matches the Supabase error style: thrown on miss / transport failure. */
export class D1ApiError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'D1ApiError';
    this.status = status;
  }
}

/** Abort a Worker call after this long, so a slow/hung Worker trips the Ganjoor fallback. */
const REQUEST_TIMEOUT_MS = 3000;

function workerUrl(): string {
  const url = process.env.D1_WORKER_URL;
  if (!url) throw new D1ApiError('D1_WORKER_URL is not configured');
  return url.replace(/\/$/, '');
}

function workerSecret(): string {
  const secret = process.env.D1_WORKER_SECRET;
  if (!secret) throw new D1ApiError('D1_WORKER_SECRET is not configured');
  return secret;
}

/** True when both D1 Worker env vars are present. */
export function isD1Available(): boolean {
  return Boolean(process.env.D1_WORKER_URL && process.env.D1_WORKER_SECRET);
}

async function getJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(workerUrl() + path, {
      headers: { 'X-Ganj-Key': workerSecret(), accept: 'application/json' },
      signal: controller.signal,
      // the Data-Cache wrapper in d1-api-server.ts does the caching; don't let fetch cache
      cache: 'no-store',
    });
    if (res.status === 404) throw new D1ApiError(`D1 worker: not found (${path})`, 404);
    if (!res.ok) throw new D1ApiError(`D1 worker responded ${res.status} for ${path}`, res.status);
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof D1ApiError) throw error;
    throw new D1ApiError(
      `D1 worker request to ${path} failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    clearTimeout(timer);
  }
}

export const d1Api: HybridBackend = {
  async getPoets(): Promise<Poet[]> {
    return getJson<Poet[]>('/poets');
  },

  async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }> {
    return getJson<{ poet: Poet; categories: Category[] }>(`/poets/${id}`);
  },

  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]> {
    return getJson<Poem[]>(`/categories/${categoryId}/poems?poetId=${poetId}`);
  },

  async getPoem(id: number): Promise<Poem> {
    return getJson<Poem>(`/poems/${id}`);
  },

  async getChapter(
    poetId: number,
    categoryId: number,
    chapterId: number
  ): Promise<{ chapter: Chapter; poems: Poem[] }> {
    return getJson<{ chapter: Chapter; poems: Poem[] }>(
      `/chapters/${chapterId}?poetId=${poetId}&categoryId=${categoryId}`
    );
  },

  async getPoemNeighbors(
    poemId: number,
    poetId: number,
    categoryId: number,
    chapterId?: number
  ): Promise<{ previousPoem: Poem | null; nextPoem: Poem | null }> {
    const chapter = chapterId ? `&chapterId=${chapterId}` : '';
    return getJson<{ previousPoem: Poem | null; nextPoem: Poem | null }>(
      `/poems/${poemId}/neighbors?poetId=${poetId}&categoryId=${categoryId}${chapter}`
    );
  },

  async listMigratedPoetIds(): Promise<number[]> {
    return getJson<number[]>('/migrated-poet-ids');
  },
};
