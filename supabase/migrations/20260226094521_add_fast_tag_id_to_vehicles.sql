/*
  # Add Fast Tag ID to Vehicles Table

  1. Changes
    - Add `fast_tag_id` column to `vehicles` table as a foreign key reference to `fast_tags_master`
    - The column is nullable since not all vehicles may have a fast tag assigned
    
  2. Purpose
    - Links vehicles to their assigned fast tags for toll payments tracking
*/

-- Add fast_tag_id column to vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fast_tag_id'
  ) THEN
    ALTER TABLE vehicles 
    ADD COLUMN fast_tag_id uuid REFERENCES fast_tags_master(fast_tag_id);
  END IF;
END $$;
