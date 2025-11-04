# Testing Supabase Fixes

This guide will help you test the recent fixes for Supabase category filtering and poem counting.

## What Was Fixed

### 1. ✅ Better Category Filtering
- **Problem**: Poet name was showing as first category (e.g., "حافظ" for Hafez)
- **Fix**: Enhanced string normalization (lowercase, trim, collapse spaces) and partial match detection
- **Test**: Check that poet names don't appear in category lists

### 2. ✅ Accurate Poem Counts
- **Problem**: Some categories showed 0 poems even when poems existed
- **Fix**: Removed incorrect `.not()` syntax that was causing Supabase query errors
- **Test**: Verify all categories show correct poem counts (not 0)

### 3. ✅ Debug Logging
- **Added**: Comprehensive logging for diagnosis
- **Test**: Check browser console for detailed logs

## How to Test

### Prerequisites
```bash
# Make sure dev server is running
npm run dev
```

### Test 1: Famous Poets (Supabase Data)

#### Test Hafez (ID: 2)
1. Navigate to: `http://localhost:3000/poet/2`
2. Check console logs for:
   ```
   [Supabase] Loaded poet: حافظ شیرازی (ID: 2)
   [Supabase] Description: Yes
   [Supabase] Filtered categories: X -> Y
   [Supabase] Categories: ["غزلیات", "قطعات", ...]
   [Supabase] Poem counts: ["غزلیات: 495", "قطعات: 34", ...]
   ```
3. Verify:
   - ✅ Poet name "حافظ" is NOT in category list
   - ✅ Description is shown below poet info
   - ✅ All categories show correct poem counts (not 0)
   - ✅ Can click on categories and view poems

#### Test Saadi (ID: 7)
1. Navigate to: `http://localhost:3000/poet/7`
2. Check console logs
3. Verify:
   - ✅ Poet name "سعدی" is NOT in category list
   - ✅ Description is shown
   - ✅ Poem counts are accurate

#### Test Molavi/Rumi (ID: 5)
1. Navigate to: `http://localhost:3000/poet/5`
2. Check console logs
3. Verify:
   - ✅ Poet name "مولانا" is NOT in category list
   - ✅ Description is shown
   - ✅ Poem counts are accurate

### Test 2: Non-Famous Poets (Ganjoor API Fallback)

#### Test a Non-Famous Poet
1. Navigate to any poet NOT in Supabase (e.g., `/poet/100`)
2. Check console logs for:
   ```
   Poet 100 not in Supabase, using Ganjoor API
   [ganjoor] getPoet: XXXms (fallback)
   ```
3. Verify:
   - ✅ Page loads correctly
   - ✅ Categories and poems are shown
   - ✅ Fallback to Ganjoor API works

### Test 3: Category Pages

#### Test Famous Poet Category
1. Navigate to a Hafez category (e.g., `/poet/2/category/1`)
2. Check console logs for:
   ```
   [supabase] getCategoryPoems: XXXms
   ```
3. Verify:
   - ✅ Poems load correctly
   - ✅ Can click on individual poems
   - ✅ Fast loading (< 200ms)

#### Test Non-Famous Poet Category
1. Navigate to a non-Supabase poet's category
2. Verify:
   - ✅ Fallback to Ganjoor API works
   - ✅ Poems load correctly

### Test 4: Individual Poems

#### Test Supabase Poem
1. Navigate to a famous poet's poem (e.g., `/poem/1`)
2. Check console logs
3. Verify:
   - ✅ Poem displays correctly
   - ✅ Poet name and category name are shown
   - ✅ Fast loading

#### Test Ganjoor API Poem
1. Navigate to a non-Supabase poem
2. Verify:
   - ✅ Fallback works
   - ✅ Poem displays correctly

## Expected Console Output

### For Supabase Poets (Famous)
```
[supabase] getPoet: 150ms
[Supabase] Loaded poet: حافظ شیرازی (ID: 2)
[Supabase] Description: Yes
[Supabase] Filtered categories: 5 -> 4
[Supabase] Categories: ["غزلیات", "قطعات", "رباعیات", "ترجیعات"]
[Supabase] Poem counts: ["غزلیات: 495", "قطعات: 34", "رباعیات: 42", "ترجیعات: 12"]
```

### For Non-Supabase Poets
```
Poet 100 not in Supabase, using Ganjoor API
[ganjoor] getPoet: 850ms (fallback)
```

## Common Issues and Solutions

### Issue 1: Still seeing poet name as first category
**Symptoms**: "حافظ" appears in Hafez's category list
**Debug**:
1. Check console logs for category filtering
2. Look for the category list before/after filtering
3. Check if the strings match exactly

**Solution**: The normalization might need adjustment. Share the console output with developer.

### Issue 2: Still seeing 0 poem counts
**Symptoms**: Categories show "0 شعر" when poems exist
**Debug**:
1. Check console logs for poem counts
2. Look for any Supabase query errors
3. Check if poems table has data for that category

**Solution**: May be a data issue in Supabase. Run audit script to check.

### Issue 3: Non-famous poets not loading
**Symptoms**: Page shows error or hangs
**Debug**:
1. Check console logs for fallback message
2. Look for any errors from Ganjoor API
3. Check network tab for API calls

**Solution**: May be a network issue or Ganjoor API timeout.

### Issue 4: Description not showing
**Symptoms**: Poet info card missing description
**Debug**:
1. Check console logs: `[Supabase] Description: Yes/No`
2. Check if description exists in Supabase

**Solution**: If log says "No", the description is missing in Supabase database.

## Performance Expectations

### Supabase (Famous Poets)
- **getPoet**: 50-200ms
- **getCategoryPoems**: 50-150ms
- **getPoem**: 50-100ms

### Ganjoor API Fallback
- **getPoet**: 500-2000ms
- **getCategoryPoems**: 300-1500ms
- **getPoem**: 300-1000ms

## Data Audit

To check what's in Supabase:

```bash
npx tsx scripts/audit-supabase-data.ts
```

This will show:
- Total poets, categories, poems in Supabase
- List of all poets
- Categories per poet
- Poems per poet
- Data completeness

## Reporting Issues

When reporting issues, please provide:

1. **Browser console logs** (all messages)
2. **Network tab** (API calls and response times)
3. **Screenshot** of the issue
4. **Poet ID** and **Category ID** (if applicable)
5. **Expected vs. Actual** behavior

Example:
```
Issue: Hafez still shows "حافظ" as first category

Console logs:
[Supabase] Loaded poet: حافظ شیرازی (ID: 2)
[Supabase] Filtered categories: 5 -> 5
[Supabase] Categories: ["حافظ", "غزلیات", ...]

Expected: "حافظ" should be filtered out
Actual: "حافظ" is still in the list

Screenshot: [attach image]
```

## Next Steps

After testing, we may need to:

1. **Adjust filtering logic** if poet names still appear
2. **Fix poem count queries** if counts are still 0
3. **Improve fallback mechanism** if non-famous poets don't load
4. **Add missing descriptions** to Supabase database
5. **Optimize performance** if loading is too slow

---

**Note**: All these changes are currently in development mode. Make sure you're running `npm run dev` locally, not on Vercel yet.

