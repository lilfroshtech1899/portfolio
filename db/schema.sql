-- ============================================================
-- SUPABASE DATABASE SETUP — run once in Supabase SQL Editor
-- ============================================================
-- Reference schema for this portfolio project. The deployed copy
-- of js/supabase.js is minified and no longer carries these
-- instructions, so they live here instead.

CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  short_description text,
  full_description text,
  technologies text[] DEFAULT '{}',
  category text,
  thumbnail_url text,
  gallery_images text[] DEFAULT '{}',
  live_url text,
  github_url text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read projects"
  ON projects FOR SELECT
  USING (true);

-- Write access: use db/security-fixes.sql to lock these to YOUR
-- admin user id instead of "any authenticated user".
CREATE POLICY "Authenticated users can insert"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update"
  ON projects FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete"
  ON projects FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true);

-- Allow public access to storage
CREATE POLICY "Public can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

-- These write policies are tightened in db/security-fixes.sql
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');