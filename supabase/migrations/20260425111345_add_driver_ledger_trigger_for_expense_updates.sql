/*
  # Handle Driver Ledger for Trip Expense Updates

  ## Purpose
  When a trip expense amount is updated, create a reversal entry for the old amount
  and a new entry for the updated amount to maintain accurate ledger balance.

  ## Logic
  - If amount decreased: Insert REVERSAL for difference
  - If amount increased: Insert EXPENSE_REIMBURSEMENT for difference
  - Preserves ledger immutability by creating new entries instead of updating existing ones
*/

-- Create function to handle trip expense updates
CREATE OR REPLACE FUNCTION handle_driver_ledger_on_expense_update()
RETURNS TRIGGER AS $$
DECLARE
  v_driver_id uuid;
  v_trip_number text;
  v_expense_head_name text;
  v_difference decimal;
  v_transaction_type text;
  v_error_msg TEXT;
BEGIN
  -- Only process if amount changed
  IF NEW.amount = OLD.amount THEN
    RETURN NEW;
  END IF;

  -- Get driver_id and trip_number from the trip
  SELECT t.driver_id, t.trip_number, eh.expense_head_name
  INTO v_driver_id, v_trip_number, v_expense_head_name
  FROM trips t
  LEFT JOIN expense_heads eh ON eh.expense_head_id = NEW.expense_head_id
  WHERE t.trip_id = NEW.trip_id;

  -- Only create ledger entry if driver exists
  IF v_driver_id IS NOT NULL THEN
    v_difference := NEW.amount - OLD.amount;

    BEGIN
      IF v_difference > 0 THEN
        -- Amount increased: add reimbursement for the difference
        v_transaction_type := 'EXPENSE_REIMBURSEMENT';
      ELSE
        -- Amount decreased: add reversal for the difference
        v_transaction_type := 'REVERSAL';
        v_difference := ABS(v_difference);
      END IF;

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
        v_transaction_type,
        v_difference,
        COALESCE(v_expense_head_name, 'Expense') || ' adjustment for Trip ' || v_trip_number,
        'Expense amount ' || CASE WHEN v_transaction_type = 'EXPENSE_REIMBURSEMENT' THEN 'increased' ELSE 'decreased' END ||
        ' from ' || OLD.amount::text || ' to ' || NEW.amount::text,
        NEW.updated_by,
        NEW.updated_by
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log but don't fail the expense update
      RAISE WARNING 'Failed to create driver ledger adjustment for expense %: %', NEW.trip_expense_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_handle_driver_ledger_on_expense_update ON trip_expenses;

-- Create trigger on trip_expenses UPDATE
CREATE TRIGGER trigger_handle_driver_ledger_on_expense_update
AFTER UPDATE ON trip_expenses
FOR EACH ROW
EXECUTE FUNCTION handle_driver_ledger_on_expense_update();
