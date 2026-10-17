/**
 * Unit tests for the browser content client (same-origin /api/content/* backend).
 * Uses an injected fetch, no network and no secrets.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentApiClient, CLIENT_MAX_IDS } from './content-api-client';
import type { Poem } from './types';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  }) as Response;
}

const POEM = (id: number): Poem => ({
  id,
  title: `t${id}`,
  verses: [],
  poetId: 2,
  poetName: 'حافظ',
  categoryId: 24,
  categoryTitle: 'غزلیات',
});

test('getPoem: resolves the poem on 200', async () => {
  const paths: string[] = [];
  const poem = await contentApiClient.getPoem(42, async (p) => {
    paths.push(p);
    return jsonResponse(POEM(42));
  });
  assert.equal(poem.id, 42);
  assert.deepEqual(paths, ['/api/content/poems/42']);
});

test('getPoem: 404 throws so the hybrid fallback can switch to Ganjoor', async () => {
  await assert.rejects(
    contentApiClient.getPoem(999, async () => jsonResponse({ error: 'poem not found' }, 404)),
    /not found/
  );
});

test('getPoem: non-2xx and bad json throw', async () => {
  await assert.rejects(contentApiClient.getPoem(1, async () => jsonResponse({}, 500)));
  await assert.rejects(
    contentApiClient.getPoem(1, async () => new Response('not json', { status: 200 }) as Response)
  );
});

test('getPoets, getPoet and getCategoryPoems hit the documented routes', async () => {
  const paths: string[] = [];
  const fetcher = async (p: string) => {
    paths.push(p);
    if (p === '/api/content/poets') return jsonResponse([]);
    if (p === '/api/content/poets/2') return jsonResponse({ poet: { id: 2, name: 'حافظ' }, categories: [] });
    return jsonResponse([]);
  };
  await contentApiClient.getPoets(fetcher);
  await contentApiClient.getPoet(2, fetcher);
  await contentApiClient.getCategoryPoems(2, 24, fetcher);
  await contentApiClient.listMigratedPoetIds(fetcher);
  assert.deepEqual(paths, [
    '/api/content/poets',
    '/api/content/poets/2',
    '/api/content/categories/24/poems?poetId=2',
    '/api/content/migrated-poet-ids',
  ]);
});

test('getPoemsByIds: chunked to 100 ids per request, concatenated in order', async () => {
  const paths: string[] = [];
  const fetcher = async (p: string) => {
    paths.push(p);
    const ids = (p.split('?ids=')[1] ?? '').split(',').map(Number);
    return jsonResponse(ids.map(POEM));
  };
  const ids = Array.from({ length: CLIENT_MAX_IDS + 30 }, (_, i) => i + 1);
  const poems = await contentApiClient.getPoemsByIds(ids, fetcher);
  assert.equal(paths.length, 2);
  assert.ok(paths[0].includes(`ids=${ids[0]},`));
  assert.equal(poems.length, CLIENT_MAX_IDS + 30);
  assert.equal(poems[0].id, 1);
  assert.equal(poems[poems.length - 1].id, CLIENT_MAX_IDS + 30);
});

test('getPoemsByIds: empty input makes no request', async () => {
  const poems = await contentApiClient.getPoemsByIds([], async () => {
    throw new Error('should not fetch');
  });
  assert.deepEqual(poems, []);
});

test('getChapter and getPoemNeighbors are rejected server-side-only stubs', async () => {
  await assert.rejects(contentApiClient.getChapter(0, 0, 0), /server-side only/);
  await assert.rejects(contentApiClient.getPoemNeighbors(0, 0, 0), /server-side only/);
});
