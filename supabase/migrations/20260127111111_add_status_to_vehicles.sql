/*
  # Add Status Column to Vehicles Table

  1. New Columns
    - `vehicle_status` (text, default: 'Active')
      - Tracks if a vehicle is active or inactive
      - Can be 'Active' or 'Inactive'

  2. Updates
    - All existing vehicles are set to 'Active' status by default

  3. Notes
    - Status column allows vehicles to be marked as inactive without deleting them
    - Maintains historical data while allowing soft deactivation of vehicles
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_status text DEFAULT 'Active';
  END IF;
END $$;

UPDATE vehicles SET vehicle_status = 'Active' WHERE vehicle_status IS NULL OR vehicle_status = '';
