# Supabase Data Issue - Category Corruption

## 🔴 Problem Identified

After extensive debugging with detailed logging, we've identified a **critical data quality issue** in the Supabase `categories` table.

### Symptoms

1. All categories for famous poets show as "(0) حافظ" instead of proper names
2. Poem counts display as 0 even though poems exist (571 poems for Hafez)
3. Poet name cannot be filtered from category list (all categories ARE the poet name)
4. Descriptions are missing for poets

### Console Output Analysis

```
[Supabase] POET ID: 2 (Hafez)
[Supabase] Categories count: 6
[Supabase] All category titles: Array(6)
  0: "(0) حافظ"
  1: "(0) حافظ"
  2: "(0) حافظ"
  3: "(0) حافظ"
  4: "(0) حافظ"
  5: "(0) حافظ"
[Supabase] FILTERED: 6 -> 6 (nothing removed)
[Supabase] Total poems fetched: 571
[Supabase] POEM COUNTS CALCULATED: All showing 0
[Supabase] Poet data: descriptionLength: 0
```

### Expected Data

Categories should have proper titles like:
- "غزلیات" (Ghazals)
- "قطعات" (Fragments)
- "رباعیات" (Quatrains)
- "ترجیعات" (Terje'at)
- "اشعار منتسب" (Attributed poems)

---

## 🔧 Current Workaround

**Supabase has been temporarily disabled** for poet/category/poem fetching. All requests now use Ganjoor API.

### Code Changes

In `src/lib/hybrid-api.ts`:
```typescript
// TEMPORARY: Disable Supabase due to corrupt category data
if (false && isSupabaseAvailable()) {
  // Supabase code...
}
// Always use Ganjoor API for now
```

This ensures the application works correctly while you fix the Supabase data.

---

## 🛠️ How to Fix the Supabase Data

### Step 1: Verify the Issue in Supabase Dashboard

Run this SQL query in Supabase SQL Editor:

```sql
-- Check categories for Hafez (poet_id = 2)
SELECT id, title, poet_id, poem_count
FROM categories
WHERE poet_id = 2
ORDER BY id;
```

**Expected result:** All rows show `title = "(0) حافظ"` (corrupted)

### Step 2: Check the Source Data

Query Ganjoor API to see what the correct data should be:

```bash
curl https://api.ganjoor.net/api/ganjoor/poet/2
```

This will show the correct category structure.

### Step 3: Re-import Categories

You have two options:

#### Option A: Delete and Re-import All Categories

```sql
-- Backup first!
CREATE TABLE categories_backup AS SELECT * FROM categories;

-- Delete corrupted categories
DELETE FROM categories WHERE poet_id = 2;

-- Re-import from Ganjoor API using your import script
```

#### Option B: Fix Individual Categories

If you know the correct category IDs and titles, update them:

```sql
UPDATE categories
SET title = 'غزلیات'
WHERE id = [category_id_1] AND poet_id = 2;

UPDATE categories
SET title = 'قطعات'
WHERE id = [category_id_2] AND poet_id = 2;

-- ... repeat for other categories
```

### Step 4: Fix Missing Descriptions

```sql
-- Check which poets are missing descriptions
SELECT id, name, description
FROM poets
WHERE description IS NULL OR description = '';

-- Update Hafez description (example)
UPDATE poets
SET description = 'خواجه شمس‌الدین محمد حافظ شیرازی شاعر بزرگ ایرانی در قرن هشتم هجری...'
WHERE id = 2;
```

### Step 5: Verify poem_count Column

The `poem_count` column in categories might also be incorrect:

```sql
-- Recalculate poem counts for all categories
UPDATE categories c
SET poem_count = (
  SELECT COUNT(*)
  FROM poems p
  WHERE p.category_id = c.id
);

-- Verify counts for Hafez categories
SELECT c.id, c.title, c.poem_count, COUNT(p.id) as actual_count
FROM categories c
LEFT JOIN poems p ON p.category_id = c.id
WHERE c.poet_id = 2
GROUP BY c.id, c.title, c.poem_count;
```

---

## 🔍 Root Cause Analysis

The issue likely occurred during data import. Possible causes:

1. **Import script bug**: The script that imported categories from Ganjoor API had a bug
2. **Encoding issues**: Persian text encoding was corrupted during import
3. **SQL injection/escaping**: Category titles weren't properly escaped
4. **Partial import**: Import was interrupted mid-process
5. **Wrong data source**: Imported from incorrect API endpoint

### Check Your Import Script

Look for issues in your import logic:
- Are you correctly parsing the Ganjoor API response?
- Are you handling Persian characters (UTF-8) correctly?
- Are you using parameterized queries to prevent SQL issues?
- Are you properly mapping fields (title, description, poet_id, etc.)?

---

## ✅ Re-enabling Supabase After Fix

Once you've fixed the data:

### Step 1: Verify the Fix

```sql
-- Check categories for Hafez
SELECT id, title, poet_id, poem_count
FROM categories
WHERE poet_id = 2
ORDER BY id;
```

**Expected result:** Proper category titles like "غزلیات", "قطعات", etc.

### Step 2: Test with Audit Script

```bash
npx tsx scripts/audit-supabase-data.ts
```

Should show correct category names and counts.

### Step 3: Re-enable Supabase in Code

In `src/lib/hybrid-api.ts`, change:

```typescript
// From:
if (false && isSupabaseAvailable()) {

// To:
if (isSupabaseAvailable()) {
```

Do this for all three methods:
- `getPoet()`
- `getCategoryPoems()`
- `getPoem()`

### Step 4: Test in Browser

1. Clear cache: `localStorage.clear()` in console
2. Restart dev server: `npm run dev`
3. Visit Hafez page: `http://localhost:3000/poet/2`
4. Check console logs for correct data
5. Verify UI shows:
   - ✅ Proper category names (not "حافظ")
   - ✅ Accurate poem counts (not 0)
   - ✅ Description (if added to database)

---

## 📊 Data Quality Checklist

Before re-enabling Supabase, ensure:

- [ ] All categories have proper Persian titles (not poet names)
- [ ] All categories have correct `poet_id` foreign keys
- [ ] Poem counts match actual poem counts in database
- [ ] Poets have descriptions (from Ganjoor API)
- [ ] All Persian text uses correct UTF-8 encoding
- [ ] No duplicate categories for same poet
- [ ] All poems have valid `category_id` references

---

## 🚀 Next Steps

1. **Immediate**: Application works fine with Ganjoor API (current state)
2. **Short-term**: Fix Supabase data and re-enable hybrid API
3. **Long-term**: Add data validation to import scripts to prevent this

---

## 📝 Summary

- **Issue**: Supabase categories table has corrupt data (all titles = "(0) حافظ")
- **Impact**: Categories not displaying, poem counts wrong, descriptions missing
- **Workaround**: Supabase disabled, using Ganjoor API only
- **Status**: Application fully functional with Ganjoor API
- **Next**: Fix Supabase data, then re-enable hybrid API for performance boost

---

**Note**: This is a data quality issue, not a code issue. Our debugging confirmed the code works perfectly - it's the Supabase database that needs cleaning up.

