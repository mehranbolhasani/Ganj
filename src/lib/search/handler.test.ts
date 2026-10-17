import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleSearch, filterPoets, CACHE_SUCCESS, type SearchDeps, type WorkerSearchParams, type CachedPoet } from './handler';
import { workerGet, type FetchLike } from '../worker-client';

const CONFIG = { baseUrl: 'https://worker.example.test', secret: 'test-secret' };

const POETS: CachedPoet[] = [
  { id: 2, name: 'حافظ شیرازی', slug: 'hafez', description: 'غزلسرای بزرگ' },
  { id: 3, name: 'خیام نیشابوری', slug: 'khayyam', birthYear: 439, deathYear: 526 },
  { id: 9, name: 'یار دبستانی', slug: 'yar' }, // name written with Persian yeh
  { id: 40, name: 'سعدی', slug: 'saadi', description: 'بوستان و گلستان' },
];

const WORKER_CATEGORIES = [{ id: 31, title: 'رباعیات', poetId: 3, poetName: 'خیام نیشابوری', poemCount: 5 }];
const WORKER_POEMS = [
  { id: 1119, title: 'رباعی شمارهٔ ۱', verses: ['برخیز بُتا، بیا ز بهر دل ما', 'حل کن به جمال خویشتن مشکل ما'], poetId: 3, poetName: 'خیام نیشابوری', categoryId: 31, categoryTitle: 'رباعیات' },
];

/** A fake Worker: answers /search from a behaviour switch and records every request. */
function fakeWorker(behaviour: 'ok' | 'timeout' | 'unauthorized') {
  const calls: string[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    calls.push(url);
    if (behaviour === 'timeout') {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      });
    }
    if (behaviour === 'unauthorized') {
      return Promise.resolve(new Response('{"error":"unauthorized"}', { status: 401 }));
    }
    const u = new URL(url);
    const type = u.searchParams.get('type');
    const count = u.searchParams.get('count') === 'true';
    const body: Record<string, unknown> = {};
    if (type === 'all' || type === 'categories') {
      body.categories = WORKER_CATEGORIES;
      if (count) body.totalCategories = WORKER_CATEGORIES.length;
    }
    if (type === 'all' || type === 'poems') {
      body.poems = WORKER_POEMS;
      if (count) body.totalPoems = WORKER_POEMS.length;
    }
    body.poets = []; // the Worker also returns poets; the app ignores them and uses the cached list
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }));
  };
  return { calls, fetchImpl };
}

function makeDeps(opts: {
  fetchImpl: FetchLike;
  timeoutMs?: number;
  migrated?: number[];
  rateLimit?: { success: boolean; retryAfterSec: number };
  fallbackEnabled?: boolean;
  logs?: string[];
  legacyCalls?: { n: number };
}): SearchDeps {
  const migrated = new Set(opts.migrated ?? [2, 3, 9, 40]);
  const legacyCalls = opts.legacyCalls ?? { n: 0 };
  return {
    workerSearch: (p: WorkerSearchParams) => {
      const qs = new URLSearchParams({ q: p.q, type: p.type, limit: String(p.limit), offset: String(p.offset) });
      if (p.count) qs.set('count', 'true');
      if (p.poetId !== undefined) qs.set('poetId', String(p.poetId));
      return workerGet(`/search?${qs.toString()}`, { config: CONFIG, fetchImpl: opts.fetchImpl, timeoutMs: opts.timeoutMs });
    },
    getPoets: async () => POETS,
    isMigratedPoet: async (id) => migrated.has(id),
    legacySearch: async () => {
      legacyCalls.n++;
      return new Response(JSON.stringify({ legacy: true, poets: [], categories: [], poems: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
    rateLimit: async () => opts.rateLimit ?? { success: true, retryAfterSec: 0 },
    fallbackEnabled: opts.fallbackEnabled ?? true,
    log: (line) => opts.logs?.push(line),
  };
}

const run = (qs: string, deps: SearchDeps) => handleSearch(new URLSearchParams(qs), '203.0.113.7', deps);

test('success: 200 from the Worker, identical key shape, cacheable', async () => {
  const w = fakeWorker('ok');
  const logs: string[] = [];
  const res = await run('q=' + encodeURIComponent('حافظ') + '&type=all&limit=20', makeDeps({ fetchImpl: w.fetchImpl, logs }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('X-Search-Source'), 'd1');
  assert.equal(res.headers.get('Cache-Control'), CACHE_SUCCESS);
  assert.equal(CACHE_SUCCESS, 'public, s-maxage=3600, stale-while-revalidate=3600');
  const body = (await res.json()) as Record<string, unknown>;
  assert.deepEqual(Object.keys(body).sort(), ['categories', 'poems', 'poets']);
  assert.equal(w.calls.length, 1, 'one Worker call covers categories and poems');
  assert.deepEqual(logs, []);
});

test('poem excerpts from the Worker pass through unchanged (the UI shows verses[])', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=' + encodeURIComponent('رباعی') + '&type=poems', makeDeps({ fetchImpl: w.fetchImpl }));
  const body = (await res.json()) as { poems: { id: number; verses: string[] }[] };
  assert.deepEqual(body.poems[0].verses, ['برخیز بُتا، بیا ز بهر دل ما', 'حل کن به جمال خویشتن مشکل ما']);
});

test('poets row shape matches the legacy Supabase search exactly (snake_case, nulls kept)', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=' + encodeURIComponent('خیام') + '&type=poets', makeDeps({ fetchImpl: w.fetchImpl }));
  const body = (await res.json()) as { poets: Record<string, unknown>[] };
  assert.equal(body.poets.length, 1);
  assert.deepEqual(Object.keys(body.poets[0]), ['id', 'name', 'slug', 'description', 'birth_year', 'death_year']);
  assert.equal(body.poets[0].description, null);
  assert.equal(body.poets[0].birth_year, 439);
});

test('count=true adds totals for the requested groups only', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=' + encodeURIComponent('حافظ') + '&type=all&count=true', makeDeps({ fetchImpl: w.fetchImpl }));
  const body = (await res.json()) as Record<string, unknown>;
  for (const k of ['totalPoets', 'totalCategories', 'totalPoems']) assert.ok(k in body, k);
});

test('poet search normalizes Arabic yeh in the query against Persian yeh in the name', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=' + encodeURIComponent('يار') + '&type=poets', makeDeps({ fetchImpl: w.fetchImpl }));
  const body = (await res.json()) as { poets: { id: number }[] };
  assert.deepEqual(body.poets.map((p) => p.id), [9]);
});

test('timeout: falls back to the legacy path, logs one [d1-fallback] line, does not cache', async () => {
  const w = fakeWorker('timeout');
  const logs: string[] = [];
  const legacy = { n: 0 };
  const res = await run('q=' + encodeURIComponent('حافظ') + '&type=poems', makeDeps({ fetchImpl: w.fetchImpl, timeoutMs: 20, logs, legacyCalls: legacy }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('X-Search-Source'), 'supabase-fallback');
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(legacy.n, 1);
  assert.deepEqual(logs, ['[d1-fallback] scope=search reason=timeout action=supabase']);
});

test('401 from the Worker: falls back and logs reason=http-401', async () => {
  const w = fakeWorker('unauthorized');
  const logs: string[] = [];
  const res = await run('q=' + encodeURIComponent('حافظ') + '&type=poems', makeDeps({ fetchImpl: w.fetchImpl, logs }));
  assert.equal(res.headers.get('X-Search-Source'), 'supabase-fallback');
  assert.deepEqual(logs, ['[d1-fallback] scope=search reason=http-401 action=supabase']);
});

test('fallback disabled: 503 with no-store and a log line that says unavailable', async () => {
  const w = fakeWorker('unauthorized');
  const logs: string[] = [];
  const res = await run('q=' + encodeURIComponent('حافظ') + '&type=poems', makeDeps({ fetchImpl: w.fetchImpl, logs, fallbackEnabled: false }));
  assert.equal(res.status, 503);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(logs, ['[d1-fallback] scope=search reason=http-401 action=unavailable']);
});

test('rate limit exceeded: 429 with Retry-After, and the Worker is never called', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=' + encodeURIComponent('حافظ'), makeDeps({ fetchImpl: w.fetchImpl, rateLimit: { success: false, retryAfterSec: 42 } }));
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '42');
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(w.calls.length, 0);
});

test('an empty query is rejected with 400 and does not reach the Worker', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=%20', makeDeps({ fetchImpl: w.fetchImpl }));
  assert.equal(res.status, 400);
  assert.equal(w.calls.length, 0);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
});

test('a one-character query returns the legacy "Query too short" 200', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=' + encodeURIComponent('ح'), makeDeps({ fetchImpl: w.fetchImpl }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { poets: [], categories: [], poems: [], message: 'Query too short' });
  assert.equal(w.calls.length, 0);
});

test('a poet that is not migrated keeps the existing path (delegated, Worker not called)', async () => {
  const w = fakeWorker('ok');
  const legacy = { n: 0 };
  const res = await run('q=' + encodeURIComponent('حافظ') + '&poetId=99999', makeDeps({ fetchImpl: w.fetchImpl, legacyCalls: legacy }));
  assert.equal(res.headers.get('X-Search-Source'), 'legacy');
  assert.equal(legacy.n, 1);
  assert.equal(w.calls.length, 0);
});

test('a migrated poetId filters poems through the Worker', async () => {
  const w = fakeWorker('ok');
  await run('q=' + encodeURIComponent('رباعی') + '&type=poems&poetId=3', makeDeps({ fetchImpl: w.fetchImpl }));
  assert.equal(w.calls.length, 1);
  assert.ok(w.calls[0].includes('poetId=3'));
});

test('a non-numeric poetId omits the poems key, as the legacy route does', async () => {
  const w = fakeWorker('ok');
  const res = await run('q=' + encodeURIComponent('حافظ') + '&type=all&poetId=abc', makeDeps({ fetchImpl: w.fetchImpl }));
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal('poems' in body, false);
  assert.ok('categories' in body && 'poets' in body);
});

test('the query is clamped before it reaches the Worker', async () => {
  const w = fakeWorker('ok');
  await run('q=' + encodeURIComponent('a'.repeat(80)) + '&type=poems', makeDeps({ fetchImpl: w.fetchImpl }));
  const sent = new URL(w.calls[0]).searchParams.get('q') ?? '';
  assert.ok(sent.length <= 50);
});

test('filterPoets: id ascending, normalized match on name and description, paging', () => {
  const r = filterPoets(POETS, 'گل', 10, 0);
  assert.deepEqual(r.rows.map((p) => p.id), [40]); // description "گلستان" matches
  const all = filterPoets(POETS, 'ی', 2, 1);
  assert.equal(all.total >= 3, true);
  assert.equal(all.rows.length, 2);
});
