/*
  # Add Driver Ledger Triggers for Trips and Expenses

  ## Purpose
  Automatically create driver ledger entries when:
  1. A trip is created with advance_to_driver > 0
  2. A trip expense is added to a trip

  ## Changes
  - Create trigger function to insert ADVANCE entry on trip creation
  - Create trigger function to insert EXPENSE_REIMBURSEMENT entry on trip expense creation
  - Both triggers use SECURITY DEFINER to bypass RLS for system operations

  ## Implementation Notes
  - Trigger captures created_by from auth.uid()
  - Amount validation ensures only positive amounts are recorded
  - Soft-fail logic: errors don't break trip creation (logged but not raised)
*/

-- Create function to insert driver ledger entry on trip creation
CREATE OR REPLACE FUNCTION insert_driver_ledger_on_trip_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_error_msg TEXT;
BEGIN
  -- Only create ledger entry if advance_to_driver > 0 and driver_id exists
  IF NEW.advance_to_driver > 0 AND NEW.driver_id IS NOT NULL THEN
    BEGIN
      INSERT INTO driver_ledger (
        driver_id,
        trip_id,
        transaction_type,
        amount,
        description,
        notes,
        created_by,
        updated_by
      ) VALUES (
        NEW.driver_id,
        NEW.trip_id,
        'ADVANCE',
        NEW.advance_to_driver,
        'Advance for Trip ' || NEW.trip_number || ': ' || NEW.origin || ' to ' || NEW.destination,
        'Auto-created on trip creation. Payment via ' || COALESCE(NEW.payment_mode_advance, 'Diesel Card'),
        NEW.created_by,
        NEW.created_by
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log but don't fail the trip creation
      RAISE WARNING 'Failed to create driver ledger entry for trip %: %', NEW.trip_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_insert_driver_ledger_on_trip ON trips;

-- Create trigger on trips INSERT
CREATE TRIGGER trigger_insert_driver_ledger_on_trip
AFTER INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION insert_driver_ledger_on_trip_creation();

-- Create function to insert driver ledger entry on trip expense creation
CREATE OR REPLACE FUNCTION insert_driver_ledger_on_trip_expense()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_id uuid;
  v_trip_number text;
  v_expense_head_name text;
  v_error_msg TEXT;
BEGIN
  -- Get driver_id and trip_number from the trip
  SELECT t.driver_id, t.trip_number, eh.expense_head_name
  INTO v_driver_id, v_trip_number, v_expense_head_name
  FROM trips t
  LEFT JOIN expense_heads eh ON eh.expense_head_id = NEW.expense_head_id
  WHERE t.trip_id = NEW.trip_id;

  -- Only create ledger entry if driver exists and amount > 0
  IF v_driver_id IS NOT NULL AND NEW.amount > 0 THEN
    BEGIN
      INSERT INTO driver_ledger (
        driver_id,
        trip_id,
        trip_expense_id,
        transaction_type,
        amount,
        description,
        notes,
        created_by,
        updated_by
      ) VALUES (
        v_driver_id,
        NEW.trip_id,
        NEW.trip_expense_id,
        'EXPENSE_REIMBURSEMENT',
        NEW.amount,
        COALESCE(v_expense_head_name, 'Expense') || ' for Trip ' || v_trip_number,
        'Expense Date: ' || NEW.expense_date::text || '. ' || COALESCE(NEW.description, ''),
        NEW.created_by,
        NEW.created_by
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log but don't fail the expense creation
      RAISE WARNING 'Failed to create driver ledger entry for expense %: %', NEW.trip_expense_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_insert_driver_ledger_on_expense ON trip_expenses;

-- Create trigger on trip_expenses INSERT
CREATE TRIGGER trigger_insert_driver_ledger_on_expense
AFTER INSERT ON trip_expenses
FOR EACH ROW
EXECUTE FUNCTION insert_driver_ledger_on_trip_expense();
