import { createClient } from '@supabase/supabase-js';
import { withCache } from './api-cache';

interface GanjoorCacheRow {
  key: string;
  data: unknown;
  fetched_at: string;
  ttl_ms: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const durableSupabase = typeof window === 'undefined' && supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

function nowMs(): number {
  return Date.now();
}

function isExpired(fetchedAtIso: string, ttlMs: number): boolean {
  const fetchedAtMs = new Date(fetchedAtIso).getTime();
  return nowMs() - fetchedAtMs > ttlMs;
}

async function readDurableCache<T>(key: string): Promise<{ data: T; isExpired: boolean } | null> {
  if (!durableSupabase) {
    return null;
  }

  try {
    const { data, error } = await durableSupabase
      .from('ganjoor_cache')
      .select('key, data, fetched_at, ttl_ms')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as GanjoorCacheRow;
    return {
      data: row.data as T,
      isExpired: isExpired(row.fetched_at, row.ttl_ms),
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to read durable cache:', error);
    }
    return null;
  }
}

async function writeDurableCache<T>(key: string, data: T, ttlMs: number): Promise<void> {
  if (!durableSupabase) {
    return;
  }

  try {
    const payload = {
      key,
      data,
      fetched_at: new Date(nowMs()).toISOString(),
      ttl_ms: ttlMs,
    };

    await durableSupabase
      .from('ganjoor_cache')
      .upsert(payload, { onConflict: 'key' });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to write durable cache:', error);
    }
  }
}

/**
 * Read-through cache with durable fallback.
 * Memory cache (withCache) is the first layer, Supabase table is second layer.
 */
export async function withDurableCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  return withCache(`durable:${key}`, async () => {
    const persisted = await readDurableCache<T>(key);

    // Fresh durable value can be returned immediately.
    if (persisted && !persisted.isExpired) {
      return persisted.data;
    }

    try {
      const fresh = await fetcher();
      await writeDurableCache(key, fresh, ttlMs);
      return fresh;
    } catch (error) {
      // During outages, serve stale durable data if we have it.
      if (persisted) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Serving stale durable cache for ${key}`);
        }
        return persisted.data;
      }
      throw error;
    }
  }, ttlMs);
}
