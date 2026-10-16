/**
 * D1 backend implementation of the `HybridBackend` interface.
 *
 * Calls the read-only `ganj-d1-worker` with the shared-secret header `X-Ganj-Key`. The secret
 * is server-only: this module imports `server-only` and must never be imported from a client
 * component. Env vars: D1_WORKER_URL, D1_WORKER_SECRET.
 *
 * Behaviour mirrors `supabaseApi`:
 *  - a genuinely missing poem or poet throws (so the hybrid layer falls back to Ganjoor),
 *  - a network failure, timeout or non-2xx throws a WorkerError with a `reason`,
 *  - an empty (but valid) collection resolves to an empty array.
 */

import 'server-only';
import { Poet, Category, Poem, Chapter } from './types';
import type { HybridBackend } from './hybrid-api';
import { workerConfigFromEnv, workerGet, isWorkerConfigured, WorkerError, type WorkerConfig, type FetchLike } from './worker-client';

/** Kept under its old name so existing imports keep working. */
export { WorkerError as D1ApiError } from './worker-client';

export function isD1Available(): boolean {
  return isWorkerConfigured(workerConfigFromEnv());
}

function getJson<T>(path: string, opts?: { config?: WorkerConfig; fetchImpl?: FetchLike }): Promise<T> {
  const config = opts?.config ?? workerConfigFromEnv();
  return workerGet<T>(path, { config, fetchImpl: opts?.fetchImpl, cache: 'no-store' });
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

  /**
   * Batch poem metadata by ids through the Worker `GET /poems?ids=` endpoint.
   * The Worker caps a request at 100 ids and returns only existing rows in request
   * order, so callers chunk their id lists here.
   */
  async getPoemsByIds(ids: number[], opts?: { config?: WorkerConfig; fetchImpl?: FetchLike }): Promise<Poem[]> {
    if (ids.length === 0) return [];
    const chunks: Poem[] = [];
    for (let i = 0; i < ids.length; i += 100) {
      const part = ids.slice(i, i + 100);
      const poems = await getJson<Poem[]>(`/poems?ids=${part.join(',')}`, opts);
      chunks.push(...poems);
    }
    return chunks;
  },
};

/**
 * One random poem from a category with full verses (Telegram /faal under
 * CONTENT_BACKEND=d1). Not part of the HybridBackend interface: only faal-core
 * needs it, and it must not be cached (each call draws a different poem).
 */
export async function d1GetRandomPoemInCategory(
  poetId: number,
  categoryId: number,
  opts?: { config?: WorkerConfig; fetchImpl?: FetchLike }
): Promise<Poem> {
  return getJson<Poem>(`/categories/${categoryId}/random-poem?poetId=${poetId}`, opts);
}

export { WorkerError };
