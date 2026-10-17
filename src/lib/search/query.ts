/**
 * Parses and validates the /api/search query string. Pure, so it is unit-tested directly.
 */

import { clampSearchQuery } from './normalize';

export type SearchType = 'all' | 'poets' | 'categories' | 'poems';

export const SEARCH_LIMITS = {
  defaultLimit: 20,
  maxLimit: 100,
  /** Deep offsets make FTS and LIMIT/OFFSET expensive. The UI's deepest paging stays well below. */
  maxOffset: 5000,
} as const;

const TYPES: readonly SearchType[] = ['all', 'poets', 'categories', 'poems'];

export type PoetIdParam = { kind: 'none' } | { kind: 'valid'; id: number } | { kind: 'invalid' };

export type ParsedSearch = {
  /** Clamped (<= 24 chars, <= 50 bytes) and trimmed. The Worker normalizes it again. */
  q: string;
  type: SearchType;
  limit: number;
  offset: number;
  count: boolean;
  poetIdParam: PoetIdParam;
};

export type ParseResult = { ok: true; value: ParsedSearch } | { ok: false; status: 400; error: string };

export function parseSearchParams(params: URLSearchParams): ParseResult {
  const rawQ = params.get('q');
  if (rawQ == null || rawQ.trim() === '') {
    return { ok: false, status: 400, error: 'Query is required' };
  }

  const type = (params.get('type') || 'all') as SearchType;
  if (!TYPES.includes(type)) {
    return { ok: false, status: 400, error: 'Invalid type' };
  }

  const limitN = parseInt(params.get('limit') || String(SEARCH_LIMITS.defaultLimit), 10);
  const limit = Number.isFinite(limitN)
    ? Math.min(Math.max(limitN, 1), SEARCH_LIMITS.maxLimit)
    : SEARCH_LIMITS.defaultLimit;

  const offsetN = parseInt(params.get('offset') || '0', 10);
  const offset = Number.isFinite(offsetN) ? Math.min(Math.max(offsetN, 0), SEARCH_LIMITS.maxOffset) : 0;

  // Mirrors the legacy route: an empty poetId means "no filter"; a non-numeric one skips poems.
  const poetIdRaw = params.get('poetId');
  let poetIdParam: PoetIdParam = { kind: 'none' };
  if (poetIdRaw) {
    const n = parseInt(poetIdRaw, 10);
    poetIdParam = Number.isNaN(n) ? { kind: 'invalid' } : { kind: 'valid', id: n };
  }

  return {
    ok: true,
    value: {
      q: clampSearchQuery(rawQ),
      type,
      limit,
      offset,
      count: params.get('count') === 'true',
      poetIdParam,
    },
  };
}
