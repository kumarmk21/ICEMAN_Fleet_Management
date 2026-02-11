/*
  # Rename Actual Start DateTime and Add Loading TAT Hours

  1. Changes to trips table
    - Rename `actual_start_datetime` to `vehicle_placement_datetime`
      - Purpose: Better reflects the field's meaning - when vehicle was placed at loading point
      - Type: timestamptz (timestamp with timezone)
    
    - Add `loading_tat_hrs` field
      - Purpose: Records actual hours taken from vehicle placement to departure
      - Type: decimal(10,2) to store hours with 2 decimal precision
      - Default: 0
      - Can be calculated as: (veh_departure - vehicle_placement_datetime) in hours
  
  2. Purpose
    - More accurate terminology: "placement" is clearer than "actual start"
    - Track loading turnaround time (TAT) for performance analysis
    - Measure efficiency of loading operations
*/

-- Rename actual_start_datetime to vehicle_placement_datetime
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'actual_start_datetime'
  ) THEN
    ALTER TABLE trips RENAME COLUMN actual_start_datetime TO vehicle_placement_datetime;
    COMMENT ON COLUMN trips.vehicle_placement_datetime IS 'Date and time when vehicle was placed at loading point';
  END IF;
END $$;

-- Add loading_tat_hrs field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'loading_tat_hrs'
  ) THEN
    ALTER TABLE trips ADD COLUMN loading_tat_hrs decimal(10,2) DEFAULT 0;
    COMMENT ON COLUMN trips.loading_tat_hrs IS 'Loading turnaround time in hours - time from placement to departure';
  END IF;
END $$;
