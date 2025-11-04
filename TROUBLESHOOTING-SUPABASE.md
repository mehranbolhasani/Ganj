# Troubleshooting Supabase Connection

## Issue: "Supabase credentials not found"

If you see this warning in the console, it means the Supabase client isn't being initialized correctly.

---

## ✅ Solution 1: Check Your .env.local File

Make sure your `.env.local` file has these variables:

```bash
# Required for both client and server
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# For server-side (recommended - full access)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OR for client-side (public access)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important:**
- ✅ Use `NEXT_PUBLIC_` prefix for variables that need to be available in the browser
- ✅ `SUPABASE_SERVICE_ROLE_KEY` is **server-only** (more secure, more permissions)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is **public** (less permissions, but works in browser)

---

## ✅ Solution 2: Restart Development Server

After updating `.env.local`, you **must** restart the dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

**Why?** Next.js only loads `.env.local` when the server starts.

---

## ✅ Solution 3: Verify Environment Variables

Check if the variables are being loaded:

1. **Add this temporarily** to see what's available:
   ```typescript
   // In src/lib/supabase-api.ts (temporarily)
   console.log('Env check:', {
     hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
     hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
     hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
   });
   ```

2. **Or check in browser console** (client-side):
   ```javascript
   // In browser console
   console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   ```

---

## ✅ Solution 4: Use Service Role Key (Recommended)

For server-side operations, use `SUPABASE_SERVICE_ROLE_KEY`:

```bash
# In .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Benefits:**
- ✅ Full database access (no RLS restrictions)
- ✅ Works on server-side (more secure)
- ✅ Same permissions as your audit script

**Where to find it:**
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy "service_role" key (secret!)
4. **Never commit this to git!**

---

## ✅ Solution 5: Check RLS Policies

If you're using `NEXT_PUBLIC_SUPABASE_ANON_KEY`, you might need to set up Row Level Security (RLS) policies:

```sql
-- Allow public read access to poets, categories, poems
ALTER TABLE poets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON poets FOR SELECT USING (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON categories FOR SELECT USING (true);

ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON poems FOR SELECT USING (true);
```

**Or just use `SUPABASE_SERVICE_ROLE_KEY`** (bypasses RLS) - easier!

---

## 🔍 Debug Steps

### Step 1: Verify .env.local Location
```bash
# Make sure .env.local is in the project root
ls -la .env.local
```

### Step 2: Check File Contents (without exposing secrets)
```bash
# Check if variables are set (without showing values)
grep -E "^NEXT_PUBLIC_SUPABASE_URL|^SUPABASE_SERVICE_ROLE_KEY" .env.local
```

### Step 3: Restart Dev Server
```bash
# Kill existing process
pkill -f "next dev"

# Start fresh
npm run dev
```

### Step 4: Check Console Output
Look for:
- ✅ `[supabase] getPoet: XXXms` = Working!
- ❌ `Supabase credentials not found` = Not loaded
- ❌ `SupabaseApiError` = Query failed (permissions issue)

---

## 🎯 Quick Fix Checklist

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (for server) OR `NEXT_PUBLIC_SUPABASE_ANON_KEY` (for client)
- [ ] No quotes around values in `.env.local`
- [ ] No spaces around `=` sign
- [ ] Dev server restarted after changes
- [ ] Variables are correct (check Supabase dashboard)

---

## 💡 Common Mistakes

### ❌ Wrong:
```bash
NEXT_PUBLIC_SUPABASE_URL = "https://..."
SUPABASE_SERVICE_ROLE_KEY = "key..."
```

### ✅ Correct:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=key...
```

---

## 🚀 After Fixing

Once credentials are loaded correctly, you should see:

```
[supabase] getPoet: 150ms
```

Instead of:
```
[ganjoor] getPoet: 800ms (fallback)
```

---

## 📞 Still Not Working?

1. **Check Supabase Dashboard**: Verify your project is active
2. **Check API Keys**: Make sure you're using the correct keys
3. **Check Network**: Ensure you can access Supabase from your location
4. **Check Console**: Look for detailed error messages

---

**After fixing, restart the dev server and test again!** 🚀

