/*
  # Add veh_departure column to trips table

  1. Changes
    - Add `veh_departure` column to trips table
      - Type: timestamptz (timestamp with timezone)
      - Nullable: true (non-mandatory field)
      - Purpose: Tracks actual vehicle departure date/time
      - When set, indicates the vehicle has departed and trip is in transit
  
  2. Notes
    - This field is used to track when a vehicle actually departs
    - Setting this field can trigger automatic status change to 'In Transit'
*/

-- Add veh_departure column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'veh_departure'
  ) THEN
    ALTER TABLE trips ADD COLUMN veh_departure timestamptz;
  END IF;
END $$;
