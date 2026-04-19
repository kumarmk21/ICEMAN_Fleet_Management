/*
  # Add Approval Workflow to Trip Expenses

  ## Summary
  Adds approval tracking columns to the trip_expenses table to support
  a manager-level review process for expense entries.

  ## New Columns
  - `approval_status` — workflow state: 'pending' (default), 'approved', 'rejected'
  - `approved_by` — UUID of the user who actioned the approval
  - `approved_at` — timestamp of approval/rejection
  - `approval_remarks` — optional notes from the approver

  ## Notes
  - All existing rows default to 'pending' so they surface in the approval queue
  - A check constraint enforces valid status values
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_expenses' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE trip_expenses
      ADD COLUMN approval_status text NOT NULL DEFAULT 'pending'
        CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_expenses' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE trip_expenses ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_expenses' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE trip_expenses ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_expenses' AND column_name = 'approval_remarks'
  ) THEN
    ALTER TABLE trip_expenses ADD COLUMN approval_remarks text DEFAULT '';
  END IF;
END $$;
