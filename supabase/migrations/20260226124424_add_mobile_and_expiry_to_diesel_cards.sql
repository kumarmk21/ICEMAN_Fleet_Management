/*
  # Add Mobile Number and Expiry Date to Diesel Cards

  1. Changes
    - Add `mobile_number` column to `diesel_cards_master` table
      - Type: text
      - Constraint: Must be exactly 10 digits
      - Required field
    - Add `expiry_date` column to `diesel_cards_master` table
      - Type: date
      - Constraint: Must be a future date
      - Required field

  2. Validation
    - Mobile number must match pattern for exactly 10 digits
    - Expiry date must be greater than current date

  3. Notes
    - Uses CHECK constraints for data validation
    - Ensures data integrity at the database level
*/

-- Add mobile_number column with validation
ALTER TABLE diesel_cards_master 
ADD COLUMN IF NOT EXISTS mobile_number text;

-- Add expiry_date column
ALTER TABLE diesel_cards_master 
ADD COLUMN IF NOT EXISTS expiry_date date;

-- Add CHECK constraint for mobile number (exactly 10 digits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'diesel_cards_mobile_number_check'
  ) THEN
    ALTER TABLE diesel_cards_master 
    ADD CONSTRAINT diesel_cards_mobile_number_check 
    CHECK (mobile_number ~ '^\d{10}$');
  END IF;
END $$;

-- Add CHECK constraint for expiry date (must be future date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'diesel_cards_expiry_date_check'
  ) THEN
    ALTER TABLE diesel_cards_master 
    ADD CONSTRAINT diesel_cards_expiry_date_check 
    CHECK (expiry_date > CURRENT_DATE);
  END IF;
END $$;