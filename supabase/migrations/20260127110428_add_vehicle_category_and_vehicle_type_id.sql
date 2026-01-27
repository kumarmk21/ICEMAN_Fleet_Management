/*
  # Add Vehicle Category and Vehicle Type ID to Vehicles Table

  1. Changes
    - Add `vehicle_type_id` column to link vehicles to vehicle_types_master table
      - Foreign key constraint to vehicle_types_master
      - Nullable for backward compatibility
    - Update `vehicle_category` logic to pull from vehicle_types_master.temp_type when vehicle_type_id is set
    - This creates a relationship where vehicle category is determined by the temperature type of the selected vehicle type
    
  2. Notes
    - This creates a link between vehicles and vehicle types master
    - The vehicle category will be based on the vehicle type's temperature requirement
    - Frozen, Ambient, or Dry temperature types
*/

-- Add vehicle_type_id column to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_type_id'
  ) THEN
    ALTER TABLE vehicles
    ADD COLUMN vehicle_type_id uuid REFERENCES vehicle_types_master(vehicle_type_id);
  END IF;
END $$;