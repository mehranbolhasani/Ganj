# Making `/poet/:id/category/:categoryId` and the chapter page cacheable while keeping `?page=` URLs

**Status: not implemented.** Both options that would make these routes statically cacheable change what a visitor (or a non-JS crawler) can observe for `?page=N` URLs, which this phase forbids. The options and trade-offs are documented here so a later phase can decide with the Vercel/SEO context in hand.

**Current situation** (see `docs/caching-audit.md`):

- `src/app/poet/[id]/category/[categoryId]/page.tsx:27–31` and
  `src/app/poet/[id]/category/[categoryId]/chapter/[chapterId]/page.tsx:28–32` both `await searchParams` and read `page`.
  Awaiting `searchParams` opts the route out of static/ISR HTML caching, so every request with any query string is a full server render. After change 3, the Supabase data behind those renders is now served from the Data Cache, so per-request DB cost is mostly gone — but the HTML render itself (plus the RSC payload carrying the whole poem list) still runs per request.
- Pagination is client-side: the page sends the **entire poem list** to `PoemPagination` (`src/components/PoemPagination.tsx:44`, `slice(startIndex, endIndex)`), which shows 20 items per page and links `?page=N` (`PoemPagination.tsx:46–48`).

## Option A — read the page param in a client component (no URL change)

Move `currentPage` from the awaited `searchParams` into `PoemPagination` itself (`useSearchParams()` inside the already-client component, wrapped in the existing `<Suspense>` boundary). The server page stops awaiting `searchParams` and becomes ISR-cached with the existing `revalidate = 3600`.

- URLs: unchanged (`?page=N` links keep working).
- Supabase: one ISR render per category/chapter per hour instead of per request.
- **Trade-off that blocks it:** on statically served pages, Vercel/NextISR cache is keyed by path, not query string. A request to `?page=2` receives the page-1 HTML; the correct page-2 slice only appears after React hydrates and `useSearchParams()` supplies the page number. Two current behaviors change visibly:
  1. visitors see a page-1 flash before the page-2 list renders;
  2. crawlers that don't execute JS (and crawlers that don't wait for hydration) index only page-1 links for every `?page=N` URL — today the SSR HTML contains the page-N links.
- Verdict: cheap and safe from a DB perspective, but changes first-paint HTML and crawler-visible content → not allowed in this phase.

## Option B — server-side pagination with real path segments (`.../page/2/`)

Make the server page fetch only 20 poems in-range (`.range(start, end)`) and encode the page as a route segment; `?page=N` URLs would 308-redirect to the new paths.

- URLs: **changes** (new canonical URLs for pages ≥ 2; redirects of existing URLs). Forbidden in this phase; also needs rel=canonical care to avoid softening SEO of the paginated URLs that currently work.
- Supabase: smallest possible payloads (only 20 rows, no extra client bundle), fully ISR-cacheable per segment.
- Verdict: best long-term architecture, explicitly out of bounds now (URL + metadata/canonical changes).

## Option C — keep `?page=` searchParams, rely on data caching (today's state after change 3)

Keep the routes dynamic, but all heavy Supabase fetches hit the Data Cache (1h), so the per-request DB cost ≈ 0 and the render only re-assembles HTML/RSC from cached JSON.

- URLs/SEO/HTML: unchanged — zero risk.
- Trade-off: the render (and the big RSC poem-list payload) still executes per request; compute + bandwidth on Vercel instead of Supabase.
- Verdict: **current state**; the safest option and acceptable while Option A/B are evaluated.

## Option D — hybrid: ISR page + bot-only static first page

Serve `?page=1` (or no param) statically and keep `?page>=2` dynamic (e.g. by suppressing `page` read when absent). Doesn't change page-1 rendering, only page ≥ 2 stays as-is — i.e. ~no win for tomb crawlers hitting deep pages, plus added complexity.

- Verdict: not worth it this phase (no meaningful win for bot crawlers hitting deep pages, plus added complexity).

## Recommendation

either Option A if the team accepts the first-paint flip for page ≥ 2, or Option B if URL changes are acceptable as a deliberate SEO redesign. Both should be verified on a Vercel preview with real user-agent tests before rollout.
