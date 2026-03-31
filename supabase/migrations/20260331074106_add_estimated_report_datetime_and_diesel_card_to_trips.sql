/*
  # Add Estimated Report DateTime and Diesel Card to Trips

  1. Changes
    - `estimated_report_datetime` (timestamptz) - Estimated time vehicle will report back
    - `diesel_card_id` (uuid, FK → diesel_cards_master) - Petro/fuel card assigned to this trip

  2. Notes
    - Both columns are nullable; no existing data is affected
    - No RLS changes needed; existing trip policies cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'estimated_report_datetime'
  ) THEN
    ALTER TABLE trips ADD COLUMN estimated_report_datetime timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'diesel_card_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN diesel_card_id uuid REFERENCES diesel_cards_master(diesel_card_id);
  END IF;
END $$;
