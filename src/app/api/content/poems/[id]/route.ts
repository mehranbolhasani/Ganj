/**
 * GET /api/content/poems/:id : one poem with full verses (web faal final fetch).
 * 400 on a non-positive-integer id, 404 when both backends and Ganjoor say the
 * poem does not exist.
 */

import { NextRequest } from 'next/server';
import { hybridApiServer } from '@/lib/hybrid-api-server';
import { contentRateLimitGuard, jsonWithCache, jsonError, parsePositiveInt } from '@/lib/content-routes';
import { GanjoorApiError } from '@/lib/ganjoor-api';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const limited = await contentRateLimitGuard(request);
  if (limited) return limited;

  const { id } = await ctx.params;
  const poemId = parsePositiveInt(id);
  if (poemId == null) {
    return jsonError({ error: 'invalid poem id' }, 400);
  }

  try {
    const poem = await hybridApiServer.getPoem(poemId);
    return jsonWithCache(poem, 'item');
  } catch (error) {
    if (error instanceof GanjoorApiError && error.status === 404) {
      return jsonError({ error: 'poem not found', id: poemId }, 404);
    }
    return jsonError({ error: 'content temporarily unavailable' }, 502);
  }
}
