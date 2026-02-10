/*
  # Remove Temperature Type from Vehicle Types Constraint

  1. Changes
    - Drop existing composite unique constraint
    - Add new unique constraint on (vehicle_type_name, capacity_tons) only
    - Make temp_type nullable and set default value
  
  2. Purpose
    - Remove temperature type as a distinguishing factor for vehicle types
    - Allow vehicle type to be identified by name and capacity only
*/

-- Drop existing composite unique constraint
ALTER TABLE vehicle_types_master 
DROP CONSTRAINT IF EXISTS vehicle_types_master_unique_combination;

-- Make temp_type nullable
ALTER TABLE vehicle_types_master 
ALTER COLUMN temp_type DROP NOT NULL;

-- Set default value for temp_type
ALTER TABLE vehicle_types_master 
ALTER COLUMN temp_type SET DEFAULT 'Ambient';

-- Add unique constraint on vehicle_type_name and capacity_tons only
ALTER TABLE vehicle_types_master 
ADD CONSTRAINT vehicle_types_master_name_capacity_unique 
UNIQUE (vehicle_type_name, capacity_tons);