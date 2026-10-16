/**
 * Server-side, Data-Cache-backed variants of the shared Supabase fetchers.
 *
 * Two layers:
 * - `cache()` (React) dedupes concurrent/sequential calls within a single
 *   request/render — e.g. `generateMetadata` + the page component both calling
 *   `getPoem` for the same id now run at most one Supabase query per request.
 * - `unstable_cache` (next/cache) persists the result in the Vercel Data
 *   Cache across requests and serverless instances, with a revalidate window
 *   (24h for poems/poets, 1h for lists/navigation) and tags for future
 *   manual invalidation via revalidateTag.
 *
 * This module is `server-only`: it must never be imported from client
 * components (they use the shared, uncached ./supabase-api).
 */

import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { Poet, Category, Poem, Chapter } from './types';
import { supabaseApi } from './supabase-api';

/* Revalidate windows (seconds) */
const ITEM_REVALIDATE = 60 * 60 * 24; // poems & poets: 1 day
const LIST_REVALIDATE = 60 * 60; // lists, navigation, migrated-ids: 1 hour

/**
 * Wrap a fetcher with unstable_cache (cross-request Data Cache with tags)
 * inside React cache() (per-request dedupe). The cached function keeps the
 * fetcher's exact argument/return signature.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dataCached<A extends any[], R>(
  fetcher: (...args: A) => Promise<R>,
  keyPrefix: string[],
  revalidate: number,
  tags: string[]
): (...args: A) => Promise<R> {
  const platformCached = unstable_cache(
    fetcher as (...args: A) => Promise<R>,
    keyPrefix,
    { revalidate, tags }
  );
  // Call order matters: the React cache() wraps the platform cache so one
  // render never hits unstable_cache twice with identical args.
  return cache(platformCached) as (...args: A) => Promise<R>;
}

/* Poem / poet = 24h Data Cache */
const getPoemCached = dataCached<[id: number], Poem>(
  supabaseApi.getPoem.bind(supabaseApi),
  ['supabase-poem'],
  ITEM_REVALIDATE,
  ['supabase-content', 'poems']
);

const getPoetCached = dataCached<[id: number], { poet: Poet; categories: Category[] }>(
  supabaseApi.getPoet.bind(supabaseApi),
  ['supabase-poet'],
  ITEM_REVALIDATE,
  ['supabase-content', 'poets']
);

/* Lists, chapter, navigation = 1h Data Cache */
const getPoetsCached = dataCached<[], Poet[]>(
  supabaseApi.getPoets.bind(supabaseApi),
  ['supabase-poets'],
  LIST_REVALIDATE,
  ['supabase-content', 'poets']
);

const getCategoryPoemsCached = dataCached<[poetId: number, categoryId: number], Poem[]>(
  supabaseApi.getCategoryPoems.bind(supabaseApi),
  ['supabase-category-poems'],
  LIST_REVALIDATE,
  ['supabase-content', 'poems', 'categories']
);

const getChapterCached = dataCached<
  [poetId: number, categoryId: number, chapterId: number],
  { chapter: Chapter; poems: Poem[] }
>(
  supabaseApi.getChapter.bind(supabaseApi),
  ['supabase-chapter'],
  LIST_REVALIDATE,
  ['supabase-content', 'poems', 'categories']
);

const getPoemNeighborsCached = dataCached<
  [poemId: number, poetId: number, categoryId: number, chapterId?: number],
  { previousPoem: Poem | null; nextPoem: Poem | null }
>(
  supabaseApi.getPoemNeighbors.bind(supabaseApi),
  ['supabase-poem-neighbors'],
  LIST_REVALIDATE,
  ['supabase-content', 'poems']
);

const listMigratedPoetIdsCached = dataCached<[], number[]>(
  supabaseApi.listMigratedPoetIds.bind(supabaseApi),
  ['supabase-migrated-poet-ids'],
  LIST_REVALIDATE,
  ['supabase-content', 'poets']
);

const getPoemsByIdsCached = dataCached<[ids: number[]], Poem[]>(
  supabaseApi.getPoemsByIds.bind(supabaseApi),
  ['supabase-poems-by-ids'],
  LIST_REVALIDATE,
  ['supabase-content', 'poems']
);

/** Same interface as `supabaseApi` (the HybridBackend subset), but every fetcher goes through the cached wrappers. */
export const supabaseApiCached = {
  getPoets: getPoetsCached,
  getPoet: getPoetCached,
  getCategoryPoems: getCategoryPoemsCached,
  getPoem: getPoemCached,
  getChapter: getChapterCached,
  getPoemNeighbors: getPoemNeighborsCached,
  listMigratedPoetIds: listMigratedPoetIdsCached,
  getPoemsByIds: getPoemsByIdsCached,
};
