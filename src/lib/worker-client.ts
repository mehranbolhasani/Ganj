/**
 * Minimal, dependency-free client for the ganj-d1-worker. No `server-only` import so it can
 * be unit-tested. Callers supply the config (base URL + shared secret) and, in tests, fetch.
 *
 * Every failure is a WorkerError with a short `reason` so callers can log
 * `[d1-fallback] ... reason=<reason>` and so tests can assert on it.
 *
 * Retry policy (this client is GET-only, so every call is an idempotent read and a retry
 * can never mutate data; there is no POST path):
 * - a timeout or a network failure ("fetch failed") is retried exactly once, after ~150ms;
 * - a completed response that carries a status code (401, 404, other 4xx, 5xx) and a
 *   completed 200 with invalid JSON are never retried;
 * - per-attempt timeouts: content endpoints use CONTENT_TIMEOUT_MS (5000ms), the /search
 *   path keeps SEARCH_TIMEOUT_MS (3000ms) so the Supabase fallback is not delayed;
 * - worst case (both attempts time out) is about 10.2s for content and 6.2s for search,
 *   far below the platform function duration (no maxDuration is configured anywhere, so
 *   the Vercel default of 300s applies);
 * - each retry emits exactly one greppable line, with no secrets and no URLs or query
 *   strings:
 *   `[d1-retry] key=<cache key> reason=<timeout|network> stage=<connect|headers|body>
 *   elapsedMs=<ms> attempt=2 outcome=<ok|failed>[ region=<VERCEL_REGION>]`
 *
 * Every thrown WorkerError also carries the attempt's failure `stage` (`connect`,
 * `headers` or `body`) and `elapsedMs`, so the error objects Next prints for failed
 * revalidations are diagnosable without extra logging.
 */

export type WorkerErrorReason =
  | 'config'
  | 'timeout'
  | 'network'
  | 'http-401'
  | 'not-found'
  | 'http-5xx'
  | 'http-other'
  | 'bad-json'
  | 'error';

/**
 * How far a failed attempt got:
 * - `connect`: the fetch had not resolved (no response headers received);
 * - `headers`: response headers arrived, the body had not finished;
 * - `body`: the attempt failed or was aborted while reading the body.
 */
export type WorkerErrorStage = 'connect' | 'headers' | 'body';

export class WorkerError extends Error {
  readonly reason: WorkerErrorReason;
  readonly status?: number;
  readonly stage?: WorkerErrorStage;
  readonly elapsedMs?: number;
  constructor(
    message: string,
    reason: WorkerErrorReason,
    status?: number,
    details?: { stage?: WorkerErrorStage; elapsedMs?: number }
  ) {
    super(message);
    this.name = 'WorkerError';
    this.reason = reason;
    this.status = status;
    this.stage = details?.stage;
    this.elapsedMs = details?.elapsedMs;
  }
}

export type WorkerConfig = { baseUrl?: string; secret?: string };
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Per-attempt timeout for /search. Kept short so the Supabase fallback is not delayed. */
export const SEARCH_TIMEOUT_MS = 3000;

/** Per-attempt timeout for content endpoints (poems, poets, categories, chapters). */
export const CONTENT_TIMEOUT_MS = 5000;

/** Wait before the single retry of a timed-out or network-failed attempt. */
export const RETRY_DELAY_MS = 150;

export function workerConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  return { baseUrl: env.D1_WORKER_URL, secret: env.D1_WORKER_SECRET };
}

export function isWorkerConfigured(config: WorkerConfig): boolean {
  return Boolean(config.baseUrl && config.secret);
}

/** The search path keeps the short per-attempt timeout; every other path is content. */
function isSearchPath(path: string): boolean {
  return path.startsWith('/search');
}

/**
 * The unstable_cache key prefix (see d1-api-server.ts) for a Worker path, used only in
 * `[d1-retry]` log lines so production logs line up with the known cache keys. Uncached
 * paths get a stable label, and unknown paths fall back to the query-stripped path
 * (never a full URL, never a secret).
 */
export function cacheKeyLabel(path: string): string {
  const clean = path.split('?')[0];
  if (/^\/search/.test(clean)) return 'd1-search';
  if (/^\/poems\/[^/]+\/neighbors$/.test(clean)) return 'd1-poem-neighbors';
  if (/^\/categories\/[^/]+\/poems$/.test(clean)) return 'd1-category-poems';
  if (/^\/categories\/[^/]+\/random-poem$/.test(clean)) return 'd1-random-poem';
  if (/^\/chapters\/[^/]+$/.test(clean)) return 'd1-chapter';
  if (/^\/poems$/.test(clean)) return 'd1-poems-by-ids';
  if (/^\/poems\/[^/]+$/.test(clean)) return 'd1-poem';
  if (/^\/poets$/.test(clean)) return 'd1-poets';
  if (/^\/poets\/[^/]+$/.test(clean)) return 'd1-poet';
  if (/^\/migrated-poet-ids$/.test(clean)) return 'd1-migrated-poet-ids';
  return clean || 'd1-unknown';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `region=<VERCEL_REGION>` for the [d1-retry] line when the platform sets it.
 * Sanitized to alphanumerics and dashes so nothing unexpected can be injected.
 */
function regionLabel(): string {
  const region = process.env.VERCEL_REGION;
  if (!region) return '';
  return ` region=${region.replace(/[^A-Za-z0-9-]/g, '_')}`;
}

/** One fetch attempt with its own abort timer. Errors are classified exactly as before. */
async function attemptJson<T>(
  path: string,
  config: WorkerConfig,
  fetchImpl: FetchLike,
  timeoutMs: number,
  cache?: RequestCache
): Promise<T> {
  const base = (config.baseUrl as string).replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  const elapsed = () => Date.now() - startedAt;
  try {
    let res: Response;
    try {
      res = await fetchImpl(base + path, {
        headers: { 'X-Ganj-Key': config.secret as string, accept: 'application/json' },
        signal: controller.signal,
        ...(cache ? { cache } : {}),
      });
    } catch (error) {
      // The fetch itself never resolved: the failure is in the connect stage
      // (an AbortError here means the per-attempt timer fired before headers).
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WorkerError(`Worker timed out after ${timeoutMs}ms`, 'timeout', undefined, {
          stage: 'connect',
          elapsedMs: elapsed(),
        });
      }
      throw new WorkerError(
        `Worker request failed: ${error instanceof Error ? error.message : String(error)}`,
        'network',
        undefined,
        { stage: 'connect', elapsedMs: elapsed() }
      );
    }
    if (res.status === 401) {
      throw new WorkerError('Worker rejected the shared secret (401)', 'http-401', 401, {
        stage: 'headers',
        elapsedMs: elapsed(),
      });
    }
    if (res.status === 404) {
      throw new WorkerError(`Worker: not found (${path.split('?')[0]})`, 'not-found', 404, {
        stage: 'headers',
        elapsedMs: elapsed(),
      });
    }
    if (res.status >= 500) {
      throw new WorkerError(`Worker responded ${res.status}`, 'http-5xx', res.status, {
        stage: 'headers',
        elapsedMs: elapsed(),
      });
    }
    if (!res.ok) {
      throw new WorkerError(`Worker responded ${res.status}`, 'http-other', res.status, {
        stage: 'headers',
        elapsedMs: elapsed(),
      });
    }
    try {
      return (await res.json()) as T;
    } catch (error) {
      // Headers were received; the failure happened while reading the body
      // (a mid-body abort) or parsing the completed body.
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WorkerError(`Worker timed out after ${timeoutMs}ms`, 'timeout', res.status, {
          stage: 'body',
          elapsedMs: elapsed(),
        });
      }
      throw new WorkerError('Worker returned invalid JSON', 'bad-json', res.status, {
        stage: 'body',
        elapsedMs: elapsed(),
      });
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function workerGet<T>(
  path: string,
  opts: {
    config: WorkerConfig;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
    cache?: RequestCache;
  }
): Promise<T> {
  const { config } = opts;
  if (!isWorkerConfigured(config)) {
    throw new WorkerError('D1_WORKER_URL / D1_WORKER_SECRET not configured', 'config');
  }
  const fetchImpl = opts.fetchImpl ?? (fetch as FetchLike);
  const timeoutMs = opts.timeoutMs ?? (isSearchPath(path) ? SEARCH_TIMEOUT_MS : CONTENT_TIMEOUT_MS);

  try {
    return await attemptJson<T>(path, config, fetchImpl, timeoutMs, opts.cache);
  } catch (firstError) {
    // Exactly one retry, and only for a timeout or a network failure. Anything that
    // carries a status code (401, 404, 4xx, 5xx) or a completed-but-invalid JSON body
    // is surfaced as-is to the fallback layer.
    if (!(firstError instanceof WorkerError)) throw firstError;
    if (firstError.reason !== 'timeout' && firstError.reason !== 'network') throw firstError;
    const reason: WorkerErrorReason = firstError.reason;
    const key = cacheKeyLabel(path);
    // Stage and elapsed time belong to the first attempt: they explain what made
    // the retry happen. A second attempt that also fails propagates its own
    // WorkerError (with its own stage and elapsedMs) to the fallback layer.
    const stage = firstError.stage ?? 'connect';
    const elapsedMs = firstError.elapsedMs ?? -1;
    await delay(RETRY_DELAY_MS);
    try {
      const result = await attemptJson<T>(path, config, fetchImpl, timeoutMs, opts.cache);
      console.warn(
        `[d1-retry] key=${key} reason=${reason} stage=${stage} elapsedMs=${elapsedMs} attempt=2 outcome=ok${regionLabel()}`
      );
      return result;
    } catch (secondError) {
      console.warn(
        `[d1-retry] key=${key} reason=${reason} stage=${stage} elapsedMs=${elapsedMs} attempt=2 outcome=failed${regionLabel()}`
      );
      throw secondError;
    }
  }
}

/** The fallback reason for any thrown value (non-WorkerError errors are reported as 'error'). */
export function reasonOf(error: unknown): WorkerErrorReason {
  return error instanceof WorkerError ? error.reason : 'error';
}
