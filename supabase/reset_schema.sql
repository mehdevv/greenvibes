-- =============================================================================
-- GreenVibes — RESET public schema (run BEFORE schema.sql)
--
-- ⚠️  DESTRUCTIVE: deletes ALL tables, data, functions, and policies in
--     the `public` schema. Auth users in auth.users are NOT deleted.
--
-- Steps:
--   1. Run this file in Supabase → SQL Editor
--   2. Run supabase/schema.sql
--   3. Create first admin at /admin/login (or setup-admin edge function)
--
-- If you already had admin accounts in Auth but want a clean slate, also run
-- the optional block at the bottom to remove those users.
-- =============================================================================

-- Remove storage policies that reference public.* functions (avoid orphans)
DROP POLICY IF EXISTS trip_images_public_read ON storage.objects;
DROP POLICY IF EXISTS trip_images_admin_write ON storage.objects;
DROP POLICY IF EXISTS site_media_public_read ON storage.objects;
DROP POLICY IF EXISTS site_media_admin_write ON storage.objects;

-- Wipe entire public schema
DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;

-- Supabase expects these grants on public
GRANT USAGE ON SCHEMA public TO public;

-- =============================================================================
-- OPTIONAL — uncomment to delete ALL auth users (emails/passwords)
-- Only needed if setup-admin says an admin already exists.
-- =============================================================================
--
-- DELETE FROM auth.users;
--
