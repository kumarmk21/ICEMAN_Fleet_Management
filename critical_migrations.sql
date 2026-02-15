/*
  # Master Tables for Fleet Management

  ## Overview
  Creates all master data tables for managing vehicles, drivers, routes, customers, vendors, and related entities.

  ## New Tables Created
  
  ### 1. `vehicles`
  Vehicle/Truck master data
  - `vehicle_id` (uuid, primary key)
  - `vehicle_number` (text, unique, required) - e.g., MH12AB1234
  - `vehicle_type` (text) - 32FT MXL, 20FT, Trailer, etc.
  - `ownership_type` (text) - Owned, Attached, Market Vehicle
  - `make` (text)
  - `model` (text)
  - `year_of_manufacture` (integer)
  - `capacity_tons` (decimal)
  - `registration_number` (text)
  - `engine_number` (text)
  - `chassis_number` (text)
  - `odometer_current` (decimal) - current odometer reading
  - `status` (text) - Active, Inactive, Sold, Under Maintenance
  - `fixed_cost_per_month` (decimal) - for profitability allocation
  - `remarks` (text)

  ### 2. `drivers`
  Driver master data
  - `driver_id` (uuid, primary key)
  - `driver_name` (text, required)
  - `mobile_number` (text)
  - `alternate_mobile` (text)
  - `address` (text)
  - `license_number` (text)
  - `license_valid_upto` (date)
  - `aadhar_number` (text)
  - `pan_number` (text)
  - `status` (text) - Active, Inactive
  - `remarks` (text)

  ### 3. `routes`
  Route master data
  - `route_id` (uuid, primary key)
  - `route_code` (text)
  - `origin` (text) - city
  - `destination` (text) - city
  - `standard_distance_km` (decimal)
  - `standard_fuel_kmpl` (decimal) - expected km per litre
  - `standard_transit_time_days` (decimal)
  - `remarks` (text)

  ### 4. `customers`
  Customer master data
  - `customer_id` (uuid, primary key)
  - `customer_name` (text, required)
  - `gst_number` (text)
  - `billing_address` (text)
  - `contact_person` (text)
  - `contact_mobile` (text)
  - `email` (text)
  - `remarks` (text)

  ### 5. `expense_heads`
  Expense head master for categorizing expenses
  - `expense_head_id` (uuid, primary key)
  - `expense_head_name` (text, required)
  - `category` (text) - Trip Variable, Fixed, Maintenance, Other
  - `default_gl_code` (text)
  - `remarks` (text)

  ### 6. `vendors`
  Vendor master (fuel pumps, workshops, tyre dealers, etc.)
  - `vendor_id` (uuid, primary key)
  - `vendor_name` (text, required)
  - `vendor_type` (text) - Fuel, Workshop, Tyre, Toll, Other
  - `gst_number` (text)
  - `address` (text)
  - `contact_person` (text)
  - `contact_mobile` (text)
  - `email` (text)
  - `remarks` (text)

  ### 7. `document_types`
  Document types for compliance tracking
  - `document_type_id` (uuid, primary key)
  - `document_type_name` (text, required) - Insurance, Fitness, PUC, National Permit, Road Tax
  - `description` (text)

  ### 8. `vehicle_documents`
  Vehicle document register for compliance tracking
  - `vehicle_document_id` (uuid, primary key)
  - `vehicle_id` (uuid, FK to vehicles)
  - `document_type_id` (uuid, FK to document_types)
  - `document_number` (text)
  - `valid_from` (date)
  - `valid_to` (date)
  - `attachment_url` (text)
  - `remarks` (text)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users based on roles
  - Read access for most roles
  - Write access for Admin and Fleet Manager

  ## Notes
  - All monetary values in INR
  - Distances in KM
  - Fuel in litres
  - Weights in KG/TON
*/

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text UNIQUE NOT NULL,
  vehicle_type text DEFAULT '',
  ownership_type text DEFAULT 'Owned' CHECK (ownership_type IN ('Owned', 'Attached', 'Market Vehicle')),
  make text DEFAULT '',
  model text DEFAULT '',
  year_of_manufacture integer,
  capacity_tons decimal(10,2) DEFAULT 0,
  registration_number text DEFAULT '',
  engine_number text DEFAULT '',
  chassis_number text DEFAULT '',
  odometer_current decimal(12,2) DEFAULT 0,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Sold', 'Under Maintenance')),
  fixed_cost_per_month decimal(12,2) DEFAULT 0,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  driver_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name text NOT NULL,
  mobile_number text DEFAULT '',
  alternate_mobile text DEFAULT '',
  address text DEFAULT '',
  license_number text DEFAULT '',
  license_valid_upto date,
  aadhar_number text DEFAULT '',
  pan_number text DEFAULT '',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  route_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_code text DEFAULT '',
  origin text NOT NULL,
  destination text NOT NULL,
  standard_distance_km decimal(10,2) DEFAULT 0,
  standard_fuel_kmpl decimal(5,2) DEFAULT 0,
  standard_transit_time_days decimal(5,2) DEFAULT 0,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  gst_number text DEFAULT '',
  billing_address text DEFAULT '',
  contact_person text DEFAULT '',
  contact_mobile text DEFAULT '',
  email text DEFAULT '',
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expense_heads table
CREATE TABLE IF NOT EXISTS expense_heads (
  expense_head_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_head_name text NOT NULL,
  category text DEFAULT 'Other' CHECK (category IN ('Trip Variable', 'Fixed', 'Maintenance', 'Other')),
  default_gl_code text DEFAULT '',
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  vendor_type text DEFAULT 'Other' CHECK (vendor_type IN ('Fuel', 'Workshop', 'Tyre', 'Toll', 'Other')),
  gst_number text DEFAULT '',
  address text DEFAULT '',
  contact_person text DEFAULT '',
  contact_mobile text DEFAULT '',
  email text DEFAULT '',
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_types table
CREATE TABLE IF NOT EXISTS document_types (
  document_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type_name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create vehicle_documents table
CREATE TABLE IF NOT EXISTS vehicle_documents (
  vehicle_document_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(vehicle_id) ON DELETE CASCADE NOT NULL,
  document_type_id uuid REFERENCES document_types(document_type_id) NOT NULL,
  document_number text DEFAULT '',
  valid_from date,
  valid_to date,
  attachment_url text DEFAULT '',
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin or fleet manager
CREATE OR REPLACE FUNCTION is_admin_or_fleet_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.role_id
    WHERE up.user_id = auth.uid()
    AND r.role_name IN ('Admin', 'Fleet Manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for vehicles
CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_fleet_manager());

CREATE POLICY "Admin and Fleet Manager can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

CREATE POLICY "Admin can delete vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- RLS Policies for drivers
CREATE POLICY "Authenticated users can read drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can insert drivers"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_fleet_manager());

CREATE POLICY "Admin and Fleet Manager can update drivers"
  ON drivers FOR UPDATE
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

CREATE POLICY "Admin can delete drivers"
  ON drivers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- RLS Policies for routes
CREATE POLICY "Authenticated users can read routes"
  ON routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can insert routes"
  ON routes FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_fleet_manager());

CREATE POLICY "Admin and Fleet Manager can update routes"
  ON routes FOR UPDATE
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

-- RLS Policies for customers
CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

-- RLS Policies for expense_heads
CREATE POLICY "Authenticated users can read expense_heads"
  ON expense_heads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage expense_heads"
  ON expense_heads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- RLS Policies for vendors
CREATE POLICY "Authenticated users can read vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

-- RLS Policies for document_types
CREATE POLICY "Authenticated users can read document_types"
  ON document_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage document_types"
  ON document_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- RLS Policies for vehicle_documents
CREATE POLICY "Authenticated users can read vehicle_documents"
  ON vehicle_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and Fleet Manager can manage vehicle_documents"
  ON vehicle_documents FOR ALL
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

-- Create triggers for updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_heads_updated_at
  BEFORE UPDATE ON expense_heads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_documents_updated_at
  BEFORE UPDATE ON vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default expense heads
INSERT INTO expense_heads (expense_head_name, category) VALUES
  ('Fuel', 'Trip Variable'),
  ('Toll', 'Trip Variable'),
  ('Driver Bata', 'Trip Variable'),
  ('Loading Charges', 'Trip Variable'),
  ('Unloading Charges', 'Trip Variable'),
  ('RTO', 'Trip Variable'),
  ('Parking', 'Trip Variable'),
  ('Trip Miscellaneous', 'Trip Variable'),
  ('Repairs', 'Maintenance'),
  ('Tyres', 'Maintenance'),
  ('Workshop', 'Maintenance'),
  ('EMI', 'Fixed'),
  ('Insurance', 'Fixed'),
  ('Road Tax', 'Fixed'),
  ('Driver Salary', 'Fixed')
ON CONFLICT DO NOTHING;

-- Insert default document types
INSERT INTO document_types (document_type_name, description) VALUES
  ('Insurance', 'Vehicle Insurance'),
  ('Fitness Certificate', 'Fitness Certificate'),
  ('PUC', 'Pollution Under Control Certificate'),
  ('National Permit', 'National Permit'),
  ('Road Tax', 'Road Tax Receipt'),
  ('RC Book', 'Registration Certificate'),
  ('Fastag', 'Fastag Details')
ON CONFLICT DO NOTHING;
/*
  # Transaction Tables for Fleet Management

  ## Overview
  Creates all transaction tables for managing trips, expenses, fuel, maintenance, and tyres.

  ## New Tables Created
  
  ### 1. `trips`
  Trip header/sheet - main trip information
  - `trip_id` (uuid, primary key)
  - `trip_number` (text, unique) - auto-generated
  - `vehicle_id` (uuid, FK to vehicles)
  - `driver_id` (uuid, FK to drivers)
  - `helper_name` (text)
  - `route_id` (uuid, FK to routes)
  - `customer_id` (uuid, FK to customers)
  - `origin` (text)
  - `destination` (text)
  - `planned_start_datetime` (timestamptz)
  - `actual_start_datetime` (timestamptz)
  - `planned_end_datetime` (timestamptz)
  - `actual_end_datetime` (timestamptz)
  - `planned_distance_km` (decimal)
  - `actual_distance_km` (decimal)
  - `freight_revenue` (decimal)
  - `other_revenue` (decimal)
  - `advance_to_driver` (decimal)
  - `payment_mode_advance` (text)
  - `trip_status` (text) - Planned, In Transit, Completed, Closed, Cancelled
  - `remarks` (text)

  ### 2. `trip_expenses`
  Expense line items for each trip
  - `trip_expense_id` (uuid, primary key)
  - `trip_id` (uuid, FK to trips)
  - `expense_date` (date)
  - `expense_head_id` (uuid, FK to expense_heads)
  - `vendor_id` (uuid, FK to vendors)
  - `description` (text)
  - `amount` (decimal)
  - `quantity` (decimal)
  - `unit` (text)
  - `bill_number` (text)
  - `attachment_url` (text)
  - Special fields for fuel:
    - `rate_per_litre` (decimal)
    - `odometer_reading` (decimal)
  - Special field for toll:
    - `toll_plaza_name` (text)
  - `created_by` (uuid, FK to auth.users)

  ### 3. `fuel_transactions`
  Separate normalized fuel tracking (can also use trip_expenses)
  - `fuel_txn_id` (uuid, primary key)
  - `trip_id` (uuid, FK to trips)
  - `vehicle_id` (uuid, FK to vehicles)
  - `transaction_date` (date)
  - `odometer_reading` (decimal)
  - `fuel_litres` (decimal)
  - `rate_per_litre` (decimal)
  - `amount` (decimal)
  - `fuel_station_name` (text)
  - `vendor_id` (uuid, FK to vendors)
  - `remarks` (text)

  ### 4. `maintenance_jobs`
  Maintenance and repair jobs
  - `maintenance_id` (uuid, primary key)
  - `vehicle_id` (uuid, FK to vehicles)
  - `job_card_number` (text)
  - `workshop_vendor_id` (uuid, FK to vendors)
  - `job_date` (date)
  - `odometer_reading` (decimal)
  - `issue_description` (text)
  - `parts_cost` (decimal)
  - `labour_cost` (decimal)
  - `total_cost` (decimal)
  - `downtime_from` (timestamptz)
  - `downtime_to` (timestamptz)
  - `remarks` (text)

  ### 5. `tyres`
  Tyre tracking
  - `tyre_id` (uuid, primary key)
  - `tyre_number` (text)
  - `vehicle_id` (uuid, FK to vehicles, nullable)
  - `position` (text) - e.g., Front Left, Rear Right
  - `fitted_date` (date)
  - `fitted_odometer` (decimal)
  - `removed_date` (date)
  - `removed_odometer` (decimal)
  - `cost` (decimal)
  - `status` (text) - In Use, In Stock, Scrap
  - `remarks` (text)

  ## Security
  - Enable RLS on all tables
  - Different permissions based on user roles
  - Operations Executive can create/update trips and expenses
  - Accounts can view and edit financial fields
  - Admin and Fleet Manager have full access

  ## Notes
  - Trip numbers auto-generated with sequence
  - All amounts in INR
  - Distances in KM, fuel in litres
*/

-- Create sequence for trip numbers
CREATE SEQUENCE IF NOT EXISTS trip_number_seq START 1000;

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  trip_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_number text UNIQUE NOT NULL DEFAULT 'TR' || nextval('trip_number_seq')::text,
  vehicle_id uuid REFERENCES vehicles(vehicle_id) NOT NULL,
  driver_id uuid REFERENCES drivers(driver_id) NOT NULL,
  helper_name text DEFAULT '',
  route_id uuid REFERENCES routes(route_id),
  customer_id uuid REFERENCES customers(customer_id),
  origin text NOT NULL,
  destination text NOT NULL,
  planned_start_datetime timestamptz,
  actual_start_datetime timestamptz,
  planned_end_datetime timestamptz,
  actual_end_datetime timestamptz,
  planned_distance_km decimal(10,2) DEFAULT 0,
  actual_distance_km decimal(10,2) DEFAULT 0,
  freight_revenue decimal(12,2) DEFAULT 0,
  other_revenue decimal(12,2) DEFAULT 0,
  advance_to_driver decimal(12,2) DEFAULT 0,
  payment_mode_advance text DEFAULT '',
  trip_status text DEFAULT 'Planned' CHECK (trip_status IN ('Planned', 'In Transit', 'Completed', 'Closed', 'Cancelled')),
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create trip_expenses table
CREATE TABLE IF NOT EXISTS trip_expenses (
  trip_expense_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(trip_id) ON DELETE CASCADE NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  expense_head_id uuid REFERENCES expense_heads(expense_head_id) NOT NULL,
  vendor_id uuid REFERENCES vendors(vendor_id),
  description text DEFAULT '',
  amount decimal(12,2) DEFAULT 0 NOT NULL,
  quantity decimal(10,2) DEFAULT 0,
  unit text DEFAULT '',
  bill_number text DEFAULT '',
  attachment_url text DEFAULT '',
  rate_per_litre decimal(10,2) DEFAULT 0,
  odometer_reading decimal(12,2) DEFAULT 0,
  toll_plaza_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create fuel_transactions table
CREATE TABLE IF NOT EXISTS fuel_transactions (
  fuel_txn_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(trip_id),
  vehicle_id uuid REFERENCES vehicles(vehicle_id) NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading decimal(12,2) DEFAULT 0,
  fuel_litres decimal(10,2) NOT NULL,
  rate_per_litre decimal(10,2) NOT NULL,
  amount decimal(12,2) NOT NULL,
  fuel_station_name text DEFAULT '',
  vendor_id uuid REFERENCES vendors(vendor_id),
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create maintenance_jobs table
CREATE TABLE IF NOT EXISTS maintenance_jobs (
  maintenance_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(vehicle_id) NOT NULL,
  job_card_number text DEFAULT '',
  workshop_vendor_id uuid REFERENCES vendors(vendor_id),
  job_date date NOT NULL DEFAULT CURRENT_DATE,
  odometer_reading decimal(12,2) DEFAULT 0,
  issue_description text DEFAULT '',
  parts_cost decimal(12,2) DEFAULT 0,
  labour_cost decimal(12,2) DEFAULT 0,
  total_cost decimal(12,2) DEFAULT 0,
  downtime_from timestamptz,
  downtime_to timestamptz,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create tyres table
CREATE TABLE IF NOT EXISTS tyres (
  tyre_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tyre_number text NOT NULL,
  vehicle_id uuid REFERENCES vehicles(vehicle_id),
  position text DEFAULT '',
  fitted_date date,
  fitted_odometer decimal(12,2) DEFAULT 0,
  removed_date date,
  removed_odometer decimal(12,2) DEFAULT 0,
  cost decimal(12,2) DEFAULT 0,
  status text DEFAULT 'In Stock' CHECK (status IN ('In Use', 'In Stock', 'Scrap')),
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tyres ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can manage trips
CREATE OR REPLACE FUNCTION can_manage_trips()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.role_id
    WHERE up.user_id = auth.uid()
    AND r.role_name IN ('Admin', 'Fleet Manager', 'Operations Executive')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can edit financial data
CREATE OR REPLACE FUNCTION can_edit_financial()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN roles r ON up.role_id = r.role_id
    WHERE up.user_id = auth.uid()
    AND r.role_name IN ('Admin', 'Accounts')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for trips
CREATE POLICY "Authenticated users can read trips"
  ON trips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trip managers can insert trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_trips());

CREATE POLICY "Trip managers can update trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (can_manage_trips())
  WITH CHECK (can_manage_trips());

CREATE POLICY "Admin can delete trips"
  ON trips FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- RLS Policies for trip_expenses
CREATE POLICY "Authenticated users can read trip_expenses"
  ON trip_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trip managers can insert trip_expenses"
  ON trip_expenses FOR INSERT
  TO authenticated
  WITH CHECK (can_manage_trips());

CREATE POLICY "Trip managers can update trip_expenses"
  ON trip_expenses FOR UPDATE
  TO authenticated
  USING (can_manage_trips())
  WITH CHECK (can_manage_trips());

CREATE POLICY "Admin can delete trip_expenses"
  ON trip_expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- RLS Policies for fuel_transactions
CREATE POLICY "Authenticated users can read fuel_transactions"
  ON fuel_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Trip managers can manage fuel_transactions"
  ON fuel_transactions FOR ALL
  TO authenticated
  USING (can_manage_trips())
  WITH CHECK (can_manage_trips());

-- RLS Policies for maintenance_jobs
CREATE POLICY "Authenticated users can read maintenance_jobs"
  ON maintenance_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Fleet managers can manage maintenance_jobs"
  ON maintenance_jobs FOR ALL
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

-- RLS Policies for tyres
CREATE POLICY "Authenticated users can read tyres"
  ON tyres FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Fleet managers can manage tyres"
  ON tyres FOR ALL
  TO authenticated
  USING (is_admin_or_fleet_manager())
  WITH CHECK (is_admin_or_fleet_manager());

-- Create triggers for updated_at
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_expenses_updated_at
  BEFORE UPDATE ON trip_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_transactions_updated_at
  BEFORE UPDATE ON fuel_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_jobs_updated_at
  BEFORE UPDATE ON maintenance_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tyres_updated_at
  BEFORE UPDATE ON tyres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(trip_status);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(actual_start_datetime, actual_end_datetime);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle_id ON fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_vehicle_id ON maintenance_jobs(vehicle_id);
/*
  # Create Enquiries Table
  
  ## Overview
  Creates the enquiries table for managing customer enquiries and quotations
  in the fleet management system.
  
  ## New Table Created
  
  ### `enquiries`
  Customer enquiry and quotation data
  - `enquiry_id` (uuid, primary key)
  - `enquiry_number` (text, unique, required) - Auto-generated enquiry reference
  - `enquiry_date` (date, required) - Date of enquiry
  - `customer_id` (uuid, FK to customers) - Customer making the enquiry
  - `contact_person` (text) - Contact person name
  - `contact_mobile` (text) - Contact mobile number
  - `contact_email` (text) - Contact email
  - `origin` (text, required) - Pickup location/city
  - `destination` (text, required) - Delivery location/city
  - `material_description` (text) - Description of goods to be transported
  - `weight_tons` (decimal) - Estimated weight in tons
  - `vehicle_type_required` (text) - Type of vehicle required
  - `loading_date` (date) - Expected loading date
  - `quoted_rate` (decimal) - Quoted freight rate
  - `remarks` (text) - Additional notes
  - `status` (text) - New, Quoted, Converted, Lost
  - `converted_to_trip_id` (uuid, FK to trips) - If converted to trip
  - `created_by` (uuid, FK to user_profiles) - User who created the enquiry
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Security
  - Enable RLS on enquiries table
  - Authenticated users can read all enquiries
  - Admin, Fleet Manager, and Operations Executive can create/update enquiries
  
  ## Notes
  - All monetary values in INR
  - Weights in TON
  - Status workflow: New → Quoted → Converted/Lost
*/

-- Create enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number text UNIQUE NOT NULL,
  enquiry_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES customers(customer_id),
  contact_person text DEFAULT '',
  contact_mobile text DEFAULT '',
  contact_email text DEFAULT '',
  origin text NOT NULL,
  destination text NOT NULL,
  material_description text DEFAULT '',
  weight_tons decimal(10,2) DEFAULT 0,
  vehicle_type_required text DEFAULT '',
  loading_date date,
  quoted_rate decimal(12,2) DEFAULT 0,
  remarks text DEFAULT '',
  status text DEFAULT 'New' CHECK (status IN ('New', 'Quoted', 'Converted', 'Lost')),
  converted_to_trip_id uuid REFERENCES trips(trip_id),
  created_by uuid REFERENCES user_profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enquiries
CREATE POLICY "Authenticated users can read enquiries"
  ON enquiries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can insert enquiries"
  ON enquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Operations Executive')
    )
  );

CREATE POLICY "Authorized users can update enquiries"
  ON enquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Operations Executive')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Operations Executive')
    )
  );

CREATE POLICY "Admins can delete enquiries"
  ON enquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate enquiry number
CREATE OR REPLACE FUNCTION generate_enquiry_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_number text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(enquiry_number FROM 4) AS integer)), 0) + 1
  INTO next_num
  FROM enquiries
  WHERE enquiry_number ~ '^ENQ[0-9]+$';
  
  new_number := 'ENQ' || LPAD(next_num::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate enquiry number
CREATE OR REPLACE FUNCTION set_enquiry_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enquiry_number IS NULL OR NEW.enquiry_number = '' THEN
    NEW.enquiry_number := generate_enquiry_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_enquiry_number_trigger
  BEFORE INSERT ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION set_enquiry_number();
