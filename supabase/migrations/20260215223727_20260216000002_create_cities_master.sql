/*
  # Create City Master Table

  ## Overview
  Creates a master table for Indian cities (Tier 1 and Tier 2) with state references.

  ## New Tables Created

  ### `cities`
  City master data for India
  - `city_id` (uuid, primary key)
  - `city_name` (text, not null) - Name of the city
  - `state_id` (uuid, foreign key) - Reference to states table
  - `tier` (text) - City tier classification (Tier 1, Tier 2)
  - `is_active` (boolean) - Whether the city is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on cities table
  - All authenticated users can read cities
  - Only Admin can insert/update/delete cities
*/

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  city_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  state_id uuid NOT NULL REFERENCES states(state_id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city_name, state_id)
);

-- Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read cities"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admin can update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admin can delete cities"
  ON cities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_tier ON cities(tier);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(city_name);

-- Insert Tier 1 cities
INSERT INTO cities (city_name, state_id, tier)
SELECT 'Mumbai', state_id, 'Tier 1' FROM states WHERE state_name = 'Maharashtra'
UNION ALL
SELECT 'Delhi', state_id, 'Tier 1' FROM states WHERE state_name = 'Delhi'
UNION ALL
SELECT 'Bangalore', state_id, 'Tier 1' FROM states WHERE state_name = 'Karnataka'
UNION ALL
SELECT 'Hyderabad', state_id, 'Tier 1' FROM states WHERE state_name = 'Telangana'
UNION ALL
SELECT 'Ahmedabad', state_id, 'Tier 1' FROM states WHERE state_name = 'Gujarat'
UNION ALL
SELECT 'Chennai', state_id, 'Tier 1' FROM states WHERE state_name = 'Tamil Nadu'
UNION ALL
SELECT 'Kolkata', state_id, 'Tier 1' FROM states WHERE state_name = 'West Bengal'
UNION ALL
SELECT 'Pune', state_id, 'Tier 1' FROM states WHERE state_name = 'Maharashtra'
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 2 cities
INSERT INTO cities (city_name, state_id, tier)
SELECT 'Jaipur', state_id, 'Tier 2' FROM states WHERE state_name = 'Rajasthan'
UNION ALL
SELECT 'Lucknow', state_id, 'Tier 2' FROM states WHERE state_name = 'Uttar Pradesh'
UNION ALL
SELECT 'Kochi', state_id, 'Tier 2' FROM states WHERE state_name = 'Kerala'
UNION ALL
SELECT 'Chandigarh', state_id, 'Tier 2' FROM states WHERE state_name = 'Chandigarh'
UNION ALL
SELECT 'Coimbatore', state_id, 'Tier 2' FROM states WHERE state_name = 'Tamil Nadu'
UNION ALL
SELECT 'Indore', state_id, 'Tier 2' FROM states WHERE state_name = 'Madhya Pradesh'
UNION ALL
SELECT 'Nagpur', state_id, 'Tier 2' FROM states WHERE state_name = 'Maharashtra'
UNION ALL
SELECT 'Visakhapatnam', state_id, 'Tier 2' FROM states WHERE state_name = 'Andhra Pradesh'
UNION ALL
SELECT 'Surat', state_id, 'Tier 2' FROM states WHERE state_name = 'Gujarat'
UNION ALL
SELECT 'Kanpur', state_id, 'Tier 2' FROM states WHERE state_name = 'Uttar Pradesh'
ON CONFLICT (city_name, state_id) DO NOTHING;