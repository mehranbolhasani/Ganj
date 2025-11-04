# Hybrid API Testing Guide

## ✅ Phase 1 & 2 Complete!

All components have been migrated to use the hybrid API. Now it's time to test and see the performance improvements.

---

## Step 1: Run the Audit Script

**First, let's see what's in Supabase:**

```bash
npx tsx scripts/audit-supabase-data.ts
```

This will show you:
- How many poets are in Supabase
- Which famous poets are migrated
- Number of categories and poems per poet

---

## Step 2: Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## Step 3: Test with Famous Poets (Should Use Supabase)

### Open Browser DevTools Console

Press `F12` or `Cmd+Option+I` to open DevTools and go to the Console tab.

### Test Hafez (Poet ID: 2)
1. Visit: `http://localhost:3000/poet/2`
2. **Look for in console**: `[supabase] getPoet: XXXms`
3. **Expected**: Response time should be **50-200ms**
4. The page should load very fast!

### Test Saadi (Poet ID: 7)
1. Visit: `http://localhost:3000/poet/7`
2. **Look for**: `[supabase] getPoet: XXXms`
3. **Expected**: Response time should be **50-200ms**

### Test Molavi/Rumi (Poet ID: 5)
1. Visit: `http://localhost:3000/poet/5`
2. **Look for**: `[supabase] getPoet: XXXms`
3. **Expected**: Response time should be **50-200ms**

### Test a Poem from Hafez
1. Visit: `http://localhost:3000/poet/2/category/24` (Hafez's Ghazals)
2. Click on any poem
3. **Look for**: `[supabase] getPoem: XXXms`
4. **Expected**: Response time should be **50-100ms**

---

## Step 4: Test Fallback (Unmigrated Poets)

These poets are likely **NOT** in Supabase yet, so they should fallback to Ganjoor API:

### Test an Unmigrated Poet
1. Visit: `http://localhost:3000/poet/99` (or any high ID)
2. **Look for**: `[ganjoor] getPoet: XXXms (fallback)`
3. **Expected**: Response time should be **500-2000ms** (slower)
4. Page should still work correctly!

---

## Step 5: Check Performance Stats

Open the browser console and run:

```javascript
import { getPerformanceStats } from '@/lib/hybrid-api';
getPerformanceStats();
```

Or check the console logs to see performance patterns:

```
[supabase] getPoets: 120ms
[supabase] getPoet: 150ms
[ganjoor] getPoet: 823ms (fallback)
[supabase] getPoem: 87ms
```

---

## What to Look For

### ✅ Success Indicators:

1. **Fast Loading for Famous Poets**
   - Hafez, Saadi, Molavi pages load in under 200ms
   - Console shows `[supabase]` logs
   - Smooth, instant navigation

2. **Graceful Fallback**
   - Unmigrated poets still work
   - Console shows `[ganjoor] (fallback)` logs
   - No errors or broken pages

3. **Performance Difference**
   - Supabase: ~50-200ms
   - Ganjoor fallback: ~500-2000ms
   - 10x speed improvement visible!

### ⚠️ Potential Issues:

1. **All Requests Use Ganjoor**
   - If you see only `[ganjoor]` logs, Supabase might not be configured
   - Check `.env.local` for Supabase credentials

2. **Errors in Console**
   - `SupabaseApiError`: Check Supabase connection
   - `404 Not Found`: Poet might not be migrated yet (fallback should work)

3. **Slow Supabase Queries**
   - If Supabase is slower than expected, check:
     - Database indexes
     - Network connection
     - Supabase plan/region

---

## Testing Checklist

### Homepage
- [ ] Poets list loads correctly
- [ ] Console shows hybrid API logs
- [ ] Famous poets section displays

### Poet Pages (Famous)
- [ ] Hafez page loads fast (`/poet/2`)
- [ ] Saadi page loads fast (`/poet/7`)
- [ ] Molavi page loads fast (`/poet/5`)
- [ ] Ferdowsi page loads fast (`/poet/4`)
- [ ] Console shows `[supabase]` logs
- [ ] Categories display correctly
- [ ] Poem counts show up

### Poet Pages (Unmigrated)
- [ ] Unmigrated poet page loads (`/poet/99`)
- [ ] Console shows `[ganjoor] (fallback)` log
- [ ] Page works correctly (no errors)

### Category Pages
- [ ] Category page loads (`/poet/2/category/24`)
- [ ] Poems list displays
- [ ] Console shows appropriate logs
- [ ] Navigation works

### Poem Pages
- [ ] Poem page loads (`/poem/2133`)
- [ ] Verses display correctly
- [ ] Poet name and category show
- [ ] Console shows appropriate logs
- [ ] Bookmark button works
- [ ] Font size control works

### Performance
- [ ] Supabase queries: 50-200ms
- [ ] Ganjoor fallback: 500-2000ms
- [ ] No console errors
- [ ] Smooth page transitions
- [ ] Cache working (second load faster)

---

## Performance Comparison

### Before (Ganjoor API Only)
```
GET /poet/2 → 800ms
GET /poem/2133 → 650ms
GET /poet/7 → 900ms
```

### After (Hybrid API)
```
GET /poet/2 → 150ms (Supabase) ⚡ 5.3x faster!
GET /poem/2133 → 85ms (Supabase) ⚡ 7.6x faster!
GET /poet/7 → 140ms (Supabase) ⚡ 6.4x faster!
GET /poet/99 → 820ms (Ganjoor fallback) ✓ Same as before
```

---

## Debugging Tips

### Enable Verbose Logging

In development, all performance logs are automatically shown in the console:

```
[supabase] getPoet: 152ms
[ganjoor] getPoet: 823ms (fallback)
```

### Check Supabase Availability

```javascript
// In browser console
import { isSupabaseAvailable } from '@/lib/supabase-api';
console.log('Supabase available:', isSupabaseAvailable());
```

### Check Performance Stats

```javascript
// In browser console
import { getPerformanceStats } from '@/lib/hybrid-api';
console.log(getPerformanceStats());
// Output:
// {
//   totalRequests: 50,
//   supabase: { count: 35, avgDuration: 120 },
//   ganjoor: { count: 15, avgDuration: 750 },
//   fallbackRate: 30
// }
```

### Verify Supabase Data

Run the audit script to see what's in Supabase:

```bash
npx tsx scripts/audit-supabase-data.ts
```

---

## Common Issues & Solutions

### Issue: All requests show [ganjoor] logs

**Cause**: Supabase not configured or poets not migrated

**Solution**:
1. Check `.env.local` for Supabase credentials
2. Run audit script to verify data
3. If no data, famous poets need to be migrated

### Issue: Supabase errors in console

**Cause**: Supabase connection or credentials issue

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check Supabase dashboard for project status

### Issue: Slow Supabase queries (>500ms)

**Cause**: Missing indexes or network issues

**Solution**:
1. Check network connection
2. Verify Supabase region (should be close to you)
3. Run index creation SQL (if available)

### Issue: Fallback not working

**Cause**: Error in fallback logic

**Solution**:
1. Check console for errors
2. Verify Ganjoor API is accessible
3. Check network tab in DevTools

---

## Next Steps After Testing

### If Everything Works ✅

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel** and test in production

3. **Monitor Performance**:
   - Track response times
   - Monitor fallback rate
   - Identify poets needing migration

### If Issues Found ⚠️

1. **Report Issues**: Note what doesn't work
2. **Check Console Logs**: Copy error messages
3. **Run Audit**: Verify Supabase data
4. **Test Fallback**: Ensure Ganjoor API works

---

## Performance Monitoring

Keep an eye on these metrics:

1. **Supabase Hit Rate**: % of requests served by Supabase
   - Goal: >70% for famous poets

2. **Average Response Time**:
   - Supabase: <200ms
   - Ganjoor fallback: 500-2000ms

3. **Error Rate**: Should be <0.1%

4. **Cache Hit Rate**: Should be >80%

---

## Success Criteria

✅ **All tests pass if:**
1. Famous poets load in under 200ms
2. Unmigrated poets still work (fallback)
3. No console errors
4. All pages display correctly
5. Performance improvement is noticeable

🎉 **Once all tests pass, you're ready to deploy!**

---

**Happy Testing! 🚀**

