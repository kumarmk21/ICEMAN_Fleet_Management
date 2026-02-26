/*
  # Add Customer Classification and GST Applicable Fields

  1. Changes
    - Add `customer_classification` column to customers table
      - Values: 'Corporate' or 'Broker'
      - Required field (NOT NULL)
      - Default: 'Corporate'
    
    - Add `gst_applicable` column to customers table
      - Boolean field to indicate if GST is applicable
      - Default: false
    
    - Add `registered_office_address` column to customers table
      - Text field for registered office address
      - Replaces or complements existing billing_address
    
    - Add `registered_office_city` column to customers table
      - Text field for registered office city
    
  2. Notes
    - These fields are required by the CustomersList UI component
    - Existing customers will get default values
*/

-- Add customer_classification column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'customer_classification'
  ) THEN
    ALTER TABLE customers 
    ADD COLUMN customer_classification text NOT NULL DEFAULT 'Corporate'
    CHECK (customer_classification IN ('Corporate', 'Broker'));
  END IF;
END $$;

-- Add gst_applicable column (boolean)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'gst_applicable'
  ) THEN
    ALTER TABLE customers 
    ADD COLUMN gst_applicable boolean DEFAULT false;
  END IF;
END $$;

-- Add registered_office_address column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'registered_office_address'
  ) THEN
    ALTER TABLE customers 
    ADD COLUMN registered_office_address text;
  END IF;
END $$;

-- Add registered_office_city column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'registered_office_city'
  ) THEN
    ALTER TABLE customers 
    ADD COLUMN registered_office_city text;
  END IF;
END $$;