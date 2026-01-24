/*
  # Add enquiry_id to trips table

  ## Overview
  Links enquiries to trips so that converted enquiries can be tracked.

  ## Changes
  1. Add `enquiry_id` column to trips table
    - Nullable foreign key to enquiries table
    - Allows tracking which enquiry resulted in this trip
  
  2. Add index for performance
    - Index on enquiry_id for quick lookups

  ## Notes
  - This field is optional since not all trips come from enquiries
  - When an enquiry status is "Converted", it should reference a trip
*/

-- Add enquiry_id column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'enquiry_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN enquiry_id uuid REFERENCES enquiries(enquiry_id);
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_trips_enquiry_id ON trips(enquiry_id);