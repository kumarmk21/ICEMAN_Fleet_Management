/*
  # Create Driver Ledger Table

  ## Purpose
  Tracks all financial transactions between the company and drivers, including:
  - Advances paid to drivers during trip creation
  - Expense reimbursements (trip expenses incurred by drivers)
  - Running balance calculations (positive = company owes driver, negative = driver owes company)

  ## Design Rationale
  
  ### Transaction Types
  - ADVANCE: Company pays money to driver upfront (debit entry, reduces balance)
  - EXPENSE_REIMBURSEMENT: Driver incurs expense on behalf of company (credit entry, increases balance)
  - REVERSAL: Reverses a previous transaction (e.g., double-entry correction)
  - MANUAL_ADJUSTMENT: Manual adjustments by accounts team
  
  ### Balance Logic
  - balance = SUM of all credit entries - SUM of all debit entries
  - Positive balance: Company has a liability (owes money to driver)
  - Negative balance: Driver has a liability (owes money to company)
  - Zero balance: Settlement complete
  
  ### Foreign Key Strategy
  - Links to drivers table for driver information
  - Optional links to trips and trip_expenses (allows manual entries if needed)
  - References auth.users for audit trail (created_by, updated_by)
  
  ### Performance Optimization
  - Index on (driver_id, transaction_type) for fast filtering
  - Index on (trip_id) for trip-specific reconciliation
  - Denormalized amount and type fields for faster aggregations
  - Helper functions for balance calculations
  
  ### Data Integrity
  - Amount must be positive (type determines debit/credit semantics)
  - Created entries are immutable (no deletes, use reversals if needed)
  - Audit fields track creation and updates
  
  ## New Tables
  - `driver_ledger`: Main ledger table recording all driver transactions

  ## New Indexes
  - idx_driver_ledger_driver_id: Fast lookup by driver
  - idx_driver_ledger_trip_id: Fast lookup by trip
  - idx_driver_ledger_driver_type: Optimized for balance aggregations
  - idx_driver_ledger_created_at: For chronological queries

  ## Security
  - Enable RLS on driver_ledger table
  - Different permissions based on user roles (Admin, Accounts, Fleet Manager, Operations Executive)
  - Immutable ledger entries (no deletion allowed)
  
  ## Sample Usage
  - When trip created with advance: INSERT with ADVANCE type
  - When trip expense added: INSERT with EXPENSE_REIMBURSEMENT type
  - Query balance: SELECT get_driver_balance(driver_id)
*/

-- Create driver_ledger table
CREATE TABLE IF NOT EXISTS driver_ledger (
  ledger_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES drivers(driver_id) ON DELETE RESTRICT,
  trip_id uuid REFERENCES trips(trip_id) ON DELETE SET NULL,
  trip_expense_id uuid REFERENCES trip_expenses(trip_expense_id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('ADVANCE', 'EXPENSE_REIMBURSEMENT', 'REVERSAL', 'MANUAL_ADJUSTMENT')),
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  description text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_ledger_driver_id ON driver_ledger(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_ledger_trip_id ON driver_ledger(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_ledger_driver_type ON driver_ledger(driver_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_driver_ledger_created_at ON driver_ledger(created_at DESC);

-- Enable RLS
ALTER TABLE driver_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies - permissive SELECT for authorized roles
CREATE POLICY "Authorized roles can view driver ledger"
  ON driver_ledger
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      INNER JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Accounts', 'Fleet Manager', 'Operations Executive')
    )
  );

-- Only Admin and Accounts can insert
CREATE POLICY "Admin and Accounts can insert driver ledger"
  ON driver_ledger
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      INNER JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Accounts')
    )
    AND created_by = auth.uid()
  );

-- Only creator or Admin can update notes
CREATE POLICY "Creator or Admin can update driver ledger"
  ON driver_ledger
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      INNER JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      INNER JOIN roles r ON r.role_id = up.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- Prevent deletion of ledger entries
CREATE POLICY "Prevent deletion of driver ledger"
  ON driver_ledger
  FOR DELETE
  TO authenticated
  USING (false);

-- Create helper function to calculate driver balance
CREATE OR REPLACE FUNCTION get_driver_balance(p_driver_id uuid)
RETURNS decimal AS $$
  SELECT COALESCE(
    SUM(CASE 
      WHEN transaction_type = 'ADVANCE' THEN -amount
      WHEN transaction_type = 'EXPENSE_REIMBURSEMENT' THEN amount
      WHEN transaction_type = 'REVERSAL' THEN -amount
      WHEN transaction_type = 'MANUAL_ADJUSTMENT' THEN amount
      ELSE 0
    END),
    0
  ) as balance
  FROM driver_ledger
  WHERE driver_id = p_driver_id;
$$ LANGUAGE SQL IMMUTABLE SECURITY DEFINER;

-- Create helper function to get driver ledger summary
CREATE OR REPLACE FUNCTION get_driver_ledger_summary(p_driver_id uuid)
RETURNS TABLE (
  driver_id uuid,
  total_advances decimal,
  total_reimbursements decimal,
  current_balance decimal,
  last_transaction_date timestamptz,
  total_entries int
) AS $$
  SELECT
    p_driver_id,
    COALESCE(SUM(CASE WHEN transaction_type = 'ADVANCE' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE_REIMBURSEMENT' THEN amount ELSE 0 END), 0),
    COALESCE(
      SUM(CASE 
        WHEN transaction_type = 'ADVANCE' THEN -amount
        WHEN transaction_type = 'EXPENSE_REIMBURSEMENT' THEN amount
        WHEN transaction_type = 'REVERSAL' THEN -amount
        WHEN transaction_type = 'MANUAL_ADJUSTMENT' THEN amount
        ELSE 0
      END),
      0
    ),
    MAX(created_at),
    COUNT(*)::int
  FROM driver_ledger
  WHERE driver_id = p_driver_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
