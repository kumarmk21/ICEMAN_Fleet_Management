/*
  # Add Vehicle Category and Standard KMPL to Vehicles Table

  1. Changes to Vehicles Table
    - Add `vehicle_category` column with options: "Dry", "Frozen", "Ambient"
    - Add `standard_fuel_kmpl` column to track standard fuel efficiency (moved from routes)
  
  2. Changes to Routes Table
    - Remove `standard_fuel_kmpl` column (will be tracked per vehicle instead)
  
  ## Rationale
  - Vehicle category determines the type of cargo the vehicle can carry (refrigerated vs non-refrigerated)
  - Fuel efficiency (KMPL) is a vehicle-specific attribute, not route-specific
  - This allows different vehicles on the same route to have different fuel consumption rates
*/

-- Add vehicle_category to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_category'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_category text;
    COMMENT ON COLUMN vehicles.vehicle_category IS 'Category of vehicle: Dry, Frozen, or Ambient';
  END IF;
END $$;

-- Add standard_fuel_kmpl to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'standard_fuel_kmpl'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN standard_fuel_kmpl numeric(10,2) DEFAULT 0;
    COMMENT ON COLUMN vehicles.standard_fuel_kmpl IS 'Standard fuel efficiency in kilometers per liter';
  END IF;
END $$;

-- Remove standard_fuel_kmpl from routes table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'standard_fuel_kmpl'
  ) THEN
    ALTER TABLE routes DROP COLUMN standard_fuel_kmpl;
  END IF;
END $$;