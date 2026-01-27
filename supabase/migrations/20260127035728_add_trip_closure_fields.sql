/*
  # Add Trip Closure Fields

  1. Changes to trips table
    - Add 'trip_closure' datetime column
    - Add 'trip_closed_by' text column
*/

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS trip_closure timestamptz,
ADD COLUMN IF NOT EXISTS trip_closed_by text;
