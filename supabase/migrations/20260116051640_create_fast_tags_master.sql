/*
  # Create Fast Tags Master Table

  1. New Tables
    - `fast_tags_master`
      - `fast_tag_id` (uuid, primary key)
      - `vehicle_number` (text, mandatory) - Vehicle registration number
      - `wallet_id` (text, mandatory) - FASTag wallet identification
      - `customer_id` (text, optional) - Customer identification
      - `tag_account_number` (text) - Tag account number
      - `mobile_number` (text, mandatory) - Registered mobile number
      - `tag_id` (text) - FASTag ID/serial number
      - `vehicle_class` (text) - Vehicle classification for toll
      - `issuer_bank` (text) - Bank that issued the FASTag
      - `balance` (numeric) - Current wallet balance
      - `status` (text) - Active, Inactive, Blocked, Suspended
      - `issue_date` (date) - Tag issue date
      - `expiry_date` (date) - Tag expiry date
      - `remarks` (text) - Additional notes
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `fast_tags_master` table
    - Add policies for authenticated users to manage Fast Tags
*/

-- Create fast_tags_master table
CREATE TABLE IF NOT EXISTS fast_tags_master (
  fast_tag_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number text NOT NULL,
  wallet_id text NOT NULL,
  customer_id text,
  tag_account_number text,
  mobile_number text NOT NULL,
  tag_id text,
  vehicle_class text,
  issuer_bank text,
  balance numeric(10,2) DEFAULT 0,
  status text DEFAULT 'Active',
  issue_date date,
  expiry_date date,
  remarks text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments
COMMENT ON TABLE fast_tags_master IS 'Master table for FASTag details';
COMMENT ON COLUMN fast_tags_master.vehicle_number IS 'Vehicle registration number (mandatory)';
COMMENT ON COLUMN fast_tags_master.wallet_id IS 'FASTag wallet identification (mandatory)';
COMMENT ON COLUMN fast_tags_master.customer_id IS 'Customer identification (optional)';
COMMENT ON COLUMN fast_tags_master.tag_account_number IS 'Tag account number';
COMMENT ON COLUMN fast_tags_master.mobile_number IS 'Registered mobile number (mandatory)';
COMMENT ON COLUMN fast_tags_master.tag_id IS 'FASTag ID/serial number';
COMMENT ON COLUMN fast_tags_master.vehicle_class IS 'Vehicle classification for toll';
COMMENT ON COLUMN fast_tags_master.issuer_bank IS 'Bank that issued the FASTag';
COMMENT ON COLUMN fast_tags_master.balance IS 'Current wallet balance';
COMMENT ON COLUMN fast_tags_master.status IS 'Status: Active, Inactive, Blocked, Suspended';

-- Enable RLS
ALTER TABLE fast_tags_master ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view fast tags"
  ON fast_tags_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert fast tags"
  ON fast_tags_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update fast tags"
  ON fast_tags_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete fast tags"
  ON fast_tags_master FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fast_tags_vehicle_number ON fast_tags_master(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_fast_tags_wallet_id ON fast_tags_master(wallet_id);
CREATE INDEX IF NOT EXISTS idx_fast_tags_is_active ON fast_tags_master(is_active);

-- Update vehicles table to use fast_tag_id foreign key
DO $$
BEGIN
  -- First drop the fast_tag column if it exists as text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fast_tag' AND data_type = 'text'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN fast_tag;
  END IF;

  -- Add fast_tag_id as foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fast_tag_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN fast_tag_id uuid REFERENCES fast_tags_master(fast_tag_id);
    COMMENT ON COLUMN vehicles.fast_tag_id IS 'Reference to fast_tags_master';
  END IF;
END $$;