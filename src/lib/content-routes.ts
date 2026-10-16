/**
 * Shared helpers for the same-origin /api/content/* route handlers.
 *
 * Every handler: validates input strictly, calls hybridApiServer (which honors
 * CONTENT_BACKEND, so Supabase stays the default data source), rate limits per IP
 * with the same Upstash pattern as /api/search (fail open without Upstash env vars),
 * and sets public Cache-Control headers so Vercel serves repeat requests from the
 * CDN. The D1 Worker secret stays server side: handlers only ever talk to
 * hybridApiServer.
 *
 * server-only: never import from a client component.
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { checkContentRateLimit } from './search/ratelimit';
import {
  CACHE_HEADERS,
  CACHE_NONE,
  type CachePreset,
} from './content-params';

export { CACHE_HEADERS, CACHE_NONE, MAX_HYDRATE_IDS, parsePoemIdsParam, parsePositiveInt } from './content-params';
export type { CachePreset } from './content-params';

/** JSON response with a Cache-Control preset attached. */
export function jsonWithCache(body: unknown, preset: CachePreset, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': CACHE_HEADERS[preset] } });
}

/** JSON error response that must never be cached. */
export function jsonError(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': CACHE_NONE } });
}

/**
 * Per-IP rate limit for content handlers. Fail open without Upstash env vars
 * (same contract as /api/search). Returns a 429 response, or null to continue.
 */
export async function contentRateLimitGuard(request: NextRequest): Promise<NextResponse | null> {
  const ip = clientIpOf(request);
  const result = await checkContentRateLimit(ip);
  if (result.success) return null;
  return jsonError(
    { error: 'Too many requests. Please wait a moment and try again.' },
    429
  );
}

/** Same client-IP rule as /api/search (x-forwarded-for first value). */
function clientIpOf(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
