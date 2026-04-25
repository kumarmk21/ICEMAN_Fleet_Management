/*
  # Handle Driver Ledger for Trip Advance Updates

  ## Purpose
  When a trip's advance_to_driver amount is modified, adjust the ledger accordingly.
  Creates reversal/new entries to maintain accurate balance without modifying existing entries.

  ## Logic
  - If advance increased: Insert EXPENSE_REIMBURSEMENT for difference
  - If advance decreased: Insert REVERSAL for difference
  - Ensures ledger immutability through new entries
*/

-- Create function to handle trip advance updates
CREATE OR REPLACE FUNCTION handle_driver_ledger_on_trip_advance_update()
RETURNS TRIGGER AS $$
DECLARE
  v_difference decimal;
  v_transaction_type text;
  v_error_msg TEXT;
BEGIN
  -- Only process if advance_to_driver changed
  IF NEW.advance_to_driver = OLD.advance_to_driver THEN
    RETURN NEW;
  END IF;

  -- Only process if driver_id exists
  IF NEW.driver_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_difference := NEW.advance_to_driver - OLD.advance_to_driver;

  BEGIN
    IF v_difference > 0 THEN
      -- Advance increased: this is additional advance (negative balance impact)
      v_transaction_type := 'ADVANCE';
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
        v_transaction_type,
        v_difference,
        'Additional advance for Trip ' || NEW.trip_number,
        'Advance increased from ' || OLD.advance_to_driver::text || ' to ' || NEW.advance_to_driver::text,
        NEW.updated_by,
        NEW.updated_by
      );
    ELSE
      -- Advance decreased: this is a reversal of part of the advance
      v_transaction_type := 'REVERSAL';
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
        v_transaction_type,
        ABS(v_difference),
        'Advance reduction for Trip ' || NEW.trip_number,
        'Advance decreased from ' || OLD.advance_to_driver::text || ' to ' || NEW.advance_to_driver::text,
        NEW.updated_by,
        NEW.updated_by
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log but don't fail the trip update
    RAISE WARNING 'Failed to create driver ledger entry for trip advance update %: %', NEW.trip_id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_handle_driver_ledger_on_trip_advance_update ON trips;

-- Create trigger on trips UPDATE for advance changes
CREATE TRIGGER trigger_handle_driver_ledger_on_trip_advance_update
AFTER UPDATE ON trips
FOR EACH ROW
WHEN (OLD.advance_to_driver IS DISTINCT FROM NEW.advance_to_driver)
EXECUTE FUNCTION handle_driver_ledger_on_trip_advance_update();
