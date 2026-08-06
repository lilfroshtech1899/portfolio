-- ============================================================
-- SECURITY HARDENING — Portfolio Supabase project
-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor, AFTER doing steps
-- 1-3 below. See SECURITY.md for the full walkthrough.
--
-- It locks all WRITE access (create/edit/delete projects, upload/
-- delete images) to a single admin user. Public visitors can still
-- read projects and view images (required by the public site).
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Find your admin user ID (run this first, then paste the UUID)
-- ─────────────────────────────────────────────────────────────
SELECT id, email FROM auth.users;

-- ─────────────────────────────────────────────────────────────
-- 2. Replace <ADMIN_USER_ID> below with the UUID shown above.
--    e.g. auth.uid() = '3f8c2b1a-....-....'
--    IMPORTANT: keep the single quotes around the value.
-- ─────────────────────────────────────────────────────────────

-- ═════════════════════════════════════════════════════════════
-- PROJECTS TABLE
-- ═════════════════════════════════════════════════════════════

-- Keep public read (do not drop this one)
-- CREATE POLICY "Public can read projects" ... already exists

DROP POLICY IF EXISTS "Authenticated users can insert" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON projects;

CREATE POLICY "Only admin can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = '<ADMIN_USER_ID>');

CREATE POLICY "Only admin can update projects"
  ON projects FOR UPDATE
  USING (auth.uid() = '<ADMIN_USER_ID>');

CREATE POLICY "Only admin can delete projects"
  ON projects FOR DELETE
  USING (auth.uid() = '<ADMIN_USER_ID>');

-- ═════════════════════════════════════════════════════════════
-- STORAGE (portfolio-images bucket)
-- ═════════════════════════════════════════════════════════════

-- Keep public image viewing (do not drop this one)
-- CREATE POLICY "Public can view images" ... already exists

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

CREATE POLICY "Only admin can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid() = '<ADMIN_USER_ID>');

CREATE POLICY "Only admin can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio-images' AND auth.uid() = '<ADMIN_USER_ID>');

-- ═════════════════════════════════════════════════════════════
-- VERIFY (should return 0 rows — nothing left open to strangers)
-- ═════════════════════════════════════════════════════════════
SELECT
  schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('projects', 'objects')
ORDER BY tablename, cmd;