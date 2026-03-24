/*
  # Fix Multiple Permissive Policies

  ## Problem
  Several tables had two overlapping SELECT policies for `authenticated` users:
  one from a broad "Authenticated users can read X" policy and another from a
  role-scoped "ALL" policy that implicitly included SELECT. PostgreSQL evaluates
  both permissive policies via OR, flagging them as redundant and a security smell.

  ## Fix Strategy
  - Replace each "FOR ALL" role-scoped policy with explicit INSERT, UPDATE, DELETE
    policies for that role. This leaves only one SELECT policy per table.
  - Merge the two UPDATE policies on `user_profiles` into a single policy that
    covers both admins and own-profile edits.

  ## Affected Tables
  - document_types: replace Admin ALL → INSERT + UPDATE + DELETE
  - expense_heads: replace Admin ALL → INSERT + UPDATE + DELETE
  - fuel_transactions: replace Trip Manager ALL → INSERT + UPDATE + DELETE
  - maintenance_jobs: replace Fleet Manager ALL → INSERT + UPDATE + DELETE
  - tyres: replace Fleet Manager ALL → INSERT + UPDATE + DELETE
  - vendors: replace Admin+Fleet Manager ALL → INSERT + UPDATE + DELETE
  - user_profiles: merge two UPDATE policies into one
*/

-- ============================================================
-- document_types
-- ============================================================
DROP POLICY IF EXISTS "Admin can manage document_types" ON public.document_types;

CREATE POLICY "Admin can insert document_types"
  ON public.document_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admin can update document_types"
  ON public.document_types FOR UPDATE
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

CREATE POLICY "Admin can delete document_types"
  ON public.document_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

-- ============================================================
-- expense_heads
-- ============================================================
DROP POLICY IF EXISTS "Admin can manage expense_heads" ON public.expense_heads;

CREATE POLICY "Admin can insert expense_heads"
  ON public.expense_heads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admin can update expense_heads"
  ON public.expense_heads FOR UPDATE
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

CREATE POLICY "Admin can delete expense_heads"
  ON public.expense_heads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid()) AND r.role_name = 'Admin'
    )
  );

-- ============================================================
-- fuel_transactions
-- ============================================================
DROP POLICY IF EXISTS "Trip managers can manage fuel_transactions" ON public.fuel_transactions;

CREATE POLICY "Trip managers can insert fuel_transactions"
  ON public.fuel_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager', 'Trip Manager'])
    )
  );

CREATE POLICY "Trip managers can update fuel_transactions"
  ON public.fuel_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager', 'Trip Manager'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager', 'Trip Manager'])
    )
  );

CREATE POLICY "Trip managers can delete fuel_transactions"
  ON public.fuel_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager', 'Trip Manager'])
    )
  );

-- ============================================================
-- maintenance_jobs
-- ============================================================
DROP POLICY IF EXISTS "Fleet managers can manage maintenance_jobs" ON public.maintenance_jobs;

CREATE POLICY "Fleet managers can insert maintenance_jobs"
  ON public.maintenance_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

CREATE POLICY "Fleet managers can update maintenance_jobs"
  ON public.maintenance_jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

CREATE POLICY "Fleet managers can delete maintenance_jobs"
  ON public.maintenance_jobs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

-- ============================================================
-- tyres
-- ============================================================
DROP POLICY IF EXISTS "Fleet managers can manage tyres" ON public.tyres;

CREATE POLICY "Fleet managers can insert tyres"
  ON public.tyres FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

CREATE POLICY "Fleet managers can update tyres"
  ON public.tyres FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

CREATE POLICY "Fleet managers can delete tyres"
  ON public.tyres FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

-- ============================================================
-- vendors
-- ============================================================
DROP POLICY IF EXISTS "Admin and Fleet Manager can manage vendors" ON public.vendors;

CREATE POLICY "Admin and Fleet Manager can insert vendors"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

CREATE POLICY "Admin and Fleet Manager can update vendors"
  ON public.vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

CREATE POLICY "Admin and Fleet Manager can delete vendors"
  ON public.vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = (SELECT auth.uid())
        AND r.role_name = ANY (ARRAY['Admin', 'Fleet Manager'])
    )
  );

-- ============================================================
-- user_profiles — merge two UPDATE policies into one
-- ============================================================
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can update own profile or admins can update any"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
    OR is_user_admin()
  )
  WITH CHECK (
    (user_id = (SELECT auth.uid()))
    OR is_user_admin()
  );
