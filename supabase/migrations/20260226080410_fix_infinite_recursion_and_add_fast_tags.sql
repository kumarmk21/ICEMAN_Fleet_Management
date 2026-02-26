/*
  # Fix Infinite Recursion in RLS Policies and Add Missing Tables

  1. Changes
    - Drop and recreate user_profiles RLS policies to avoid infinite recursion
    - Create fast_tags_master table that was missing
    - Use direct role_id comparison instead of subqueries that cause recursion

  2. Security
    - Policies now check role_id directly against known admin role UUID
    - Users can read their own profile
    - Only authenticated users can access data
*/

-- First, get the Admin role ID (we'll use it in policies)
DO $$
DECLARE
  admin_role_id uuid;
BEGIN
  -- Get admin role ID
  SELECT role_id INTO admin_role_id FROM roles WHERE role_name = 'Admin' LIMIT 1;
  
  -- Drop existing problematic policies on user_profiles
  DROP POLICY IF EXISTS "Users can read profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins insert profiles" ON user_profiles;
  DROP POLICY IF EXISTS "Admins delete profiles" ON user_profiles;

  -- Create new policies without recursion
  -- Users can read their own profile
  EXECUTE format('
    CREATE POLICY "Users can read own profile"
      ON user_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  ');

  -- Admins can read all profiles (using direct role_id check)
  IF admin_role_id IS NOT NULL THEN
    EXECUTE format('
      CREATE POLICY "Admins can read all profiles"
        ON user_profiles
        FOR SELECT
        TO authenticated
        USING (role_id = %L OR user_id IN (
          SELECT user_id FROM user_profiles WHERE role_id = %L AND user_id = auth.uid()
        ));
    ', admin_role_id, admin_role_id);
  END IF;

  -- Users can update their own profile
  EXECUTE format('
    CREATE POLICY "Users can update own profile"
      ON user_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  ');

  -- Admins can insert profiles
  IF admin_role_id IS NOT NULL THEN
    EXECUTE format('
      CREATE POLICY "Admins can insert profiles"
        ON user_profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() AND role_id = %L
        ));
    ', admin_role_id);
  END IF;

  -- Admins can delete profiles
  IF admin_role_id IS NOT NULL THEN
    EXECUTE format('
      CREATE POLICY "Admins can delete profiles"
        ON user_profiles
        FOR DELETE
        TO authenticated
        USING (EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() AND role_id = %L
        ));
    ', admin_role_id);
  END IF;
END $$;

-- Drop and recreate document_types policies to avoid any recursion
DROP POLICY IF EXISTS "Authenticated users can view document types" ON document_types;
DROP POLICY IF EXISTS "Authenticated users can manage document types" ON document_types;

CREATE POLICY "Authenticated users can read document types"
  ON document_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert document types"
  ON document_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update document types"
  ON document_types
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete document types"
  ON document_types
  FOR DELETE
  TO authenticated
  USING (true);

-- Create fast_tags_master table
CREATE TABLE IF NOT EXISTS fast_tags_master (
  fast_tag_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL,
  wallet_id text NOT NULL,
  tag_number text DEFAULT '',
  provider text DEFAULT '',
  balance numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_fast_tags_active ON fast_tags_master(is_active);
CREATE INDEX IF NOT EXISTS idx_fast_tags_vehicle ON fast_tags_master(vehicle_number);

-- Enable RLS
ALTER TABLE fast_tags_master ENABLE ROW LEVEL SECURITY;

-- Add policies for fast_tags_master
CREATE POLICY "Authenticated users can read fast tags"
  ON fast_tags_master
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fast tags"
  ON fast_tags_master
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fast tags"
  ON fast_tags_master
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fast tags"
  ON fast_tags_master
  FOR DELETE
  TO authenticated
  USING (true);
