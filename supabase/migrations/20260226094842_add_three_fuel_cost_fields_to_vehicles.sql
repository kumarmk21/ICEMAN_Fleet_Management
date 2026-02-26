/*
  # Add Three Fuel Cost Fields to Vehicles Table

  1. Changes to vehicles table
    - Add three new fields for different vehicle conditions:
      - `standard_fuel_cost_reefer`: Fuel cost per km for reefer (refrigerated) condition
      - `standard_fuel_cost_dry`: Fuel cost per km for dry (normal load) condition
      - `standard_fuel_cost_empty`: Fuel cost per km for empty (no load) condition
  
  2. Data Types
    - All three fields are decimal(10,2) with default value of 0
    - All fields are NOT NULL with default values for data integrity
  
  3. Purpose
    - Allows tracking different fuel costs based on vehicle load conditions
    - More accurate fuel cost tracking for different operational scenarios
*/

-- Add three new fuel cost fields
DO $$
BEGIN
  -- Add standard_fuel_cost_reefer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'standard_fuel_cost_reefer'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN standard_fuel_cost_reefer decimal(10,2) DEFAULT 0 NOT NULL;
    COMMENT ON COLUMN vehicles.standard_fuel_cost_reefer IS 'Standard fuel cost per km for reefer (refrigerated) condition';
  END IF;

  -- Add standard_fuel_cost_dry
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'standard_fuel_cost_dry'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN standard_fuel_cost_dry decimal(10,2) DEFAULT 0 NOT NULL;
    COMMENT ON COLUMN vehicles.standard_fuel_cost_dry IS 'Standard fuel cost per km for dry (normal load) condition';
  END IF;

  -- Add standard_fuel_cost_empty
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'standard_fuel_cost_empty'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN standard_fuel_cost_empty decimal(10,2) DEFAULT 0 NOT NULL;
    COMMENT ON COLUMN vehicles.standard_fuel_cost_empty IS 'Standard fuel cost per km for empty (no load) condition';
  END IF;
END $$;
