/*
  # Rename Vehicle Cost Fields

  1. Changes to Vehicles Table
    - Rename `standard_fuel_kmpl` to `standard_fuel_cost_per_km`
    - Rename `fixed_cost_per_month` to `emi_per_month`
    - Remove `debit_card_id` column (no longer needed)
  
  ## Rationale
  - Field names now better reflect their purpose
  - Standard Fuel Cost per KM is more accurate than KMPL
  - EMI per Month is more specific than Fixed Cost per Month
  - Debit Card functionality is not required
*/

-- Rename standard_fuel_kmpl to standard_fuel_cost_per_km
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'standard_fuel_kmpl'
  ) THEN
    ALTER TABLE vehicles RENAME COLUMN standard_fuel_kmpl TO standard_fuel_cost_per_km;
    COMMENT ON COLUMN vehicles.standard_fuel_cost_per_km IS 'Standard fuel cost per kilometer';
  END IF;
END $$;

-- Rename fixed_cost_per_month to emi_per_month
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fixed_cost_per_month'
  ) THEN
    ALTER TABLE vehicles RENAME COLUMN fixed_cost_per_month TO emi_per_month;
    COMMENT ON COLUMN vehicles.emi_per_month IS 'EMI (Equated Monthly Installment) per month';
  END IF;
END $$;

-- Remove debit_card_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'debit_card_id'
  ) THEN
    ALTER TABLE vehicles DROP COLUMN debit_card_id;
  END IF;
END $$;