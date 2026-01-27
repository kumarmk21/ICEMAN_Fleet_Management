/*
  # Create Route Waypoints Table for Multi-Point Delivery (Milk Run)

  1. New Tables
    - `route_waypoints`
      - `waypoint_id` (uuid, primary key) - Unique identifier for each waypoint
      - `route_id` (uuid, foreign key) - Reference to parent route
      - `sequence_number` (integer) - Order of the waypoint in the route
      - `city_id` (uuid, foreign key) - Reference to cities master
      - `city_name` (text) - City name for display
      - `distance_from_previous_km` (decimal) - Distance from previous point (origin or previous waypoint)
      - `estimated_time_from_previous_hours` (decimal) - Estimated time from previous point
      - `stop_type` (text) - Type of stop: 'Pickup', 'Delivery', 'Both'
      - `remarks` (text) - Additional notes for this waypoint
      - `created_at` (timestamptz) - Timestamp when created
      - `updated_at` (timestamptz) - Timestamp when last updated

  2. Security
    - Enable RLS on `route_waypoints` table
    - Add policy for authenticated users to read waypoints
    - Add policy for authenticated users to insert waypoints
    - Add policy for authenticated users to update waypoints
    - Add policy for authenticated users to delete waypoints

  3. Indexes
    - Add index on route_id for fast lookups
    - Add unique constraint on (route_id, sequence_number) to prevent duplicates

  4. Notes
    - Waypoints are inserted between origin and destination of a route
    - Sequence numbers start from 1 (after origin, before destination)
    - Total route distance = sum of all segment distances
*/

-- Create route_waypoints table
CREATE TABLE IF NOT EXISTS route_waypoints (
  waypoint_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  sequence_number integer NOT NULL CHECK (sequence_number > 0),
  city_id uuid REFERENCES cities(city_id),
  city_name text NOT NULL,
  distance_from_previous_km decimal(10,2) DEFAULT 0,
  estimated_time_from_previous_hours decimal(5,2) DEFAULT 0,
  stop_type text DEFAULT 'Delivery' CHECK (stop_type IN ('Pickup', 'Delivery', 'Both')),
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(route_id, sequence_number)
);

-- Create index for fast lookups by route_id
CREATE INDEX IF NOT EXISTS idx_route_waypoints_route_id ON route_waypoints(route_id);

-- Enable RLS
ALTER TABLE route_waypoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for route_waypoints
CREATE POLICY "Authenticated users can view route waypoints"
  ON route_waypoints
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert route waypoints"
  ON route_waypoints
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update route waypoints"
  ON route_waypoints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete route waypoints"
  ON route_waypoints
  FOR DELETE
  TO authenticated
  USING (true);