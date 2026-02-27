/*
  # Remove Vehicle Category Check Constraint

  1. Changes
    - Drop the CHECK constraint on vehicles.vehicle_category
    - This allows dynamic categories from the categories table instead of hardcoded values

  2. Notes
    - The old constraint only allowed: 'Dry', 'Frozen', 'Ambient'
    - Now categories are managed through the categories master table
    - This provides flexibility to add/edit/remove categories without schema changes
*/

-- Drop the check constraint on vehicle_category
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_category_check;
