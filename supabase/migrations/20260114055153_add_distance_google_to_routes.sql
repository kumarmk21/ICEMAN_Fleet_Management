/*
  # Add Distance Google Field to Routes Table

  1. Changes
    - Add `distance_google` field to store Google Maps distance
    - Add `origin_city_id` field to reference cities table
    - Add `destination_city_id` field to reference cities table
    - Migrate existing text-based origin/destination to new structure

  2. Notes
    - distance_google stores the actual distance from Google Maps API
    - Maintains backward compatibility by keeping origin/destination text fields
    - New city_id fields will be used for dropdowns while text fields serve as fallback
*/

-- Add new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'distance_google'
  ) THEN
    ALTER TABLE routes ADD COLUMN distance_google numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'origin_city_id'
  ) THEN
    ALTER TABLE routes ADD COLUMN origin_city_id uuid REFERENCES cities(city_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'destination_city_id'
  ) THEN
    ALTER TABLE routes ADD COLUMN destination_city_id uuid REFERENCES cities(city_id);
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routes_origin_city_id ON routes(origin_city_id);
CREATE INDEX IF NOT EXISTS idx_routes_destination_city_id ON routes(destination_city_id);