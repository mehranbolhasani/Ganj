/**
 * GET /api/content/poets/:id : one poet with its categories (faal uses poet 2).
 * 400 when the id is not a positive integer, 404 when unknown (matches the
 * direct-backend behavior the faal fallback relies on).
 */

import { NextRequest } from 'next/server';
import { hybridApiServer } from '@/lib/hybrid-api-server';
import { contentRateLimitGuard, jsonWithCache, jsonError, parsePositiveInt } from '@/lib/content-routes';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const limited = await contentRateLimitGuard(request);
  if (limited) return limited;

  const { id } = await ctx.params;
  const poetId = parsePositiveInt(id);
  if (poetId == null) {
    return jsonError({ error: 'invalid poet id' }, 400);
  }

  try {
    const poet = await hybridApiServer.getPoet(poetId);
    return jsonWithCache(poet, 'item');
  } catch {
    // A missing poet throws in both backends; the faal client then falls back
    // to the Ganjoor API itself, so the browser only needs a clean 404.
    return jsonError({ error: 'poet not found', id: poetId }, 404);
  }
}
