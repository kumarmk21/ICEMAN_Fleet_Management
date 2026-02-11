/*
  # Add Load Type to Trips and Trip Stops

  1. Changes
    - Add `load_type` column to `trips` table
      - Type: TEXT
      - Allowed values: 'Reefer', 'Dry', 'Empty'
      - Nullable: YES (to support existing data)
      - Used for tracking load type at trip level for Single route type trips
    
    - Add `load_type` column to `trip_stops` table
      - Type: TEXT
      - Allowed values: 'Reefer', 'Dry', 'Empty'
      - Nullable: YES
      - Used for tracking load type at each stop level for Milk Run trips
  
  2. Purpose
    - Enable tracking of load type for both Single and Milk Run trip types
    - Support Trip Expenses module where Standard Fuel Cost depends on Load Type
    - Provide flexibility for different load types at different stops in Milk Run trips

  3. Notes
    - Columns are nullable to support existing trip data
    - Check constraints ensure only valid load types are stored
    - Both tables updated to maintain consistency across trip types
*/

-- Add load_type column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'load_type'
  ) THEN
    ALTER TABLE trips ADD COLUMN load_type TEXT;
    
    -- Add check constraint for valid load types
    ALTER TABLE trips ADD CONSTRAINT trips_load_type_check 
      CHECK (load_type IN ('Reefer', 'Dry', 'Empty'));
  END IF;
END $$;

-- Add load_type column to trip_stops table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_stops' AND column_name = 'load_type'
  ) THEN
    ALTER TABLE trip_stops ADD COLUMN load_type TEXT;
    
    -- Add check constraint for valid load types
    ALTER TABLE trip_stops ADD CONSTRAINT trip_stops_load_type_check 
      CHECK (load_type IN ('Reefer', 'Dry', 'Empty'));
  END IF;
END $$;
