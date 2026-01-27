/*
  # Add Temperature Type Field to Vehicle Types Master

  1. Changes
    - Add `temp_type` column to `vehicle_types_master` table
      - Values: 'Frozen', 'Ambient', 'Dry'
      - Default: 'Ambient'
      - NOT NULL constraint with CHECK constraint for valid values
    
  2. Notes
    - This field categorizes vehicles by temperature control requirements
    - Frozen: Refrigerated vehicles for frozen goods
    - Ambient: Standard temperature vehicles
    - Dry: Dry/non-temperature-controlled vehicles
*/

-- Add temp_type column to vehicle_types_master
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicle_types_master' AND column_name = 'temp_type'
  ) THEN
    ALTER TABLE vehicle_types_master 
    ADD COLUMN temp_type text DEFAULT 'Ambient' NOT NULL 
    CHECK (temp_type IN ('Frozen', 'Ambient', 'Dry'));
  END IF;
END $$;