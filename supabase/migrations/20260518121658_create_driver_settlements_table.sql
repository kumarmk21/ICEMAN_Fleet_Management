/*
  # Create Driver Settlements Table

  ## Purpose
  Tracks financial settlements between the company and drivers after a trip completes.
  Compares advance paid to a driver against actual trip expenses to determine if money
  is owed to the driver (Payable) or recoverable from the driver (Recoverable).

  ## New Tables
  - `driver_settlements`
    - `id` (uuid, PK)
    - `trip_id` (text) — reference to the trip
    - `trip_date` (date)
    - `driver_id` (text)
    - `driver_name` (text)
    - `vehicle_number` (text, optional)
    - `route` (text, optional)
    - `advance_amount` (numeric) — money given to driver before trip
    - `trip_expenses_total` (numeric) — actual expenses incurred
    - `difference_amount` (generated) — advance - expenses (positive = recoverable)
    - `settlement_type` (generated) — 'Payable' | 'Recoverable' | 'Settled'
    - `status` (text) — workflow: Pending → Approved → Paid | Cancelled
    - `payment_reference`, `payment_date` — for Paid status
    - `notes`, 3x custom field pairs for company-specific data
    - `generated_by`, `generated_at`, `approved_by`, `approved_at`, timestamps

  ## Security
  - RLS enabled with authenticated-user policies
  - Separate policies for select, insert, update
*/

CREATE TABLE IF NOT EXISTS driver_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id text NOT NULL,
  trip_date date NOT NULL,
  driver_id text NOT NULL DEFAULT '',
  driver_name text NOT NULL,
  vehicle_number text,
  route text,
  advance_amount numeric(10,2) NOT NULL DEFAULT 0,
  trip_expenses_total numeric(10,2) NOT NULL DEFAULT 0,
  difference_amount numeric(10,2) GENERATED ALWAYS AS (advance_amount - trip_expenses_total) STORED,
  settlement_type text GENERATED ALWAYS AS (
    CASE
      WHEN advance_amount > trip_expenses_total THEN 'Recoverable'
      WHEN advance_amount < trip_expenses_total THEN 'Payable'
      ELSE 'Settled'
    END
  ) STORED,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Paid', 'Cancelled')),
  payment_reference text,
  payment_date date,
  notes text,
  custom_field_1_label text,
  custom_field_1_value text,
  custom_field_2_label text,
  custom_field_2_value text,
  custom_field_3_label text,
  custom_field_3_value text,
  generated_by text,
  generated_at timestamptz DEFAULT now(),
  approved_by text,
  approved_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE driver_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view driver settlements"
  ON driver_settlements FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert driver settlements"
  ON driver_settlements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update driver settlements"
  ON driver_settlements FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_driver_settlements_trip_id ON driver_settlements(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_driver_id ON driver_settlements(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_status ON driver_settlements(status);
CREATE INDEX IF NOT EXISTS idx_driver_settlements_created_at ON driver_settlements(created_at DESC);
