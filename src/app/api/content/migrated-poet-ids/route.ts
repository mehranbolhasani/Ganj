/**
 * GET /api/content/migrated-poet-ids : the id list the shared hybrid logic needs
 * to decide whether a poem/category can be served straight from the content
 * backend. The browser faal flow reaches this through createHybridApi, so it
 * must exist as a handler even though it is not one of the five content shapes.
 */

import { NextRequest } from 'next/server';
import { hybridApiServer } from '@/lib/hybrid-api-server';
import { contentRateLimitGuard, jsonWithCache, jsonError } from '@/lib/content-routes';

export async function GET(request: NextRequest) {
  const limited = await contentRateLimitGuard(request);
  if (limited) return limited;
  try {
    const ids = await hybridApiServer.getMigratedPoetIds();
    return jsonWithCache(ids, 'list');
  } catch {
    return jsonError({ error: 'content temporarily unavailable' }, 502);
  }
}
