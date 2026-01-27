/*
  # Add Closing Odometer to Trips Table

  1. New Fields
    - `closing_odometer` (numeric, not nullable) - Records the odometer reading when trip is closed
  
  2. Changes
    - Add closing_odometer column to trips table to store closing odometer reading
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'closing_odometer'
  ) THEN
    ALTER TABLE trips ADD COLUMN closing_odometer numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
