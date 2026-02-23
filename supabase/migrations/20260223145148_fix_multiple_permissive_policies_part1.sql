/*
  # Fix Multiple Permissive Policies - Part 1

  ## Security Fix - CRITICAL
  
  Replace overlapping permissive RLS policies with single, consolidated policies.
  Multiple permissive policies use OR logic and can create security vulnerabilities
  by allowing unintended access patterns.
  
  This migration fixes the following tables:
  - customers
  - diesel_cards_master
  - document_types
  - expense_heads
  - fuel_transactions
*/

-- Fix customers table - Consolidate SELECT policies
DROP POLICY IF EXISTS "Admin and Fleet Manager can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can read customers" ON public.customers;

CREATE POLICY "Authenticated users can read customers"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can manage customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM public.roles WHERE role_name IN ('admin', 'fleet_manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM public.roles WHERE role_name IN ('admin', 'fleet_manager')
      )
    )
  );

-- Fix diesel_cards_master table
DROP POLICY IF EXISTS "Admin can manage diesel cards" ON public.diesel_cards_master;
DROP POLICY IF EXISTS "Authenticated users can read diesel cards" ON public.diesel_cards_master;

CREATE POLICY "Authenticated users can read diesel cards"
  ON public.diesel_cards_master
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage diesel cards"
  ON public.diesel_cards_master
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  );

-- Fix document_types table
DROP POLICY IF EXISTS "Admin can manage document_types" ON public.document_types;
DROP POLICY IF EXISTS "Authenticated users can read document_types" ON public.document_types;

CREATE POLICY "Authenticated users can read document_types"
  ON public.document_types
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage document_types"
  ON public.document_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  );

-- Fix expense_heads table
DROP POLICY IF EXISTS "Admin can manage expense_heads" ON public.expense_heads;
DROP POLICY IF EXISTS "Authenticated users can read expense_heads" ON public.expense_heads;

CREATE POLICY "Authenticated users can read expense_heads"
  ON public.expense_heads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage expense_heads"
  ON public.expense_heads
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id = (SELECT role_id FROM public.roles WHERE role_name = 'admin')
    )
  );

-- Fix fuel_transactions table
DROP POLICY IF EXISTS "Authenticated users can read fuel_transactions" ON public.fuel_transactions;
DROP POLICY IF EXISTS "Trip managers can manage fuel_transactions" ON public.fuel_transactions;

CREATE POLICY "Authenticated users can read fuel_transactions"
  ON public.fuel_transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trip managers can manage fuel_transactions"
  ON public.fuel_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM public.roles WHERE role_name IN ('admin', 'trip_manager', 'fleet_manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (
        SELECT role_id FROM public.roles WHERE role_name IN ('admin', 'trip_manager', 'fleet_manager')
      )
    )
  );
