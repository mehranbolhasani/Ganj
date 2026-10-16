# Phase 4d: search ready for a Vercel Preview (branch `d1-backend`)

**Result: pass.** Poem results now carry excerpts, search has its own flag (`SEARCH_BACKEND`), and the deployed Worker passes all checks. Nothing was pushed, nothing was changed on Vercel or Supabase, and no D1 database or KV key was created, deleted or reloaded. The Worker was redeployed once, after local tests passed.

## Pass / fail per item

| # | Item | Result | Numbers |
|---|---|---|---|
| 1 | Worker: excerpt per poem result, from `verses_json`, one query, ≤100 params | **Pass** | One couplet per poem (2 misras, or 1 for an odd trailing misra). Read in the same statement as the poem list. Extra statements: **0**. Extra rows returned: **0** (see cost below). |
| 1 | Local tests (emulated D1 and KV): word, trigram, 2-char, Arabic letters, no-match-in-excerpt, six capped poems, 401 | **Pass** | `test:unit` 8/8. `test:snippets` 54/54. Existing `npm test` (05) all PASS. |
| 1 | Deployed Worker: existing API tests (05 `--remote`) | **Pass** | poets, poems, categories, KV, 40 search queries (0 mismatches), limits, auth 401/200, 404, extras. |
| 1 | Deployed Worker: snippets for every poem result, 20 queries | **Pass** | 54/54 deployed checks. Benchmark 20 queries: **400/400** poem results have an excerpt matching the oracle. |
| 1 | Deployed version id | `7a920c21-5cfc-434a-b031-7afff15461f8` | Deployed with `wrangler deploy` (bindings unchanged, GANJ_KEY secret untouched). |
| 2 | `SEARCH_BACKEND=d1` switches search; `CONTENT_BACKEND=d1` does not | **Pass** | `searchBackendFromEnv` (unset, `CONTENT_BACKEND=d1` alone, and non-`d1` values all give `supabase`). 4 unit tests. |
| 2 | Defaults unchanged, `.env.example`, unit tests, docs | **Pass** | Both flags default to current behaviour. `.env.example` has `SEARCH_BACKEND` and `SEARCH_FALLBACK_SUPABASE`. Checklist and Phase 4c report updated. |
| 3 | Cold-path timing, 12 requests, 90 s apart, `/search` and `/poems/:id` | **Pass** (no request >1 s) | See below. |
| 4 | Id-set comparison, D1 vs Supabase, 20 queries | **Pass** | 8 counted, 12 excluded (Supabase timeout). Every missing id explained. See below. |
| 5 | `tsc`, eslint, `build:verify`, unit tests | **Pass** | tsc 0 errors. Lint: 0 errors, 2 warnings (existing, `changelog/page.tsx`). `build:verify`: production ready. Unit tests 44/44. |

## Decisions

- **Separate flag.** `SEARCH_BACKEND=d1` switches `/api/search`. `CONTENT_BACKEND=d1` no longer switches search.
- **Result order accepted:** newest id first (`rowid DESC`) on the D1 path. The legacy route has no `ORDER BY`, so no fixed order is promised on either path.
- **Excerpt rule:** the couplet containing the normalized query (phrase match inside the couplet, so a phrase spanning its two misras still matches), else the first couplet. Only that couplet is returned, never the whole poem.
- **Merged read, no extra query.** The excerpt is read in the same statement as the poem list. A separate query would have added one row read per result (about 20 per search).

## Snippet cost (A/B, local: HEAD vs working tree)

Benchmark 20 queries, `type=poems`, default limit 20, same data. Script: `ganj-d1-worker/scripts/20-snippet-cost.mjs`.

| Per search (average) | HEAD (no excerpts) | With excerpts | Difference |
|---|---|---|---|
| Statements | 1.75 | 1.75 | **0** |
| Rows returned (proxy for rows read) | 35 | 35 | **0** |
| Response bytes | 3,902 | 11,243 | **+7,342 B** |
| Bytes per poem result | | | **+367 B** |

Rows returned is a proxy. The Worker cannot see D1's `rows_read`, so the real billed number is not measured here.

## Cold path (deployed, from this machine)

12 requests, 90 s apart, alternating `/search?q=عشق&type=poems&limit=20` and `/poems/1119`. Each request is a fresh `curl`, so DNS, TCP and TLS are paid every time. Script: `ganj-d1-worker/scripts/21-cold-path.mjs`. Raw data: `build/cold-path.json` (gitignored).

| | Value |
|---|---|
| All HTTP 200 | yes |
| Time to first byte, min / median / max | 228 / 326 / 522 ms |
| First request (after idle) | 522 ms |
| Requests over 1 s | **0** of 12 |
| `/search` median / max | 399 / 522 ms |
| `/poems/:id` median / max | 286 / 326 ms |

Most of the time is the network round trip from here (TCP and TLS alone are 100 to 250 ms per request). The Worker-side time is smaller.

**Recommendation.**
- **Timeout:** keep the 3 s timeout. The worst observed time was 522 ms, about 6× headroom. 2 s would still have passed this sample, but 12 requests is a small sample.
- **Retry:** not implemented. No request timed out, and a retry would add up to another full timeout to a page that is already falling back. The Supabase fallback already covers failure. Reconsider only if a Preview shows real timeouts.

## Id-set comparison (D1 vs legacy Supabase path, 20 queries)

Legacy path: Ganjeh dev server, default mode (`SEARCH_BACKEND` unset), `type=poems&limit=100&count=true`. D1 path: deployed Worker, same parameters. Full D1 match set: from the local index, which matches the deployed totals for all 8 counted queries. Script: `ganj-d1-worker/scripts/22-search-idset.mjs`. Raw data: `build/search-idset-4d.json` (gitignored).

**Counted (Supabase responded): 8 of 20.** Excluded (Supabase statement timeout): `سعدی عشق عاشق گل شب دل یار یک يك دیوان ماه دوست` (12 queries).

| Query | Path | Supabase ids | In D1's first page | Missing | Explanation |
|---|---|---|---|---|---|
| حافظ | trigram | 100 | 94 | 6 | all ordering-window |
| مولوی | trigram | 100 | 99 | 1 | ordering-window |
| کفر | trigram | 100 | 53 | 47 | ordering-window |
| كفر | trigram | 1 | 1 | 0 | Arabic kaf normalized (D1 finds 4,166, Supabase 1) |
| غزلیات | trigram | 64 | 64 | 0 | |
| شاهنامه | trigram | 49 | 49 | 0 | |
| بزرگ | trigram | 100 | 100 | 0 | |
| مرگ | trigram | 100 | 100 | 0 | |
| **Total** | | **614** | **560** | **54** | **54 ordering-window, 0 unexplained** |

- **Ordering-window (54 of 54):** each missing id is in D1's full match set, but outside the first 100 results (`rowid DESC`). The legacy window is arbitrary, so it can contain older poems that the newest-first page does not.
- **Not matched by D1 at all:** 0. Every id Supabase returned is in D1's full match set.
- **Unexplained:** 0.
- For the 8 counted queries the local full set equals the deployed `totalPoems` in all cases, so the local oracle matches the deployed data.

## Known limitations

- The id comparison covers 8 of 20 queries. The other 12 need a Supabase run without timeouts, or a longer window.
- The cold-path sample is 12 requests from one location.
- Rows returned is a proxy for `rows_read`.

## Deployment and Vercel Preview (not done by me)

Repos: `ganj-d1-worker` branch `phase4d-search-snippets` (`cd89fee` plus the scripts commit). Ganjeh branch `d1-backend`.

For a Preview of `d1-backend` (Vercel dashboard, Preview scope only):
1. `SEARCH_BACKEND=d1`
2. `D1_WORKER_URL`: the Worker's `workers.dev` URL
3. `D1_WORKER_SECRET` (mark **Sensitive**): the `GANJ_KEY` value from `ganj-d1-worker/.env.phase4b`
4. Optional: `SEARCH_FALLBACK_SUPABASE` (default on when unset)
5. Check that the Upstash variables are set for Preview, or the rate limit is off
6. Redeploy the Preview. `CONTENT_BACKEND` can stay `supabase` to test search alone.
