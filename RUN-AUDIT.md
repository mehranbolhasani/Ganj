# How to Run the Supabase Data Audit

## Prerequisites

Make sure you have your Supabase credentials in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# or
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Run the Audit

```bash
npx tsx scripts/audit-supabase-data.ts
```

## Expected Output

The script will show:

1. **Total Records**
   - Number of poets, categories, poems in Supabase

2. **List of Poets**
   - All poets with their IDs and slugs
   - Example: "حافظ (ID: 2, Slug: hafez)"

3. **Categories per Poet**
   - How many categories each poet has
   - Example: "حافظ: 15 categories"

4. **Poems per Poet**
   - How many poems each poet has
   - Example: "حافظ: 495 poems"

5. **Data Completeness**
   - Poets missing descriptions, birth/death years

6. **Sample Data**
   - Example poem to verify data structure

## What to Look For

### ✅ Good Signs:
- Famous poets (Hafez, Saadi, Molavi, etc.) are present
- Each poet has multiple categories
- Each category has poems
- Poems have verses (not empty)

### ⚠️ Potential Issues:
- Missing poets
- Empty categories
- Poems without verses
- Missing metadata

## After the Audit

Based on the results, we'll know:

1. **Which poets are fully migrated** (will use Supabase)
2. **Which poets are missing** (will fallback to Ganjoor API)
3. **Data quality** (completeness and accuracy)

This helps us set realistic expectations for performance improvements.

## Next Steps

After running the audit:
1. Share the output (or key findings)
2. We'll update components to use `hybridApi`
3. Test with migrated poets (should be fast)
4. Test with unmigrated poets (should fallback gracefully)

