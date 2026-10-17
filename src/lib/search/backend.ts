/**
 * Which backend serves /api/search. Separate from CONTENT_BACKEND on purpose: the content
 * pages and the search route can be switched independently. Anything other than `d1`
 * (including unset) keeps the legacy Supabase/Ganjoor search.
 */

export type SearchBackend = 'd1' | 'supabase';

export function searchBackendFromEnv(env: Partial<NodeJS.ProcessEnv> = process.env): SearchBackend {
  return env.SEARCH_BACKEND === 'd1' ? 'd1' : 'supabase';
}
