/**
 * GET /api/content/poems?ids=1,2,3 : poem metadata for a list of ids, used by
 * bookmark hydration (the browser sends batches of at most 100 ids, the same
 * cap the D1 Worker enforces). Only existing rows are returned, in backend
 * order; callers preserve their own ordering. Missing ids are skipped silently
 * and logged once per response (bookmarks rows are never deleted here).
 */

import { NextRequest } from 'next/server';
import { hybridApiServer } from '@/lib/hybrid-api-server';
import { contentRateLimitGuard, jsonWithCache, jsonError, parsePoemIdsParam } from '@/lib/content-routes';

export async function GET(request: NextRequest) {
  const limited = await contentRateLimitGuard(request);
  if (limited) return limited;

  const ids = parsePoemIdsParam(request.nextUrl.searchParams.get('ids'));
  if (ids == null) {
    return jsonError({ error: 'ids is required, comma separated digits, at most 100' }, 400);
  }

  try {
    const poems = await hybridApiServer.getPoemsByIds(ids);
    return jsonWithCache(poems, 'list');
  } catch {
    return jsonError({ error: 'content temporarily unavailable' }, 502);
  }
}
