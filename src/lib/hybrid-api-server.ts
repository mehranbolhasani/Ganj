/**
 * Server-only hybrid API: identical fallback logic to ./hybrid-api, but with a selectable
 * content backend.
 *
 *   CONTENT_BACKEND=supabase (default) -> Data-Cache-wrapped Supabase fetchers
 *   CONTENT_BACKEND=d1                 -> Data-Cache-wrapped D1 Worker fetchers
 *
 * Either way the fetchers are wrapped in React cache() + the Next.js Data Cache
 * (unstable_cache), and pages fall back to the Ganjoor API exactly as before when the
 * backend misses or errors.
 *
 * Production behaviour is unchanged while CONTENT_BACKEND is unset or `supabase`.
 */

import 'server-only';
import { createHybridApi } from './hybrid-api';
import { supabaseApiCached } from './supabase-api-server';
import { d1ApiCached } from './d1-api-server';
import { isD1Available } from './d1-api';
import { isSupabaseAvailable } from './supabase-api';

const useD1 = process.env.CONTENT_BACKEND === 'd1' && isD1Available();

export const contentBackendName: 'd1' | 'supabase' = useD1 ? 'd1' : 'supabase';

export const hybridApiServer = createHybridApi(
  useD1 ? d1ApiCached : supabaseApiCached,
  // the injected backend is tried first when it is usable; Supabase still counts as
  // usable when it is configured (auth/user tables keep it around during a cutover)
  () => useD1 || isSupabaseAvailable()
);
