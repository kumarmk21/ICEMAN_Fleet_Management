/*
  # Add Vehicle Category to Trips Table

  1. Changes
    - Add `vehicle_category` column to `trips` table
      - Type: text
      - Nullable: true
      - Description: Stores the vehicle category (Dry, Frozen, Ambient) from the vehicle master at time of trip creation
  
  2. Purpose
    - Track vehicle category information for each trip
    - Autopopulated from vehicle master when vehicle is selected
    - Provides historical reference even if vehicle category changes later
*/

-- Add vehicle_category to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'vehicle_category'
  ) THEN
    ALTER TABLE trips ADD COLUMN vehicle_category text;
    COMMENT ON COLUMN trips.vehicle_category IS 'Vehicle category (Dry, Frozen, Ambient) copied from vehicle master';
  END IF;
END $$;