# Performance Optimization Plan - Speed Insights Fix

Based on Vercel Speed Insights results:
- **INP: 432ms** (Target: <200ms) ❌
- **CLS: 0.27** (Target: <0.1) ❌
- Other metrics are good ✅

## 🔴 Critical: Fix INP (Interaction to Next Paint)

### 1. Optimize GlobalSearch Component
**Problem**: Heavy search operations blocking main thread

**Solutions**:
```typescript
// src/components/GlobalSearch.tsx
- Increase debounce from 300ms to 500ms
- Use useTransition for search state updates
- Implement virtual scrolling for large result sets
- Add requestIdleCallback for non-critical updates
```

### 2. Optimize Search API Calls
**Problem**: Supabase queries might be slow

**Solutions**:
```typescript
// src/lib/supabase-search.ts
- Add result caching with Map/WeakMap
- Limit results to 20 items max (currently 50)
- Use AbortController to cancel stale requests
- Add search query throttling
```

### 3. Reduce Main Thread Blocking
**Solutions**:
- Move heavy computations to Web Workers
- Use `useTransition` for state updates
- Defer non-critical JavaScript
- Code split heavy components

## 🟡 Important: Fix CLS (Cumulative Layout Shift)

### 1. Fix Image Loading
**Problem**: Images loading without reserved space

**Solutions**:
```typescript
// src/components/FamousPoets.tsx & PoetCard.tsx
- Add explicit width/height to all <Image> components
- Use aspect-ratio CSS for containers
- Preload critical images with priority
```

Example:
```tsx
<Image
  src={poetImage}
  alt={poet.name}
  width={384}  // Add explicit dimensions
  height={384}
  className="..."
  priority={isFamous} // Only for above-fold
/>
```

### 2. Reserve Space for Dynamic Content
**Problem**: Content shifting when loaded

**Solutions**:
```typescript
// Add skeleton placeholders with exact dimensions
// Use min-height on dynamic containers
// Avoid inserting content above existing content
```

### 3. Optimize Grid Background
**Problem**: Background might cause layout shift

**Solutions**:
```css
/* src/app/globals.css */
.grid-background {
  content-visibility: auto; /* Browser optimization */
  contain: layout style paint; /* Contain layout changes */
}
```

## 🎯 Quick Wins (Implement First)

### 1. Optimize GlobalSearch Debounce
```typescript
// Change from 300ms to 500ms
const timeoutId = setTimeout(() => {
  if (query.trim()) {
    search(query);
  }
}, 500); // Increased from 300ms
```

### 2. Add Explicit Image Dimensions
```tsx
// In FamousPoets.tsx
<div className="relative w-24 h-24 md:w-32 md:h-32">
  <Image
    src={`/images/${poet.image}`}
    alt={poet.name}
    width={128}
    height={128}
    className="..."
  />
</div>
```

### 3. Use useTransition for Heavy Updates
```typescript
const [isPending, startTransition] = useTransition();

const handleSearch = (query: string) => {
  startTransition(() => {
    setResults(newResults);
  });
};
```

### 4. Limit Search Results
```typescript
// src/lib/supabase-search.ts
export async function searchAll(query: string, limit: number = 20) {
  // Changed from 50 to 20
}
```

### 5. Add Result Caching
```typescript
const searchCache = new Map<string, SearchResponse>();

export async function searchAll(query: string, limit: number = 20) {
  const cacheKey = `${query}-${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }
  
  const results = await fetch(...);
  searchCache.set(cacheKey, results);
  return results;
}
```

## 📊 Expected Results After Fixes

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| INP | 432ms | <200ms | 🔴 Critical |
| CLS | 0.27 | <0.1 | 🟡 Important |
| FCP | 0.6s | <1.8s | ✅ Good |
| LCP | 1.36s | <2.5s | ✅ Good |
| FID | 22ms | <100ms | ✅ Good |
| TTFB | 0.37s | <0.8s | ✅ Good |

## 🚀 Implementation Order

1. **Phase 1 (Quick Wins - 30 mins)**:
   - Increase search debounce to 500ms
   - Limit search results to 20
   - Add explicit image dimensions

2. **Phase 2 (Medium Impact - 1 hour)**:
   - Add useTransition to GlobalSearch
   - Implement search result caching
   - Fix CLS in poet cards and grids

3. **Phase 3 (Long-term - 2 hours)**:
   - Code split heavy components
   - Optimize font loading
   - Add virtual scrolling for long lists

## 🧪 Testing

After each phase:
```bash
# Run Lighthouse
npx lighthouse https://ganj.directory --view

# Check specific routes
npx lighthouse https://ganj.directory/poet/2 --view
npx lighthouse https://ganj.directory/search?q=عشق --view
```

## 📝 Notes

- INP is most affected by search functionality and heavy JavaScript
- CLS is likely from images and dynamic content loading
- Focus on Phase 1 first - it's the lowest effort with highest impact
- Monitor Vercel Speed Insights after each deployment

