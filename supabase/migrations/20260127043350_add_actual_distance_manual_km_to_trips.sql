/*
  # Add Actual Distance Manual KM field to Trips

  1. Changes
    - Add `actual_distance_manual_km` column to `trips` table
      - Type: decimal(10,2)
      - NOT NULL with DEFAULT 0
      - Represents manually entered actual distance

  2. Notes
    - This field will store manually entered actual distance
    - The existing `actual_distance_km` will be renamed in UI to "Actual Distance as Google"
    - This new field will be mandatory in the Create Trip form
*/

-- Add the actual_distance_manual_km column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'actual_distance_manual_km'
  ) THEN
    ALTER TABLE trips ADD COLUMN actual_distance_manual_km decimal(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;
