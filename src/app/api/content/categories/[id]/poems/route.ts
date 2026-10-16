/**
 * GET /api/content/categories/:id/poems?poetId= : the poem list of one category
 * (the web faal reads Hafez's ghazaliat this way and picks a random poem client-side,
 * so an empty array is a valid 200 response for container categories).
 */

import { NextRequest } from 'next/server';
import { hybridApiServer } from '@/lib/hybrid-api-server';
import { contentRateLimitGuard, jsonWithCache, jsonError, parsePositiveInt } from '@/lib/content-routes';
import { GanjoorApiError } from '@/lib/ganjoor-api';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const limited = await contentRateLimitGuard(request);
  if (limited) return limited;

  const { id } = await ctx.params;
  const categoryId = parsePositiveInt(id);
  const poetIdRaw = request.nextUrl.searchParams.get('poetId');
  const poetId = parsePositiveInt(poetIdRaw);
  if (categoryId == null) {
    return jsonError({ error: 'invalid category id' }, 400);
  }
  if (poetId == null) {
    return jsonError({ error: 'poetId is required and must be a positive integer' }, 400);
  }

  try {
    const poems = await hybridApiServer.getCategoryPoems(poetId, categoryId);
    return jsonWithCache(poems, 'list');
  } catch (error) {
    if (error instanceof GanjoorApiError && error.status === 404) {
      return jsonError({ error: 'category not found', id: categoryId }, 404);
    }
    return jsonError({ error: 'content temporarily unavailable' }, 502);
  }
}
