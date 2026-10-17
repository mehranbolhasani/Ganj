import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workerGet, WorkerError, reasonOf, type FetchLike } from './worker-client';

const config = { baseUrl: 'https://worker.example.test/', secret: 'test-secret' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

test('success: sends the secret header and returns the parsed body', async () => {
  const seen: { url: string; key: string | null }[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    seen.push({ url, key: new Headers(init?.headers).get('X-Ganj-Key') });
    return jsonResponse({ ok: true });
  };
  const body = await workerGet<{ ok: boolean }>('/search?q=x', { config, fetchImpl });
  assert.deepEqual(body, { ok: true });
  assert.equal(seen[0].url, 'https://worker.example.test/search?q=x');
  assert.equal(seen[0].key, 'test-secret');
});

test('timeout: an aborted request becomes reason=timeout', async () => {
  const fetchImpl: FetchLike = (_url, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });
  await assert.rejects(workerGet('/search', { config, fetchImpl, timeoutMs: 20 }), (e: unknown) => {
    assert.ok(e instanceof WorkerError);
    assert.equal(reasonOf(e), 'timeout');
    return true;
  });
});

test('401 from the Worker is reason=http-401', async () => {
  const fetchImpl: FetchLike = async () => jsonResponse({ error: 'unauthorized' }, 401);
  await assert.rejects(workerGet('/search', { config, fetchImpl }), (e: unknown) => reasonOf(e) === 'http-401');
});

test('404 is reason=not-found and 5xx is reason=http-5xx', async () => {
  await assert.rejects(
    workerGet('/poems/1', { config, fetchImpl: async () => jsonResponse({}, 404) }),
    (e: unknown) => reasonOf(e) === 'not-found'
  );
  await assert.rejects(
    workerGet('/poems/1', { config, fetchImpl: async () => jsonResponse({}, 503) }),
    (e: unknown) => reasonOf(e) === 'http-5xx'
  );
});

test('a network error is reason=network', async () => {
  const fetchImpl: FetchLike = async () => {
    throw new TypeError('fetch failed');
  };
  await assert.rejects(workerGet('/search', { config, fetchImpl }), (e: unknown) => reasonOf(e) === 'network');
});

test('invalid JSON is reason=bad-json', async () => {
  const fetchImpl: FetchLike = async () => new Response('<html>', { status: 200 });
  await assert.rejects(workerGet('/search', { config, fetchImpl }), (e: unknown) => reasonOf(e) === 'bad-json');
});

test('missing configuration is reason=config and never calls fetch', async () => {
  let called = false;
  const fetchImpl: FetchLike = async () => {
    called = true;
    return jsonResponse({});
  };
  await assert.rejects(
    workerGet('/search', { config: { baseUrl: undefined, secret: 'x' }, fetchImpl }),
    (e: unknown) => reasonOf(e) === 'config'
  );
  assert.equal(called, false);
});

test('non-WorkerError exceptions are reported as reason=error by reasonOf', () => {
  assert.equal(reasonOf(new Error('boom')), 'error');
});
