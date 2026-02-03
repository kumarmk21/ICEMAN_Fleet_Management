/*
  # Update Vehicle Types Composite Unique Constraint

  1. Changes
    - Drop existing unique constraint on vehicle_type_name only
    - Add composite unique constraint on (vehicle_type_name, temp_type, capacity_tons)
  
  2. Purpose
    - Allow same vehicle type name with different temperature types and capacities
    - Ensure no duplicates based on the combination of all three fields
*/

-- Drop existing unique constraint on vehicle_type_name
ALTER TABLE vehicle_types_master 
DROP CONSTRAINT IF EXISTS vehicle_types_master_vehicle_type_name_key;

-- Add composite unique constraint on vehicle_type_name, temp_type, and capacity_tons
ALTER TABLE vehicle_types_master 
ADD CONSTRAINT vehicle_types_master_unique_combination 
UNIQUE (vehicle_type_name, temp_type, capacity_tons);