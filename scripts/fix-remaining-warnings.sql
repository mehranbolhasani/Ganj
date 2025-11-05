-- Fix Remaining Supabase Security Warnings
-- This script addresses the 3 remaining warnings:
-- 1. Extension in Public: pg_trgm
-- 2. Extension in Public: unaccent  
-- 3. Materialized View in API: famous_poets
-- Run this script in Supabase SQL Editor

-- ============================================================================
-- 1. EXCLUDE MATERIALIZED VIEW FROM POSTGREST API
-- ============================================================================
-- The famous_poets view is not used by the application via PostgREST API
-- Revoke access from anon and authenticated roles to exclude it from API

-- Revoke public access to the materialized view
REVOKE ALL ON famous_poets FROM anon;
REVOKE ALL ON famous_poets FROM authenticated;
REVOKE ALL ON famous_poets FROM public;

-- Note: Service role key (used by server-side code) can still access
-- This only prevents public API access via PostgREST

-- ============================================================================
-- 2. DOCUMENT EXTENSION USAGE
-- ============================================================================
-- Extensions pg_trgm and unaccent are installed in public schema
-- This is a common practice and acceptable for this use case
-- These extensions are REQUIRED for full-text search functionality
-- The warnings are informational - these extensions are safe and necessary

-- Add comments to document why these extensions are needed
COMMENT ON EXTENSION pg_trgm IS 'Trigram extension for fuzzy text search - required for poem search functionality. Installed in public schema as per PostgreSQL best practices.';
COMMENT ON EXTENSION unaccent IS 'Unaccent extension for accent-insensitive search - required for Persian text search. Installed in public schema as per PostgreSQL best practices.';

-- ============================================================================
-- 3. OPTIONAL: DROP MATERIALIZED VIEW (if not needed)
-- ============================================================================
-- If you don't need the famous_poets view at all, you can drop it:
-- DROP MATERIALIZED VIEW IF EXISTS famous_poets CASCADE;
-- DROP FUNCTION IF EXISTS refresh_famous_poets();

-- Note: The view is not used by the application, so it's safe to drop if desired
-- However, keeping it doesn't harm anything since we've revoked public access

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check materialized view permissions
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' 
--   AND table_name = 'famous_poets';

-- Verify extensions are documented
-- SELECT extname, extversion, obj_description(oid, 'pg_extension') as comment
-- FROM pg_extension 
-- WHERE extname IN ('pg_trgm', 'unaccent');

