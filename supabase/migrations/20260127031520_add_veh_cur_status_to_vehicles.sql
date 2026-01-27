/*
  # Add Vehicle Current Status Column

  1. Changes to vehicles table
    - Add `veh_cur_status` (text, nullable) - stores current vehicle status (e.g., Active, Inactive, In Maintenance, etc.)

  2. Notes
    - Using IF NOT EXISTS to safely add the column
    - Default value is empty string for existing records
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'veh_cur_status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN veh_cur_status text DEFAULT '';
  END IF;
END $$;
