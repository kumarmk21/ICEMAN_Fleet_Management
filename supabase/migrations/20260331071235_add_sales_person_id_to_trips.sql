/*
  # Add Sales Person to Trips

  1. Changes
    - Adds `sales_person_id` column to `trips` table
      - References `user_profiles(user_id)` to track which sales person is associated with the trip
      - Nullable - not mandatory at trip creation
  
  2. Security
    - No RLS changes needed; existing trip policies cover this column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'sales_person_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN sales_person_id uuid REFERENCES user_profiles(user_id);
  END IF;
END $$;
