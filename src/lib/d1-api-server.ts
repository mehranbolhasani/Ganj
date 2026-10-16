/**
 * Server-side, Data-Cache-backed variants of the D1 Worker fetchers.
 *
 * Exactly the same two-layer pattern as ./supabase-api-server:
 * - `cache()` (React) dedupes calls within a single request/render,
 * - `unstable_cache` (next/cache) persists results in the Data Cache with the same
 *   revalidate windows (24h for poems/poets, 1h for lists/navigation/migrated-ids).
 *
 * `server-only`: never import from a client component.
 */

import 'server-only';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { Poet, Category, Poem, Chapter } from './types';
import { d1Api } from './d1-api';

/* Same revalidate windows as supabase-api-server.ts */
const ITEM_REVALIDATE = 60 * 60 * 24; // poems & poets: 1 day
const LIST_REVALIDATE = 60 * 60; // lists, navigation, migrated-ids: 1 hour

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dataCached<A extends any[], R>(
  fetcher: (...args: A) => Promise<R>,
  keyPrefix: string[],
  revalidate: number,
  tags: string[]
): (...args: A) => Promise<R> {
  const platformCached = unstable_cache(fetcher as (...args: A) => Promise<R>, keyPrefix, {
    revalidate,
    tags,
  });
  return cache(platformCached) as (...args: A) => Promise<R>;
}

const getPoemCached = dataCached<[id: number], Poem>(
  d1Api.getPoem.bind(d1Api),
  ['d1-poem'],
  ITEM_REVALIDATE,
  ['d1-content', 'poems']
);

const getPoetCached = dataCached<[id: number], { poet: Poet; categories: Category[] }>(
  d1Api.getPoet.bind(d1Api),
  ['d1-poet'],
  ITEM_REVALIDATE,
  ['d1-content', 'poets']
);

const getPoetsCached = dataCached<[], Poet[]>(
  d1Api.getPoets.bind(d1Api),
  ['d1-poets'],
  LIST_REVALIDATE,
  ['d1-content', 'poets']
);

const getCategoryPoemsCached = dataCached<[poetId: number, categoryId: number], Poem[]>(
  d1Api.getCategoryPoems.bind(d1Api),
  ['d1-category-poems'],
  LIST_REVALIDATE,
  ['d1-content', 'poems', 'categories']
);

const getChapterCached = dataCached<
  [poetId: number, categoryId: number, chapterId: number],
  { chapter: Chapter; poems: Poem[] }
>(
  d1Api.getChapter.bind(d1Api),
  ['d1-chapter'],
  LIST_REVALIDATE,
  ['d1-content', 'poems', 'categories']
);

const getPoemNeighborsCached = dataCached<
  [poemId: number, poetId: number, categoryId: number, chapterId?: number],
  { previousPoem: Poem | null; nextPoem: Poem | null }
>(
  d1Api.getPoemNeighbors.bind(d1Api),
  ['d1-poem-neighbors'],
  LIST_REVALIDATE,
  ['d1-content', 'poems']
);

const listMigratedPoetIdsCached = dataCached<[], number[]>(
  d1Api.listMigratedPoetIds.bind(d1Api),
  ['d1-migrated-poet-ids'],
  LIST_REVALIDATE,
  ['d1-content', 'poets']
);

const getPoemsByIdsCached = dataCached<[ids: number[]], Poem[]>(
  d1Api.getPoemsByIds.bind(d1Api),
  ['d1-poems-by-ids'],
  LIST_REVALIDATE,
  ['d1-content', 'poems']
);

/** Same interface as `supabaseApiCached`, backed by the D1 Worker. */
export const d1ApiCached = {
  getPoets: getPoetsCached,
  getPoet: getPoetCached,
  getCategoryPoems: getCategoryPoemsCached,
  getPoem: getPoemCached,
  getChapter: getChapterCached,
  getPoemNeighbors: getPoemNeighborsCached,
  listMigratedPoetIds: listMigratedPoetIdsCached,
  getPoemsByIds: getPoemsByIdsCached,
};
