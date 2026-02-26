/*
  # Fix Vehicle Documents RLS Policies - Case Sensitivity

  1. Changes
    - Update policies to use correct case-sensitive role names
    - Change 'admin' to 'Admin'
    - Change 'fleet_manager' to 'Fleet Manager'

  2. Security
    - Maintains same access control but with correct role name matching
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin and Fleet Manager can insert vehicle_documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Admin and Fleet Manager can update vehicle_documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Admin and Fleet Manager can delete vehicle_documents" ON vehicle_documents;

-- Create separate policies with correct role names
CREATE POLICY "Admin and Fleet Manager can insert vehicle_documents"
  ON vehicle_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM roles WHERE role_name IN ('Admin', 'Fleet Manager')
      )
    )
  );

CREATE POLICY "Admin and Fleet Manager can update vehicle_documents"
  ON vehicle_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM roles WHERE role_name IN ('Admin', 'Fleet Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM roles WHERE role_name IN ('Admin', 'Fleet Manager')
      )
    )
  );

CREATE POLICY "Admin and Fleet Manager can delete vehicle_documents"
  ON vehicle_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM roles WHERE role_name IN ('Admin', 'Fleet Manager')
      )
    )
  );
