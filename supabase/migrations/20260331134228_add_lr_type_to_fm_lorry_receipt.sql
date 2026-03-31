/*
  # Add lr_type to fm_lorry_receipt

  Adds a free-text field `lr_type` to store the type/category of the Lorry Receipt.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fm_lorry_receipt' AND column_name = 'lr_type'
  ) THEN
    ALTER TABLE fm_lorry_receipt ADD COLUMN lr_type VARCHAR(100) NULL;
  END IF;
END $$;
