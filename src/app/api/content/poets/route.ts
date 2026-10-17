/**
 * GET /api/content/poets : the full poet list for the home page poet grid.
 * Data source follows CONTENT_BACKEND via hybridApiServer (Supabase by default,
 * D1 Worker when flagged), Ganjoor fallback unchanged. Per-IP rate limited and
 * CDN cached; the browser receives no backend credentials.
 */

import { NextRequest } from 'next/server';
import { hybridApiServer } from '@/lib/hybrid-api-server';
import { contentRateLimitGuard, jsonWithCache, jsonError } from '@/lib/content-routes';

export async function GET(request: NextRequest) {
  const limited = await contentRateLimitGuard(request);
  if (limited) return limited;
  try {
    const poets = await hybridApiServer.getPoets();
    return jsonWithCache(poets, 'list');
  } catch {
    return jsonError({ error: 'content temporarily unavailable' }, 502);
  }
}
