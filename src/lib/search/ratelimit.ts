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

const limiters = new Map<string, Ratelimit | null>();

function getLimiter(prefix: string, requests: number): Ratelimit | null {
  const cacheKey = `${prefix}:${requests}`;
  let limiter = limiters.get(cacheKey);
  if (limiter === undefined) {
    limiter =
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(requests, '1 m'),
            prefix,
            analytics: false,
          })
        : null;
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Sliding-window limiter shared by /api/search (prefix ganj:search) and /api/content/*
 * (prefix ganj:content). Without Upstash env vars the limiter is disabled. If Upstash
 * errors, the request is allowed (fail open) and a `[<tag>-ratelimit]` warning is logged.
 */
export async function checkRateLimit(
  ip: string,
  opts: { prefix: string; requests?: number; logTag?: string } = { prefix: 'ganj:search' }
): Promise<RateLimitResult> {
  const requests = opts.requests ?? SEARCH_RATE_LIMIT.requests;
  const logTag = opts.logTag ?? 'search';
  const rl = getLimiter(opts.prefix, requests);
  if (!rl) return { success: true, retryAfterSec: 0 };
  try {
    const { success, reset } = await rl.limit(ip);
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { success, retryAfterSec: success ? 0 : retryAfterSec };
  } catch (error) {
    console.warn(`[${logTag}-ratelimit] unavailable reason=${error instanceof Error ? error.name : 'error'}`);
    return { success: true, retryAfterSec: 0 };
  }
}

export async function checkSearchRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, { prefix: 'ganj:search', requests: SEARCH_RATE_LIMIT.requests, logTag: 'search' });
}

export async function checkContentRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, { prefix: 'ganj:content', logTag: 'content' });
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). Falls back to a shared bucket. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
