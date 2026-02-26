/*
  # Fix Customers Insert Policy

  1. Changes
    - Drop the existing "Admin and Fleet Manager can manage customers" policy
    - Create separate policies for INSERT, UPDATE, and DELETE operations
    - Ensure INSERT policy allows authenticated users to create customers
    - Keep admin/fleet manager restriction for UPDATE and DELETE
  
  2. Security
    - SELECT: All authenticated users can read customers
    - INSERT: All authenticated users can create customers (matching existing behavior)
    - UPDATE: Only admin and fleet_manager can update
    - DELETE: Only admin and fleet_manager can delete
*/

-- Drop existing policy that covers ALL operations
DROP POLICY IF EXISTS "Admin and Fleet Manager can manage customers" ON customers;

-- Create separate INSERT policy for all authenticated users
CREATE POLICY "Authenticated users can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create UPDATE policy for admin and fleet_manager only
CREATE POLICY "Admin and Fleet Manager can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT roles.role_id
        FROM roles
        WHERE roles.role_name IN ('admin', 'fleet_manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT roles.role_id
        FROM roles
        WHERE roles.role_name IN ('admin', 'fleet_manager')
      )
    )
  );

-- Create DELETE policy for admin and fleet_manager only
CREATE POLICY "Admin and Fleet Manager can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT roles.role_id
        FROM roles
        WHERE roles.role_name IN ('admin', 'fleet_manager')
      )
    )
  );