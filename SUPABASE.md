# 🗄️ Supabase Integration Guide

This document covers the Supabase integration for fast poem loading and search.

---

## 📊 Overview

Ganjeh uses a **hybrid API approach**:
- **Supabase**: Fast database for 6 famous poets (~15,000 poems)
- **Ganjoor API**: Fallback for all other poets (~200+ poets)

### Performance Benefits
- ⚡ **10x faster** loading for famous poets (50-200ms vs 800-2000ms)
- 🔍 **Instant search** through 15,000+ poems
- 📱 **Better mobile experience** - no heavy client-side processing

---

## 🏗️ Database Schema

Located in: `supabase-schema.sql`

### Tables
```
poets → categories → poems
```

- **poets**: Poet metadata (name, description, birth/death year)
- **categories**: Collections (دیوان, غزلیات, etc.)
- **poems**: Full poems with verses for search

### Indexes
- Full-text search on `verses` field
- Trigram indexes for fuzzy search
- Foreign key relationships for data integrity

---

## 🚀 Setup

### 1. Environment Variables

Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Create Database Schema

In Supabase SQL Editor, run:
```bash
# Copy contents from supabase-schema.sql
```

### 3. Import Famous Poets

```bash
npx tsx scripts/import-famous-poets-with-verses.ts
```

This imports 6 famous poets with all verses (~15,000 poems, takes 10-15 minutes).

---

## 📜 Available Scripts

Located in `scripts/`:

### `import-famous-poets-with-verses.ts`
Complete import with verses for all poems. Use this for fresh imports or re-imports.

```bash
npx tsx scripts/import-famous-poets-with-verses.ts
```

### `audit-supabase-data.ts`
Verify data integrity and see what's in the database.

```bash
npx tsx scripts/audit-supabase-data.ts
```

---

## 🔧 How It Works

### Hybrid API (`src/lib/hybrid-api.ts`)

```typescript
// 1. Try Supabase first (if poet exists)
const hasPoet = await supabaseApi.hasPoet(id);
if (hasPoet) {
  return await supabaseApi.getPoet(id); // Fast! 50-200ms
}

// 2. Fallback to Ganjoor API
return await ganjoorApi.getPoet(id); // Slower but comprehensive
```

### Famous Poets in Supabase
1. حافظ (Hafez) - 692 poems
2. سعدی (Saadi) - 2,009 poems
3. مولوی (Molavi) - 6,329 poems
4. فردوسی (Ferdowsi) - 777 poems
5. عطار (Attar) - 5,014 poems
6. نظامی (Nezami) - 378 poems

**Total: ~15,000 poems**

---

## 🐛 Troubleshooting

### No Data Showing
```bash
# Check if data exists
npx tsx scripts/audit-supabase-data.ts

# Re-import if needed
npx tsx scripts/import-famous-poets-with-verses.ts
```

### Slow Performance
- Check Supabase dashboard for connection issues
- Verify environment variables are set
- Hybrid API will automatically fallback to Ganjoor API

### Import Errors
- **Foreign key errors**: Some poems have sub-categories (chapters) not in simplified structure - this is normal
- **Rate limiting**: Add delays between requests if Ganjoor API returns 429
- **Missing verses**: Script will skip poems without verse data

---

## 📈 Monitoring

### Check Performance in Browser Console
```javascript
// Look for these logs:
[supabase] getPoet: 150ms  ← Fast!
[ganjoor] getPoet: 800ms (fallback)  ← Slower but works
```

### Database Usage
Check Supabase dashboard for:
- Storage: ~100-200MB (well within free tier)
- API calls: Should be minimal (most data is cached)

---

## 🔄 Updating Data

To add more poets or update existing data:

1. Edit `FAMOUS_POETS` array in import script
2. Run import: `npx tsx scripts/import-famous-poets-with-verses.ts`
3. Verify: `npx tsx scripts/audit-supabase-data.ts`

The import script uses `upsert`, so it's safe to run multiple times.

---

## 📝 Notes

- Only famous poets are in Supabase (performance optimization)
- All other poets load from Ganjoor API (comprehensive coverage)
- Hybrid approach gives best of both worlds: speed + completeness
- Search API can be extended to use Supabase full-text search

---

## 🆘 Support

If you encounter issues:
1. Check environment variables
2. Run audit script
3. Check Supabase dashboard for errors
4. Re-run import if data is corrupted

For questions or issues, check the code comments in:
- `src/lib/hybrid-api.ts` - Main hybrid logic
- `src/lib/supabase-api.ts` - Supabase queries
- `src/lib/ganjoor-api.ts` - Ganjoor API fallback

