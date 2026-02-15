/*
  # Add Email to User Profiles and Create Diesel Cards Master
  
  1. Changes
    - Add email column to user_profiles table
    - Create diesel_cards_master table (if not exists)
    - Add diesel_card_id foreign key to vehicles
  
  2. Purpose
    - Store user email addresses in profiles
    - Track diesel/fuel cards assigned to vehicles
*/

-- Add email to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;
END $$;

-- Create diesel_cards_master table
CREATE TABLE IF NOT EXISTS diesel_cards_master (
  diesel_card_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name text NOT NULL,
  card_number text UNIQUE NOT NULL,
  card_type text DEFAULT 'Diesel' CHECK (card_type IN ('Diesel', 'FASTag', 'Other')),
  provider text DEFAULT '',
  is_active boolean DEFAULT true,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on diesel_cards_master
ALTER TABLE diesel_cards_master ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read diesel cards"
  ON diesel_cards_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage diesel cards"
  ON diesel_cards_master FOR ALL
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

-- Add diesel_card_id to vehicles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'diesel_card_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN diesel_card_id uuid REFERENCES diesel_cards_master(diesel_card_id);
  END IF;
END $$;