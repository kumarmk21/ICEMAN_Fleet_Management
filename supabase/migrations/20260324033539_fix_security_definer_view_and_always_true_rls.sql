/*
  # Fix Security Definer View and Always-True RLS Policies

  ## Changes

  ### 1. Security Definer View → Security Invoker
  Recreates `document_expiry_alerts_view` without SECURITY DEFINER so it runs
  with the calling user's permissions, respecting their RLS policies rather than
  bypassing them with the view owner's privileges.

  ### 2. Fix always-true INSERT / UPDATE / DELETE policies on `categories`
  The existing policies allowed ANY authenticated user to mutate categories.
  Replaced with admin-only mutations; SELECT remains open to all authenticated users.

  ### 3. Fix always-true INSERT / UPDATE / DELETE policies on `vehicle_categories_master`
  Same pattern as `categories` above.

  ## Security Notes
  - SELECT on both master tables remains open to all authenticated users (read-only access is fine)
  - Mutations are now restricted to Admin role only
*/

-- ============================================================
-- Recreate document_expiry_alerts_view as SECURITY INVOKER
-- ============================================================
DROP VIEW IF EXISTS public.document_expiry_alerts_view;

CREATE VIEW public.document_expiry_alerts_view
  WITH (security_invoker = true)
AS
  SELECT
    vd.vehicle_document_id,
    vd.vehicle_id,
    v.vehicle_number,
    vd.document_type_id,
    dt.document_type_name,
    vd.document_number,
    vd.valid_from,
    vd.valid_to,
    CURRENT_DATE AS today,
    (vd.valid_to - CURRENT_DATE) AS days_until_expiry,
    CASE
      WHEN vd.valid_to < CURRENT_DATE                       THEN 'Expired'
      WHEN (vd.valid_to - CURRENT_DATE) <= 30               THEN 'Critical'
      WHEN (vd.valid_to - CURRENT_DATE) <= 60               THEN 'Warning'
      WHEN (vd.valid_to - CURRENT_DATE) <= 90               THEN 'Notice'
      ELSE 'OK'
    END AS urgency_level,
    vd.remarks
  FROM vehicle_documents vd
  JOIN vehicles v  ON v.vehicle_id  = vd.vehicle_id
  JOIN document_types dt ON dt.document_type_id = vd.document_type_id
  WHERE vd.valid_to IS NOT NULL
    AND (vd.valid_to - CURRENT_DATE) <= 90
  ORDER BY vd.valid_to;

-- ============================================================
-- Fix always-true RLS policies on `categories`
-- ============================================================
DROP POLICY IF EXISTS "Users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories" ON public.categories;

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

-- ============================================================
-- Fix always-true RLS policies on `vehicle_categories_master`
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.vehicle_categories_master;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.vehicle_categories_master;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.vehicle_categories_master;

CREATE POLICY "Admins can insert vehicle_categories"
  ON public.vehicle_categories_master FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admins can update vehicle_categories"
  ON public.vehicle_categories_master FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admins can delete vehicle_categories"
  ON public.vehicle_categories_master FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );
