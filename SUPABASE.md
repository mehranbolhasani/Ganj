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

### `test-security-policies.ts`
Test Row Level Security policies to ensure security is working correctly.

```bash
npx tsx scripts/test-security-policies.ts
```

### `fix-supabase-security.sql`
SQL script to fix all security issues (RLS, function search_path, etc.).

Run this in Supabase SQL Editor if Security Advisor shows errors.

### `fix-remaining-warnings.sql`
SQL script to fix remaining warnings (materialized view, extensions).

Run this after `fix-supabase-security.sql` if Security Advisor still shows warnings.

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

## 🔒 Security

### Row Level Security (RLS)

All tables in Supabase have Row Level Security enabled to protect your data while allowing public read access for poetry content.

#### RLS Policies

**Public Read Access (Poetry Data):**
- ✅ **poets**: Anyone can read (public read-only)
- ✅ **categories**: Anyone can read (public read-only)
- ✅ **poems**: Anyone can read (public read-only)

**Contact Form:**
- ✅ **contact_messages**: Anyone can insert (submit form), but **cannot read** (privacy protection)

**Server-Side Access:**
- The application uses `SUPABASE_SERVICE_ROLE_KEY` on the server, which bypasses RLS for admin operations (imports, etc.)
- Client-side code uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which respects RLS policies

#### Applying Security Fixes

If you see security warnings in Supabase Security Advisor:

1. **Run the security fix script:**
   ```bash
   # Copy contents of scripts/fix-supabase-security.sql
   # Run in Supabase SQL Editor
   ```

2. **Or apply manually:**
   - The main schema file (`supabase-schema.sql`) includes RLS policies
   - Run the updated schema to enable security

#### Testing Security Policies

Test that RLS policies are working correctly:

```bash
npx tsx scripts/test-security-policies.ts
```

This script verifies:
- ✅ Public read access works (anon key)
- ✅ Public write is blocked (anon key)
- ✅ Contact form insert works (anon key)
- ✅ Contact form read is blocked (anon key)
- ✅ Service role key still has full access

#### Security Warnings Explained

**Function Search Path Warnings:**
- Fixed by setting `SET search_path = public` in functions
- Prevents SQL injection vulnerabilities

**Extension Warnings:**
- `pg_trgm` and `unaccent` in public schema are acceptable
- These extensions are required for full-text search
- Common practice for PostgreSQL extensions
- **Note:** These warnings are informational and can be safely ignored
- The extensions are documented with comments explaining their purpose

**Materialized View Warning:**
- `famous_poets` view is not accessed via PostgREST API
- **Fix:** Run `fix-remaining-warnings.sql` to revoke public access
- This will remove the warning from Security Advisor

#### Backup Tables

If you have backup tables (`*_backup`), they should be:
- **Option A**: Dropped (if not needed) - recommended
- **Option B**: Secured with RLS policies (if needed for recovery)

The security fix script handles this automatically.

---

## 🆘 Support

If you encounter issues:
1. Check environment variables
2. Run audit script
3. Check Supabase dashboard for errors
4. Re-run import if data is corrupted
5. Test security policies if access issues occur

For questions or issues, check the code comments in:
- `src/lib/hybrid-api.ts` - Main hybrid logic
- `src/lib/supabase-api.ts` - Supabase queries
- `src/lib/ganjoor-api.ts` - Ganjoor API fallback

