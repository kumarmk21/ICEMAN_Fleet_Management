/*
  # Fix trips_trip_status_check Constraint

  ## Summary
  The existing check constraint on `trips.trip_status` only allows a fixed set of
  values, but the application sets the status to dynamic strings like
  "In Transit To Bangalore" when a trip is created. This migration drops the
  overly strict constraint and replaces it with one that also permits the
  "In Transit To ..." pattern.

  ## Changes

  ### Modified Tables
  - `trips`: Updated `trips_trip_status_check` constraint to allow:
    - 'Planned'
    - 'In Transit' (exact)
    - 'In Transit To <destination>' (any string starting with 'In Transit To ')
    - 'Completed'
    - 'Closed'
    - 'Cancelled'
*/

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_trip_status_check;

ALTER TABLE trips
  ADD CONSTRAINT trips_trip_status_check
  CHECK (
    trip_status = ANY (ARRAY[
      'Planned',
      'In Transit',
      'Completed',
      'Closed',
      'Cancelled'
    ])
    OR trip_status LIKE 'In Transit To %'
  );
