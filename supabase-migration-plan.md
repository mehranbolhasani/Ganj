# Supabase Migration Plan: Performance & Speed Optimization

## Executive Summary

**Goal**: Migrate from Ganjoor API to Supabase as the primary data source for poets, categories, and poems to achieve:
- ⚡ **10-50x faster response times** (Supabase: ~50-200ms vs Ganjoor API: ~500-2000ms)
- 🚀 **Better reliability** (no external API dependency for famous poets)
- 💰 **Cost savings** (reduced external API calls)
- 📊 **Better caching** (PostgreSQL connection pooling + edge caching)
- 🔍 **Enhanced search** (already using Supabase for search)

**Current State**:
- ✅ Supabase is already set up with `poets`, `categories`, `poems` tables
- ✅ Famous poets' works are already migrated to Supabase (15+ poets)
- ✅ Supabase is currently ONLY used for search functionality
- ⚠️ Ganjoor API is used for all regular data fetching (with caching)

**Proposed Strategy**: Hybrid approach with intelligent fallback
- **Primary**: Supabase for famous poets (already in DB)
- **Fallback**: Ganjoor API for poets not yet in Supabase
- **Progressive Migration**: Gradually migrate more poets to Supabase

---

## Phase 1: Assessment & Data Verification

### 1.1 Audit Current Supabase Data
**Goal**: Understand what data is already in Supabase

**Tasks**:
- [ ] Query Supabase to count poets, categories, poems
- [ ] Verify famous poets data completeness (Hafez, Saadi, Molavi, etc.)
- [ ] Check data quality (missing fields, inconsistencies)
- [ ] Compare Supabase data with Ganjoor API for sample poets

**Files to Create**:
- `scripts/audit-supabase-data.ts` - Audit script

**Expected Output**:
```
Poets in Supabase: ~15+ (famous poets)
Categories in Supabase: ~500+ 
Poems in Supabase: ~50,000+
```

### 1.2 Identify Data Gaps
**Goal**: Determine which poets/categories/poems are missing

**Tasks**:
- [ ] Compare Supabase poets list with Ganjoor API poets list
- [ ] Identify missing categories for famous poets
- [ ] Identify missing poems for famous poets
- [ ] Create migration priority list (most accessed first)

**Files to Create**:
- `scripts/compare-data-sources.ts` - Comparison script

---

## Phase 2: Create Supabase API Client

### 2.1 Create Supabase Client Utility
**Goal**: Centralized Supabase client with error handling

**Files to Create**:
- `src/lib/supabase-api.ts` - New Supabase API client

**Key Features**:
```typescript
// Similar structure to ganjoor-api.ts but using Supabase
export const supabaseApi = {
  async getPoets(): Promise<Poet[]>
  async getPoet(id: number): Promise<{ poet: Poet; categories: Category[] }>
  async getCategoryPoems(poetId: number, categoryId: number): Promise<Poem[]>
  async getPoem(id: number): Promise<Poem>
  // ... etc
}
```

**Benefits**:
- Same interface as `ganjoorApi` for easy migration
- Built-in connection pooling
- Automatic retries and error handling
- Type-safe queries

### 2.2 Implement Hybrid API Strategy
**Goal**: Smart fallback between Supabase and Ganjoor API

**Strategy**:
```typescript
// Priority: Supabase → Ganjoor API (fallback)
async getPoet(id: number) {
  try {
    // Try Supabase first
    const data = await supabaseApi.getPoet(id);
    if (data) return data;
  } catch (error) {
    // Log for monitoring
    console.warn(`Poet ${id} not in Supabase, falling back to Ganjoor API`);
  }
  
  // Fallback to Ganjoor API
  return ganjoorApi.getPoet(id);
}
```

**Files to Create**:
- `src/lib/hybrid-api.ts` - Hybrid API client

**Benefits**:
- Zero downtime migration
- Gradual rollout capability
- Automatic fallback for missing data
- Performance monitoring per data source

---

## Phase 3: Update Components to Use Hybrid API

### 3.1 Update Data Fetching Points
**Goal**: Replace Ganjoor API calls with hybrid API

**Files to Modify**:
- `src/app/page.tsx` - Homepage poets list
- `src/app/poet/[id]/page.tsx` - Poet detail page
- `src/app/poet/[id]/category/[categoryId]/page.tsx` - Category page
- `src/app/poem/[id]/page.tsx` - Poem detail page
- `src/components/PoetsGrid.tsx` - Poets grid component
- `src/components/PoetsDropdown.tsx` - Poets dropdown

**Migration Strategy**:
1. Import hybrid API: `import { hybridApi } from '@/lib/hybrid-api'`
2. Replace `ganjoorApi.getPoets()` → `hybridApi.getPoets()`
3. Replace `ganjoorApi.getPoet(id)` → `hybridApi.getPoet(id)`
4. Replace `ganjoorApi.getPoem(id)` → `hybridApi.getPoem(id)`
5. Test thoroughly

**Benefits**:
- Immediate performance improvement for famous poets
- No breaking changes (same interface)
- Automatic fallback for non-migrated poets

### 3.2 Update Caching Strategy
**Goal**: Optimize caching for Supabase queries

**Files to Modify**:
- `src/lib/api-cache.ts` - Update caching strategy

**Changes**:
- Longer TTL for Supabase data (more reliable)
- Shorter TTL for Ganjoor API fallback
- Different cache keys for Supabase vs Ganjoor
- Cache warming for famous poets from Supabase

**Example**:
```typescript
// Supabase: Cache for 1 hour (more reliable)
const SUPABASE_TTL = 60 * 60 * 1000;

// Ganjoor API: Cache for 5 minutes (less reliable)
const GANJOOR_TTL = 5 * 60 * 1000;
```

---

## Phase 4: Performance Optimization

### 4.1 Database Indexing
**Goal**: Optimize Supabase queries with proper indexes

**Indexes to Add**:
```sql
-- Fast poet lookups
CREATE INDEX IF NOT EXISTS idx_poets_id ON poets(id);
CREATE INDEX IF NOT EXISTS idx_poets_slug ON poets(slug);

-- Fast category lookups
CREATE INDEX IF NOT EXISTS idx_categories_poet_id ON categories(poet_id);
CREATE INDEX IF NOT EXISTS idx_categories_id ON categories(id);

-- Fast poem lookups
CREATE INDEX IF NOT EXISTS idx_poems_id ON poems(id);
CREATE INDEX IF NOT EXISTS idx_poems_poet_id ON poems(poet_id);
CREATE INDEX IF NOT EXISTS idx_poems_category_id ON poems(category_id);

-- Full-text search indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_poems_search ON poems USING gin(to_tsvector('persian', title || ' ' || verses));
```

**Files to Create**:
- `scripts/add-supabase-indexes.sql` - Index creation script

### 4.2 Query Optimization
**Goal**: Optimize Supabase queries for speed

**Optimizations**:
- Use `select()` with specific fields (not `*`)
- Use joins instead of multiple queries
- Batch queries where possible
- Use Supabase connection pooling
- Implement query result caching at database level

**Example**:
```typescript
// ❌ Bad: Multiple queries
const poet = await supabase.from('poets').select('*').eq('id', id).single();
const categories = await supabase.from('categories').select('*').eq('poet_id', id);

// ✅ Good: Single query with join
const { data } = await supabase
  .from('poets')
  .select(`
    id, name, slug, description, birth_year, death_year,
    categories (
      id, title, url_slug, poem_count
    )
  `)
  .eq('id', id)
  .single();
```

### 4.3 Edge Caching
**Goal**: Leverage Vercel Edge Caching + Supabase

**Strategy**:
- Use Next.js `revalidate` for static pages
- Cache Supabase responses at edge (Vercel CDN)
- Implement ISR (Incremental Static Regeneration)
- Use Supabase's built-in caching headers

**Files to Modify**:
- `src/app/poet/[id]/page.tsx` - Add `revalidate` export
- `src/app/poem/[id]/page.tsx` - Add `revalidate` export

---

## Phase 5: Data Migration (Progressive)

### 5.1 Migrate Most-Accessed Poets
**Goal**: Migrate poets based on usage analytics

**Priority Order**:
1. Famous poets (already done ✅)
2. Poets with most views (if analytics available)
3. Poets with most poems
4. Remaining poets alphabetically

**Files to Use**:
- `scripts/migrate-to-supabase.ts` - Update for progressive migration

**Migration Process**:
```typescript
// 1. Fetch from Ganjoor API
const poet = await ganjoorApi.getPoet(id);
const categories = await ganjoorApi.getPoet(id);

// 2. Transform to Supabase format
const supabasePoet = transformToSupabase(poet);

// 3. Insert into Supabase
await supabase.from('poets').upsert(supabasePoet);
await supabase.from('categories').upsert(categories);
await supabase.from('poems').upsert(poems);

// 4. Verify data integrity
const verify = await supabase.from('poets').select('*').eq('id', id);
```

### 5.2 Data Synchronization
**Goal**: Keep Supabase in sync with Ganjoor API

**Strategy**:
- Daily sync job for new/updated poets
- Weekly full sync for data integrity
- Monitor for data discrepancies

**Files to Create**:
- `scripts/sync-supabase-data.ts` - Sync script
- `src/app/api/cron/sync-data/route.ts` - Vercel Cron job

---

## Phase 6: Monitoring & Analytics

### 6.1 Performance Monitoring
**Goal**: Track performance improvements

**Metrics to Track**:
- Response time per data source (Supabase vs Ganjoor)
- Cache hit rate
- Error rate per data source
- User experience metrics (LCP, FCP, TTFB)

**Files to Create**:
- `src/lib/performance-monitor.ts` - Performance tracking

**Example**:
```typescript
const startTime = performance.now();
const data = await hybridApi.getPoet(id);
const duration = performance.now() - startTime;

trackPerformance({
  source: 'supabase', // or 'ganjoor'
  endpoint: 'getPoet',
  duration,
  success: true
});
```

### 6.2 Data Source Analytics
**Goal**: Understand which poets need migration

**Analytics**:
- Track which poets are accessed via Ganjoor API (fallback)
- Identify most-accessed poets not in Supabase
- Monitor Supabase vs Ganjoor API usage ratio

**Dashboard**:
- Create internal dashboard (optional)
- Log to Vercel Analytics
- Track in Supabase dashboard

---

## Phase 7: Testing & Validation

### 7.1 Unit Tests
**Goal**: Test hybrid API functionality

**Tests to Create**:
- Supabase API client tests
- Hybrid API fallback tests
- Data transformation tests
- Error handling tests

**Files to Create**:
- `src/lib/__tests__/supabase-api.test.ts`
- `src/lib/__tests__/hybrid-api.test.ts`

### 7.2 Integration Tests
**Goal**: Test end-to-end functionality

**Tests to Create**:
- Poet page loading (Supabase vs Ganjoor)
- Poem page loading
- Search functionality
- Cache behavior

### 7.3 Performance Tests
**Goal**: Verify performance improvements

**Tests**:
- Load testing with Supabase
- Compare response times
- Test cache effectiveness
- Test fallback performance

---

## Phase 8: Rollout Strategy

### 8.1 Feature Flag
**Goal**: Gradual rollout with ability to rollback

**Implementation**:
```typescript
// Feature flag for Supabase
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

async getPoet(id: number) {
  if (USE_SUPABASE) {
    return hybridApi.getPoet(id);
  }
  return ganjoorApi.getPoet(id);
}
```

**Benefits**:
- A/B testing capability
- Easy rollback if issues occur
- Gradual rollout to users

### 8.2 Rollout Plan
**Timeline**:
1. **Week 1**: Deploy hybrid API (100% Ganjoor API, 0% Supabase)
2. **Week 2**: Enable Supabase for famous poets only (15% traffic)
3. **Week 3**: Monitor performance and errors
4. **Week 4**: Expand to more poets (50% traffic)
5. **Week 5**: Full rollout (100% Supabase where available)

**Monitoring**:
- Daily performance reports
- Error rate monitoring
- User feedback collection

---

## Expected Benefits

### Performance Improvements
- ⚡ **Response Time**: 500-2000ms → 50-200ms (10x faster)
- 🚀 **Cache Hit Rate**: Improved edge caching
- 📊 **Database Queries**: Optimized with indexes
- 💾 **Reduced API Calls**: Less dependency on external API

### Reliability Improvements
- ✅ **Uptime**: Supabase 99.9% vs Ganjoor API variable
- 🔄 **Fallback**: Automatic fallback for missing data
- 📈 **Scalability**: PostgreSQL handles high load better

### Cost Improvements
- 💰 **Reduced API Calls**: Less external API usage
- 📉 **Bandwidth**: Local database queries
- 🎯 **Caching**: Better cache utilization

---

## Risks & Mitigations

### Risk 1: Data Inconsistency
**Mitigation**: 
- Data validation scripts
- Regular sync jobs
- Fallback to Ganjoor API

### Risk 2: Performance Degradation
**Mitigation**:
- Feature flags for rollback
- Performance monitoring
- Gradual rollout

### Risk 3: Missing Data
**Mitigation**:
- Automatic fallback to Ganjoor API
- Data migration scripts
- Progressive migration

### Risk 4: Supabase Costs
**Mitigation**:
- Monitor usage
- Optimize queries
- Use connection pooling
- Leverage free tier limits

---

## Success Criteria

### Performance Metrics
- ✅ Response time < 200ms for 95% of requests
- ✅ Cache hit rate > 80%
- ✅ Error rate < 0.1%

### Functional Metrics
- ✅ All pages load correctly
- ✅ Search functionality works
- ✅ No data loss or corruption
- ✅ Fallback works correctly

### User Experience
- ✅ Faster page loads (user-perceived)
- ✅ No broken pages
- ✅ Smooth navigation

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Audit Supabase data
- [ ] Create Supabase API client
- [ ] Create hybrid API client
- [ ] Add database indexes

### Week 3-4: Integration
- [ ] Update components to use hybrid API
- [ ] Update caching strategy
- [ ] Add performance monitoring
- [ ] Write tests

### Week 5-6: Rollout
- [ ] Deploy with feature flag (0% Supabase)
- [ ] Enable for famous poets (15%)
- [ ] Monitor and optimize
- [ ] Expand to more poets (50%)

### Week 7-8: Completion
- [ ] Full rollout (100%)
- [ ] Data migration for remaining poets
- [ ] Documentation
- [ ] Performance report

---

## Files Summary

### New Files to Create
- `src/lib/supabase-api.ts` - Supabase API client
- `src/lib/hybrid-api.ts` - Hybrid API client
- `scripts/audit-supabase-data.ts` - Data audit script
- `scripts/compare-data-sources.ts` - Data comparison script
- `scripts/add-supabase-indexes.sql` - Database indexes
- `scripts/sync-supabase-data.ts` - Data sync script
- `src/lib/performance-monitor.ts` - Performance tracking
- `src/lib/__tests__/supabase-api.test.ts` - Unit tests

### Files to Modify
- `src/app/page.tsx` - Use hybrid API
- `src/app/poet/[id]/page.tsx` - Use hybrid API
- `src/app/poet/[id]/category/[categoryId]/page.tsx` - Use hybrid API
- `src/app/poem/[id]/page.tsx` - Use hybrid API
- `src/components/PoetsGrid.tsx` - Use hybrid API
- `src/components/PoetsDropdown.tsx` - Use hybrid API
- `src/lib/api-cache.ts` - Update caching strategy

### Files to Keep (for fallback)
- `src/lib/ganjoor-api.ts` - Keep for fallback
- `src/lib/simple-api.ts` - Keep for fallback

---

## Next Steps

1. **Review this plan** with the team
2. **Approve the approach** (hybrid vs full migration)
3. **Set up Supabase credentials** (if not already done)
4. **Run data audit** to understand current state
5. **Create Supabase API client** as proof of concept
6. **Test with famous poets** first
7. **Gradual rollout** based on results

---

## Questions to Consider

1. **Should we migrate all poets or just famous ones?**
   - Recommendation: Start with famous poets, then expand based on usage

2. **How to handle data updates?**
   - Recommendation: Daily sync job + manual trigger for updates

3. **What about Supabase costs?**
   - Recommendation: Monitor usage, optimize queries, use free tier limits

4. **Should we keep Ganjoor API as fallback?**
   - Recommendation: Yes, for at least 6 months after full migration

5. **How to handle missing data?**
   - Recommendation: Automatic fallback to Ganjoor API + logging for migration

---

**Status**: 📋 Plan Ready for Review
**Next Action**: Review plan and get approval before implementation

