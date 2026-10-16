/**
 * Pure validation and cache-header helpers for the /api/content/* route handlers.
 * Kept free of server-only imports so they are unit-testable with node --test and
 * reusable without pulling the Next.js route context.
 */

/** Hard cap shared with the D1 Worker: at most 100 poem ids per request. */
export const MAX_HYDRATE_IDS = 100;

/**
 * Cache-Control presets. Poets and categories move rarely (long s-maxage + SWR);
 * hydration responses are list-shaped (1 h fresh, long SWR window). There is no
 * random-content route handler in the app: the web faal picks its random poem
 * client-side from the category list, and the Telegram /faal command calls the
 * Worker directly from the server, so no CDN cache can pin a random draw.
 */
export const CACHE_HEADERS = {
  /** Single poem / poet items: content effectively never changes. */
  item: 'public, s-maxage=86400, stale-while-revalidate=604800',
  /** Poet and category lists (poets full list, category poems, migrated ids, hydration). */
  list: 'public, s-maxage=3600, stale-while-revalidate=86400',
} as const;

/** Never cache errors: a fallback must not be pinned into the CDN. */
export const CACHE_NONE = 'no-store';

export type CachePreset = keyof typeof CACHE_HEADERS;

/** Positive 53-bit-safe integer; returns null on anything else. */
export function parsePositiveInt(raw: string | null): number | null {
  if (raw == null || raw === '') return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

/**
 * Parse the `ids` query parameter of GET /api/content/poems. Returns null on any
 * violation (caller answers 400). Enforces the 100-id cap so a request can never
 * exceed what the D1 Worker accepts in one statement; duplicates are removed.
 */
export function parsePoemIdsParam(raw: string | null): number[] | null {
  if (raw == null || raw === '') return null;
  const parts = raw.split(',');
  if (parts.length === 0 || parts.length > MAX_HYDRATE_IDS) return null;
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const part of parts) {
    const id = parsePositiveInt(part.trim());
    if (id == null) return null;
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids.length > 0 ? ids : null;
}
