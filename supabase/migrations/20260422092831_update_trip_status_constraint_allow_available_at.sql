/*
  # Update trip_status check constraint to allow 'Available at {destination}'

  ## Change
  - Drops the existing trip_status check constraint on the trips table
  - Recreates it to also allow values starting with 'Available at '
    in addition to the existing allowed values
*/

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_trip_status_check;

ALTER TABLE trips ADD CONSTRAINT trips_trip_status_check
  CHECK (
    trip_status = ANY (ARRAY['Planned','In Transit','Completed','Closed','Cancelled'])
    OR trip_status LIKE 'In Transit To %'
    OR trip_status LIKE 'Available at %'
  );
