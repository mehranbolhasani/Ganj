# D1 cutover checklist

**Status:** Phase 4a (adapter only). The server-side content reads are now *switchable*
between Supabase and the D1 Worker via `CONTENT_BACKEND`; the default stays `supabase`,
so production behaviour is unchanged. Nothing below has been migrated yet — this is the
list of what is left, the order to do it in, and the risks.

Branches: `d1-backend` (this change). The Worker lives in `ganj-d1-worker`.

---

## 1. Already switchable (`CONTENT_BACKEND=d1`)

These all resolve through `src/lib/hybrid-api-server.ts`, which now injects either
`supabaseApiCached` or `d1ApiCached` and keeps the React `cache()` + `unstable_cache`
pattern with the same revalidate windows:

| Consumer | File:line | Method(s) |
|---|---|---|
| Poem page | `src/app/poem/[id]/page.tsx:9,34,97,104,133` | `getPoem`, `getPoet`, `getPoemNavigation` |
| Poet page | `src/app/poet/[id]/page.tsx:11,56,118,124` | `getPoet`, `isPoetMigrated` |
| Category page | `src/app/poet/[id]/category/[categoryId]/page.tsx:8,47,49,60` | `getCategoryPoems`, `getPoet`, `isPoetMigrated` |
| Chapter page | `src/app/poet/[id]/category/[categoryId]/chapter/[chapterId]/page.tsx:7,47,52` | `getChapter`, `getPoet` |
| Sitemap | `src/app/sitemap.ts:2` | `getPoets`, `getPoem`, `listMigratedPoetIds` |

The D1 adapter is `src/lib/d1-api.ts` (fetch + `X-Ganj-Key`) wrapped by
`src/lib/d1-api-server.ts` (React `cache()` + `unstable_cache`, 24 h items / 1 h lists).

---

## 2. Remaining readers of poems / poets / categories

Legend: **runtime** · **needs** = what it reads.

### 2.1 Server, still on Supabase

| # | File:line | Function / symbol | Runtime | Needs |
|---|---|---|---|---|
| S1 | `src/app/api/search/route.ts:63` | poets search in `GET` | server (**service-role**) | `poets` by `name/description ILIKE` |
| S2 | `src/app/api/search/route.ts:90,117` | categories search | server (service-role) | `categories` + embedded `poets(name)` |
| S3 | `src/app/api/search/route.ts:140` | `supabaseApi.hasPoet` | server (service-role) | `poets.id` |
| S4 | `src/app/api/search/route.ts:145,178` | famous-poet poem search | server (service-role) | `poems(title/verses ILIKE)` + `poets`, `categories` |
| S5 | `src/app/api/search/route.ts:293,325` | global poem search | server (service-role) | `poems(title/verses ILIKE)` + joins |
| S6 | `src/lib/faal-core.ts:9,21` | Hafez ghazal random pick | server (Telegram/faal) | `poems` by `category_id` (+ `COUNT`, random offset) |
| S7 | `src/lib/telegram/search.ts:14,66` | Telegram poem search / fetch | server (Telegram) | `poems(title/verses ILIKE)`, `poems` by id |
| S8 | `src/lib/telegram/analytics.ts:33` | bot analytics insert | server (Telegram) | *not content* — stays on Supabase |
| S9 | `src/lib/supabase-api.ts:55-625` | the whole `supabaseApi` content surface | server + browser | `poets`, `categories`, `poems` (`getPoets`, `getPoet`, `getCategoryPoems`, `getPoem`, `getChapter`, `getPoemNeighbors`, `listMigratedPoetIds`, `hasPoet`, `hasPoem`, `getSupabaseStats`, `getDescendantCategoryIds`) |

### 2.2 Browser, direct to Supabase (must become route handlers first)

| # | File:line | Call | Needs |
|---|---|---|---|
| B1 | `src/lib/hybrid-api.ts:276` | `createHybridApi(supabaseApi)` — the client instance | all `HybridBackend` methods, from the browser |
| B2 | `src/components/PoetsGrid.tsx:4` | `hybridApi.getPoets()` | `poets` |
| B3 | `src/components/FaalProviderWrapper.tsx:5` | `getPoet(2)`, `getCategoryPoems`, `getPoem` | `poets`, `categories`, `poems` |

### 2.3 Cross-boundary join

| # | File:line | Call | Needs |
|---|---|---|---|
| X1 | `src/lib/cloud-bookmarks-api.ts:41-56` | bookmarks query embedding `poems(...poets(name), categories(title))` | `bookmarks` **+** `poems`, `poets`, `categories` — breaks the moment poems leave Supabase |

---

## 3. Recommended migration order

Each step is independently revertible via `CONTENT_BACKEND` / route-level flags.

1. **S1–S5 (search route).** Highest traffic and the only service-role content reader.
   Point `/api/search` at the Worker `/search` endpoint (word FTS for <3 chars, trigram for
   ≥3). Keep the Ganjoor branch for non-migrated poets. *Needs the Worker search parity work
   to be verified against production first (Phase 4b).*
2. **B1–B3 (browser content).** Add same-origin `/api/content/*` route handlers that call
   `d1ApiCached` server-side (carrying the secret), and repoint the client instance in
   `hybrid-api.ts:276` at those routes. This removes the browser's direct Supabase content
   access **and** its anon-key dependency for content.
3. **X1 (bookmarks hydration).** Fetch `bookmarks` rows from Supabase, then hydrate
   poem/poet/category metadata from the Worker by id (plan §7.3 option (a)). Do this **with**
   or immediately after step 1, because booksmarks embed `poems` today.
4. **S6–S7 (Telegram / faal).** Repoint `telegram/search.ts` and `faal-core.ts` at the Worker
   (or a service binding). Low volume; can trail the web cutover.
5. **S9 / drop Supabase content.** Once nothing reads `poems`/`poets`/`categories` from
   Supabase, drop the tables and their indexes (`idx_poems_*`, `idx_poets_name`,
   `idx_categories_title`) and optionally `pg_trgm`/`unaccent` (plan §7.4).
6. **S8 (bot analytics), auth, `contact_messages`, `ganjoor_cache`, `user_profiles`** stay on
   Supabase Free permanently.

---

## 4. Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Search semantics** | Production is `ILIKE '%q%'`; D1 uses word FTS (<3 chars) + trigram (≥3). Partial-word/inside-word matches differ. | Phase 4b: replay the §8.2 query set against both and gate the cutover on parity. Worker already clamped `q` to ~24 Persian chars. |
| **Browser content still hits Supabase** | Steps B1–B3 still ship the anon key to the browser and read content directly. | Do step 2 (route handlers) as one PR; verify no `supabase` import remains in client components. |
| **Bookmark join (X1)** | Embedding `poems` in the `bookmarks` query breaks silently (empty titles) when poems leave Supabase. | Hydrate via the Worker; add a regression test on `cloud-bookmarks-api`. |
| **Backend flag coupling** | `hybrid-api.ts` previously gated the backend on `isSupabaseAvailable()`. | Fixed in this change: `createHybridApi(backend, isBackendAvailable)` — `hybrid-api-server.ts` passes a D1-aware check. Default behaviour unchanged. |
| **Secret leakage** | `D1_WORKER_SECRET` must never reach the browser. | Worker calls happen only in `d1-api.ts` (`server-only`) and route handlers. `wrangler.toml` keeps no real secret. Do not create `NEXT_PUBLIC_D1_*`. |
| **Poet ordering** | SQLite binary `ORDER BY name` differs from Postgres in 177/230 positions (phase 3). | Solved: `poets.sort_name` is precomputed with the `en` collator (0/230 diff vs Postgres) and the Worker orders by it. |
| **Large categories** | Largest category is 9,824 poems / 1.45 MB; dynamic D1 JSON is >10 ms CPU on Workers Free. | Precomputed into KV (>500 poems; 73 keys); the Worker serves KV first and falls back to D1. |
| **`.in()` / parameter limits** | D1 caps 100 bound parameters and 50-byte LIKE patterns. | Worker chunks IN lists (parameter-aware) and clamps `q`; verified in Phase 4a tests. |
| **Cache stampede at cutover** | First post-cutover requests cold-fill the Data Cache from the Worker. | Warm `/api/content/*` and `/api/search` for the top poets/categories before flipping the flag; keep the Ganjoor fallback. |
| **Regional latency** | D1 is single-primary (WEUR in the probe); Vercel default region is iad1. | Measure cold render at cutover; consider a Vercel region change or D1 read replication (plan §4.7). |

---

## 5. What Phase 4b must prove (on real Cloudflare resources)

1. Create the two real D1 databases and the KV namespace; load the full dataset with the
   resumable loader (batches < 98 KB statements; the local loader already does this).
2. Deploy `ganj-d1-worker`; set `D1_WORKER_SECRET` as the Worker secret `GANJ_KEY`.
3. Re-run the Phase 4a test suite against the deployed Worker.
4. Search parity replay for the §8.2 query set.
5. CPU / rows-read / response-size measurements on Workers Free for the largest endpoints.
6. Then, and only then, flip `CONTENT_BACKEND=d1` in a preview environment.
