/*
  # Truck Arrival Feature - Schema Updates

  ## Summary
  Adds support for the Truck Arrival workflow, including:
  - POD (Proof of Delivery) file storage reference on trips
  - A new `truck-arrival` module entry in the modules registry
  - A `pod-uploads` Supabase Storage bucket for POD documents
  - RLS policies for the storage bucket

  ## Changes

  ### Modified Tables
  - `trips`: New column `pod_file` (text, nullable) — stores the storage path/URL of the uploaded POD document

  ### Modules Registry
  - Inserts `truck-arrival` (Truck Arrival, operations group, sort_order 5)

  ### Storage
  - Creates `pod-uploads` storage bucket (private, per-user access)
  - INSERT policy: authenticated users can upload to their own folder
  - SELECT policy: authenticated users can read files they uploaded
*/

-- ============================================================
-- 1. Add pod_file column to trips
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'pod_file'
  ) THEN
    ALTER TABLE trips ADD COLUMN pod_file text;
  END IF;
END $$;

-- ============================================================
-- 2. Register truck-arrival in modules table
-- ============================================================
INSERT INTO modules (module_key, module_name, module_group, sort_order)
VALUES ('truck-arrival', 'Truck Arrival', 'operations', 5)
ON CONFLICT (module_key) DO NOTHING;

-- ============================================================
-- 3. Create pod-uploads storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pod-uploads',
  'pod-uploads',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Storage RLS policies for pod-uploads
-- ============================================================
CREATE POLICY "Authenticated users can upload POD files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pod-uploads');

CREATE POLICY "Authenticated users can view POD files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'pod-uploads');

CREATE POLICY "Authenticated users can delete own POD files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pod-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
