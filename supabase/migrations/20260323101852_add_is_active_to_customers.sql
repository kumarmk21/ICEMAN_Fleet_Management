/*
  # Add is_active flag to customers table

  ## Changes
  - Adds `is_active` boolean column to `customers` table with a default of `true`
  - All existing customers are set to active (true) on migration
  - This enables soft-deletion / deactivation of customers without data loss

  ## Security
  - No RLS changes needed; existing policies remain intact
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE customers ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    UPDATE customers SET is_active = true WHERE is_active IS NULL;
  END IF;
END $$;
