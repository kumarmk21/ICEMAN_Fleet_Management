/*
  # Add expense_ref_no and sequence generator for trip_expenses

  ## Summary
  - Adds `expense_ref_no` text column to trip_expenses (e.g. TE/2526/00001)
  - Adds a DB function to generate the next ref number for a financial year
  - Financial year is April–March (e.g. Apr 2025–Mar 2026 = "2526")

  ## Changes
  - `trip_expenses`: new `expense_ref_no` column (text, unique, nullable)
  - New function `generate_expense_ref_no()` returns next ref as text
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_expenses' AND column_name = 'expense_ref_no'
  ) THEN
    ALTER TABLE trip_expenses ADD COLUMN expense_ref_no text UNIQUE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_expense_ref_no()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month int;
  v_year  int;
  v_fy    text;
  v_count int;
  v_ref   text;
BEGIN
  v_month := EXTRACT(MONTH FROM now())::int;
  v_year  := EXTRACT(YEAR FROM now())::int;

  IF v_month >= 4 THEN
    v_fy := LPAD((v_year % 100)::text, 2, '0') || LPAD(((v_year + 1) % 100)::text, 2, '0');
  ELSE
    v_fy := LPAD(((v_year - 1) % 100)::text, 2, '0') || LPAD((v_year % 100)::text, 2, '0');
  END IF;

  SELECT COUNT(*) + 1
  INTO v_count
  FROM trip_expenses
  WHERE expense_ref_no LIKE 'TE/' || v_fy || '/%';

  v_ref := 'TE/' || v_fy || '/' || LPAD(v_count::text, 5, '0');

  RETURN v_ref;
END;
$$;
