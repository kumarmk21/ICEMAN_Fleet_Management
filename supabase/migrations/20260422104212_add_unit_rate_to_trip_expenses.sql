/*
  # Add unit_rate column to trip_expenses

  ## Summary
  Adds a general-purpose unit rate column to trip_expenses so that
  Amount can be auto-calculated as Quantity × Unit Rate for any
  expense type (not just fuel which already has rate_per_litre).

  ## Changes
  - `trip_expenses`
    - New column `unit_rate` (numeric, nullable) — rate per unit for non-fuel expenses
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_expenses' AND column_name = 'unit_rate'
  ) THEN
    ALTER TABLE trip_expenses ADD COLUMN unit_rate numeric DEFAULT NULL;
  END IF;
END $$;
