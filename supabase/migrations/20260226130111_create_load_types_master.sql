/*
  # Create Load Types Master Table

  1. New Tables
    - `load_types_master`
      - `load_type_id` (uuid, primary key)
      - `load_type_name` (text, unique) - Name of the load type
      - `description` (text) - Description of the load type
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `load_types_master` table
    - Add policy for authenticated users to read load types
    - Add policy for admin users to manage load types

  3. Initial Data
    - Insert standard load types: Reefer-Chilled, Reefer-Ambient, Dry, Empty
*/

CREATE TABLE IF NOT EXISTS load_types_master (
  load_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  load_type_name text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE load_types_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read load types"
  ON load_types_master FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin users can insert load types"
  ON load_types_master FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Admin users can update load types"
  ON load_types_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Admin users can delete load types"
  ON load_types_master FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'admin'
    )
  );

INSERT INTO load_types_master (load_type_name, description) VALUES
  ('Reefer-Chilled', 'Temperature-controlled refrigerated load (chilled)'),
  ('Reefer-Ambient', 'Temperature-controlled refrigerated load (ambient)'),
  ('Dry', 'Standard dry load without temperature control'),
  ('Empty', 'Empty return trip')
ON CONFLICT (load_type_name) DO NOTHING;
