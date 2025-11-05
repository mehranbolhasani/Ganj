# 📜 Scripts Documentation

This folder contains utility scripts for managing the Ganjeh database and development environment.

---

## 🗄️ Supabase Scripts

### `import-famous-poets-with-verses.ts`
**Purpose:** Import 6 famous Persian poets with complete poem verses into Supabase.

**Usage:**
```bash
npx tsx scripts/import-famous-poets-with-verses.ts
```

**What it does:**
- Imports poets: حافظ, سعدی, مولوی, فردوسی, عطار, نظامی
- Fetches each poem individually to get full verses
- ~15,000 poems total
- Takes 10-15 minutes

**When to use:**
- Fresh Supabase setup
- Data corruption recovery
- Adding new poets (edit FAMOUS_POETS array)

---

### `audit-supabase-data.ts`
**Purpose:** Verify Supabase data integrity and statistics.

**Usage:**
```bash
npx tsx scripts/audit-supabase-data.ts
```

**Output:**
- Total poets, categories, poems
- Distribution per poet
- Data completeness check
- Sample poem verification

**When to use:**
- After import to verify success
- Troubleshooting data issues
- Checking database status

---

## 🛠️ Development Scripts

### `build-check.js`
**Purpose:** Verify build compatibility before deployment.

**Usage:**
```bash
node scripts/build-check.js
```

### `dev-setup.js`
**Purpose:** Initialize development environment.

**Usage:**
```bash
node scripts/dev-setup.js
```

---

## 📄 SQL Files

### `check-supabase-poems.sql`
Check poem data in Supabase database.

### `cleanup-famous-poets.sql`
Remove famous poets data (use before re-import).

### `fix-poem-counts.sql`
Recalculate and fix poem counts in categories table.

---

## ⚠️ Important Notes

1. **Environment Variables Required**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Safe to Re-run**
   - Import scripts use `upsert` (insert or update)
   - Won't create duplicates

3. **Import Time**
   - Full import: 10-15 minutes
   - Progress shown in console
   - Can be interrupted and resumed

4. **Error Handling**
   - Foreign key errors for sub-categories are normal
   - Script continues despite individual failures
   - Check audit script after import

---

## 🚀 Quick Start

```bash
# 1. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 2. Run Supabase schema
# Copy supabase-schema.sql to Supabase SQL Editor and run

# 3. Import famous poets
npx tsx scripts/import-famous-poets-with-verses.ts

# 4. Verify import
npx tsx scripts/audit-supabase-data.ts
```

---

## 📚 Related Documentation

- Main Supabase guide: `SUPABASE.md`
- Database schema: `supabase-schema.sql`
- Hybrid API docs: See code comments in `src/lib/hybrid-api.ts`

