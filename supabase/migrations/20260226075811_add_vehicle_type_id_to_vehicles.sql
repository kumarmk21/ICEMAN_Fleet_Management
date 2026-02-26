/*
  # Add vehicle_type_id to vehicles table

  1. Changes
    - Add `vehicle_type_id` column to vehicles table
    - Add foreign key constraint to vehicle_types_master
    - Add index for performance

  2. Notes
    - Column is nullable to allow existing vehicles without types
    - Existing vehicles can be updated later to link to vehicle types
*/

-- Add vehicle_type_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_type_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_type_id uuid;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicles_vehicle_type_id_fkey'
  ) THEN
    ALTER TABLE vehicles
    ADD CONSTRAINT vehicles_vehicle_type_id_fkey
    FOREIGN KEY (vehicle_type_id)
    REFERENCES vehicle_types_master(vehicle_type_id);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON vehicles(vehicle_type_id);

-- Add vehicle_category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_category'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_category text CHECK (vehicle_category IN ('Dry', 'Frozen', 'Ambient'));
  END IF;
END $$;
