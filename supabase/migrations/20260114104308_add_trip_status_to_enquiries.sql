/*
  # Add trip_status to enquiries table

  ## Overview
  Adds a trip_status field to track the status of trips created from enquiries.
  
  ## Changes
  
  1. New Column Added to `enquiries` table:
    - `trip_status` (text) - Status of the trip created from this enquiry
      - Possible values: 'Planned', 'In Transit', 'Completed', 'Closed', 'Cancelled'
      - Default: NULL (no trip created yet)
  
  ## Notes
  - This field is separate from the `status` field which tracks enquiry workflow
  - The `status` field tracks: New → Quoted → Converted/Lost
  - The `trip_status` field tracks actual trip execution status once converted
*/

-- Add trip_status column to enquiries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enquiries' AND column_name = 'trip_status'
  ) THEN
    ALTER TABLE enquiries ADD COLUMN trip_status text CHECK (trip_status IN ('Planned', 'In Transit', 'Completed', 'Closed', 'Cancelled'));
  END IF;
END $$;
