/**
 * Server-only hybrid API: identical fallback logic to ./hybrid-api, but with
 * every Supabase fetcher wrapped in React cache() + the Next.js Data Cache
 * (unstable_cache). Same runtime contract — pages fall back to the Ganjoor
 * API exactly as before when Supabase misses or errors.
 *
 * Server pages and sitemap must import this instead of ./hybrid-api so their
 * data fetching is deduped per request and cached across requests.
 */

import 'server-only';
import { createHybridApi } from './hybrid-api';
import { supabaseApiCached } from './supabase-api-server';

export const hybridApiServer = createHybridApi(supabaseApiCached);
