/*
  # Change enquiries created_by and converted_to_trip_id to text

  ## Changes
  1. Drop FK constraint on `created_by` (was referencing user_profiles.user_id as uuid)
     and change column type to text so it stores the user's full_name.
  2. Drop FK constraint on `converted_to_trip_id` (was referencing trips.trip_id as uuid)
     and change column type to text so it stores the trip_number (e.g. TR00001).
*/

ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_created_by_fkey;
ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_converted_to_trip_id_fkey;

ALTER TABLE enquiries ALTER COLUMN created_by TYPE text USING NULL;
ALTER TABLE enquiries ALTER COLUMN converted_to_trip_id TYPE text USING NULL;
