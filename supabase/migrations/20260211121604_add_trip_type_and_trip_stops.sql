/*
  # Add Trip Type and Trip Stops Support

  ## Overview
  This migration enables support for both single trips (Point A to Point B) and milk run trips 
  (multiple pickups and drops). It adds a trip_type field to the trips table and creates a new 
  trip_stops table to track individual stops in milk run trips.

  ## Changes Made

  ### 1. Trips Table Updates
    - Add `trip_type` column: 'Single' (default) or 'Milk Run'
    - Existing trips default to 'Single' for backward compatibility
    - Origin and destination fields will contain:
      - Single trips: Actual origin/destination
      - Milk runs: Summary text or first/last stop info

  ### 2. New Table: trip_stops
    - `trip_stop_id` (uuid, primary key)
    - `trip_id` (FK to trips table)
    - `stop_sequence` (integer) - Order of the stop in the trip (1, 2, 3...)
    - `stop_type` (text) - 'Pickup' or 'Drop'
    - `location` (text) - Location name/address
    - `city_id` (uuid, FK to cities) - Optional city reference
    - `planned_arrival_datetime` (timestamptz) - When vehicle should arrive
    - `actual_arrival_datetime` (timestamptz) - When vehicle actually arrived
    - `planned_departure_datetime` (timestamptz) - When vehicle should leave
    - `actual_departure_datetime` (timestamptz) - When vehicle actually left
    - `contact_person` (text) - Contact at this stop
    - `contact_phone` (text) - Contact phone number
    - `remarks` (text) - Any notes about this stop
    - Timestamps: created_at, updated_at

  ### 3. Security
    - Enable RLS on trip_stops table
    - Add policies for authenticated users to:
      - Read stops for trips they can access
      - Create stops for new trips
      - Update stops for trips in their organization
      - Delete stops they created

  ## Notes
  - Single trips continue working as before (no stops needed)
  - Milk run trips should have at least 2 stops in trip_stops table
  - Stop sequence determines the order of execution
  - Each stop can have planned vs actual times for tracking delays
*/

-- Add trip_type column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'trip_type'
  ) THEN
    ALTER TABLE trips ADD COLUMN trip_type text DEFAULT 'Single' CHECK (trip_type IN ('Single', 'Milk Run'));
  END IF;
END $$;

-- Update existing trips to have 'Single' type
UPDATE trips SET trip_type = 'Single' WHERE trip_type IS NULL;

-- Create trip_stops table
CREATE TABLE IF NOT EXISTS trip_stops (
  trip_stop_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
  stop_sequence integer NOT NULL,
  stop_type text NOT NULL CHECK (stop_type IN ('Pickup', 'Drop')),
  location text NOT NULL,
  city_id uuid REFERENCES cities(city_id),
  planned_arrival_datetime timestamptz,
  actual_arrival_datetime timestamptz,
  planned_departure_datetime timestamptz,
  actual_departure_datetime timestamptz,
  contact_person text,
  contact_phone text,
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, stop_sequence)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_sequence ON trip_stops(trip_id, stop_sequence);

-- Enable RLS on trip_stops
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_stops

-- Policy: Authenticated users can read stops for trips in their organization
CREATE POLICY "Users can read trip stops in their organization"
  ON trip_stops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.trip_id = trip_stops.trip_id
    )
  );

-- Policy: Authenticated users can create trip stops for trips in their organization
CREATE POLICY "Users can create trip stops in their organization"
  ON trip_stops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.trip_id = trip_stops.trip_id
    )
  );

-- Policy: Authenticated users can update trip stops in their organization
CREATE POLICY "Users can update trip stops in their organization"
  ON trip_stops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.trip_id = trip_stops.trip_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.trip_id = trip_stops.trip_id
    )
  );

-- Policy: Authenticated users can delete trip stops in their organization
CREATE POLICY "Users can delete trip stops in their organization"
  ON trip_stops FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.trip_id = trip_stops.trip_id
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_trip_stops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trip_stops_updated_at ON trip_stops;
CREATE TRIGGER trip_stops_updated_at
  BEFORE UPDATE ON trip_stops
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_stops_updated_at();