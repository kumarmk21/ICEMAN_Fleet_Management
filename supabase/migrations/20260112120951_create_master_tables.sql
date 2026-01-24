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
