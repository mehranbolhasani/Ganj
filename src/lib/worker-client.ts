/**
 * Minimal, dependency-free client for the ganj-d1-worker. No `server-only` import so it can
 * be unit-tested. Callers supply the config (base URL + shared secret) and, in tests, fetch.
 *
 * Every failure is a WorkerError with a short `reason` so callers can log
 * `[d1-fallback] ... reason=<reason>` and so tests can assert on it.
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

export class WorkerError extends Error {
  readonly reason: WorkerErrorReason;
  readonly status?: number;
  constructor(message: string, reason: WorkerErrorReason, status?: number) {
    super(message);
    this.name = 'WorkerError';
    this.reason = reason;
    this.status = status;
  }
}

export type WorkerConfig = { baseUrl?: string; secret?: string };
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export const WORKER_TIMEOUT_MS = 3000;

export function workerConfigFromEnv(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  return { baseUrl: env.D1_WORKER_URL, secret: env.D1_WORKER_SECRET };
}

export function isWorkerConfigured(config: WorkerConfig): boolean {
  return Boolean(config.baseUrl && config.secret);
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
  const timeoutMs = opts.timeoutMs ?? WORKER_TIMEOUT_MS;
  const base = (config.baseUrl as string).replace(/\/$/, '');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(base + path, {
      headers: { 'X-Ganj-Key': config.secret as string, accept: 'application/json' },
      signal: controller.signal,
      ...(opts.cache ? { cache: opts.cache } : {}),
    });
    if (res.status === 401) throw new WorkerError('Worker rejected the shared secret (401)', 'http-401', 401);
    if (res.status === 404) throw new WorkerError(`Worker: not found (${path.split('?')[0]})`, 'not-found', 404);
    if (res.status >= 500) throw new WorkerError(`Worker responded ${res.status}`, 'http-5xx', res.status);
    if (!res.ok) throw new WorkerError(`Worker responded ${res.status}`, 'http-other', res.status);
    try {
      return (await res.json()) as T;
    } catch {
      throw new WorkerError('Worker returned invalid JSON', 'bad-json', res.status);
    }
  } catch (error) {
    if (error instanceof WorkerError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new WorkerError(`Worker timed out after ${timeoutMs}ms`, 'timeout');
    }
    throw new WorkerError(
      `Worker request failed: ${error instanceof Error ? error.message : String(error)}`,
      'network'
    );
  } finally {
    clearTimeout(timer);
  }
}

/** The fallback reason for any thrown value (non-WorkerError errors are reported as 'error'). */
export function reasonOf(error: unknown): WorkerErrorReason {
  return error instanceof WorkerError ? error.reason : 'error';
}
