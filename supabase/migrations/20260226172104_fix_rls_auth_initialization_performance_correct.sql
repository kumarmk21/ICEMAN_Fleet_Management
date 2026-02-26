/*
  # Fix RLS Auth Function Initialization Performance
  
  1. Changes
    - Replace auth.<function>() with (SELECT auth.<function>()) in RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale
  
  2. Tables Affected
    - customers
    - user_profiles
    - vehicle_documents
    - document_types
    - expense_heads
    - fuel_transactions
    - maintenance_jobs
    - tyres
    - vendors
    - load_types_master
*/

-- Drop and recreate customers policies
DROP POLICY IF EXISTS "Admin and Fleet Manager can update customers" ON customers;
DROP POLICY IF EXISTS "Admin and Fleet Manager can delete customers" ON customers;

CREATE POLICY "Admin and Fleet Manager can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Drop and recreate user_profiles policies
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Drop and recreate vehicle_documents policies
DROP POLICY IF EXISTS "Admin and Fleet Manager can insert vehicle_documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Admin and Fleet Manager can update vehicle_documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Admin and Fleet Manager can delete vehicle_documents" ON vehicle_documents;

CREATE POLICY "Admin and Fleet Manager can insert vehicle_documents"
  ON vehicle_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can update vehicle_documents"
  ON vehicle_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

CREATE POLICY "Admin and Fleet Manager can delete vehicle_documents"
  ON vehicle_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Drop and recreate document_types policies
DROP POLICY IF EXISTS "Admin can manage document_types" ON document_types;

CREATE POLICY "Admin can manage document_types"
  ON document_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Drop and recreate expense_heads policies
DROP POLICY IF EXISTS "Admin can manage expense_heads" ON expense_heads;

CREATE POLICY "Admin can manage expense_heads"
  ON expense_heads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Drop and recreate fuel_transactions policies
DROP POLICY IF EXISTS "Trip managers can manage fuel_transactions" ON fuel_transactions;

CREATE POLICY "Trip managers can manage fuel_transactions"
  ON fuel_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Trip Manager')
    )
  );

-- Drop and recreate maintenance_jobs policies
DROP POLICY IF EXISTS "Fleet managers can manage maintenance_jobs" ON maintenance_jobs;

CREATE POLICY "Fleet managers can manage maintenance_jobs"
  ON maintenance_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Drop and recreate tyres policies
DROP POLICY IF EXISTS "Fleet managers can manage tyres" ON tyres;

CREATE POLICY "Fleet managers can manage tyres"
  ON tyres FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Drop and recreate vendors policies
DROP POLICY IF EXISTS "Admin and Fleet Manager can manage vendors" ON vendors;

CREATE POLICY "Admin and Fleet Manager can manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager')
    )
  );

-- Drop and recreate load_types_master policies
DROP POLICY IF EXISTS "Admin users can insert load types" ON load_types_master;
DROP POLICY IF EXISTS "Admin users can update load types" ON load_types_master;
DROP POLICY IF EXISTS "Admin users can delete load types" ON load_types_master;

CREATE POLICY "Admin users can insert load types"
  ON load_types_master FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admin users can update load types"
  ON load_types_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admin users can delete load types"
  ON load_types_master FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );
