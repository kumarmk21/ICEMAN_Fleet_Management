/*
  # Fix Multiple Permissive Policies
  
  1. Changes
    - Remove duplicate permissive policies to avoid confusion and potential security issues
    - Keep only the most appropriate policy for each operation
    - Consolidate overlapping policies into single comprehensive policies
  
  2. Tables Affected
    - document_types
    - expense_heads
    - fuel_transactions
    - maintenance_jobs
    - tyres
    - user_profiles
    - vendors
*/

-- Fix document_types: Remove generic authenticated policies, keep admin policy
DROP POLICY IF EXISTS "Authenticated users can delete document types" ON document_types;
DROP POLICY IF EXISTS "Authenticated users can insert document types" ON document_types;
DROP POLICY IF EXISTS "Authenticated users can read document types" ON document_types;
DROP POLICY IF EXISTS "Authenticated users can read document_types" ON document_types;
DROP POLICY IF EXISTS "Authenticated users can update document types" ON document_types;

-- Keep only the read policy for all authenticated users and admin manage policy
CREATE POLICY "Authenticated users can read document_types"
  ON document_types FOR SELECT
  TO authenticated
  USING (true);

-- Fix expense_heads: Remove duplicate read policy
DROP POLICY IF EXISTS "Authenticated users can read expense_heads" ON expense_heads;

-- Recreate single read policy
CREATE POLICY "Authenticated users can read expense_heads"
  ON expense_heads FOR SELECT
  TO authenticated
  USING (true);

-- Fix fuel_transactions: Remove duplicate read policy
DROP POLICY IF EXISTS "Authenticated users can read fuel_transactions" ON fuel_transactions;

-- Recreate single read policy
CREATE POLICY "Authenticated users can read fuel_transactions"
  ON fuel_transactions FOR SELECT
  TO authenticated
  USING (true);

-- Fix maintenance_jobs: Remove duplicate read policy
DROP POLICY IF EXISTS "Authenticated users can read maintenance_jobs" ON maintenance_jobs;

-- Recreate single read policy
CREATE POLICY "Authenticated users can read maintenance_jobs"
  ON maintenance_jobs FOR SELECT
  TO authenticated
  USING (true);

-- Fix tyres: Remove duplicate read policy
DROP POLICY IF EXISTS "Authenticated users can read tyres" ON tyres;

-- Recreate single read policy
CREATE POLICY "Authenticated users can read tyres"
  ON tyres FOR SELECT
  TO authenticated
  USING (true);

-- Fix user_profiles: Keep both policies as they serve different purposes
-- "Admins can update any profile" and "Users can update own profile" are both needed

-- Fix vendors: Remove duplicate read policy
DROP POLICY IF EXISTS "Authenticated users can read vendors" ON vendors;

-- Recreate single read policy
CREATE POLICY "Authenticated users can read vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);
