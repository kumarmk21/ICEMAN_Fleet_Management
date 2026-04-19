/*
  # Add Opening Odometer to Trips Table

  ## Summary
  Adds an `opening_odometer` integer column to the `trips` table to store the
  vehicle's odometer reading at the start of each trip (auto-populated from
  Vehicle Master when a trip is created).

  ## Changes

  ### Modified Tables
  - `trips`: New column `opening_odometer` (integer, nullable) — stores the
    vehicle's odometer_current value at the time the trip is created.

  ## Notes
  - Integer only (no decimals) as per business requirement.
  - Nullable to support existing trips that were created before this column existed.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'opening_odometer'
  ) THEN
    ALTER TABLE trips ADD COLUMN opening_odometer integer;
  END IF;
END $$;
