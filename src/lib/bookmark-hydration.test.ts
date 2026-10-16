/**
 * Unit tests for the two-step bookmark hydration (Phase 5).
 * Coverage required by the checklist: 0, 1, 100, 101 and 250 bookmarks, plus ids
 * that do not exist. The fetcher is injected, no network, no Supabase.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hydrateBookmarks, HYDRATE_CHUNK, type BookmarkRowLite } from './bookmark-hydration';
import type { Poem } from './types';

function poemOf(id: number): Poem {
  return {
    id,
    title: `شعر ${id}`,
    verses: [],
    poetId: 2,
    poetName: 'حافظ',
    categoryId: 24,
    categoryTitle: 'غزلیات',
  };
}

function rowsOf(ids: number[]): BookmarkRowLite[] {
  // created_at descending: newest first, matching the Supabase query order.
  return ids.map((poem_id, i) => ({
    id: `row-${poem_id}`,
    poem_id,
    created_at: new Date(Date.UTC(2026, 0, 1) - i * 1000).toISOString(),
  }));
}

test('hydration with 0 bookmarks returns [] and makes no requests', async () => {
  let calls = 0;
  const items = await hydrateBookmarks([], async () => {
    calls += 1;
    return [];
  });
  assert.deepEqual(items, []);
  assert.equal(calls, 0);
});

test('hydration with 1 bookmark maps the row fields 1:1 (same shape as the old join)', async () => {
  const items = await hydrateBookmarks(rowsOf([42]), async () => [poemOf(42)]);
  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    id: 'row-42',
    poemId: 42,
    poetId: 2,
    poetName: 'حافظ',
    title: 'شعر 42',
    categoryId: 24,
    categoryTitle: 'غزلیات',
    timestamp: new Date('2026-01-01T00:00:00.000Z').getTime(),
    url: '/poem/42',
  });
});

test('hydration chunks at most 100 ids per request (100, 101 and 250 bookmarks)', async () => {
  for (const n of [HYDRATE_CHUNK, HYDRATE_CHUNK + 1, 250]) {
    const ids = Array.from({ length: n }, (_, i) => i + 1);
    const paths: string[] = [];
    const items = await hydrateBookmarks(rowsOf(ids), async (path) => {
      paths.push(path);
      const chunk = (path.split('?ids=')[1] ?? '').split(',').map(Number);
      assert.ok(chunk.length <= HYDRATE_CHUNK, `chunk too large: ${chunk.length}`);
      return chunk.map(poemOf);
    });
    assert.equal(items.length, n);
    const expectedCalls = Math.ceil(n / HYDRATE_CHUNK);
    assert.equal(paths.length, expectedCalls, `${n} bookmarks in ${expectedCalls} batch(es)`);
    // order follows the rows (created_at desc), not the backend response
    assert.equal(items[0].poemId, ids[0]);
    assert.equal(items[n - 1].poemId, ids[n - 1]);
  }
});

test('ids that no longer exist are skipped; the response is logged once', async () => {
  const ids = [1, 2, 3, 4, 5];
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(String(args[0]));
  };
  try {
    const items = await hydrateBookmarks(rowsOf(ids), async (path) => {
      const chunk = (path.split('?ids=')[1] ?? '').split(',').map(Number);
      // poem 3 is gone; everything else exists
      return chunk.filter((id) => id !== 3).map(poemOf);
    });
    assert.equal(
      items.length,
      ids.length - 1,
      'the missing poem is skipped, other bookmarks survive'
    );
    assert.ok(!items.some((i) => i.poemId === 3));
    const hydrateWarnings = warnings.filter((w) => w.includes('[bookmark-hydrate] missing'));
    assert.equal(hydrateWarnings.length, 1, 'exactly one missing-poem log per response');
  } finally {
    console.warn = originalWarn;
  }
});

test('a failed batch does not drop the whole list (other batches still hydrate)', async () => {
  const ids = Array.from({ length: HYDRATE_CHUNK + 1 }, (_, i) => i + 1);
  let call = 0;
  const items = await hydrateBookmarks(rowsOf(ids), async (path) => {
    call += 1;
    if (call === 1) throw new Error('network down');
    const chunk = (path.split('?ids=')[1] ?? '').split(',').map(Number);
    return chunk.map(poemOf);
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].poemId, HYDRATE_CHUNK + 1);
});

test('duplicate ids in the input are transported once', async () => {
  const paths: string[] = [];
  await hydrateBookmarks([rowsOf([7])[0], rowsOf([7])[0]].map((r, i) => ({ ...r, id: `row-${i}` })), async (path) => {
    paths.push(path);
    return [];
  });
  assert.equal(paths[0], '/api/content/poems?ids=7');
});
