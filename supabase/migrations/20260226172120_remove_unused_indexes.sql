/*
  # Remove Unused Indexes
  
  1. Changes
    - Remove indexes that are not being used by queries
    - This reduces database size and improves write performance
  
  2. Indexes Removed
    - idx_vehicle_types_category (not used)
    - idx_vehicle_types_active (not used)
    - idx_vehicles_vehicle_type_id (not used)
    - idx_fast_tags_active (not used)
*/

DROP INDEX IF EXISTS idx_vehicle_types_category;
DROP INDEX IF EXISTS idx_vehicle_types_active;
DROP INDEX IF EXISTS idx_vehicles_vehicle_type_id;
DROP INDEX IF EXISTS idx_fast_tags_active;
