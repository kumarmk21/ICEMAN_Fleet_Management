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