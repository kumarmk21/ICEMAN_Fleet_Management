/*
  # Add vehicle_number_text field to trips table

  1. Changes
    - Add `vehicle_number_text` column to `trips` table
  
  2. Purpose
    - Support Market vehicle type where vehicle is not from the fleet
    - When vehicle_type is 'Market', user enters vehicle number manually
    - This field stores the manually entered vehicle number for market vehicles
  
  3. Notes
    - Field is nullable as it's only used for Market vehicles
    - For Own/Attached vehicles, vehicle_id is used instead
*/

-- Add vehicle_number_text column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'vehicle_number_text'
  ) THEN
    ALTER TABLE trips ADD COLUMN vehicle_number_text text DEFAULT '';
  END IF;
END $$;
