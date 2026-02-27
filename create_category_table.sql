-- Create the vehicle_category_master table
CREATE TABLE IF NOT EXISTS vehicle_category_master (
  vehicle_category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text UNIQUE NOT NULL CHECK (trim(category_name) != ''),
  category_description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_category_master_name ON vehicle_category_master(category_name);
CREATE INDEX IF NOT EXISTS idx_vehicle_category_master_active ON vehicle_category_master(is_active);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicle_category_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_vehicle_category_master_updated_at ON vehicle_category_master;
CREATE TRIGGER trigger_update_vehicle_category_master_updated_at
  BEFORE UPDATE ON vehicle_category_master
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_category_master_updated_at();

-- Enable RLS
ALTER TABLE vehicle_category_master ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view vehicle categories" ON vehicle_category_master;
DROP POLICY IF EXISTS "Users can insert vehicle categories" ON vehicle_category_master;
DROP POLICY IF EXISTS "Users can update vehicle categories" ON vehicle_category_master;
DROP POLICY IF EXISTS "Users can delete vehicle categories" ON vehicle_category_master;

-- Create RLS policies
CREATE POLICY "Users can view vehicle categories"
  ON vehicle_category_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert vehicle categories"
  ON vehicle_category_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update vehicle categories"
  ON vehicle_category_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete vehicle categories"
  ON vehicle_category_master FOR DELETE
  TO authenticated
  USING (true);

-- Insert default vehicle categories
INSERT INTO vehicle_category_master (category_name, category_description, is_active)
VALUES
  ('Reefer', 'Refrigerated vehicles for temperature-controlled transport', true),
  ('Dry', 'Standard dry cargo vehicles', true)
ON CONFLICT (category_name) DO NOTHING;
