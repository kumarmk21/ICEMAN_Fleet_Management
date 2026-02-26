/*
  # Update Vehicle Documents Table

  1. Changes
    - Add document_category column to track different document types
    - Add file_name, file_size, file_type columns for better tracking
    - Keep existing structure intact

  2. Document Categories
    - Vehicle Insurance
    - Fitness Certificate
    - PUC Certificate
    - National Permit
    - Tax Receipt
    - Registration Certificate
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_documents' AND column_name = 'document_category'
  ) THEN
    ALTER TABLE vehicle_documents ADD COLUMN document_category text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_documents' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE vehicle_documents ADD COLUMN file_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_documents' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE vehicle_documents ADD COLUMN file_size integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_documents' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE vehicle_documents ADD COLUMN file_type text DEFAULT '';
  END IF;
END $$;
