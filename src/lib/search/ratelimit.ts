/**
 * Per-IP abuse limit for /api/search, using the same @upstash/ratelimit + @upstash/redis
 * pattern as src/app/api/contact/route.ts and src/lib/telegram/bot.ts.
 *
 * Limit: 30 requests per 60 seconds per client IP (sliding window). Without Upstash env vars
 * the limiter is disabled. If Upstash errors, the request is allowed (fail open) and a
 * [search-ratelimit] warning is logged. Search must not go down because Redis does.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const SEARCH_RATE_LIMIT = { requests: 30, windowSeconds: 60 } as const;

export type RateLimitResult = { success: boolean; retryAfterSec: number };

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  limiter =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(SEARCH_RATE_LIMIT.requests, '1 m'),
          prefix: 'ganj:search',
          analytics: false,
        })
      : null;
  return limiter;
}

export async function checkSearchRateLimit(ip: string): Promise<RateLimitResult> {
  const rl = getLimiter();
  if (!rl) return { success: true, retryAfterSec: 0 };
  try {
    const { success, reset } = await rl.limit(ip);
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { success, retryAfterSec: success ? 0 : retryAfterSec };
  } catch (error) {
    console.warn(`[search-ratelimit] unavailable reason=${error instanceof Error ? error.name : 'error'}`);
    return { success: true, retryAfterSec: 0 };
  }
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). Falls back to a shared bucket. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
