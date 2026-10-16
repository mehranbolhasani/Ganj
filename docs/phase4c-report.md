# Phase 4c: D1 search route (branch `d1-backend`)

**Result: partial pass.** The search route works against the deployed Worker in local dev, with rate limiting, cache headers and fallback. The blocker (no snippets) is resolved in Phase 4d, see `docs/phase4d-report.md`.

## Pass / fail per item

| # | Item | Result | Notes |
|---|---|---|---|
| 1 | Poem search via Worker `/search` (Phase 4c: under `CONTENT_BACKEND=d1`; since Phase 4d: `SEARCH_BACKEND=d1`) | **Pass (gap resolved in 4d)** | Response keys and types match the legacy route. Poem `verses` were empty in 4c; fixed in 4d. |
| 1 | Poets search | **Pass** | Filters the cached poets list in the app with the shared normalization. No Worker call. |
| 1 | Categories search | **Pass** | Worker `/search?type=categories`. No new endpoint needed. No new Worker endpoint was added, so nothing is awaiting deploy for this. |
| 2 | Normalization parity, ≥30 strings | **Pass** | 47 golden vectors generated from `ganj-d1-worker/src/lib/normalize.js`. Covers Arabic yeh/kaf, harakat, tatweel, ZWNJ. Unit test checks equality for all 47. |
| 2 | Clamp to 24 chars / 50 bytes, reject empty | **Pass** | `clampSearchQuery`; empty or whitespace `q` → 400 `Query is required`. |
| 3 | Per-IP rate limit (Upstash, same pattern as contact/telegram) | **Pass** | See numbers below. |
| 3 | `Cache-Control` for successful identical queries | **Pass** | `public, s-maxage=3600, stale-while-revalidate=3600`. Errors, 400, 429 and fallbacks use `no-store`. |
| 4 | Fallback to Supabase, `SEARCH_FALLBACK_SUPABASE` default on | **Pass** | Single line `[d1-fallback] scope=search reason=<reason> action=supabase`. With `false`: 503 plus `action=unavailable`. |
| 4 | `[d1-fallback]` on content pages falling back to Ganjoor | **Pass** | `hybrid-api.ts` logs `scope=content method=<name>` on every D1 read failure. Supabase failures stay silent, as before. |
| 4 | `.env.example` | **Pass** | Added `SEARCH_FALLBACK_SUPABASE`. `CONTENT_BACKEND`, `D1_WORKER_URL`, `D1_WORKER_SECRET` were already there. |
| 5 | Unit tests (normalization, route with mocked Worker: success, timeout, 401, 429) | **Pass** | `npm run test:unit`: 39 of 39 pass. |
| 5 | Dev server against deployed Worker, 20 queries vs Supabase | **Pass, with differences** | Details below. |
| 5 | `tsc`, `eslint`, `build:verify` | **Pass** | Lint shows only the 2 warnings that were already there (`changelog/page.tsx`). |
| 6 | Update `docs/d1-cutover-checklist.md` | **Pass** | Search marked partial; remaining Supabase readers and order listed. |

## Blocker: no snippets in D1 search (RESOLVED in Phase 4d)

The Worker's `/search` returned `verses: []` for every poem, so the UI snippet disappeared. Phase 4d fixed this in the Worker (`ganj-d1-worker`, branch `phase4d-search-snippets`): each poem result now carries one excerpt, the couplet that contains the normalized query (or the first couplet). See `docs/phase4d-report.md`.

Decisions made in Phase 4d:
- **Separate flag.** `SEARCH_BACKEND=d1` switches `/api/search`. `CONTENT_BACKEND=d1` no longer switches search.
- **Result order accepted:** poems are ordered newest id first (`rowid DESC`) on the D1 path. The legacy route has no `ORDER BY`, so no fixed order is promised on either path.

## Rate limit

- Limit: **30 requests per 60 seconds per client IP** (Upstash sliding window, prefix `ganj:search`).
- IP source: first value of `x-forwarded-for`, then `x-real-ip`, else `unknown`.
- Exceeded: HTTP 429 with `Retry-After` (seconds until the window resets).
- Without Upstash env vars the limiter is off. On Upstash error the request is allowed and `[search-ratelimit] unavailable` is logged (fail open).

## 20-query comparison (D1 vs Supabase path, local dev; Phase 4c)

Superseded by the complete id-set comparison in Phase 4d (`docs/phase4d-report.md`).

Both servers ran locally against the same deployed Worker and production Supabase. Queries: `حافظ سعدی مولوی عشق عاشق گل شب دل یار کفر كفر یک يك غزلیات دیوان شاهنامه بزرگ ماه مرگ دوست`, with `type=all&count=true&limit=20`.

- **Status:** 20 of 20 return 200 on both paths.
- **Top-level key shape:** identical in 10 of 20. The other 10 are the Supabase timeouts below.
- **Element shape** (poets, categories, poems fields and types): 0 differences in all groups.
- **Supabase timeouts:** 10 queries (`عشق عاشق گل شب دل یار یک يك ماه دوست`) lost the `poems` key and `totalPoems`. The dev log shows `canceling statement due to statement timeout` for each. This is the legacy route's error path, not a shape difference.
- **Totals differ** for most queries. Causes: the Arabic kaf query `كفر` (D1 4166, Supabase 1, because D1 folds Arabic kaf); harakat variants and word-level matching (D1 slightly higher). Expected from the normalization and word/trigram design.
- **Ids:** for the queries checked (not all 20), the Supabase poem and category ids were almost always in the Worker's first 100 results. One exception: 19 of 20 Supabase categories for `دیوان` were found. Id-order differences are expected (see Blocker/Result order). This check was partial; a full id-set comparison is still open.
- **`verses`:** see Blocker.

Local cold start: the first request after a restart hit the 3 s timeout and fell back, logging `[d1-fallback] scope=search reason=timeout action=supabase`. Subsequent Worker calls took 170 to 360 ms. This is a one-time cost and it is handled correctly by the fallback.

## Environment variables (Vercel Preview)

Do this in the Vercel dashboard. I have not changed Vercel.

1. Open the Ganjeh project → Settings → Environment Variables.
2. Add `D1_WORKER_URL` (Preview scope only, or restrict to branch `d1-backend`). Value: the Worker's `https://…workers.dev` URL, from `ganj-d1-worker`. Keep it out of the chat log.
3. Add `D1_WORKER_SECRET` (Preview scope, mark **Sensitive**). Value: `GANJ_KEY` from `ganj-d1-worker/.env.phase4b`.
4. Add `CONTENT_BACKEND=d1` (Preview scope only). Since Phase 4d this no longer switches search. Add `SEARCH_BACKEND=d1` separately to test search.
5. Optional: `SEARCH_FALLBACK_SUPABASE=true` (the default already applies if unset).
6. Upstash variables already exist for the contact form and Telegram; check they are set for Preview too, or the rate limit is off.
7. Redeploy the Preview for `d1-backend`. Production variables stay unchanged.

## Files changed (branch `d1-backend`, local commit only)

- `src/app/api/search/route.ts`: dispatcher. `CONTENT_BACKEND !== 'd1'` runs the legacy code unchanged.
- `src/lib/search/` (new): `normalize.ts`, `normalize.golden.json`, `query.ts`, `ratelimit.ts`, `handler.ts`, and their tests.
- `src/lib/worker-client.ts` (new): shared Worker client with timeout and failure reasons. `src/lib/worker-client.test.ts`.
- `src/lib/fallback-log.ts` (new): one-line `[d1-fallback]` format, plus test.
- `src/lib/d1-api.ts`: rebuilt on the shared client (same behaviour, reason codes).
- `src/lib/hybrid-api.ts`, `src/lib/hybrid-api-server.ts`: content fallback logging; migrated-id lookup no longer fails the page.
- `.env.example`, `package.json` (`test:unit` script), `docs/d1-cutover-checklist.md`, this report.

No secrets are in the committed files. `.env.local` (git-ignored) holds `D1_WORKER_URL` and `D1_WORKER_SECRET` for local testing, copied from `ganj-d1-worker` without printing.
