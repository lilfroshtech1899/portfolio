/* ============================================================
   SUPABASE CONFIGURATION — shared by the public site and admin
   ============================================================
   Instructions:
   1. Go to https://supabase.com → Your Project → Settings → API
   2. Copy your Project URL and anon/public key
   3. Paste them below

   This single file is used by both index.html and the admin
   pages, so you only have to update your keys in ONE place.
   ============================================================
   DATABASE SETUP — Run this SQL in Supabase SQL Editor:
   -------------------------------------------------------
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

   -- Allow authenticated users full access
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

   CREATE POLICY "Authenticated users can upload images"
     ON storage.objects FOR INSERT
     WITH CHECK (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');

   CREATE POLICY "Authenticated users can delete images"
     ON storage.objects FOR DELETE
     USING (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');
   ============================================================ */

// ─── CREDENTIALS (paste your values below) ───
const SUPABASE_URL = 'https://omvpvbmxunerjbgmcmkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdnB2Ym14dW5lcmpiZ21jbWtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDkzNjUsImV4cCI6MjEwMDk4NTM2NX0.F_Ovhi7_hgf0T0KrBcIxeZf-rOrz5vZf_j01LDi9O9U';

// ─── CLIENT ───
// Note: named `supabaseClient` (not `supabase`) because the Supabase
// CDN script already declares a global `supabase` name.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
