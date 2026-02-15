/*
  # Create Trip Stops Table
  
  ## Overview
  Creates trip_stops table for multi-stop (Milk Run) trip support.
  
  ## New Table Created
  
  ### `trip_stops`
  Individual stops for milk run trips
  - Stop sequence and type (Pickup/Drop)
  - Location and city reference
  - Planned vs actual arrival/departure times
  - Contact information
  - Load type per stop
  
  ## Security
  - Enable RLS on trip_stops table
  - Authenticated users can manage stops for their trips
*/

-- Create trip_stops table
CREATE TABLE IF NOT EXISTS trip_stops (
  trip_stop_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
  stop_sequence integer NOT NULL,
  stop_type text NOT NULL CHECK (stop_type IN ('Pickup', 'Drop')),
  location text NOT NULL,
  city_id uuid REFERENCES cities(city_id),
  load_type text CHECK (load_type IN ('Reefer-Chilled', 'Reefer-Ambient', 'Dry', 'Empty')),
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_sequence ON trip_stops(trip_id, stop_sequence);

-- Enable RLS
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_stops
CREATE POLICY "Users can read trip stops"
  ON trip_stops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.trip_id = trip_stops.trip_id
    )
  );

CREATE POLICY "Users can create trip stops"
  ON trip_stops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.trip_id = trip_stops.trip_id
    )
  );

CREATE POLICY "Users can update trip stops"
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

CREATE POLICY "Users can delete trip stops"
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