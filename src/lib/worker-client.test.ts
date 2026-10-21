import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  workerGet,
  WorkerError,
  reasonOf,
  SEARCH_TIMEOUT_MS,
  CONTENT_TIMEOUT_MS,
  RETRY_DELAY_MS,
  cacheKeyLabel,
  type FetchLike,
} from './worker-client';

const config = { baseUrl: 'https://worker.example.test/', secret: 'test-secret' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** A fetch that hangs until its abort signal fires, then rejects with an AbortError. */
function hangingFetch(_url: string, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
}

/**
 * A fetch whose headers resolve immediately (200) but whose body read stalls
 * until the abort signal fires, then rejects with an AbortError. Exercise for
 * the "body" failure stage: the per-attempt abort lands mid-body-read.
 */
function hangingBodyFetch(_url: string, init?: RequestInit): Promise<Response> {
  const response = {
    status: 200,
    ok: true,
    json: (): Promise<never> =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
        );
      }),
  };
  return Promise.resolve(response as unknown as Response);
}

/** Capture console.warn lines while fn runs, restoring it afterwards. */
async function captureWarn(fn: () => Promise<void>): Promise<string[]> {
  const lines: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    lines.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
  };
  try {
    await fn();
  } finally {
    console.warn = original;
  }
  return lines;
}

/**
 * Minimal fake timer harness: replaces globalThis.setTimeout/clearTimeout so a test
 * can step the clock deterministically without waiting real milliseconds. Restores
 * the originals afterwards. Used instead of node:test MockTimers, which crashes the
 * test runner on this Node version once a mocked timer test finishes.
 */
class FakeClock {
  private now = 0;
  private nextId = 1;
  private readonly pending = new Map<number, { at: number; fn: () => void }>();
  private readonly realSetTimeout = globalThis.setTimeout;
  private readonly realClearTimeout = globalThis.clearTimeout;
  private readonly realDateNow = globalThis.Date.now;

  enable(): void {
    globalThis.setTimeout = ((fn: () => void, ms?: number): NodeJS.Timeout => {
      const id = this.nextId++;
      this.pending.set(id, { at: this.now + (ms ?? 0), fn });
      return id as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout;
    globalThis.clearTimeout = ((id?: NodeJS.Timeout | undefined): void => {
      if (id !== undefined) this.pending.delete(id as unknown as number);
    }) as unknown as typeof clearTimeout;
    // Date.now follows the fake clock so elapsedMs values are deterministic.
    globalThis.Date.now = () => this.now;
  }

  restore(): void {
    globalThis.setTimeout = this.realSetTimeout;
    globalThis.clearTimeout = this.realClearTimeout;
    globalThis.Date.now = this.realDateNow;
    this.pending.clear();
  }

  /**
   * Advance the clock by ms, firing due timers in order. Between firings it yields to
   * the event loop so promise continuations (rejections, JSON parsing) run, the same
   * way real timers interleave with promise callbacks.
   */
  async tick(ms: number): Promise<void> {
    await this.drain(); // let continuations already queued schedule their timers first
    const target = this.now + ms;
    for (;;) {
      let earliest: { id: number; at: number; fn: () => void } | null = null;
      for (const [id, timer] of this.pending) {
        if (timer.at <= target && (earliest === null || timer.at < earliest.at)) {
          earliest = { id, at: timer.at, fn: timer.fn };
        }
      }
      if (!earliest) break;
      this.pending.delete(earliest.id);
      this.now = earliest.at;
      earliest.fn();
      await this.drain();
    }
    this.now = target;
    await this.drain();
  }

  /** Yield a few macrotask hops so queued microtasks and stream callbacks run. */
  private async drain(): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
  }
}

test('success: sends the secret header and returns the parsed body, exactly 1 call', async () => {
  const seen: { url: string; key: string | null }[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    seen.push({ url, key: new Headers(init?.headers).get('X-Ganj-Key') });
    return jsonResponse({ ok: true });
  };
  const warnLines = await captureWarn(async () => {
    const body = await workerGet<{ ok: boolean }>('/search?q=x', { config, fetchImpl });
    assert.deepEqual(body, { ok: true });
  });
  assert.equal(seen.length, 1, 'success on the first try makes exactly one call');
  assert.equal(seen[0].url, 'https://worker.example.test/search?q=x');
  assert.equal(seen[0].key, 'test-secret');
  assert.deepEqual(warnLines, [], 'a clean first attempt logs no [d1-retry] line');
});

test('timeout: an aborted request becomes reason=timeout', async () => {
  await assert.rejects(workerGet('/search', { config, fetchImpl: hangingFetch, timeoutMs: 20 }), (e: unknown) => {
    assert.ok(e instanceof WorkerError);
    assert.equal(reasonOf(e), 'timeout');
    return true;
  });
});

test('timeout then success: exactly 2 calls, 5000ms content timeout, retry after 150ms', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = (url, init) => {
        calls += 1;
        if (calls === 1) return hangingFetch(url, init);
        return Promise.resolve(jsonResponse({ ok: true }));
      };
      const pending = workerGet<{ ok: boolean }>('/poems/1/neighbors?poetId=2&categoryId=3', { config, fetchImpl });
      await clock.tick(CONTENT_TIMEOUT_MS - 1); // just before the timeout: nothing happened yet
      assert.equal(calls, 1);
      await clock.tick(1); // first attempt aborts at exactly 5000ms
      await clock.tick(RETRY_DELAY_MS - 1); // just before the retry delay: still 1 call
      assert.equal(calls, 1, 'no second call before the 150ms delay has elapsed');
      await clock.tick(1); // the retry fires at exactly the 150ms mark
      assert.equal(calls, 2, 'the single retry fires after the 150ms delay');
      assert.deepEqual(await pending, { ok: true });
    });
    assert.equal(calls, 2, 'exactly 2 calls: the original and the single retry');
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-poem-neighbors reason=timeout stage=connect elapsedMs=5000 attempt=2 outcome=ok',
    ]);
    assert.ok(!warnLines[0].includes('worker.example.test'), 'no URLs in the retry log line');
    assert.ok(!warnLines[0].includes('poetId='), 'no query strings in the retry log line');
    assert.ok(!warnLines[0].includes('test-secret'), 'no secrets in the retry log line');
  } finally {
    clock.restore();
  }
});

test('network failure then success: exactly 2 calls and one outcome=ok line', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = async () => {
        calls += 1;
        if (calls === 1) throw new TypeError('fetch failed');
        return jsonResponse({ ok: true });
      };
      const pending = workerGet<{ ok: boolean }>('/poems/1', { config, fetchImpl });
      await clock.tick(RETRY_DELAY_MS);
      assert.equal(calls, 2);
      assert.deepEqual(await pending, { ok: true });
    });
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-poem reason=network stage=connect elapsedMs=0 attempt=2 outcome=ok',
    ]);
  } finally {
    clock.restore();
  }
});

test('two timeouts: exactly 2 calls, then the same WorkerError shape as before (reason=timeout, no status)', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = (url, init) => {
        calls += 1;
        return hangingFetch(url, init);
      };
      const pending = workerGet('/poems/1', { config, fetchImpl });
      const rejection = assert.rejects(() => pending, (e: unknown) => {
        assert.ok(e instanceof WorkerError);
        assert.equal(e.name, 'WorkerError');
        assert.equal(reasonOf(e), 'timeout');
        assert.equal(e.status, undefined);
        assert.equal(e.message, 'Worker timed out after 5000ms');
        // The abort fires at exactly 5000ms of the (per-attempt) attempt.
        assert.equal(e.stage, 'connect');
        assert.equal(e.elapsedMs, CONTENT_TIMEOUT_MS);
        return true;
      });
      await clock.tick(CONTENT_TIMEOUT_MS); // first attempt aborts
      await clock.tick(RETRY_DELAY_MS); // retry delay, second attempt starts
      assert.equal(calls, 2, 'retry exactly once, never more');
      await clock.tick(CONTENT_TIMEOUT_MS); // second attempt aborts
      await rejection;
    });
    assert.equal(calls, 2, 'still exactly 2 calls after the final failure');
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-poem reason=timeout stage=connect elapsedMs=5000 attempt=2 outcome=failed',
    ]);
  } finally {
    clock.restore();
  }
});

test('network failure twice: throws WorkerError with reason=network after exactly 2 calls', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = async () => {
        calls += 1;
        throw new TypeError('fetch failed');
      };
      const pending = workerGet('/poets/2', { config, fetchImpl });
      const rejection = assert.rejects(() => pending, (e: unknown) => {
        assert.ok(e instanceof WorkerError);
        assert.equal(reasonOf(e), 'network');
        // A network failure happens while waiting for the fetch to resolve.
        assert.equal(e.stage, 'connect');
        assert.equal(e.elapsedMs, 0);
        return true;
      });
      await clock.tick(RETRY_DELAY_MS); // the retry delay is the only timer in this test
      await rejection;
    });
    assert.equal(calls, 2);
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-poet reason=network stage=connect elapsedMs=0 attempt=2 outcome=failed',
    ]);
  } finally {
    clock.restore();
  }
});

test('connect timeout vs body timeout: stage is connect before headers, body after', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  const stageOfCall: Array<'connect' | 'body'> = [];
  try {
    const fetchImpl: FetchLike = (url, init) => {
      calls += 1;
      if (calls === 1) {
        stageOfCall.push('connect');
        return hangingFetch(url, init);
      }
      stageOfCall.push('body');
      return hangingBodyFetch(url, init);
    };
    const pending = workerGet('/poems/1', { config, fetchImpl });
    const rejection = assert.rejects(() => pending, (e: unknown) => {
      assert.ok(e instanceof WorkerError);
      assert.equal(reasonOf(e), 'timeout');
      assert.equal(e.stage, 'body', 'the second attempt stalls while reading the body');
      assert.equal(e.elapsedMs, CONTENT_TIMEOUT_MS);
      assert.equal(e.status, 200, 'headers had arrived, so the status is known');
      return true;
    });
    await clock.tick(CONTENT_TIMEOUT_MS); // first attempt aborts in connect
    assert.equal(stageOfCall[0], 'connect');
    await clock.tick(RETRY_DELAY_MS); // retry fires
    await clock.tick(CONTENT_TIMEOUT_MS); // second attempt aborts mid-body
    await rejection;
  } finally {
    clock.restore();
  }
});

test('body-read timeout: the retry line reports the first attempt stage and elapsedMs', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = (url, init) => {
        calls += 1;
        return calls === 1 ? hangingBodyFetch(url, init) : Promise.resolve(jsonResponse({ ok: true }));
      };
      const pending = workerGet<{ ok: boolean }>('/poems/1', { config, fetchImpl });
      await clock.tick(CONTENT_TIMEOUT_MS); // headers arrived, body stalls, abort fires
      await clock.tick(RETRY_DELAY_MS); // retry succeeds
      assert.deepEqual(await pending, { ok: true });
    });
    assert.equal(calls, 2);
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-poem reason=timeout stage=body elapsedMs=5000 attempt=2 outcome=ok',
    ]);
  } finally {
    clock.restore();
  }
});

test('VERCEL_REGION is appended as a sanitized region field when set', async () => {
  const clock = new FakeClock();
  clock.enable();
  const previousRegion = process.env.VERCEL_REGION;
  process.env.VERCEL_REGION = 'iad1';
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = (url, init) => {
        calls += 1;
        return calls === 1 ? hangingFetch(url, init) : Promise.resolve(jsonResponse({ ok: true }));
      };
      const pending = workerGet<{ ok: boolean }>('/poems/1', { config, fetchImpl });
      await clock.tick(CONTENT_TIMEOUT_MS);
      await clock.tick(RETRY_DELAY_MS);
      assert.deepEqual(await pending, { ok: true });
    });
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-poem reason=timeout stage=connect elapsedMs=5000 attempt=2 outcome=ok region=iad1',
    ]);
  } finally {
    if (previousRegion === undefined) {
      delete process.env.VERCEL_REGION;
    } else {
      process.env.VERCEL_REGION = previousRegion;
    }
    clock.restore();
  }
});

test('status responses reach the headers stage and keep their existing classification', async () => {
  const fetchImpl: FetchLike = async () => jsonResponse({}, 503);
  await assert.rejects(workerGet('/poems/1', { config, fetchImpl }), (e: unknown) => {
    assert.ok(e instanceof WorkerError);
    assert.equal(reasonOf(e), 'http-5xx');
    assert.equal(e.stage, 'headers', 'a status error is seen after the headers arrived');
    assert.ok(typeof e.elapsedMs === 'number' && e.elapsedMs >= 0);
    return true;
  });
});

test('4xx and 5xx are never retried (exactly 1 call per status)', async () => {
  for (const status of [400, 401, 404, 500, 503]) {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls += 1;
      return jsonResponse({}, status);
    };
    await assert.rejects(workerGet('/poems/1', { config, fetchImpl }), (e: unknown) => e instanceof WorkerError);
    assert.equal(calls, 1, `a ${status} response is never retried`);
  }
});

test('invalid JSON on a completed 200 is never retried (exactly 1 call)', async () => {
  let calls = 0;
  const fetchImpl: FetchLike = async () => {
    calls += 1;
    return new Response('<html>', { status: 200 });
  };
  await assert.rejects(workerGet('/poems/1', { config, fetchImpl }), (e: unknown) => reasonOf(e) === 'bad-json');
  assert.equal(calls, 1);
});

test('search: both attempts use the short 3000ms timeout and the WorkerError still propagates to the fallback layer', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = (url, init) => {
        calls += 1;
        return hangingFetch(url, init);
      };
      const pending = workerGet('/search?q=x', { config, fetchImpl });
      const rejection = assert.rejects(() => pending, (e: unknown) => {
        assert.ok(e instanceof WorkerError);
        assert.equal(reasonOf(e), 'timeout');
        assert.equal(e.message, 'Worker timed out after 3000ms');
        return true;
      });
      await clock.tick(SEARCH_TIMEOUT_MS - 1); // just before: no abort yet, so the timeout is not 5000ms
      assert.equal(calls, 1);
      await clock.tick(1); // first attempt aborts at exactly 3000ms
      await clock.tick(RETRY_DELAY_MS);
      await clock.tick(SEARCH_TIMEOUT_MS); // second attempt aborts
      await rejection;
    });
    assert.equal(calls, 2);
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-search reason=timeout stage=connect elapsedMs=3000 attempt=2 outcome=failed',
    ]);
  } finally {
    clock.restore();
  }
});

test('search: success on the second attempt returns the body (fallback only on final failure)', async () => {
  const clock = new FakeClock();
  clock.enable();
  let calls = 0;
  try {
    const warnLines = await captureWarn(async () => {
      const fetchImpl: FetchLike = (url, init) => {
        calls += 1;
        if (calls === 1) return hangingFetch(url, init);
        return Promise.resolve(jsonResponse({ found: true }));
      };
      const pending = workerGet<{ found: boolean }>('/search?q=x', { config, fetchImpl });
      await clock.tick(SEARCH_TIMEOUT_MS);
      await clock.tick(RETRY_DELAY_MS);
      assert.deepEqual(await pending, { found: true });
    });
    assert.equal(calls, 2);
    assert.deepEqual(warnLines, [
      '[d1-retry] key=d1-search reason=timeout stage=connect elapsedMs=3000 attempt=2 outcome=ok',
    ]);
  } finally {
    clock.restore();
  }
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

test('cacheKeyLabel maps Worker paths to the unstable_cache key prefixes', () => {
  assert.equal(cacheKeyLabel('/poems/1/neighbors?poetId=2&categoryId=3'), 'd1-poem-neighbors');
  assert.equal(cacheKeyLabel('/categories/24/poems?poetId=2'), 'd1-category-poems');
  assert.equal(cacheKeyLabel('/poems/1'), 'd1-poem');
  assert.equal(cacheKeyLabel('/poems?ids=1,2,3'), 'd1-poems-by-ids');
  assert.equal(cacheKeyLabel('/poets'), 'd1-poets');
  assert.equal(cacheKeyLabel('/poets/2'), 'd1-poet');
  assert.equal(cacheKeyLabel('/migrated-poet-ids'), 'd1-migrated-poet-ids');
  assert.equal(cacheKeyLabel('/search?q=x'), 'd1-search');
  assert.equal(cacheKeyLabel('/categories/24/random-poem?poetId=2'), 'd1-random-poem');
  assert.equal(cacheKeyLabel('/brand-new-endpoint'), '/brand-new-endpoint');
});
