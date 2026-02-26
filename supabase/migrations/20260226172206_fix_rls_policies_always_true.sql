/*
  # Fix RLS Policies That Are Always True
  
  1. Changes
    - Replace policies with USING (true) or WITH CHECK (true) with proper role-based checks
    - This enforces proper security instead of allowing unrestricted access
  
  2. Tables Affected
    - customers (insert policy)
    - diesel_cards_master (delete, insert, update policies)
    - document_types (handled in previous migration)
    - fast_tags_master (delete, insert, update policies)
    - vehicle_types_master (create, delete, update policies)
    - vehicles (delete policy)
  
  3. Security Impact
    - Prevents unrestricted access to sensitive data
    - Enforces role-based access control for all operations
*/

-- Fix customers insert policy
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;

CREATE POLICY "Admin and Fleet Manager can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Fix diesel_cards_master policies
DROP POLICY IF EXISTS "Authenticated users can delete diesel cards" ON diesel_cards_master;
DROP POLICY IF EXISTS "Authenticated users can insert diesel cards" ON diesel_cards_master;
DROP POLICY IF EXISTS "Authenticated users can update diesel cards" ON diesel_cards_master;

CREATE POLICY "Admin and Fleet Manager can insert diesel cards"
  ON diesel_cards_master FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can update diesel cards"
  ON diesel_cards_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can delete diesel cards"
  ON diesel_cards_master FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Fix fast_tags_master policies
DROP POLICY IF EXISTS "Authenticated users can delete fast tags" ON fast_tags_master;
DROP POLICY IF EXISTS "Authenticated users can insert fast tags" ON fast_tags_master;
DROP POLICY IF EXISTS "Authenticated users can update fast tags" ON fast_tags_master;

CREATE POLICY "Admin and Fleet Manager can insert fast tags"
  ON fast_tags_master FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can update fast tags"
  ON fast_tags_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can delete fast tags"
  ON fast_tags_master FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Fix vehicle_types_master policies
DROP POLICY IF EXISTS "Authenticated users can create vehicle types" ON vehicle_types_master;
DROP POLICY IF EXISTS "Authenticated users can delete vehicle types" ON vehicle_types_master;
DROP POLICY IF EXISTS "Authenticated users can update vehicle types" ON vehicle_types_master;

CREATE POLICY "Admin and Fleet Manager can insert vehicle types"
  ON vehicle_types_master FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can update vehicle types"
  ON vehicle_types_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can delete vehicle types"
  ON vehicle_types_master FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Fix vehicles delete policy
DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON vehicles;

CREATE POLICY "Admin and Fleet Manager can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );
