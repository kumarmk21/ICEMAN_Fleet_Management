/*
  # Create Modules Registry and User Module Permissions

  ## Summary
  Introduces a per-user, per-module permission system that replaces the
  coarse role-based permission JSON. Each user can be granted or denied
  access to individual modules independently of their role. Admin users
  bypass this table entirely at the application layer (always full access).

  ## New Tables

  ### `modules`
  A registry of all application modules.
  - `module_key` (text, primary key) – matches the nav/page ID used in the frontend
  - `module_name` (text) – human-readable display name
  - `module_group` (text) – one of: core, operations, masters, tools
  - `sort_order` (int) – display ordering within the group

  ### `user_module_permissions`
  Stores per-user CRUD permissions for each module.
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK → user_profiles.user_id)
  - `module_key` (text, FK → modules.module_key)
  - `can_view` (boolean, default false)
  - `can_create` (boolean, default false)
  - `can_edit` (boolean, default false)
  - `can_delete` (boolean, default false)
  - `updated_at` (timestamptz, auto-updated)
  - Unique constraint on (user_id, module_key)

  ## Security
  - RLS enabled on both tables
  - `modules`: all authenticated users can SELECT (read-only registry)
  - `user_module_permissions`:
    - Users can SELECT only their own rows
    - Admin users (role_name = 'Admin') can SELECT, INSERT, UPDATE, DELETE all rows

  ## Notes
  1. All 23 application modules are seeded into the `modules` table
  2. Default value for all permission booleans is false (deny by default)
  3. No permission row = no access for non-Admin users
*/

-- ============================================================
-- 1. modules registry
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
  module_key   text PRIMARY KEY,
  module_name  text NOT NULL,
  module_group text NOT NULL CHECK (module_group IN ('core', 'operations', 'masters', 'tools')),
  sort_order   int  NOT NULL DEFAULT 0
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view modules"
  ON modules FOR SELECT
  TO authenticated
  USING (true);

-- Seed all application modules
INSERT INTO modules (module_key, module_name, module_group, sort_order) VALUES
  ('dashboard',        'Dashboard',          'core',       1),
  ('profitability',    'Profitability',      'core',       2),
  ('enquiries',        'Enquiries',          'operations', 1),
  ('trips',            'Trips',              'operations', 2),
  ('trip-expenses',    'Trip Expenses',      'operations', 3),
  ('lorry-receipt',    'Lorry Receipt',      'operations', 4),
  ('vehicles',         'Vehicles',           'masters',    1),
  ('vehicle-types',    'Vehicle Types',      'masters',    2),
  ('vehicle-category', 'Vehicle Category',   'masters',    3),
  ('drivers',          'Drivers',            'masters',    4),
  ('routes',           'Routes',             'masters',    5),
  ('customers',        'Customers',          'masters',    6),
  ('vendors',          'Vendors',            'masters',    7),
  ('diesel-cards',     'Diesel Cards',       'masters',    8),
  ('fast-tags',        'Fast Tags',          'masters',    9),
  ('gst-master',       'GST Master',         'masters',   10),
  ('expense-heads',    'Expense Heads',      'masters',   11),
  ('city-master',      'City Master',        'masters',   12),
  ('documents',        'Vehicle Documents',  'masters',   13),
  ('users',            'Users',              'masters',   14),
  ('maintenance',      'Maintenance',        'tools',      1),
  ('reports',          'Reports',            'tools',      2),
  ('right-access',     'Right Access',       'tools',      3)
ON CONFLICT (module_key) DO NOTHING;

-- ============================================================
-- 2. user_module_permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS user_module_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  module_key  text NOT NULL REFERENCES modules(module_key) ON DELETE CASCADE,
  can_view    boolean NOT NULL DEFAULT false,
  can_create  boolean NOT NULL DEFAULT false,
  can_edit    boolean NOT NULL DEFAULT false,
  can_delete  boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own permission rows
CREATE POLICY "Users can view own module permissions"
  ON user_module_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin users can read all rows
CREATE POLICY "Admins can view all module permissions"
  ON user_module_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
        AND r.role_name = 'Admin'
    )
  );

-- Admin users can insert permissions for any user
CREATE POLICY "Admins can insert module permissions"
  ON user_module_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
        AND r.role_name = 'Admin'
    )
  );

-- Admin users can update permissions for any user
CREATE POLICY "Admins can update module permissions"
  ON user_module_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
        AND r.role_name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
        AND r.role_name = 'Admin'
    )
  );

-- Admin users can delete permissions for any user
CREATE POLICY "Admins can delete module permissions"
  ON user_module_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
        AND r.role_name = 'Admin'
    )
  );

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_user_module_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_module_permissions_updated_at
  BEFORE UPDATE ON user_module_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_module_permissions_updated_at();

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_user_module_permissions_user_id
  ON user_module_permissions (user_id);
