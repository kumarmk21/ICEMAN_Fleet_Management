/*
  # Fix Performance and Security Issues
  
  This migration addresses multiple security audit findings:
  
  1. **Missing Indexes on Foreign Keys** (20 tables affected)
     - Adds indexes for all unindexed foreign key columns
     - Improves JOIN performance and query optimization
  
  2. **RLS Policy Optimization** (24 policies affected)
     - Wraps auth functions in SELECT to prevent row-by-row re-evaluation
     - Significantly improves query performance at scale
  
  3. **Function Security**
     - Sets explicit search_path for all functions to prevent injection attacks
     - Ensures functions run with predictable schema resolution
  
  4. **Multiple Permissive Policies**
     - Documented - these are intentional for hierarchical access control
     - Admin policies OR regular user policies provide flexible access patterns
  
  Note: "Unused Index" warnings are false positives on new databases with no query history.
  Note: Leaked password protection must be enabled in Supabase Dashboard Auth settings.
*/

-- =====================================================
-- PART 1: ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

-- Enquiries table indexes
CREATE INDEX IF NOT EXISTS idx_enquiries_converted_to_trip_id 
  ON public.enquiries(converted_to_trip_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_by 
  ON public.enquiries(created_by);
CREATE INDEX IF NOT EXISTS idx_enquiries_customer_id 
  ON public.enquiries(customer_id);

-- Fuel transactions indexes
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_created_by 
  ON public.fuel_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_trip_id 
  ON public.fuel_transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vendor_id 
  ON public.fuel_transactions(vendor_id);

-- Maintenance jobs indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_created_by 
  ON public.maintenance_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_workshop_vendor_id 
  ON public.maintenance_jobs(workshop_vendor_id);

-- Trip expenses indexes
CREATE INDEX IF NOT EXISTS idx_trip_expenses_created_by 
  ON public.trip_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_expense_head_id 
  ON public.trip_expenses(expense_head_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_vendor_id 
  ON public.trip_expenses(vendor_id);

-- Trip stops indexes
CREATE INDEX IF NOT EXISTS idx_trip_stops_city_id 
  ON public.trip_stops(city_id);

-- Trips table indexes
CREATE INDEX IF NOT EXISTS idx_trips_created_by 
  ON public.trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_customer_id 
  ON public.trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id 
  ON public.trips(route_id);

-- Tyres indexes
CREATE INDEX IF NOT EXISTS idx_tyres_vehicle_id 
  ON public.tyres(vehicle_id);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id 
  ON public.user_profiles(role_id);

-- Vehicle documents indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_document_type_id 
  ON public.vehicle_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id 
  ON public.vehicle_documents(vehicle_id);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_diesel_card_id 
  ON public.vehicles(diesel_card_id);

-- =====================================================
-- PART 2: OPTIMIZE RLS POLICIES
-- =====================================================

-- Drop and recreate RLS policies with optimized auth function calls

-- Roles table policies
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.roles;
CREATE POLICY "Only admins can insert roles"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid())
      AND role_id IN (SELECT role_id FROM public.roles WHERE role_name = 'Admin')
    )
  );

DROP POLICY IF EXISTS "Only admins can update roles" ON public.roles;
CREATE POLICY "Only admins can update roles"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = (SELECT auth.uid())
      AND role_id IN (SELECT role_id FROM public.roles WHERE role_name = 'Admin')
    )
  );

-- Vehicles table policies
DROP POLICY IF EXISTS "Admin can delete vehicles" ON public.vehicles;
CREATE POLICY "Admin can delete vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- User profiles policies
DROP POLICY IF EXISTS "Admins update all profiles" ON public.user_profiles;
CREATE POLICY "Admins update all profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Admins delete profiles" ON public.user_profiles;
CREATE POLICY "Admins delete profiles"
  ON public.user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Users read own profile" ON public.user_profiles;
CREATE POLICY "Users read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins read all profiles" ON public.user_profiles;
CREATE POLICY "Admins read all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Admins insert profiles" ON public.user_profiles;
CREATE POLICY "Admins insert profiles"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Drivers table policies
DROP POLICY IF EXISTS "Admin can delete drivers" ON public.drivers;
CREATE POLICY "Admin can delete drivers"
  ON public.drivers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Expense heads policies
DROP POLICY IF EXISTS "Admin can manage expense_heads" ON public.expense_heads;
CREATE POLICY "Admin can manage expense_heads"
  ON public.expense_heads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Document types policies
DROP POLICY IF EXISTS "Admin can manage document_types" ON public.document_types;
CREATE POLICY "Admin can manage document_types"
  ON public.document_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Trips table policies
DROP POLICY IF EXISTS "Admin can delete trips" ON public.trips;
CREATE POLICY "Admin can delete trips"
  ON public.trips FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Trip expenses policies
DROP POLICY IF EXISTS "Admin can delete trip_expenses" ON public.trip_expenses;
CREATE POLICY "Admin can delete trip_expenses"
  ON public.trip_expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- States table policies
DROP POLICY IF EXISTS "Admin can insert states" ON public.states;
CREATE POLICY "Admin can insert states"
  ON public.states FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Admin can update states" ON public.states;
CREATE POLICY "Admin can update states"
  ON public.states FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Admin can delete states" ON public.states;
CREATE POLICY "Admin can delete states"
  ON public.states FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Cities table policies
DROP POLICY IF EXISTS "Admin can insert cities" ON public.cities;
CREATE POLICY "Admin can insert cities"
  ON public.cities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Admin can update cities" ON public.cities;
CREATE POLICY "Admin can update cities"
  ON public.cities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Admin can delete cities" ON public.cities;
CREATE POLICY "Admin can delete cities"
  ON public.cities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Enquiries table policies
DROP POLICY IF EXISTS "Authorized users can insert enquiries" ON public.enquiries;
CREATE POLICY "Authorized users can insert enquiries"
  ON public.enquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Trip Manager')
    )
  );

DROP POLICY IF EXISTS "Authorized users can update enquiries" ON public.enquiries;
CREATE POLICY "Authorized users can update enquiries"
  ON public.enquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Trip Manager')
    )
  );

DROP POLICY IF EXISTS "Admins can delete enquiries" ON public.enquiries;
CREATE POLICY "Admins can delete enquiries"
  ON public.enquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- Diesel cards policies
DROP POLICY IF EXISTS "Admin can manage diesel cards" ON public.diesel_cards_master;
CREATE POLICY "Admin can manage diesel cards"
  ON public.diesel_cards_master FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      JOIN public.roles r ON up.role_id = r.role_id
      WHERE up.user_id = (SELECT auth.uid())
      AND r.role_name = 'Admin'
    )
  );

-- =====================================================
-- PART 3: SECURE FUNCTION SEARCH PATHS
-- =====================================================

-- Set secure search_path for all functions
ALTER FUNCTION public.set_enquiry_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_trip_stops_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin_or_fleet_manager() SET search_path = public, pg_temp;
ALTER FUNCTION public.can_manage_trips() SET search_path = public, pg_temp;
ALTER FUNCTION public.can_edit_financial() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_enquiry_number() SET search_path = public, pg_temp;
