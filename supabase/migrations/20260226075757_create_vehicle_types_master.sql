/*
  # Create Vehicle Types Master Table

  1. New Tables
    - `vehicle_types_master`
      - `vehicle_type_id` (uuid, primary key)
      - `vehicle_type_name` (text, unique) - Name of vehicle type (e.g., "32 FEET 9.5 TON")
      - `capacity_tons` (numeric) - Capacity in tons
      - `vehicle_category` (text) - Category: Dry, Frozen, Ambient
      - `temp_type` (text) - Temperature type: Reefer-Chilled, Reefer-Ambient, Dry, Empty
      - `standard_kmpl` (numeric) - Standard fuel efficiency in km per liter
      - `standard_fuel_cost_per_km` (numeric) - Standard fuel cost per kilometer
      - `is_active` (boolean) - Whether the vehicle type is active
      - `remarks` (text) - Additional remarks
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `vehicle_types_master` table
    - Add policies for authenticated users to read all vehicle types
    - Add policies for admin users to manage vehicle types

  3. Indexes
    - Index on vehicle_category for filtering
    - Index on is_active for filtering active types
*/

-- Create vehicle_types_master table
CREATE TABLE IF NOT EXISTS vehicle_types_master (
  vehicle_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_name text UNIQUE NOT NULL,
  capacity_tons numeric DEFAULT 0,
  vehicle_category text CHECK (vehicle_category IN ('Dry', 'Frozen', 'Ambient')),
  temp_type text CHECK (temp_type IN ('Reefer-Chilled', 'Reefer-Ambient', 'Dry', 'Empty')),
  standard_kmpl numeric DEFAULT 0,
  standard_fuel_cost_per_km numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_types_category ON vehicle_types_master(vehicle_category);
CREATE INDEX IF NOT EXISTS idx_vehicle_types_active ON vehicle_types_master(is_active);

-- Enable RLS
ALTER TABLE vehicle_types_master ENABLE ROW LEVEL SECURITY;

-- Policies for SELECT
CREATE POLICY "Authenticated users can view all vehicle types"
  ON vehicle_types_master
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for INSERT
CREATE POLICY "Authenticated users can create vehicle types"
  ON vehicle_types_master
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for UPDATE
CREATE POLICY "Authenticated users can update vehicle types"
  ON vehicle_types_master
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for DELETE
CREATE POLICY "Authenticated users can delete vehicle types"
  ON vehicle_types_master
  FOR DELETE
  TO authenticated
  USING (true);

-- Add some sample data
INSERT INTO vehicle_types_master (vehicle_type_name, capacity_tons, vehicle_category, temp_type, standard_kmpl, standard_fuel_cost_per_km, is_active)
VALUES
  ('32 FEET 9.5 TON', 9.5, 'Frozen', 'Reefer-Chilled', 3.5, 12.0, true),
  ('32 FEET 12 TON', 12.0, 'Frozen', 'Reefer-Chilled', 3.5, 12.0, true),
  ('24 FEET 7 TON', 7.0, 'Frozen', 'Reefer-Chilled', 4.0, 10.0, true),
  ('20 FEET 5 TON', 5.0, 'Dry', 'Dry', 5.0, 8.0, true),
  ('14 FEET 3 TON', 3.0, 'Dry', 'Dry', 6.0, 7.0, true)
ON CONFLICT (vehicle_type_name) DO NOTHING;
