/*
  # Add Load Type field to Enquiries Table

  1. Changes
    - Add `load_type` column to enquiries table
    - Add foreign key relationship to load_types_master
    - Make the field mandatory (NOT NULL) with a default for existing records

  2. Notes
    - Existing records will get 'Dry' as the default load type
    - New records must specify a load type
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enquiries' AND column_name = 'load_type'
  ) THEN
    ALTER TABLE enquiries ADD COLUMN load_type text;
    
    UPDATE enquiries SET load_type = 'Dry' WHERE load_type IS NULL;
    
    ALTER TABLE enquiries ALTER COLUMN load_type SET NOT NULL;
    ALTER TABLE enquiries ALTER COLUMN load_type SET DEFAULT 'Dry';
  END IF;
END $$;
