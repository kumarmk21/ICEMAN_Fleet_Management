/*
  # Update Customers Table with Comprehensive Fields

  1. Changes to customers table
    - Add pay_basis (text) - Radio buttons: Paid, To Pay, TBB
    - Add communication_address (text)
    - Add communication_city (text)
    - Add communication_state (text)
    - Add registered_office_city (text)
    - Add registered_office_state (text)
    - Add sales_person_id (uuid) - FK to user_profiles
    - Add credit_days (integer) - Required when pay_basis = TBB
    - Add billing_cycle (text) - Radio: Daily, Weekly, Fortnightly, Monthly
    - Add billing_instance (text) - Radio: Booked, Delivered, POD Recd
    - Add auto_billing (boolean)

  2. Notes
    - Fields are nullable to support existing data
    - Conditional fields only required when pay_basis = 'TBB'
*/

-- Add pay_basis field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'pay_basis'
  ) THEN
    ALTER TABLE customers ADD COLUMN pay_basis text;
  END IF;
END $$;

-- Add communication address fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'communication_address'
  ) THEN
    ALTER TABLE customers ADD COLUMN communication_address text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'communication_city'
  ) THEN
    ALTER TABLE customers ADD COLUMN communication_city text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'communication_state'
  ) THEN
    ALTER TABLE customers ADD COLUMN communication_state text;
  END IF;
END $$;

-- Add registered office state field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'registered_office_state'
  ) THEN
    ALTER TABLE customers ADD COLUMN registered_office_state text;
  END IF;
END $$;

-- Add sales_person_id field with FK to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'sales_person_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN sales_person_id uuid REFERENCES user_profiles(user_id);
  END IF;
END $$;

-- Add TBB conditional fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'credit_days'
  ) THEN
    ALTER TABLE customers ADD COLUMN credit_days integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE customers ADD COLUMN billing_cycle text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'billing_instance'
  ) THEN
    ALTER TABLE customers ADD COLUMN billing_instance text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'auto_billing'
  ) THEN
    ALTER TABLE customers ADD COLUMN auto_billing boolean;
  END IF;
END $$;

-- Add check constraints for valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_pay_basis_check'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_pay_basis_check 
    CHECK (pay_basis IN ('Paid', 'To Pay', 'TBB') OR pay_basis IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_billing_cycle_check'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_billing_cycle_check 
    CHECK (billing_cycle IN ('Daily', 'Weekly', 'Fortnightly', 'Monthly') OR billing_cycle IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_billing_instance_check'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_billing_instance_check 
    CHECK (billing_instance IN ('Booked', 'Delivered', 'POD Recd') OR billing_instance IS NULL);
  END IF;
END $$;
