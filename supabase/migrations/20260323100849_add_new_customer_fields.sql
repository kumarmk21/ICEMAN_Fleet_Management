/*
  # Add New Fields to Customers Table

  ## Changes Made
  1. New Columns Added to `customers` table:
    - `division` (text) - Checkbox selection: Iceman(Cold), Equinox(Dry), stored as comma-separated
    - `contact_person_dod` (date) - Contact Person Date of Departure/Designation
    - `account_person` (text) - Account person free text
    - `account_person_email` (text) - Account person email
    - `account_person_contact` (text) - Account person contact number
    - `pod_type` (text) - POD Type: Physical or Scanned
    - `invoice_type` (text) - Invoice Type: Email or Physical
    - `payment_basis` (text) - Payment Basis: Advance Payment or Bill Payment
    - `sales_person_email` (text) - Sales person email free text
    - `special_instruction` (text) - Special instructions textarea

  ## Notes
  - `pay_basis` column remains unchanged (UI label renamed to Billing Type)
  - `credit_days` column remains as integer (UI changed to dropdown)
  - ATH/BTH added as new option for billing type in UI only
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'division') THEN
    ALTER TABLE customers ADD COLUMN division text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'contact_person_dod') THEN
    ALTER TABLE customers ADD COLUMN contact_person_dod date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'account_person') THEN
    ALTER TABLE customers ADD COLUMN account_person text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'account_person_email') THEN
    ALTER TABLE customers ADD COLUMN account_person_email text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'account_person_contact') THEN
    ALTER TABLE customers ADD COLUMN account_person_contact text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'pod_type') THEN
    ALTER TABLE customers ADD COLUMN pod_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'invoice_type') THEN
    ALTER TABLE customers ADD COLUMN invoice_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'payment_basis') THEN
    ALTER TABLE customers ADD COLUMN payment_basis text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'sales_person_email') THEN
    ALTER TABLE customers ADD COLUMN sales_person_email text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'special_instruction') THEN
    ALTER TABLE customers ADD COLUMN special_instruction text DEFAULT '';
  END IF;
END $$;
