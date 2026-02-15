/*
  # Authentication and User Roles Setup

  ## Overview
  Sets up the authentication system with role-based access control for the Fleet Management System.

  ## New Tables Created
  
  ### 1. `roles`
  Defines the different roles available in the system
  - `role_id` (uuid, primary key)
  - `role_name` (text, unique) - Admin, Fleet Manager, Operations Executive, Accounts, Read-Only Management
  - `description` (text) - Role description
  - `permissions` (jsonb) - Stores permission flags for different modules
  
  ### 2. `user_profiles`
  Extended user information linked to auth.users
  - `user_id` (uuid, primary key, FK to auth.users)
  - `role_id` (uuid, FK to roles)
  - `full_name` (text, required)
  - `mobile_number` (text)
  - `employee_code` (text)
  - `status` (text) - Active, Inactive
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to read their own profile
  - Policies for admins to manage all users
  - Policies for users to read role information

  ## Notes
  - Uses Supabase's built-in auth.users table
  - Permissions stored as JSON for flexibility
  - Five predefined roles inserted
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(role_id) NOT NULL,
  full_name text NOT NULL,
  mobile_number text,
  employee_code text UNIQUE,
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Insert predefined roles
INSERT INTO roles (role_name, description, permissions) VALUES
  ('Admin', 'Full access to all modules and settings', '{"all": true}'::jsonb),
  ('Fleet Manager', 'Manage vehicles, drivers, trips, expenses, and maintenance', '{"vehicles": true, "drivers": true, "trips": true, "expenses": true, "maintenance": true, "dashboards": true}'::jsonb),
  ('Operations Executive', 'Create and manage trips, capture expenses and events', '{"trips": true, "expenses": true, "trip_status": true}'::jsonb),
  ('Accounts', 'View and manage financial data, run profitability reports', '{"trips_view": true, "financial_edit": true, "reports": true}'::jsonb),
  ('Read-Only Management', 'View-only access to dashboards and reports', '{"dashboards_view": true, "reports_view": true}'::jsonb)
ON CONFLICT (role_name) DO NOTHING;

-- RLS Policies for roles table
CREATE POLICY "Anyone authenticated can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert roles"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (SELECT role_id FROM roles WHERE role_name = 'Admin')
    )
  );

CREATE POLICY "Only admins can update roles"
  ON roles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (SELECT role_id FROM roles WHERE role_name = 'Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role_id IN (SELECT role_id FROM roles WHERE role_name = 'Admin')
    )
  );

-- RLS Policies for user_profiles table
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
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

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role_id, full_name)
  VALUES (
    new.id,
    (SELECT role_id FROM roles WHERE role_name = 'Read-Only Management' LIMIT 1),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();