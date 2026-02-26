/*
  # Fix Vehicle Documents RLS Policies

  1. Changes
    - Drop the overly broad "FOR ALL" policy
    - Create separate policies for INSERT, UPDATE, and DELETE operations
    - Each policy properly checks user role (admin or fleet_manager)

  2. Security
    - SELECT: All authenticated users can read vehicle documents
    - INSERT: Only admin and fleet_manager can insert vehicle documents
    - UPDATE: Only admin and fleet_manager can update vehicle documents
    - DELETE: Only admin and fleet_manager can delete vehicle documents
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin and Fleet Manager can manage vehicle_documents" ON vehicle_documents;

-- Create separate policies for each operation
CREATE POLICY "Admin and Fleet Manager can insert vehicle_documents"
  ON vehicle_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM roles WHERE role_name IN ('admin', 'fleet_manager')
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
        SELECT role_id FROM roles WHERE role_name IN ('admin', 'fleet_manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM roles WHERE role_name IN ('admin', 'fleet_manager')
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
        SELECT role_id FROM roles WHERE role_name IN ('admin', 'fleet_manager')
      )
    )
  );
