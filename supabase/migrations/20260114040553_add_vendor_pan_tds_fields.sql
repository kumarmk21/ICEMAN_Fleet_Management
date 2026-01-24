/*
  # Add PAN and TDS fields to vendors table

  1. New Columns
    - `pan_number` (text) - PAN card number of the vendor
    - `tds_applicable` (boolean) - Whether TDS is applicable (Y/N)
    - `tds_category` (text) - Category: Corporate or Individual
    - `pan_document_url` (text) - Storage URL for PAN card document
    - `pan_file_name` (text) - Original filename of PAN card
    - `pan_file_size` (integer) - File size in bytes
    - `pan_file_type` (text) - MIME type of the file
  
  2. Changes
    - Add new columns to vendors table with appropriate defaults
    - tds_category has a CHECK constraint to only allow 'Corporate' or 'Individual'
  
  3. Security
    - No RLS changes needed as vendors table already has RLS enabled
*/

-- Add new columns to vendors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'pan_number'
  ) THEN
    ALTER TABLE vendors ADD COLUMN pan_number text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'tds_applicable'
  ) THEN
    ALTER TABLE vendors ADD COLUMN tds_applicable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'tds_category'
  ) THEN
    ALTER TABLE vendors ADD COLUMN tds_category text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'pan_document_url'
  ) THEN
    ALTER TABLE vendors ADD COLUMN pan_document_url text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'pan_file_name'
  ) THEN
    ALTER TABLE vendors ADD COLUMN pan_file_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'pan_file_size'
  ) THEN
    ALTER TABLE vendors ADD COLUMN pan_file_size integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' AND column_name = 'pan_file_type'
  ) THEN
    ALTER TABLE vendors ADD COLUMN pan_file_type text DEFAULT '';
  END IF;
END $$;

-- Add CHECK constraint for tds_category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'vendors_tds_category_check'
  ) THEN
    ALTER TABLE vendors 
    ADD CONSTRAINT vendors_tds_category_check 
    CHECK (tds_category = '' OR tds_category IN ('Corporate', 'Individual'));
  END IF;
END $$;

-- Create storage bucket for vendor documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vendor documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload vendor documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload vendor documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'vendor-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can view vendor documents'
  ) THEN
    CREATE POLICY "Authenticated users can view vendor documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'vendor-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update vendor documents'
  ) THEN
    CREATE POLICY "Authenticated users can update vendor documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'vendor-documents')
    WITH CHECK (bucket_id = 'vendor-documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete vendor documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete vendor documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'vendor-documents');
  END IF;
END $$;