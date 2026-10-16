/**
 * /api/search logic when CONTENT_BACKEND=d1. Dependencies are injected so the route stays a
 * thin wiring layer and the behaviour is unit-tested with a mocked Worker.
 *
 * Response contract: identical to the legacy Supabase route (keys and types). Only the
 * `Cache-Control` and `X-Search-Source` headers are new.
 */

import { reasonOf } from '../worker-client';
import { formatFallbackLine } from '../fallback-log';
import { normalizePersian } from './normalize';
import { parseSearchParams, type ParsedSearch } from './query';

export const CACHE_SUCCESS = 'public, s-maxage=3600, stale-while-revalidate=3600';
export const CACHE_NONE = 'no-store';

export type PoetRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  birth_year: number | null;
  death_year: number | null;
};

export type CategoryRow = { id: number; title: string; poetId: number; poetName: string; poemCount: number };

export type PoemRow = {
  id: number;
  title: string;
  verses: string[];
  poetId: number;
  poetName: string;
  categoryId?: number;
  categoryTitle?: string;
};

/** What the Worker's /search returns (only the keys for the requested types are present). */
export type WorkerSearchRaw = {
  categories?: CategoryRow[];
  poems?: PoemRow[];
  totalCategories?: number;
  totalPoems?: number;
};

export type WorkerSearchParams = {
  q: string;
  type: 'all' | 'categories' | 'poems';
  limit: number;
  offset: number;
  count: boolean;
  poetId?: number;
};

/** Mapped poet shape from the Worker's /poets (birthYear, not birth_year). */
export type CachedPoet = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  birthYear?: number;
  deathYear?: number;
};

export type SearchDeps = {
  workerSearch(params: WorkerSearchParams): Promise<WorkerSearchRaw>;
  getPoets(): Promise<CachedPoet[]>;
  isMigratedPoet(id: number): Promise<boolean>;
  /** The existing Supabase/Ganjoor route, unchanged. Used for fallback and non-migrated poets. */
  legacySearch(): Promise<Response>;
  rateLimit(ip: string): Promise<{ success: boolean; retryAfterSec: number }>;
  fallbackEnabled: boolean;
  log(line: string): void;
};

type Results = {
  poets?: PoetRow[];
  totalPoets?: number;
  categories?: CategoryRow[];
  totalCategories?: number;
  poems?: PoemRow[];
  totalPoems?: number;
};

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'Cache-Control': CACHE_NONE, ...headers },
  });
}

function withHeaders(res: Response, extra: Record<string, string>): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** Poet search runs against the cached poets list, with the shared normalization. Order: id ASC. */
export function filterPoets(
  poets: CachedPoet[],
  q: string,
  limit: number,
  offset: number
): { rows: PoetRow[]; total: number } {
  const nq = normalizePersian(q);
  const matches = poets
    .filter((p) => normalizePersian(p.name).includes(nq) || normalizePersian(p.description ?? '').includes(nq))
    .sort((a, b) => a.id - b.id);
  const rows: PoetRow[] = matches.slice(offset, offset + limit).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug ?? '',
    description: p.description ?? null,
    birth_year: p.birthYear ?? null,
    death_year: p.deathYear ?? null,
  }));
  return { rows, total: matches.length };
}

async function searchD1(p: ParsedSearch, deps: SearchDeps): Promise<Results | 'delegate'> {
  const wantPoets = p.type === 'all' || p.type === 'poets';
  const wantCategories = p.type === 'all' || p.type === 'categories';
  const wantPoems = p.type === 'all' || p.type === 'poems';

  // Poems: a numeric poetId that is not migrated keeps the existing (Ganjoor) path, unchanged.
  let poemsMode: 'worker' | 'skip' | 'none' = 'none';
  let poetId: number | undefined;
  if (wantPoems) {
    if (p.poetIdParam.kind === 'invalid') {
      poemsMode = 'skip'; // legacy: poems key omitted for a non-numeric poetId
    } else if (p.poetIdParam.kind === 'valid') {
      poetId = p.poetIdParam.id;
      if (!(await deps.isMigratedPoet(poetId))) return 'delegate';
      poemsMode = 'worker';
    } else {
      poemsMode = 'worker';
    }
  }

  const needWorkerCategories = wantCategories;
  const needWorkerPoems = poemsMode === 'worker';
  let raw: WorkerSearchRaw = {};
  if (needWorkerCategories || needWorkerPoems) {
    const type = needWorkerCategories && needWorkerPoems ? 'all' : needWorkerCategories ? 'categories' : 'poems';
    raw = await deps.workerSearch({
      q: p.q,
      type,
      limit: p.limit,
      offset: p.offset,
      count: p.count,
      poetId: needWorkerPoems ? poetId : undefined,
    });
  }

  // Key order mirrors the legacy route: poets, totalPoets, categories, totalCategories, poems, totalPoems.
  const out: Results = {};
  if (wantPoets) {
    const { rows, total } = filterPoets(await deps.getPoets(), p.q, p.limit, p.offset);
    out.poets = rows;
    if (p.count) out.totalPoets = total;
  }
  if (wantCategories) {
    out.categories = raw.categories ?? [];
    if (p.count) out.totalCategories = raw.totalCategories ?? 0;
  }
  if (poemsMode === 'worker') {
    out.poems = raw.poems ?? [];
    if (p.count) out.totalPoems = raw.totalPoems ?? 0;
  }
  return out;
}

export async function handleSearch(params: URLSearchParams, ip: string, deps: SearchDeps): Promise<Response> {
  const parsed = parseSearchParams(params);
  if (!parsed.ok) return json({ error: parsed.error }, parsed.status);

  const limit = await deps.rateLimit(ip);
  if (!limit.success) {
    return json(
      { error: 'Too many search requests. Please wait a moment and try again.' },
      429,
      { 'Retry-After': String(limit.retryAfterSec) }
    );
  }

  const p = parsed.value;
  if (p.q.length < 2) {
    // Same 200 + message as the legacy route (the UI never sends this; it guards locally).
    return json({ poets: [], categories: [], poems: [], message: 'Query too short' }, 200);
  }

  try {
    const results = await searchD1(p, deps);
    if (results === 'delegate') {
      return withHeaders(await deps.legacySearch(), { 'Cache-Control': CACHE_NONE, 'X-Search-Source': 'legacy' });
    }
    return json(results, 200, { 'Cache-Control': CACHE_SUCCESS, 'X-Search-Source': 'd1' });
  } catch (error) {
    const reason = reasonOf(error);
    if (!deps.fallbackEnabled) {
      deps.log(formatFallbackLine('search', reason, { action: 'unavailable' }));
      return json({ error: 'Search is temporarily unavailable. Please try again.' }, 503);
    }
    deps.log(formatFallbackLine('search', reason, { action: 'supabase' }));
    try {
      return withHeaders(await deps.legacySearch(), { 'Cache-Control': CACHE_NONE, 'X-Search-Source': 'supabase-fallback' });
    } catch {
      return json({ error: 'Search is temporarily unavailable. Please try again.' }, 503);
    }
  }
}

