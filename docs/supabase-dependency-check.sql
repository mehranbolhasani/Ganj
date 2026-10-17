-- supabase-dependency-check.sql
--
-- Phase 5 pre-drop dependency check for the Supabase project.
-- READ ONLY: every statement below is a SELECT over catalogs. It writes nothing.
-- Run each block in order in the Supabase SQL editor and read the notes above each
-- result. No D1 tables or functions are involved; this only looks at the Postgres
-- catalogs so we know what would break or dangle if poems, poets or categories were
-- dropped later (phase 5 checklist step 5).
--
-- How to read overall: if any block returns rows other than the expected ones
-- (called out per block), resolve that dependency before dropping the tables.

-- ---------------------------------------------------------------------------
-- 1. Foreign keys: what references poems / poets / categories, and what they
--    reference. Expected: bookmarks.user_id -> auth.users, bookmarks.poem_id ->
--    poems.id, categories.poet_id -> poets.id (or equivalents), poems.poet_id ->
--    poets.id, poems.category_id -> categories.id. Anything referencing poems from
--    outside the content schema (bookmarks included) must be hydrated differently
--    or removed before the drop.
-- ---------------------------------------------------------------------------
select
  tc.table_schema  as schema,
  tc.table_name    as table_name,
  kcu.column_name  as column_name,
  ccu.table_schema as ref_schema,
  ccu.table_name   as ref_table,
  ccu.column_name  as ref_column,
  rc.delete_rule,
  rc.update_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.constraint_schema = kcu.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.constraint_schema = tc.constraint_schema
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name and rc.constraint_schema = tc.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and (ccu.table_name in ('poems', 'poets', 'categories')
       or tc.table_name in ('poems', 'poets', 'categories'))
order by tc.table_name, ccu.table_name;

-- ---------------------------------------------------------------------------
-- 2. Views, materialized views, triggers, functions and RPCs whose definition
--    mentions poems, poets or categories anywhere in the SQL text.
--    Expected on this project: none. Any hit is a dependency that breaks or
--    silently returns nothing once the table is gone, so rewrite or drop it first.
--    (Supabase stores view/routine/function definitions in pg_catalog.pg_views,
--    pg_matviews, pg_trigger.depdend vectors differ: for triggers the definition
--    lives in the function body, which block 2b covers.)
-- ---------------------------------------------------------------------------
-- 2a. Views and materialized views
select schemaname, viewname, definition
from pg_views
where definition ilike any (array ['%poems%', '%poets%', '%categories%'])
union all
select schemaname, matviewname, definition
from pg_matviews
where definition ilike any (array ['%poems%', '%poets%', '%categories%']);

-- 2b. Functions and routines (includes trigger functions and RPCs callable by
--     supabase-js .rpc())
select
  n.nspname  as schema,
  p.proname  as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname not in ('pg_catalog', 'information_schema')
  and pg_get_functiondef(p.oid) ilike any (array ['%poems%', '%poets%', '%categories%']);

-- 2c. Triggers attached to any table whose trigger function or definition text
--     mentions the three tables (relation-level check by name).
select
  event_object_schema as schema,
  event_object_table  as table_name,
  trigger_name,
  action_statement
from information_schema.triggers
where action_statement ilike any (array ['%poems%', '%poets%', '%categories%']);

-- ---------------------------------------------------------------------------
-- 3. RLS policies on poems, poets, categories (and bookmarks, for context).
--    Expected: public SELECT on the three content tables (the anon client reads
--    them) and user-scoped ALL policies on bookmarks. At drop time these policies
--    disappear with the table; record them so nothing else depends on the same
--    role grants.
-- ---------------------------------------------------------------------------
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where tablename in ('poems', 'poets', 'categories', 'bookmarks')
order by tablename, policyname;

-- Also list which roles currently hold grants on the three tables (useful to spot
-- grant dependencies outside the anon/service roles).
select
  grantee,
  table_name,
  string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('poems', 'poets', 'categories')
group by grantee, table_name
order by table_name, grantee;

-- ---------------------------------------------------------------------------
-- 4. pg_cron jobs touching the content tables. Expected: none (the loader runs
--    from CI/tubes, not in-database). If the extension is missing the CTE yields
--    an empty result instead of an error.
-- ---------------------------------------------------------------------------
with ext as (
  select exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) as installed
)
select
  ext.installed                              as pg_cron_installed,
  jobname,
  schedule,
  command
from ext
left join cron.job on true
where not ext.installed
   or command ilike any (array ['%poems%', '%poets%', '%categories%'])
order by jobname;

-- ---------------------------------------------------------------------------
-- 5. Indexes and stored size of poems, poets, categories.
--    These are the indexes the drop plan removes (idx_poems_*, idx_poets_name,
--    idx_categories_title); the sizes help estimate the reclaim.
-- ---------------------------------------------------------------------------
select
  tablename,
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(quote_ident(schemaname) || '.' || quote_ident(indexname))) as index_size
from pg_indexes
where schemaname = 'public'
  and tablename in ('poems', 'poets', 'categories')
order by tablename, indexname;

select
  relname                                   as table_name,
  n_live_tup                                as rows_est,
  pg_size_pretty(pg_table_size(relid))      as table_size,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size_with_indexes
from pg_stat_user_tables
where relname in ('poems', 'poets', 'categories')
order by relname;

-- ---------------------------------------------------------------------------
-- 6. Whole public schema by table (disk), largest first. Context: after the drop
--    this shows what remains on Supabase Free (auth, user_profiles, bookmarks,
--    bot_analytics, contact_messages, ganjoor_cache).
-- ---------------------------------------------------------------------------
select
  relname                                    as table_name,
  n_live_tup                                 as rows_est,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_stat_user_tables
where schemaname = 'public'
order by pg_total_relation_size(relid) desc
limit 50;
