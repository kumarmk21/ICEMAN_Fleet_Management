/*
  # Add Standard Fuel Cost - Chiller to Vehicles

  Adds `standard_fuel_cost_chiller` column (numeric, default 0) to the vehicles table,
  representing the standard fuel cost per KM for chiller (ambient reefer) operations.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'standard_fuel_cost_chiller'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN standard_fuel_cost_chiller numeric DEFAULT 0;
  END IF;
END $$;
