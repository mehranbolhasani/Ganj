# Caching & Supabase Load Audit — Ganj (Next.js 16 + Supabase on Vercel)

**Date:** 2026-10-14 · **Phase 1, read-only.** No project files were modified except this report. No build was run and no production database was contacted.

**Scope note / method:** Everything below is based on source reading plus one local build artifact read (`/​.next/prerender-manifest.json`, built Jun 2026, may be stale — I did **not** run `next build`). Deployed behavior should be confirmed in the Vercel dashboard (see Open questions). Whether a route was prerendered was verified against `.next/prerender-manifest.json` (routes list + `dynamicRoutes`, which is **empty**, i.e. no incremental fallbacks were registered by the local last build).

---

## Summary — top 5 causes ranked by estimated impact on Supabase request count

1. **Poem pages (`/poem/[id]`) have no `generateStaticParams`; 0 of ~129,500 are pre-generated.** Every first hit on every poem URL (dedup window: true ISR cache, revalidate 86400 — `src/app/poem/[id]/page.tsx:14`) triggers an on-demand render of **~6–8 Supabase REST calls** (`hasPoem` + `getPoem` in metadata, `getPoet` ×3, `getCategoryPoems` + migrated-set query). With bots crawling a 129.5k-URL space this is almost certainly the dominant request-count driver. (The stale local manifest shows `dynamicRoutes: {}`, so on the last build no poem URL was pre-rendered at all.)
2. **Whole-category downloads for prev/next navigation.** The poem page fetches *all poems of the poem's category with full `verses_array` text* (select at `src/lib/supabase-api.ts:245–262`) to compute two navigation links. For a big category (e.g. Hafez ghazals, ~500 poems) that is hundreds of KB of text per uncached render — this is the most likely dominant driver of the **14 GB/month egress**, and it happens once per poem-page (re)generation. Chapter pages do the same (`supabase-api.ts:486–503`).
3. **Category and chapter list pages read `searchParams` (`?page=`), which makes them dynamically rendered per request** (`category/page.tsx:27–31`, `chapter/page.tsx:27–32`). The `export const revalidate = 3600` on those pages can't give them static ISR HTML for query-string URLs; each bot hit is a fresh render with ~5–9 Supabase calls, including another full `verses_array` download that only exists to paginate client-side in `PoemPagination`.
4. **Redundant existence checks and duplicated page/metadata data fetching.** `hasPoem`/`hasPoet` are not cached at all (always 1 extra query each: `supabase-api.ts:386–417`), `hybridApi.getPoet` does hasPoet → poet → categories sequentially, and `generateMetadata` + page body both fetch the same poem/poet (deduped only by the in-memory module cache `api-cache.ts`, which lives per serverless instance and expires). Using React `cache()` and single-pass queries would cut roughly a third of all render queries.
5. **In-memory cache (`api-cache.ts`) is per-serverless-instance and short-lived.** After a cold start, or when the ~10k requests/day spread across instances, the TTL caches (1–24h) miss and every bot wave re-downloads whole poet/category/poem payloads. This multiplies causes 1–3.

Also relevant but smaller: `/api/search` is unthrottled and uncacheable (3–4 REST queries per call, JS-rendering bots hit it via `/search?q=`), and the faal flow downloads the *entire* Ghazaliat category client-side (~5–6 REST calls + large payload per user click, `FaalProviderWrapper.tsx:116–150`).

What does **not** contribute: `/` home (static, client-fetch of poets, 1 REST call per browser/day via localStorage cache), `robots.txt` (statically prerendered, 0 Supabase — the ~175 bot hits/day on it cost Vercel edge only; it only signals bot volume), Upstash (only the contact form, 1 Redis call per submit — `api/contact/route.ts:28–34`).

---

## Route table

| Route | Rendering mode | Supabase queries per render (REST `/rest/v1` unless noted) |
|---|---|---|
| `/` (home) | **Static** (prerendered, `prerender-manifest.json` has `"/"`), no DB at build | Server: 0. Browser: 1 (`getPoets`, 24h localStorage cache) |
| `/poem/[id]` | **ISR, revalidate 86400** (`page.tsx:14`); no `generateStaticParams` → first hit per URL renders on demand | Cold: ~7–8 (`hasPoem`, `getPoem`, `hasPoet`, poet row, categories, `listMigratedPoetIds`, category-poems w/ all verses). Warm same instance: ~3–4 (`hasPoem`+`hasPoet` are never cached) |
| `/poet/[id]` | **ISR, revalidate 3600** (`page.tsx:18`); no `generateStaticParams` → on demand | Cold: 3 (`hasPoet`, poet row, categories). Warm: 1 (`hasPoet`) |
| `/poet/[id]/category/[categoryId]` | **Dynamic per request** (awaits `searchParams.page`, `page.tsx:27–31`); `revalidate 3600` not effective for `?page=` rendering | Cold: ~5–7 (`listMigratedPoetIds`, category poems w/ all verses, `hasPoet`, poet, categories, optional child-category check). Plus redirect render for containers |
| `/poet/[id]/category/[categoryId]/chapter/[chapterId]` | **Dynamic per request** (awaits `searchParams.page`, `page.tsx:28–32`); `revalidate 3600` ineffective for `?page=` | Cold: ~7–10 (`listMigratedPoetIds`, chapter row, 1–3 descendant-category queries (loop, depth ≤3), poems w/ all verses, `hasPoet`, poet, categories). Warm: ~5 |
| `/search` | **Dynamic** (awaits `searchParams`, `page.tsx:14–19`) | Server: 0. JS-executing bots/clients: `/api/search` → 3–4 queries (poets, categories, poems+count) |
| `/faal` | **Static** (prerendered) | Server: 0. Browser per draw: `hasPoet`+poet+categories (2–3), `listMigratedPoetIds`, entire Ghazaliat poems (~495 poems × full verses), `hasPoem`+poem ≈ 5–6 queries |
| `/sitemap.xml` | **Static, prerendered at build, never regenerated** (`prerender-manifest.json`: `initialRevalidateSeconds: false`) | Per request: 0. Per deploy/build: ~1 + ~3 × poetCount (`getPoets` + `getPoet` per poet at build time — the build *does* query Supabase) |
| `/robots.txt` | **Static** (prerendered) | 0 |
| `/api/search` | Dynamic (route handler, always executed, **no rate limit**) | 3–4 per query: poets, categories, poems (+count), optional `hasPoet` |
| `/api/contact` | Dynamic | Upstash rate limit 1×; on submit: 1 contact insert (direct REST fetch, `api/contact/route.ts:62–72`) |
| `/api/telegram/webhook` | **Dynamic, `force-dynamic`** (`route.ts:5`), secret-token gated (`route.ts:10–16`) | Per Telegram update: poem search queries + `bot_analytics` insert (service-role client, `src/lib/telegram/*`) |
| `/auth/callback` | Dynamic (route handler) | `exchangeCodeForSession` (Auth API) + `user_profiles` upsert/update (2) |
| `/auth`, `/profile`, `/bookmarks`, `/history`, `/contact`, `/privacy`, `/changelog` | **Static** client-component shells (all in prerender manifest) | Server: 0; browser REST only for signed-in users (auth, `user_profiles`, `bookmarks`) |

> `config.matcher` does not exclude the Proxy (former middleware) run from *any* of these — including `/sitemap.xml`, `/robots.txt` and `/fonts/*` (only `_next/static`, `_next/image`, favicon and svg/png/jpg/jpeg/gif/webp are excluded, `src/proxy.ts:34–38`). Proxy cost per anonymous request: **0 network calls** (verified in `@supabase/auth-js/dist/main/GoTrueClient.js:2528–2566` — `getUser()` with no session returns `AuthSessionMissingError` without fetching); for requests that *do* carry `sb-*` cookies: **1 call to Auth API** (`/auth/v1/user`) per request.

---

## Findings

### 1. Rendering mode of every route

- **Home `/`** — static, no data fetching on server (`src/app/page.tsx:3–10`). The poet list is fetched *client-side* by `PoetsGrid` (`src/components/PoetsGrid.tsx:72–94`) via `hybridApi.getPoets()` → Supabase anon REST, cached in `localStorage` for 24h (`PoetsGrid.tsx:24–25`).
- **Poem page** — ISR `revalidate = 86400` (`src/app/poem/[id]/page.tsx:14`), **no `generateStaticParams`** (grep across `src/app` found it nowhere). Nothing intrinsically dynamic in the render itself (no cookies/headers/searchParams); only the absence of prerendering makes every first hit a server render.
- **Poet page** — ISR `revalidate = 3600` (`src/app/poet/[id]/page.tsx:18`), also no `generateStaticParams`.
- **Category page** — declared `revalidate = 3600` (`category/page.tsx:14`) **but awaits `searchParams`** (`:27–28`), so it is rendered per request; `?page=N` is never served as static ISR HTML.
- **Chapter page** — same pattern (`chapter/page.tsx:13, 28–32`).
- **Search** — dynamic because the page awaits `searchParams` (`src/app/search/page.tsx:14–19`); actual search runs client-side in `SearchResults` (`src/components/SearchResults.tsx:40–100`) through `/api/search`.
- **Faal** — static page (`src/app/faal/page.tsx`), all data fetching client-side on user action (`src/components/FaalProviderWrapper.tsx:80–172`).
- **Sitemap** — `src/app/sitemap.ts` has no `revalidate` export; the local build artifact shows it fully prerendered (`initialRevalidateSeconds: false`), i.e. generated once per deploy at build time. No request-time DB load, but the **build itself** queries Supabase (see finding 5).
- **Robots** — static function (`src/app/robots.ts:3–20`), prerendered.
- **OG images** — there are no dynamic OG image routes; all metadata points at one static `/og-image.jpg` (e.g. `layout.tsx:65`, `poem/page.tsx:52`). N/A.
- **API routes** — `/api/search` (always dynamic), `/api/contact` (rate-limited via Upstash), `/api/telegram/webhook` (`force-dynamic` + webhook secret), `/auth/callback` (dynamic, uses `cookies()` via `createSupabaseServerClient`, `src/lib/supabase-auth-server.ts:4–6`).
- **Proxy/middleware (`src/proxy.ts`)** is the *only* `cookies()`-based Supabase client reachable on page routes, so no page I audited is forced dynamic by cookies/headers except `/auth/callback` and the API routes.

### 2. Proxy / middleware

- File: `src/proxy.ts` (Next 16 middleware). Matcher `src/proxy.ts:35–37`: everything except `_next/static`, `_next/image`, `favicon.ico`, and image extensions `{svg,png,jpg,jpeg,gif,webp}` — so it runs for HTML pages, `/sitemap.xml`, `/robots.txt`, `/fonts/*.woff2`, and all API routes, **for bots and humans alike**.
- What runs: creation of a cookie-bound `createServerClient` (`:7–26`) + `await supabase.auth.getUser()` (`:29`) on **every matched request**.
- Network cost verified against the installed package: with an empty cookie jar (bots) `getUser()` short-circuits to `AuthSessionMissingError` with **no fetch** (`node_modules/@supabase/auth-js/dist/main/GoTrueClient.js:2528–2566` — it only makes an HTTP call when an access token or custom Authorization header exists). With `sb-*` cookies (logged-in humans), **1 Auth API call per request**.
- **No Upstash/Redis rate limiting in the middleware** — Upstash is wired only into the contact form (`src/app/api/contact/route.ts:5–13`). So one anonymous page view triggers **0 Supabase/Auth calls in the proxy**; the ~10k calls/day originate from server rendering (finding 3), not middleware. The main cost of the proxy is edge invocation latency on every request, including static assets it shouldn't cover.

### 3. Supabase queries per page type (per render, incl. metadata)

All page data flows through `hybridApi` → `supabaseApi` with a module-level `withCache` (`src/lib/api-cache.ts`) — an in-memory Map **per serverless instance**, TTL 30–60min (category/poem) and `listMigratedPoetIds` 5min (`supabase-api.ts:33–35`, `hybrid-api.ts:15–17`).

- **Poem page** (`src/app/poem/[id]/page.tsx`)
  - `generateMetadata` → `hybridApi.getPoem` (`:33`) = `hasPoem` (1 query, uncached, `supabase-api.ts:401–417`) + poem fetch (1, `:326–346`).
  - Page body → `hybridApi.getPoem` again (`:96`) — same data, dedup only via `withCache`, **not** `React cache()`.
  - `hybridApi.getPoet(poem.poetId)` for breadcrumb (`:103`) = `hasPoet` (1, uncached `:386–396`) + poet row (1, `:117–121`) + categories (1, `:145–149`).
  - `hybridApi.getCategoryPoems` for prev/next (`:140`) = `listMigratedPoetIds` (1, `:434–437`) + **one query selecting `verses_array` for every poem in the category** (1, `:245–262`) + optional child-category check (1, `:295–299`).
  - → ~7–8 queries cold; ~3–4 warm on the same instance. Duplicated metadata/body fetches are deduped only by the instance cache — worth migrating to `React cache()` per rule, and eliminating `hasPoem`/`hasPoet` entirely.
- **Poet page** (`src/app/poet/[id]/page.tsx`): `generateMetadata` (`:56`) and body (`:118`) both call `hybridApi.getPoet` = `hasPoet` (1, uncached) + poet (1) + categories (1); second call from instance cache. ≈ 3 cold / 1 warm.
- **Category page** (`category/page.tsx:47–49`): `getCategoryPoems` (migrated-set 1 + big verses query 1 [+ child check]) then `getPoet` (3). ≈ 5–7 cold. Client-side pagination via `PoemPagination` means the whole category (all verses) ships into the HTML/RSC payload even when showing 20 items.
- **Chapter page** (`chapter/page.tsx:47–55`): `getChapter` (`supabase-api.ts:467–540`) = chapter row (1) + `getDescendantCategoryIds` loop (1–3 queries, depth ≤3, `:47–65`) + all-poems-with-verses query (1) + `getPoet` (3) + migrated check (1). ≈ 7–10 cold.
- **Home**: 0 server queries (static); browser does `getPoets` = 1 query (`supabase-api.ts:87–90`, small column list — good).
- **Flags:** (a) `select("*")` — none found (search API uses `verses.ilike` but not `*`; the faal count query does `select('*')` with `head:true` — no payload, OK, `faal-core.ts:8–11`). (b) **Large text column on list pages:** `verses_array` is selected wholesale on every category/chapter list query (`supabase-api.ts:247–259, 488–500`) though list UI needs only `id`/`title`/`poet_id`. (c) **No `.limit()` / server-side pagination** on the category, chapter, descendant and `listMigratedPoetIds` queries — `PoemPagination` paginates in the client. The search API does paginate (`/api/search` uses `limit`/`range`).
- Duplicate `generateMetadata` vs page fetches exist on **poem** (getPoem) and **poet** (getPoet) pages and could be coalesced with `React cache()`; today the duplicate is avoided only incidentally by the per-instance TTL cache.

### 4. Sitemap and robots

- **Sitemap** (`src/app/sitemap.ts`): iterates **all poets** fetched from Supabase (via `hybridApi.getPoets`, `:44`) and then calls `hybridApi.getPoet(poet.id)` **per poet at 5-way concurrency** (`:53–65`) to enumerate categories. At build time that is ~1 + ~3×N queries (poetCount unknown to me — I did not query the DB; it is at least the 6 famous poets; user says ~129,500 poems exist so poet count is probably tens to low hundreds). **No poem URLs are in the sitemap at all** — only `/`, `/faal`, poet pages, and category pages (`:27–67`). It is prerendered once per deploy (manifest: `initialRevalidateSeconds: false`); request cost is 0, and it does not regenerate until the next deploy.
- **Robots** (`src/app/robots.ts`): `Googlebot` allow `/` minus `/api/`, `/_next/`; `*` same plus `crawlDelay: 2` (`:5–17`). Nothing is blocked for `/search`, `/auth`, `/profile`, `/bookmarks`, `/history` (client pages, harmless) and no bot-specific deny rules exist. Given ~175 bots/day fetch robots.txt and then crawl, the crawl-delay helps only polite crawlers; robots.txt itself is fully static and contributes **0 Supabase load**.

### 5. `generateStaticParams` and prerendering

- **`generateStaticParams` appears nowhere** in `src/app` (grep). `.next/prerender-manifest.json` confirms: 18 prerendered routes — `/_global-error`, `/_not-found`, `/`, `/auth`, `/bookmarks`, `/changelog`, `/contact`, `/faal`, `/history`, `/privacy`, `/profile`, `/manifest.json`, `/robots.txt`, `/sitemap.xml`, icons/favicon — and **`dynamicRoutes` is empty**, i.e. **0 poem, poet, category or chapter URLs pre-generated**. Versus ~129,500 poem URLs (user-provided figure; `SUPABASE.md:51–53` documents an initial import of ~15,000 poems for 6 poets, plus later "remaining poets" imports in `scripts/import-remaining-poets*.ts`, so the total plausible).
- ISR is configured via `export const revalidate = 3600 / 86400`, so a rendered URL is cached ~1h (poet/category/chapter) or ~24h (poem) — but only after the first bot hit pays for the full render, and Vercel's ISR cache can be pruned/missed across hot deployments. **No on-demand revalidation (`revalidatePath`/`revalidateTag`) exists anywhere** (grep). **No `generateStaticParams` for the most popular poets' poems** (e.g. everything under the 6 famous poets) — the single highest-leverage gap.

### 6. Caching headers and Vercel config

- **No `vercel.json`** in the repo.
- `next.config.ts`: no `staleTimes`, no `cacheComponents`, no route-level `Cache-Control` for HTML. Only three header blocks: security headers on `/(.*)`, `public, max-age=31536000, immutable` for `/fonts/:path*` (`:53–61`), and `public, max-age=3600, stale-while-revalidate=86400` for `/api/ganjoor/:path*` (`:62–70`) — **a path that does not exist in the app** (no `/api/ganjoor` route; grep confirms), so that s-maxage rule is dead config. One rewrite for legacy font URLs (`:73–81`).
- Song pages rely purely on Next ISR/Vercel platform caching; since category/chapter pages are effectively dynamic (searchParams), they get no CDN HTML caching. HTML responses for `/` and static pages are CDN-cached by Vercel defaults.

### 7. Local development safety

- `.env.local` (only variable names inspected; **no secret values printed**): `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_CONTACT_TABLE`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_TO`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`.
- `NEXT_PUBLIC_SUPABASE_URL` points to project ref **`bcizaerhgsoeqrcqbtxh`** — the *only* Supabase project ref that appears anywhere in the repo (`.env.local`, docs). There is **no documented separate dev/staging project** (`SUPABASE.md:44–47` simply says "add your Supabase URL"; `DEVELOPMENT.md`/`start-dev.sh` mention no separate project). So local `next dev` almost certainly reads and writes the **same database the production site serves** — including the service-role key, and including any import/migration scripts run during development. I cannot verify the Vercel production value from the repo alone (Open question 1), but on current evidence: dev = prod connections.

### 8. Authenticated features (must stay dynamic)

- **Auth flows:** Google OAuth + magic link (`src/app/auth/page.tsx:24–58`), callback `exchangeCodeForSession` (`src/app/auth/callback/route.ts:10–11`), cookie-bound server client (`supabase-auth-server.ts`). These routes must stay dynamic.
- **Per-user server data:** `user_profiles` (profile read/update — `src/lib/user-profile-api.ts:24–80`, user-facing on `/profile` and `/bookmarks`), `bookmarks` CRUD + bulk import (`src/lib/cloud-bookmarks-api.ts:40–114`), all performed **client-side** with the anon/RRL client — they already keep dynamic work out of public HTML.
- **Reading session on the server:** the only module that reads `cookies()` server-side is `supabase-auth-server.ts` (used solely by `/auth/callback`) and `src/proxy.ts`. **No page component needs per-user server data**, which means *every public content page is cacheable for everyone*.
- **Telegram bot** uses a service-role client (`src/lib/telegram/supabase-bot-client.ts`) behind the webhook — dynamic by nature, correctly gated.
- Conclusion: nothing in the public poem/poet/category space depends on auth; the proxy's unconditional `auth.getUser()` is the only auth coupling on public routes and can be conditioned on the presence of `sb-*` cookies without affecting any feature.

---

## Recommended changes (described only, ranked by impact ↔ risk)

| # | Change | Est. impact | Risk |
|---|---|---|---|
| 1 | **Add `generateStaticParams` to `/poem/[id]`** — pre-render at build time all poems of the highest-traffic poets (or all ~129,500 via a paginated build-time query, at ~2 queries/category) and keep `dynamicParams: true` (blocking ISR fallback) for the rest. This converts the bot-heavy long tail into CDN cache hits. | Very high (request count — likely removes the majority of /rest/v1 calls) | Medium — build time and build-time DB access grow; needs the sitemap-like concurrency handling; verify in build logs |
| 2 | **Stop fetching `verses_array` for list/navigation queries.** Give the poem-page prev/next navigation a lightweight query (`select id, title, poet_id, category_id` ordered by id) or a Postgres `neighbors` RPC; same for `PoemPagination` inputs (send only ids+titles to the client, fetch verses only when a poem page opens). Optionally split `verses` into a separate table or column accessed via a view. | Very high (the 14 GB egress) + high (request latency/format) | Low — pure query-shape change |
| 3 | **Make category/chapter pages statically safe:** move `?page=` pagination into server-side `.range()` with static segment paths (e.g. `/category/[categoryId]/page/[n]`) or drop URL pagination in favor of the existing client widget fed by the lightweight payload from change 2; either way remove the `await searchParams` so `revalidate = 3600` can actually cache them as ISR. | High (both request count and cache hit rate) | Low–medium (URL scheme changes; keep redirects for old `?page=` links) |
| 4 | **Collapse redundant queries:** wrap `generateMetadata` + page data fetch in `React cache()`-deduped loaders; delete the `hasPoem`/`hasPoet` pre-checks by using a single `.maybeSingle()` fetch; replace the `isMigratedPoet` gateway with a `migrated` boolean fetched in the `poets` select (or rely on empty-result fallback); replace `getDescendantCategoryIds` (1–3 sequential queries) with one recursive Postgres function. | Medium-high (cuts ~30–50% of per-render queries) | Low |
| 5 | **robots.txt:** disallow `/search?q=` (e.g. `Disallow: /*?q=`), `/auth`, `/profile`, `/bookmarks`, `/history`, and keep `crawlDelay`. Note poem crawl volume itself needs changes 1–2, not robots surgery. Blocking `?page=` URLs too would stop bot re-crawl of every pagination variant. | Medium (reduces bot crawl of wasteful URL space) | Low–medium (careful not to hide real content) |
| 6 | **Cache `/api/search` responses** (short-TTL in-process cache keyed by normalized query, or `unstable_cache`) and/or apply the Upstash sliding-window limiter already used by the contact form. Keeps bot search traffic from hitting Postgres. | Medium | Low |
| 7 | **Make the proxy cheap:** narrow the matcher (exclude `woff2`/`txt`/`xml`/`ico` and all `/api/*` except where needed) and only call `auth.getUser()` when `sb-*` cookies exist. No public feature depends on it (finding 8). | Low-medium (edge latency, auth calls for signed-in users) | Low |
| 8 | **Sustainability of sitemap:** the current build-time sitemap is fine frequency-wise; optionally add `generateSitemaps` split + `export const revalidate = 86400` if poem URLs are ever added (129.5k URL limit per sitemap file). Keep as is until change 1. | Low now | — |
| 9 | **Dev/project separation:** create a second Supabase project for local development, move dev credentials to a clearly-named local env (e.g. `.env.development.local`), and keep import scripts pointed at dev only. Update `SUPABASE.md:44–47` accordingly. | Low (risk reduction, not request count) | Low |
| 10 | **Housekeeping:** remove the dead `/api/ganjoor/*` header block in `next.config.ts:62–70`; unify `www.ganj.directory` vs `ganj.directory` base URLs (sitemap uses `www`, `metadataBase` copies don't — `sitemap.ts:4` vs `layout.tsx:35`). | Low | Low |

A note on what *won't* help: raising the `withCache` TTLs in `api-cache.ts` only helps within a single warm instance; after a serverless cold start, or across instances during a bot wave, the caches are empty. Platform-level caching (changes 1 & 3) is the durable fix.

## Open questions

1. **Is `bcizaerhgsoeqrcqbtxh` also the production (Vercel) project ref?** I verified it is the only ref in the repo and presumably shared by local dev and prod, but I did not (and cannot) check the Vercel env vars. Confirm in the dashboard.
2. **Actual counts** of poets / categories / chapters and the number of poems per top-level category (needed to size change 1's build-time work and to estimate per-render payload of change 2 exactly). I deliberately did not query the DB.
3. **Vercel logs:** what is the user-agent/request distribution behind the ~10k calls/day (Googlebot vs Ahrefs/GPTBot etc.), and what fraction of poem-page requests were ISR cache misses? (Vercel has per-request `x-vercel-cache` status in logs.) This decides whether change 1 alone suffices.
4. **Was the last production build successful in prerendering `/sitemap.xml`** (it queries Supabase during build — a temporarily unreachable DB silently produces a 3-entry sitemap, `sitemap.ts:68–71`)?
5. **RLS:** do the `poems`/`categories`/`poets` tables allow anonymous reads via the anon key only (presumably yes, since the client anon-key client does the fetching)? The service-role key additionally sits in `/api/search` — is the missing rate limit on `/api/search` acceptable (PostgREST `verses.ilike '%…%'` scans are expensive regardless of count)?
6. Why does the stale `.next/prerender-manifest.json` show `dynamicRoutes: {}` while none of the dynamic routes failed visibly — did the last build complete cleanly, and does Vercel's current deployment match this manifest?
7. Does the Telegram bot's traffic share of `bot_analytics`/poem-search queries warrant any cap (it's currently unbounded per Telegram user)?

---

*All file paths are repo-relative under `src/` unless noted. Sensitive values (keys, tokens) were never read or printed; only variable names and one public Supabase project ref are referenced.*
