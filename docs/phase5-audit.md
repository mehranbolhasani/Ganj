# Phase 5 audit: remaining readers of poems, poets and categories

**Status:** audit only, no code changes. Branch `d1-backend` in Ganjeh. Worker repo inspected read-only at commit `434ed81` (branch `preview-check`). Dated 2026-10-16.

**Goal restated:** after Phase 5, no runtime code path that reads poems, poets or categories may depend on the Supabase `poems` table. Auth, `user_profiles`, `bookmarks` rows, `bot_analytics`, `contact_messages`, `ganjoor_cache` stay on Supabase. Every new behavior sits behind `CONTENT_BACKEND` (Supabase remains the default until cutover).

**Method:** grepped the whole repo for `.from('poems')`, `.from('poets')`, `.from('categories')`, `rpc(`, every import of `supabase-api`, `supabase-browser`, `supabase-server`, every `createClient`/`createServerClient` call site, plus all `scripts/`. No cron jobs, no Vercel config (`vercel.json` absent), no Supabase Edge Functions exist. The two `/search`-adjacent Supabase reads (S1 to S5) were already migrated behind `SEARCH_BACKEND` in Phase 4d and are listed only as fallback context.

---

## 1. Remaining content readers (server side)

| # | File:lines | Function | Reads | How often | Runtime | Worker capability that replaces it |
|---|---|---|---|---|---|---|
| S6 | `src/lib/faal-core.ts:6-68` (`getRandomHafezGhazal`) | COUNT on `poems` by `category_id=24`, then `range(random, random)` with full `verses_array`, joined `poets(name)`, `categories(title)` | poems (+ poet/category names) | One Telegram `/faal` command (rate limited 20 msg/min/user). Server side inside the Next app. | server, service-role client (`src/lib/telegram/supabase-bot-client.ts`) | NEW endpoint `GET /categories/:id/random-poem?poetId=` returning one full-verse poem. Same COUNT + random-OFFSET semantics keeps the distribution identical. Category 24 (Hafez ghazals, ~495 poems) is below the 500-poem KV threshold, so it is a plain D1 read. |
| S7a | `src/lib/telegram/search.ts:4-62` (`searchPoems`) | `poems` by `title ILIKE %q% OR verses ILIKE %q%`, `order id desc`, limit 5; list only needs `id/title/poetName` for the inline keyboard | poems | One query per user text message (rate limited 20/min/user) | server, service-role client | EXISTING `GET /search?type=poems&limit=5` (Phase 4c/4d). The keyboard label uses `title` and `poetName`, both present in the Worker response; the excerpt-only `verses` field is unused by the bot list. |
| S7b | `src/lib/telegram/search.ts:64-111` (`getPoemById`) | one `poems` row by id with full `verses_array`, joined names | poems (full text) | One query per inline-keyboard selection | server, service-role client | EXISTING `GET /poems/:id` returns full verses. `formatPoem` (`src/lib/telegram/bot.ts:47-86`) uses `verses` verbatim, so output text stays identical as long as D1 `verses_json` matches Supabase `verses_array` (verified in phase 2/3 load checksums). |
| S8 | `src/lib/telegram/analytics.ts:33` | `bot_analytics` insert | not content | per bot event | server | Stays on Supabase (operational). Listed to make the boundary explicit. |
| S9 | `src/lib/supabase-api.ts:77-630` | the whole `supabaseApi` surface: `getPoets` (81), `getPoet` (110), `getCategoryPoems` (238), `getPoem` (323), `hasPoet` (382), `hasPoem` (403), `listMigratedPoetIds` (425), `getChapter` (464), `getPoemNeighbors` (552), `getSupabaseStats` (616), private `getDescendantCategoryIds` (47) | poets, categories, poems | Depends on the flag, see the three consumer paths below | server (via `supabase-api-server.ts`) and browser (via the client bundle) | Server path already replaces with `d1Api`/`d1ApiCached` under `CONTENT_BACKEND=d1` (`src/lib/hybrid-api-server.ts:22-32`). What remains is (a) the default path, (b) the client bundle (section 2), (c) the legacy search fallback (section 3). |

Notes on S9 members:

- `hasPoem` (403) and `getSupabaseStats` (616) have **no callers** anywhere in `src` (grep). They are dead code candidates to delete in step 2, which removes two read paths without any behavior change.
- `hasPoet` (382) is called only by the legacy search route (`src/app/api/search/route.ts:146`).
- `getDescendantCategoryIds` is only used by `getChapter`.

## 2. Browser-side readers (direct to Supabase today)

The browser bundle builds its own hybrid instance at `src/lib/hybrid-api.ts:298` (`createHybridApi(supabaseApi)`), so these components issue **direct Supabase REST calls with the anon key** (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`, inlined into the client bundle by design).

| # | File:line | Call | Reads | How often | Replacement |
|---|---|---|---|---|---|
| B1 | `src/lib/hybrid-api.ts:298` | the client `hybridApi` itself | poets, categories, poems | the two consumers below | repoint the client instance at same-origin Next.js route handlers that call `hybridApiServer` (which honors `CONTENT_BACKEND`) |
| B2 | `src/components/PoetsGrid.tsx:82` | `getPoets()` | poets | once per `/` visit (home is statically prerendered; localStorage caches the list 24 h, so one call per visitor per day). Bots that do not execute JS never call it. | NEW route handler `GET /api/content/poets` |
| B3 | `src/components/FaalProviderWrapper.tsx:116,139,150` | `getPoet(2)`, `getCategoryPoems(2, ghazaliat)`, `getPoem(id)` | poets, categories, poems (full verses for the drawn ghazal) | per faal draw on `/faal` (static page, data fetched on user action only). The 24 h localStorage cache usually removes the `getPoet` call; a draw is then 2 calls. | NEW route handlers `GET /api/content/poets/:id`, `GET /api/content/categories/:id/poems`, `GET /api/content/poems/:id` |

Other client files that import `supabase-browser.ts` (`src/app/auth/page.tsx`, `src/app/profile/page.tsx`, `src/components/AuthAvatar.tsx`, `src/hooks/useAuth.ts`, `src/lib/user-profile-api.ts`) touch auth and `user_profiles` only. They stay on Supabase and are out of scope. `BookmarksWidget.tsx` and `BookmarkButton.tsx` use localStorage plus the `bookmarks` table writes in `cloud-bookmarks-api.ts` (write/is-check/is-bulk-import), also operational and staying.

Search components (`GlobalSearch.tsx`, `PoetSearch.tsx`, `SearchResults.tsx`) already go through the same-origin route handler `/api/search` (`src/lib/supabase-search.ts:44`); no direct Supabase content read happens there. No work needed.

## 3. Already-gated search readers (context, no new work in Phase 5)

`legacySearchGET` in `src/app/api/search/route.ts:18-357` reads poets (66-90), categories (92-132), `hasPoet` (146) and poems (135-345) directly with the service-role key. Under `SEARCH_BACKEND=d1` it only runs as the logged fallback (`[d1-fallback] scope=search`, disable with `SEARCH_FALLBACK_SUPABASE=false`). These stay exactly as they are in Phase 5; they matter for the final drop decision only: once `SEARCH_BACKEND=d1` is accepted in production and the fallback is switched off, the legacy block can be deleted.

## 4. Cross-boundary join: bookmarks hydration

| # | File:lines | What happens | How often | Runtime |
|---|---|---|---|---|
| X1 | `src/lib/cloud-bookmarks-api.ts:39-64` (`getCloudBookmarks`) | one Supabase query on `bookmarks` that **embeds** `poems (id, title, poet_id, category_id, poets(id,name), categories(id,title))`, ordered `created_at desc`, no pagination (the full list is fetched every time) | on every `/bookmarks` load for signed-in users, after bulk import, and after "skip import" (`src/app/bookmarks/page.tsx:46-52,72-74,87-89`) | browser (`createSupabaseBrowserClient`) |

This breaks the moment the `poems` table leaves Supabase: the embedded rows would silently become empty. Replacement (checklist section 3 step 3, option (a)): keep the two Supabase columns (`id`, `poem_id`, `created_at`) in the bookmarks query, then hydrate poem metadata (title, poetId, poetName, categoryId, categoryTitle) from the Worker by a list of ids through a same-origin route handler. Ordering (`created_at desc`) is applied by the app after hydration. Bookmark rows that point at poems the Worker no longer knows must be skipped (or shown as untitled, decision in step 2), never crash the list.

## 5. Offline scripts (not runtime, listed for the drop decision)

These read (and mostly write) the Supabase content tables as one-off ops tools: `scripts/import-famous-poets-with-verses.ts`, `scripts/import-remaining-poets.ts`, `scripts/import-remaining-poets-fast.ts`, `scripts/migrate-all-poets.ts`, `scripts/fix-missing-verses.ts`, `scripts/audit-supabase-data.ts`, `scripts/test-security-policies.ts`. They never run in production traffic. After cutover they are obsolete (the D1 loader in `ganj-d1-worker/scripts` replaces them) and should be deleted or archived rather than migrated.

## 6. Browser keys and the secret boundary

- Content reads that reach Supabase from the browser today: B2 (poets), B3 (poets/categories/poems), X1 (bookmarks join with poems). All use the anon key, which is public by design.
- `D1_WORKER_URL` and `D1_WORKER_SECRET` are plain (non-NEXT_PUBLIC) env vars. They are read only at call time in `src/lib/worker-client.ts:36-38`; `src/lib/d1-api.ts` is marked `server-only`. Next.js does not inline non-public env vars into the client bundle, so the browser cannot see the secret, and the current browser bundle never calls the Worker. Verified: no `NEXT_PUBLIC_D1_*` variable exists anywhere (`.env.local` inspected by name only).
- To keep the boundary while moving B1-B3 and X1, these new same-origin route handlers are needed (all server side, all carrying the secret via `hybridApiServer`/`d1ApiCached`):

| Route handler | Serves | Backend behavior |
|---|---|---|
| `GET /api/content/poets` | B2 home poet list | `hybridApiServer.getPoets()` (honors `CONTENT_BACKEND`, Ganjoor fallback unchanged) |
| `GET /api/content/poets/:id` | B3 faal step 1 | `hybridApiServer.getPoet(id)` |
| `GET /api/content/categories/:id/poems?poetId=` | B3 faal step 2 | `hybridApiServer.getCategoryPoems()` |
| `GET /api/content/poems/:id` | B3 faal step 3, Telegram-style single fetch if ever needed in browser | `hybridApiServer.getPoem(id)` |
| `GET /api/content/poems?ids=1,2,...` | X1 bookmark hydration | NEW backend method `getPoemsByIds(ids)` on `HybridBackend` (D1 Worker endpoint added in step 2a; Supabase implementation via one `.in()` query) |

Decision needed in step 2: whether the client instance is repointed at `/api/content/*` unconditionally (checklist recommendation: removes browser anon-key content reads immediately; the data source still follows `CONTENT_BACKEND`, so Supabase stays the content source by default and only the transport changes), or gated by an extra public flag so the browser keeps its direct Supabase path until cutover. The audit recommends unconditional repointing: it is simpler, keeps one client code path, and the flag still controls the actual content source.

## 7. Where the Telegram bot runs and which env vars it sees

The bot runs inside the Next.js server (`src/app/api/telegram/webhook/route.ts` on Vercel). `D1_WORKER_URL` and `D1_WORKER_SECRET` are already part of the Vercel environment (used by content pages under the flag), so `telegram/search.ts` and `faal-core.ts` can read them the same way. No new Vercel env vars are required for Phase 5. The bot keeps its Supabase service-role client for `bot_analytics` inserts (S8, stays) and Upstash for rate limiting.

## 8. New Worker capabilities required (summary for step 2a)

Existing Worker endpoints already cover everything except two shapes:

1. `GET /poems?ids=1,2,3` (batch poems by id list). Needed by X1. Requirements from the existing codebase conventions: shared-secret header, hard cap of 100 ids per request (D1's 100 bound-parameter limit, reuse `chunk`/`chunkSize` from `src/lib/content.js`), return only rows that exist, omit `verses` (callers only need title/poet/category names), small statements, KV not needed. Input validation: numeric, dedupe, cap, 400 on violation. Bad-input tests like the Phase 4a suite.
2. `GET /categories/:id/random-poem?poetId=` (one random poem with full verses). Needed by S6. Implement with COUNT + random OFFSET (`LIMIT 1 OFFSET n`), the same distribution as today, not `ORDER BY RANDOM()` (full scan on a ~10k row table would risk the Workers Free CPU limit; the COUNT+OFFSET plan touches an index range only).

Nothing else: B2/B3 shapes map one-to-one onto existing endpoints.

## 9. Frequency and volume estimate (for the cutover decision)

| Reader | Estimated daily volume in production | Comment |
|---|---|---|
| B2 PoetsGrid | low (a few per day, once per visitor, 24 h localStorage cache) | only JS-running browsers |
| B3 faal | low (per draw) | 3 calls per draw worst case, usually 2 |
| X1 bookmarks | very low (per signed-in visit) | unbounded list size per user today |
| S6/S7 Telegram | low (rate limited 20/min/user) | faal 2 queries, search 1 + 1 per selection |
| Legacy search route | this is where bot volume concentrates, already switchable via `SEARCH_BACKEND` | unchanged in Phase 5 |

## 10. Open items to resolve in step 2 (needs your approval)

1. Unconditional repoint of the client instance to `/api/content/*` (section 6 recommendation) vs a public flag. Recommendation: unconditional.
2. Missing-id handling in X1 hydration: skip silently vs render a placeholder. Recommendation: skip silently, log once per response.
3. `hasPoem` and `getSupabaseStats` deletion (dead code). Recommendation: delete both in the same step as the new backend method.
4. Whether the new Worker endpoints also need a KV precomputed path (none identified: the batch endpoint is bounded by 100 ids and the random endpoint is a single indexed read).
