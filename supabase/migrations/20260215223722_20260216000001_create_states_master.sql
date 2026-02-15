/*
  # Create State Master Table

  ## Overview
  Creates a master table for Indian states with GST state codes and abbreviations.

  ## New Tables Created

  ### `states`
  State master data for India
  - `state_id` (uuid, primary key)
  - `state_name` (text, unique) - Full name of the state/UT
  - `gst_state_code` (text, unique) - GST state code (2 digits)
  - `state_abbreviation` (text, unique) - Short code for the state
  - `is_active` (boolean) - Whether the state is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on states table
  - All authenticated users can read states
  - Only Admin can insert/update/delete states
*/

-- Create states table
CREATE TABLE IF NOT EXISTS states (
  state_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name text UNIQUE NOT NULL,
  gst_state_code text UNIQUE NOT NULL,
  state_abbreviation text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE states ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read states"
  ON states FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert states"
  ON states FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admin can update states"
  ON states FOR UPDATE
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

CREATE POLICY "Admin can delete states"
  ON states FOR DELETE
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
CREATE TRIGGER update_states_updated_at
  BEFORE UPDATE ON states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_states_code ON states(gst_state_code);
CREATE INDEX IF NOT EXISTS idx_states_active ON states(is_active);

-- Insert all Indian states and union territories with GST codes
INSERT INTO states (state_name, gst_state_code, state_abbreviation) VALUES
  -- States
  ('Andhra Pradesh', '37', 'AP'),
  ('Arunachal Pradesh', '12', 'AR'),
  ('Assam', '18', 'AS'),
  ('Bihar', '10', 'BR'),
  ('Chhattisgarh', '22', 'CG'),
  ('Goa', '30', 'GA'),
  ('Gujarat', '24', 'GJ'),
  ('Haryana', '06', 'HR'),
  ('Himachal Pradesh', '02', 'HP'),
  ('Jharkhand', '20', 'JH'),
  ('Karnataka', '29', 'KA'),
  ('Kerala', '32', 'KL'),
  ('Madhya Pradesh', '23', 'MP'),
  ('Maharashtra', '27', 'MH'),
  ('Manipur', '14', 'MN'),
  ('Meghalaya', '17', 'ML'),
  ('Mizoram', '15', 'MZ'),
  ('Nagaland', '13', 'NL'),
  ('Odisha', '21', 'OR'),
  ('Punjab', '03', 'PB'),
  ('Rajasthan', '08', 'RJ'),
  ('Sikkim', '11', 'SK'),
  ('Tamil Nadu', '33', 'TN'),
  ('Telangana', '36', 'TG'),
  ('Tripura', '16', 'TR'),
  ('Uttar Pradesh', '09', 'UP'),
  ('Uttarakhand', '05', 'UK'),
  ('West Bengal', '19', 'WB'),

  -- Union Territories
  ('Andaman and Nicobar Islands', '35', 'AN'),
  ('Chandigarh', '04', 'CH'),
  ('Dadra and Nagar Haveli and Daman and Diu', '26', 'DD'),
  ('Delhi', '07', 'DL'),
  ('Jammu and Kashmir', '01', 'JK'),
  ('Ladakh', '38', 'LA'),
  ('Lakshadweep', '31', 'LD'),
  ('Puducherry', '34', 'PY')
ON CONFLICT (state_name) DO NOTHING;