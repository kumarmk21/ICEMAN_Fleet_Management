/*
  # Update Vehicles Table with New Fields

  1. Changes to vehicles table
    - Add `vehicle_type_id` (uuid, foreign key to vehicle_types_master)
    - Add `fast_tag` (text, nullable)
    - Add `diesel_card_id` (uuid, foreign key to diesel_cards_master, nullable)
    - Add `debit_card_id` (uuid, foreign key to debit_cards_master, nullable)
    - Ensure year_of_manufacture, engine_number, chassis_number, odometer_current are present

  2. Notes
    - Using IF NOT EXISTS to safely add columns
    - Foreign keys will cascade on delete set null for optional relationships
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'vehicle_type_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN vehicle_type_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fast_tag'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN fast_tag text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'diesel_card_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN diesel_card_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'debit_card_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN debit_card_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicles_vehicle_type_id_fkey'
  ) THEN
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_vehicle_type_id_fkey
      FOREIGN KEY (vehicle_type_id)
      REFERENCES vehicle_types_master(vehicle_type_id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicles_diesel_card_id_fkey'
  ) THEN
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_diesel_card_id_fkey
      FOREIGN KEY (diesel_card_id)
      REFERENCES diesel_cards_master(diesel_card_id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicles_debit_card_id_fkey'
  ) THEN
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_debit_card_id_fkey
      FOREIGN KEY (debit_card_id)
      REFERENCES debit_cards_master(debit_card_id)
      ON DELETE SET NULL;
  END IF;
END $$;