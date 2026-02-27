/*
  # Enable RLS on Categories Table

  1. Security Changes
    - Enable Row Level Security on `categories` table
    - Add SELECT policy for authenticated users to view all categories
    - Add INSERT policy for authenticated users to create categories
    - Add UPDATE policy for authenticated users to modify categories
    - Add DELETE policy for authenticated users to remove categories

  2. Notes
    - All authenticated users can manage categories
    - This allows the Vehicle Category Master page to function properly
*/

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories table
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);
