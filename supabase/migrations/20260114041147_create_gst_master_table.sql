/*
  # Create GST Master Table

  1. New Tables
    - `gst_master`
      - `gst_id` (uuid, primary key) - Unique identifier
      - `customer_id` (uuid, foreign key) - Reference to customers table
      - `hsn_sac_code` (text) - HSN/SAC code for goods/services
      - `description` (text) - Description of goods/services
      - `cgst_rate` (numeric) - CGST rate percentage
      - `sgst_rate` (numeric) - SGST rate percentage
      - `igst_rate` (numeric) - IGST rate percentage
      - `effective_from` (date) - Start date for this GST configuration
      - `effective_to` (date, nullable) - End date (null means currently active)
      - `is_active` (boolean) - Active status
      - `remarks` (text) - Additional notes
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
      - `created_by` (uuid, nullable) - User who created the record

  2. Security
    - Enable RLS on `gst_master` table
    - Add policies for authenticated users to manage GST master data

  3. Notes
    - GST rates are stored as percentages (e.g., 18 for 18%)
    - Multiple GST configurations can exist per customer for different goods/services
    - IGST = CGST + SGST (for interstate transactions)
*/

-- Create gst_master table
CREATE TABLE IF NOT EXISTS gst_master (
  gst_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(customer_id),
  hsn_sac_code text DEFAULT '',
  description text DEFAULT '',
  cgst_rate numeric DEFAULT 0,
  sgst_rate numeric DEFAULT 0,
  igst_rate numeric DEFAULT 0,
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date,
  is_active boolean DEFAULT true,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE gst_master ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view GST master data"
  ON gst_master FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert GST master data"
  ON gst_master FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update GST master data"
  ON gst_master FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete GST master data"
  ON gst_master FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_gst_master_customer_id ON gst_master(customer_id);
CREATE INDEX IF NOT EXISTS idx_gst_master_is_active ON gst_master(is_active);
CREATE INDEX IF NOT EXISTS idx_gst_master_effective_dates ON gst_master(effective_from, effective_to);