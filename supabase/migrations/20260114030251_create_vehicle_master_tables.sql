/*
  # Create Vehicle Master Tables

  1. New Tables
    - `vehicle_types_master`
      - `vehicle_type_id` (uuid, primary key)
      - `vehicle_type_name` (text, unique) - e.g., "32FT MXL", "20FT", "14FT"
      - `capacity_tons` (numeric) - Default capacity for this vehicle type
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `diesel_cards_master`
      - `diesel_card_id` (uuid, primary key)
      - `card_number` (text, unique)
      - `card_name` (text)
      - `provider` (text) - e.g., "HP", "Indian Oil", "Bharat Petroleum"
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `debit_cards_master`
      - `debit_card_id` (uuid, primary key)
      - `card_number_last4` (text) - Last 4 digits for security
      - `card_name` (text)
      - `bank_name` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read and manage data
*/

CREATE TABLE IF NOT EXISTS vehicle_types_master (
  vehicle_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type_name text UNIQUE NOT NULL,
  capacity_tons numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diesel_cards_master (
  diesel_card_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number text UNIQUE NOT NULL,
  card_name text NOT NULL,
  provider text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS debit_cards_master (
  debit_card_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number_last4 text NOT NULL,
  card_name text NOT NULL,
  bank_name text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE diesel_cards_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE debit_cards_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicle types"
  ON vehicle_types_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicle types"
  ON vehicle_types_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicle types"
  ON vehicle_types_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicle types"
  ON vehicle_types_master FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read diesel cards"
  ON diesel_cards_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert diesel cards"
  ON diesel_cards_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update diesel cards"
  ON diesel_cards_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete diesel cards"
  ON diesel_cards_master FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read debit cards"
  ON debit_cards_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert debit cards"
  ON debit_cards_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update debit cards"
  ON debit_cards_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete debit cards"
  ON debit_cards_master FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO vehicle_types_master (vehicle_type_name, capacity_tons) VALUES
  ('32FT MXL', 30),
  ('32FT SXL', 28),
  ('24FT', 18),
  ('22FT', 16),
  ('20FT', 14),
  ('19FT', 12),
  ('17FT', 10),
  ('14FT', 7),
  ('10 Wheeler', 15),
  ('6 Wheeler', 8)
ON CONFLICT (vehicle_type_name) DO NOTHING;