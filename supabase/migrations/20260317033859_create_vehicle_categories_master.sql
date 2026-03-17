/*
  # Create Vehicle Categories Master Table

  1. New Tables
    - `vehicle_categories_master`
      - `category_id` (uuid, primary key)
      - `category_name` (text, unique) - Name of the category (e.g., Dry, Frozen, Ambient)
      - `description` (text) - Description of the category
      - `is_active` (boolean) - Whether the category is active
      - `created_at` (timestamptz) - When the category was created
      - `updated_at` (timestamptz) - When the category was last updated

  2. Security
    - Enable RLS on `vehicle_categories_master` table
    - Add policy for authenticated users to read categories
    - Add policy for authenticated users to insert categories
    - Add policy for authenticated users to update categories
    - Add policy for authenticated users to delete categories
*/

CREATE TABLE IF NOT EXISTS vehicle_categories_master (
  category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_categories_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON vehicle_categories_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON vehicle_categories_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON vehicle_categories_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON vehicle_categories_master FOR DELETE
  TO authenticated
  USING (true);