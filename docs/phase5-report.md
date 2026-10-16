# Phase 5 report: content readers moved off the Supabase poems table

**Date:** 2026-10-16. Branches: `d1-backend` (Ganjeh), `phase5-endpoints` (ganj-d1-worker). Nothing pushed to main. No Supabase or D1 write happened at any point.

**Outcome:** every runtime content reader (poems, poets, categories) now goes through the selectable backend layer or the same-origin content handlers. Under `CONTENT_BACKEND=d1` plus `SEARCH_BACKEND=d1` no code path that renders content touches the Supabase `poems` table. The remaining Supabase reads are the default backends (used only while the flags are unset) and the documented fallbacks.

## Commits

| Repo / branch | Commit | What |
|---|---|---|
| Ganjeh `d1-backend` | `a6a3dc5` | Phase 5 audit (step 1) |
| Ganjeh `d1-backend` | `82d70bc` | `getPoemsByIds` on `HybridBackend` (Supabase chunked `.in()`, D1 batch endpoint); dead `hasPoem` + `getSupabaseStats` deleted |
| Ganjeh `d1-backend` | `bd1c278` | `/api/content/*` route handlers (6), shared helpers, generic rate limiter |
| Ganjeh `d1-backend` | `3f3272f` | browser client repointed to `/api/content/*` |
| Ganjeh `d1-backend` | `53cb64e` | bookmarks two-step hydration |
| Ganjeh `d1-backend` | `ccfd6d3` | Telegram + faal reads behind `CONTENT_BACKEND` |
| Ganjeh `d1-backend` | `8ba458f` | `docs/supabase-dependency-check.sql` + checklist section |
| worker `phase5-endpoints` | `f783d87` | `GET /poems?ids=`, `GET /categories/:id/random-poem`, tests |
| worker `phase5-endpoints` | `ff0d35b` | verification scripts (parity, distribution, deployed measurement) |

## New environment variables

**None.** `D1_WORKER_URL` and `D1_WORKER_SECRET` already exist and are reused everywhere; the Telegram webhook runs inside the Next server so it sees both; no `NEXT_PUBLIC_D1_*` variable was created, so the browser bundle still cannot see any Worker credential.

## What was built

### Worker (`ganj-d1-worker`, branch `phase5-endpoints`, not deployed)

- `GET /poems?ids=1,2,3`: at most 100 numeric ids per request (D1 100 bound-parameter limit), digits only, dedupe, first-occurrence order, 400 on any violation, only existing rows returned, lite shape `{ id, title, verses: [], poetId, poetName, categoryId?, categoryTitle }` (no poem text). Reuses `poemsByIdsOrdered`; no KV (per approved decision 4).
- `GET /categories/:id/random-poem?poetId=`: `COUNT(*)` then `LIMIT 1 OFFSET n` with explicit `ORDER BY id ASC` (never `ORDER BY RANDOM()`), full `verses` plus poet/category names, 404 on unknown or empty category, 400 on missing `poetId` or non-numeric category id. Distribution matches the old Supabase path in `faal-core.ts`.
- Shared-secret check (`X-Ganj-Key`) covers both endpoints; tests cover empty, non-numeric, negative, float, 101 ids, huge ids, unknown ids, duplicates and the 401 path.

### Ganjeh app (branch `d1-backend`)

- `HybridBackend.getPoemsByIds(ids)`: Supabase implementation (one chunked `.in()` query, 100 per statement, no `verses_array`) and D1 implementation (`/poems?ids=` in 100-id chunks); both wrapped in React `cache()` + `unstable_cache` (1 h, tags `poems`).
- Six route handlers under `/api/content/`: `poets`, `poets/:id`, `categories/:id/poems`, `poems/:id`, `poems?ids=`, `migrated-poet-ids` (the sixth is needed because the shared hybrid factory calls `listMigratedPoetIds` on every client `getCategoryPoems`; without it the browser would wrongly fall back to Ganjoor for migrated poets). Every handler: strict input validation (400), correct 404, 502 only when the backend and Ganjoor both fail, per-IP Upstash rate limit with the same fail-open contract as `/api/search` (new prefix `ganj:content`, search untouched), and public `Cache-Control` (items `s-maxage=86400, swr=604800`; lists `s-maxage=3600, swr=86400`; errors `no-store`). There is deliberately no random handler: the web faal draws client-side from the category list and the Telegram `/faal` draws server-side directly.
- Browser: the client `hybridApi` instance now uses `contentApiClient` (same-origin `/api/content/*` only). Approved decision 1 applied: repointing is unconditional, the data source still follows `CONTENT_BACKEND` server side. `getChapter` and `getPoemNeighbors` are loud server-only stubs (no browser caller exists today).
- Bookmarks (`getCloudBookmarks`): step 1 reads only `id, poem_id, created_at` from Supabase, step 2 hydrates in batches of at most 100 ids through `/api/content/poems`. Output order stays `created_at desc`; unknown poem ids are skipped silently with one log line per response; bookmark rows are never deleted.
- Telegram: `searchPoems` uses the existing Worker `/search?type=poems` (keyboard renders title + poetName only) and `getPoemById` uses `/poems/:id` (full verses, so `formatPoem` output is byte-identical); both keep the Supabase path as the fallback and log `[d1-fallback]` on Worker errors. `getRandomHafezGhazal` in `faal-core.ts` draws from the Worker behind the same flag.
- Dead code removed: `hasPoem`, `getSupabaseStats` (zero callers).

## Verification results

All numbers below come from `ganj-d1-worker build/phase5-verify.json` (script `scripts/24-phase5-verify.mjs`), run against the local emulated D1 (the phase 4b production snapshot) and the production Supabase tables over the REST API (read-only GETs).

### Tests

- Worker: `npm run test:unit` (18 tests, including 10 new validator/shape tests) and `npm run test:phase5` (18 local API checks for the new endpoints and bad input) all pass; the phase 4a suite (`npm test`) still passes.
- Ganjeh: `npm run test:unit` 64/64 pass (20 new: content params, client client, bookmark hydration, telegram mapping), `tsc --noEmit` clean, `npm run lint` clean (2 pre-existing warnings in `changelog/page.tsx`).

### Telegram search parity (Supabase top 5 vs Worker top 5)

185 queries: 45 golden vectors, 120 real poem titles from production, 20 long verse lines over 24 characters.

| Source | Queries | Avg top-5 overlap | Supabase empty | Worker empty | Supabase timeout |
|---|---|---|---|---|---|
| real titles | 120 | 0.923 | 0 | 0 | 0 |
| long verse lines (>24 chars) | 20 | 1.0 | 0 | 0 | 0 |
| golden (diacritic/letter variants) | 45 | 0.267 | 16 | 7 | 8 |

Interpretation: on realistic queries (titles, verse lines) the Worker matched or matched-with-overlap everywhere; every long verse line had full top-5 agreement. The lower golden-set overlap is the documented normalization difference: Supabase `ILIKE` is literal (dialect sensitive), the Worker normalizes (Arabic/Farsi yeh, kashida, diacritics), so for `ميرود`, `ایـ دوست`, `عـــشـــق` the Worker finds results where Supabase finds none (10 such cases). The single Worker-empty case is the pure-kashida query `ـــ`, where Supabase returns noise matches and the Worker returns nothing, which is the better answer for the bot. Every case where the Worker returned nothing or clearly worse is listed in `build/phase5-verify.json` (`zeroOverlapCases`).

Important side finding: **8 of 45 golden queries made the production Supabase search time out** (PostgREST 57014, `verses ILIKE` scan over 129k rows). The production bot and legacy web search inherit this risk today; the Worker answered all of them.

### Bookmarks / batch parity

250 real production poem ids: Supabase row fields (title, poet_id, category_id, poet name, category title) versus the Worker batch endpoint: **250/250 compared, 0 differences**.

### Faal distribution

2000 draws on `/categories/24/random-poem?poetId=2` (category 24, 495 ghazals in the loaded snapshot): 483 unique poems drawn (97.6 percent coverage; with 2000 draws over 495 uniform items the expected number of unseen poems is about 9), chi-square 497.1 with 482 degrees of freedom (ratio 1.03), consistent with uniform. The Supabase path used the same COUNT + OFFSET scheme, so the distribution is unchanged from production behavior.

### Latency and CPU

- Local emulation (no network hop): batch of 60 ids p50 2 ms / p95 5 ms; random-poem p50 2 ms / p95 2 ms.
- Deployed numbers: run `npm run measure:phase5` in the worker repo after the deploy (it reports p50/p95 and, with `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` set, per-invocation CPU time from the Workers analytics API). Local emulation cannot measure CPU time, so no CPU figure is claimed yet. For context, the phase 4b deployed measurements put D1 read statements in the low milliseconds.

### Vercel firewall / Bot Protection

Cannot be verified from the repo. On the preview, check: (a) `/api/content/*` calls from a real browser pass with 200 in the DevTools network tab (they are same-origin GETs with browser headers, the same shape as `/api/search` which already passes), (b) a bare `curl` to `/api/content/poets` from outside is either 200 or a 429/403 from your own rules, so any Block/Challenge rule you want to add for the content handlers is a deliberate choice, (c) the Upstash limiter counts only 30 req/min/IP per handler prefix and fails open without Upstash env vars.

## Confirmations

- Sitemap: reads through `hybridApiServer` only (`src/app/sitemap.ts:2`), so it follows the flag. Nothing else.
- Robots: statically prerendered, no data reads.
- `generateStaticParams`: does not exist anywhere in the app (unchanged, per the earlier phase constraint).
- OG image routes: none exist (metadata points at a static `/og-image.jpg`).
- RSS: no feed route exists.
- `listMigratedPoetIds` consumers: the hybrid factory (flagged path, both backends), the search handler deps (`d1ApiCached` under `SEARCH_BACKEND=d1`), and the new `/api/content/migrated-poet-ids` handler. The only unflagged Supabase read left in the app's search route is the legacy block, which runs solely when `SEARCH_BACKEND != d1` or as the logged fallback.
- Browser content reads: `PoetsGrid` and `FaalProviderWrapper` go through `/api/content/*`; `supabase-browser.ts` importers are now auth/profile/bookmarks-rows/user-operations only. A grep confirms no client module imports `d1-api`, `d1-api-server`, `worker-client` with credentials, or `supabase-api` content methods.

## Deploy order

1. **Worker first:** `cd ganj-d1-worker && npx wrangler deploy -c wrangler.phase4b.toml` (additive endpoints; nothing in the app calls them until a Preview has `CONTENT_BACKEND=d1` and the new code).
2. Verify the deployment: `npm run measure:phase5` (p50/p95, CPU) plus two `curl` smoke checks with the `X-Ganj-Key` header on `/poems?ids=1119` and `/categories/24/random-poem?poetId=2`.
3. **Ganjeh Preview:** deploy `d1-backend` with `CONTENT_BACKEND=d1` and `SEARCH_BACKEND=d1` (plus the existing `D1_WORKER_URL`/`D1_WORKER_SECRET`). No new variables. Smoke on the preview: home poet grid, a poem page with prev/next, `/faal` draw, search, signed-in bookmarks list, and (if you point a test bot at the preview webhook) `/faal` plus a search message.
4. **Production flip:** set `CONTENT_BACKEND=d1` and `SEARCH_BACKEND=d1` in production env, keep `SEARCH_FALLBACK_SUPABASE=true` for the first days, watch `[d1-fallback]` lines in Vercel logs.
5. Only after that: run `docs/supabase-dependency-check.sql`, resolve what it reports, then consider the drop step.

## What still reads poems/poets/categories from Supabase (the drop list)

Runtime, behind flags (safe to keep; these disappear or become dead when the flags flip and the fallbacks are removed):

1. `supabaseApi` as the default content backend (`CONTENT_BACKEND` unset or `supabase`): pages, sitemap, `/api/content/*` handlers.
2. Legacy search block in `src/app/api/search/route.ts` (`SEARCH_BACKEND != d1`, or fallback when enabled; also the non-migrated-poet delegate path).
3. `faal-core.ts` Supabase fallback (used when `CONTENT_BACKEND != d1` or after a Worker error).
4. `telegram/search.ts` Supabase fallback (same two conditions).

Not runtime (delete at drop time): the import/migration scripts in `scripts/` that read the content tables.

Not content (stay on Supabase forever, per the checklist): auth + proxy session refresh, `user_profiles`, `bookmarks` rows, `bot_analytics`, `contact_messages`, `ganjoor_cache`.
