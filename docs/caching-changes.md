# Caching / Supabase-load changes — summary of implementation

**Branch:** `perf/cache-supabase` (local only; created from `main` — `main` itself untouched, nothing pushed).

Start state: working tree on `main` had exactly one untracked path (`docs/` = the phase-1 audit), nothing else uncommitted.

## Commits (in order, each revertable on its own)

| Commit | Change |
|---|---|
| `5e6f74a` | **1 — poem-page prev/next nav:** targeted neighbor queries instead of whole-category fetch (includes `docs/caching-audit.md`) |
| `b47a67c` | **2 — column trimming:** drop `verses_array` from all list queries |
| `06489d9` | **3 — dedupe & cache:** React `cache()` + `unstable_cache` Data Cache layer; `hasPoem`/`hasPoet` pre-checks removed from page path |
| `e3121cc` | **4 — category/chapter `?page=`:** options documented in `docs/category-pages-options.md`, intentionally **not implemented** (see below) |
| *(last)* | this summary document |

Type-check (`tsc --noEmit`) and `npm run lint` were run after **each** change: clean every time (the only 2 lint warnings are pre-existing unused-icon imports in `src/app/changelog/page.tsx`).

**Build: skipped, deliberately.** The gate was "build only if a small, bounded number of Supabase queries at build time". The audit (`docs/caching-audit.md` §4/§5) documents that the build prerenders `/sitemap.xml` with `~1 + ~3 × poetCount` queries and explicitly leaves `poetCount` unknown — that is not verifiable as bounded here, so no `next build` was run. Do let CI/Vercel run the preview build instead.

## What changed, per audit item

### 1. Poem-page navigation (`5e6f74a`)
- New `supabaseApi.getPoemNeighbors(poemId, poetId, categoryId, chapterId?)` in `src/lib/supabase-api.ts`: two parallel `LIMIT 1` queries ordered by `id` (same ordering as the old lists), selecting only `id, title, poet_id, category_id` + poet/category names, wrapped in `withCache` (30 min).
- New `hybridApi.getPoemNavigation(poem)` in `src/lib/hybrid-api.ts`: for migrated poems/chapters → the tiny neighbor queries; otherwise exactly the old behavior (category/chapter list, Ganjoor fallback). `PoemNavigation` renders only `id` + `title` (verified `src/components/PoemNavigation.tsx`), so UI output is identical.
- `poem/[id]/page.tsx` now calls `hybridApiServer.getPoemNavigation(poem)`; the try/catch and rendering are unchanged.

### 2. Column trimming (`b47a67c`)
- `getCategoryPoems` + `getChapter` (`src/lib/supabase-api.ts`): no longer select `verses_array`; return `verses: []`. Consumers verified: category/chapter pages feed `PoemPagination` (renders `id/title/poetName/chapterTitle` only); the faal flow reads only `.length`/`.id` from the list and fetches full text via `getPoem`.
- `src/lib/telegram/search.ts` `searchPoems`: list reduced to keyboard labels (`title`, `poetName`); full text via `getPoemById`.
- `faal-core.ts`: count-only query switched `select('*')` → `select('id')` with `head: true` (no payload either way, removes the audit flag).
- **Kept** `verses_array` where text is actually rendered: `getPoem` (single poem), `/api/search` (SearchResults renders matching verse snippets), Telegram `getPoemById`, faal direct fetch.

### 3. Request dedupe + platform cache (`06489d9`)
- `hybrid-api.ts` refactored into `createHybridApi(backend)` factory; the default export (`createHybridApi(supabaseApi)`) is unchanged for client components (`PoetsGrid`, `FaalProviderWrapper`).
- New server-only `src/lib/supabase-api-server.ts` + `src/lib/hybrid-api-server.ts`: every shared fetcher (`getPoem`, `getPoet`, `getPoets`, `getCategoryPoems`, `getChapter`, `getPoemNeighbors`, `listMigratedPoetIds`) is wrapped in React `cache()` **inside** unstable_cache (Vercel Data Cache), revalidate **24h for poems/poets** and **1 h for lists/navigation**, tags `supabase-content`, `poems`, `poets`, `categories` (no `revalidateTag` wiring yet — reserved for future invalidation).
- Server pages (poem/poet/category/chapter) and `sitemap.ts` import `hybridApiServer`; the per-instance in-memory `api-cache.ts` stays, because the client bundle still needs it (unstable_cache cannot ship to the browser).
- `hasPoem`/`hasPoet` pre-checks are gone from the page path: a missing row's error now drives the same Ganjoor fallback (outcome identical, one less uncached query per poem/poet render). Both functions remain in `supabaseApi` for `/api/search`.

### 4. Category/chapter `?page=` (`e3121cc`) — not implemented
Both URL-preserving options alter crawler-visible/first-paint HTML for `?page≥2` (path-keyed ISR would serve page-1 HTML + client flip; non-JS crawlers would see only page-1 links). Full options + trade-offs in **`docs/category-pages-options.md`**. Current post-implementation state is Option C there: dynamic HTML, fully cached data.

## Estimated Supabase savings per page type

| Page | Before (audit) | After | Notes |
|---|---|---|---|
| `/poem/[id]` (migrated poem) | 7–8 queries + whole-category `verses_array` (100s of KB for large categories) per uncached render | ≤ 4 tiny queries on a Data-Cache miss (`getPoem`, `getPoet`, 2 × `LIMIT 1` neighbors); **0 queries on hits within 24 h/1 h**, across all instances | request-count −40–50 % worst case; nav-payload egress ≈ −99 % |
| `/poet/[id]` | 3 (first), 1 (warm instance) | 1 on Data-Cache miss, 0 in-window (24 h) | categories included in cached poet payload |
| `/poet/[id]/category/:cid` | 5–7 incl. full verses every request | 2 light queries on Data-Cache miss (1 h), 0 in-window; HTML still dynamic (change 4 deferred) | payload per category fetch: titles only |
| `.../chapter/:cid` | 7–10 | 3–5 on miss (1 h), 0 in-window; payload titles-only | descendant-id loop only runs on recompute |
| `/` | 0 server | unchanged | — |
| `/faal` (browser) | ~5–6 + full Ghazaliat (~0.5–1 MB) per draw | list is now titles-only + 1 full-poem fetch per draw | visible text identical (drawn from `getPoem`) |
| `/api/search`, telegram, auth | unchanged | unchanged (out of scope this phase) | — |

These are estimates: exact win per page depends on Vercel ISR/Data-Cache hit rates, which you should confirm on the preview (below).

## Risks

- **Staleness:** poem/poet data can be up to 24 h old (Data Cache), lists up to 1 h. The corpus only changes via import scripts, so this matches the previous in-memory TTLs; if exact freshness is ever needed, `revalidateTag('supabase-content')` (or a specific tag) invalidates instantly — currently nothing calls it.
- **Nav-edge case:** the old code produced no prev/next links when the poem wasn't present in its category list; neighbors queries can still produce links in that rare data state. Consequence is *more* nav links, same rendering.
- **unstable_cache:** still supported on Next 16, but if the project later enables `cacheComponents`/`use cache`, migrate these wrappers.
- Client components keep the uncached instance; no `unstable_cache` imports are reachable from the browser bundle (verified: both new modules declare `server-only`).
- Change 1 keeps every Ganjoor fallback path byte-identical; only the Supabase fast path changed.

## How to verify on a Vercel preview

1. `poem/[id]` page: content renders; prev/next arrows work and point to the same neighbors as production (spot-check 2–3 poems inside one Hafez chapter).
2. Header check: first request shows `x-vercel-cache: MISS` (or `STALE`), immediate repeat → `HIT`; subsequent poem selects within the TTL should be `HIT`.
3. Supabase dashboard (usage over the preview session): confirm `/rest/v1` traffic drops and the requests you *do* see include the two neighbor queries (`order=id.desc&limit=1`) instead of whole-category `verses_array` fetches; egress per request should collapse from hundreds of KB to KBs.
4. Category/chapter pages: pagination links & pages still work (`?page=2` etc. shows page 2 in the HTML — unchanged by design after change 4).
5. Faal: draw → poem text appears; repeat draws work; console clean.
6. Ganjoor fallback: open a poem of a *non-migrated* poet → page + navigation still render (external Ganjoor API path intact).
7. Preview build log: confirm `/sitemap.xml` prerenders (may log Data-Cache fills) and no `unstable_cache` warnings appear; the RSC payload of a large category page should visibly shrink versus the audit's numbers.
