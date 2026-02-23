/*
  # Fix Multiple Permissive Policies - Part 2

  ## Security Fix - CRITICAL
  
  Continue fixing overlapping permissive RLS policies.
  
  This migration fixes the following tables:
  - maintenance_jobs
  - tyres
  - vehicle_documents
  - vendors
*/

-- Fix maintenance_jobs table
DROP POLICY IF EXISTS "Authenticated users can read maintenance_jobs" ON public.maintenance_jobs;
DROP POLICY IF EXISTS "Fleet managers can manage maintenance_jobs" ON public.maintenance_jobs;

CREATE POLICY "Authenticated users can read maintenance_jobs"
  ON public.maintenance_jobs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Fleet managers can manage maintenance_jobs"
  ON public.maintenance_jobs
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

-- Fix tyres table
DROP POLICY IF EXISTS "Authenticated users can read tyres" ON public.tyres;
DROP POLICY IF EXISTS "Fleet managers can manage tyres" ON public.tyres;

CREATE POLICY "Authenticated users can read tyres"
  ON public.tyres
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Fleet managers can manage tyres"
  ON public.tyres
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

-- Fix vehicle_documents table
DROP POLICY IF EXISTS "Admin and Fleet Manager can manage vehicle_documents" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Authenticated users can read vehicle_documents" ON public.vehicle_documents;

CREATE POLICY "Authenticated users can read vehicle_documents"
  ON public.vehicle_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can manage vehicle_documents"
  ON public.vehicle_documents
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

-- Fix vendors table
DROP POLICY IF EXISTS "Admin and Fleet Manager can manage vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated users can read vendors" ON public.vendors;

CREATE POLICY "Authenticated users can read vendors"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can manage vendors"
  ON public.vendors
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
