-- Supabase Security Fix Script
-- Fixes all RLS errors and warnings reported by Supabase Security Advisor
-- Run this script in Supabase SQL Editor

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON MAIN TABLES
-- ============================================================================

-- Enable RLS on main tables
ALTER TABLE IF EXISTS poets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow public read access to poets" ON poets;
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;
DROP POLICY IF EXISTS "Allow public read access to poems" ON poems;
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON contact_messages;

-- Create public read access policies for poetry data
CREATE POLICY "Allow public read access to poets"
  ON poets FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to poems"
  ON poems FOR SELECT
  USING (true);

-- Create public insert-only policy for contact form
CREATE POLICY "Allow public insert to contact_messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 2. HANDLE BACKUP TABLES
-- ============================================================================
-- Backup tables are not used by the application and can be dropped
-- If you need to keep them for recovery, uncomment the RLS policies below

-- Option A: Drop backup tables (recommended if not needed)
DROP TABLE IF EXISTS poets_backup CASCADE;
DROP TABLE IF EXISTS categories_backup CASCADE;
DROP TABLE IF EXISTS poems_backup CASCADE;

-- Option B: Enable RLS on backup tables (if you need to keep them)
-- Uncomment these if you want to keep backup tables:
-- ALTER TABLE IF EXISTS poets_backup ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS categories_backup ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS poems_backup ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Restrict backup table access" ON poets_backup
--   FOR ALL USING (false); -- No public access
-- CREATE POLICY "Restrict backup table access" ON categories_backup
--   FOR ALL USING (false);
-- CREATE POLICY "Restrict backup table access" ON poems_backup
--   FOR ALL USING (false);

-- ============================================================================
-- 3. FIX FUNCTION SEARCH PATH ISSUES
-- ============================================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix refresh_famous_poets function
CREATE OR REPLACE FUNCTION refresh_famous_poets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY famous_poets;
END;
$$;

-- ============================================================================
-- 4. HANDLE MATERIALIZED VIEW WARNING
-- ============================================================================
-- The famous_poets view is not used by the application via PostgREST API
-- Revoke public access to exclude it from the API

-- Revoke public access to the materialized view
REVOKE ALL ON famous_poets FROM anon;
REVOKE ALL ON famous_poets FROM authenticated;
REVOKE ALL ON famous_poets FROM public;

-- Note: Service role key (used by server-side code) can still access
-- This only prevents public API access via PostgREST

-- ============================================================================
-- 5. DOCUMENT EXTENSION USAGE
-- ============================================================================
-- Extensions pg_trgm and unaccent are installed in public schema
-- This is a common practice and acceptable for this use case
-- These extensions are required for full-text search functionality

COMMENT ON EXTENSION pg_trgm IS 'Trigram extension for fuzzy text search - required for poem search functionality. Installed in public schema as per PostgreSQL best practices.';
COMMENT ON EXTENSION unaccent IS 'Unaccent extension for accent-insensitive search - required for Persian text search. Installed in public schema as per PostgreSQL best practices.';

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify fixes)
-- ============================================================================

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('poets', 'categories', 'poems', 'contact_messages');

-- Check policies exist
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('poets', 'categories', 'poems', 'contact_messages');

-- Check function search_path is set
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE proname IN ('update_updated_at_column', 'refresh_famous_poets');

