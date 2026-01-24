/*
  # Make vehicle_id and driver_id nullable in trips table
  
  1. Changes
    - Modify `vehicle_id` column in `trips` table to allow NULL values
    - Modify `driver_id` column in `trips` table to allow NULL values
  
  2. Reasoning
    - When converting an enquiry to a trip, vehicle and driver may not be assigned yet
    - These can be assigned later when planning the trip
    - This allows for a more flexible workflow
*/

ALTER TABLE trips 
  ALTER COLUMN vehicle_id DROP NOT NULL,
  ALTER COLUMN driver_id DROP NOT NULL;
