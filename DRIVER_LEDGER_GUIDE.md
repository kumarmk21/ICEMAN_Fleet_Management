# Driver Ledger System - Implementation Guide

## Overview

The Driver Ledger table tracks all financial transactions between the company and drivers, including advances, expense reimbursements, and running balances.

## Table Structure

```sql
CREATE TABLE driver_ledger (
  ledger_id uuid PRIMARY KEY,
  driver_id uuid NOT NULL (FK to drivers),
  trip_id uuid (FK to trips),
  trip_expense_id uuid (FK to trip_expenses),
  transaction_type text ('ADVANCE' | 'EXPENSE_REIMBURSEMENT' | 'REVERSAL' | 'MANUAL_ADJUSTMENT'),
  amount decimal(12,2),
  description text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid (FK to auth.users),
  updated_by uuid (FK to auth.users)
);
```

## Transaction Types

### ADVANCE
- **Direction:** Debit (company pays driver)
- **Effect on Balance:** Negative (increases what driver owes to company)
- **Use Case:** Advance paid during trip creation
- **Formula:** `balance -= amount`

### EXPENSE_REIMBURSEMENT
- **Direction:** Credit (company reimburses driver expense)
- **Effect on Balance:** Positive (increases what company owes driver)
- **Use Case:** Expenses incurred by driver during trip
- **Formula:** `balance += amount`

### REVERSAL
- **Direction:** Reverses a previous ADVANCE
- **Effect on Balance:** Positive (reduces what driver owes)
- **Use Case:** Correcting double-entry errors
- **Formula:** `balance -= amount`

### MANUAL_ADJUSTMENT
- **Direction:** Manual adjustment by accounts team
- **Effect on Balance:** Positive (company adjustment to driver account)
- **Use Case:** Settlements, corrections, or adjustments
- **Formula:** `balance += amount`

## Balance Calculation Logic

```
Current Balance = 
  SUM(EXPENSE_REIMBURSEMENT) + SUM(MANUAL_ADJUSTMENT) - SUM(ADVANCE) - SUM(REVERSAL)
```

### Balance Interpretation
- **Positive Balance:** Company owes the driver this amount
- **Negative Balance:** Driver owes the company this amount
- **Zero Balance:** Account is settled

## Sample INSERT Statements

### 1. Record Advance During Trip Creation

```sql
-- When a trip is created with advance_to_driver = 5000
INSERT INTO driver_ledger (
  driver_id,
  trip_id,
  transaction_type,
  amount,
  description,
  notes,
  created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- driver_id
  '660e8400-e29b-41d4-a716-446655440001'::uuid,  -- trip_id
  'ADVANCE',
  5000.00,
  'Advance for Trip TR1001: Mumbai to Bangalore',
  'Advance paid via NEFT',
  '770e8400-e29b-41d4-a716-446655440002'::uuid   -- created_by (user_id)
);
```

### 2. Record Expense Reimbursement

```sql
-- When an expense is added to a trip (e.g., toll, fuel, repair)
INSERT INTO driver_ledger (
  driver_id,
  trip_id,
  trip_expense_id,
  transaction_type,
  amount,
  description,
  notes,
  created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- driver_id
  '660e8400-e29b-41d4-a716-446655440001'::uuid,  -- trip_id
  '880e8400-e29b-41d4-a716-446655440003'::uuid,  -- trip_expense_id
  'EXPENSE_REIMBURSEMENT',
  2500.00,
  'Toll expense: Mumbai Toll Plaza',
  'Toll receipt #T123456',
  '770e8400-e29b-41d4-a716-446655440002'::uuid   -- created_by
);
```

### 3. Record Reversal (Error Correction)

```sql
-- Reverse a double-entry advance
INSERT INTO driver_ledger (
  driver_id,
  transaction_type,
  amount,
  description,
  notes,
  created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'REVERSAL',
  5000.00,
  'Reversal: Duplicate advance entry for Trip TR1001',
  'Correcting double entry error',
  '770e8400-e29b-41d4-a716-446655440002'::uuid
);
```

### 4. Manual Adjustment (Settlement/Correction)

```sql
-- Manual settlement or correction by accounts
INSERT INTO driver_ledger (
  driver_id,
  transaction_type,
  amount,
  description,
  notes,
  created_by
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'MANUAL_ADJUSTMENT',
  3500.00,
  'Settlement adjustment per accounts reconciliation',
  'Accounts team approved adjustment',
  '770e8400-e29b-41d4-a716-446655440002'::uuid
);
```

## SQL Queries

### 1. Get Current Balance for a Driver

```sql
-- Using the helper function (recommended for performance)
SELECT get_driver_balance('550e8400-e29b-41d4-a716-446655440000'::uuid) as current_balance;

-- Result: -2500.00 (driver owes company 2500)
```

### 2. Get Driver Ledger Summary

```sql
-- Comprehensive summary using helper function
SELECT * FROM get_driver_ledger_summary('550e8400-e29b-41d4-a716-446655440000'::uuid);

-- Result:
-- driver_id: 550e8400-e29b-41d4-a716-446655440000
-- total_advances: 5000.00
-- total_reimbursements: 2500.00
-- current_balance: -2500.00 (company has received more, driver owes 2500)
-- last_transaction_date: 2026-04-25 10:30:00+00
-- total_entries: 3
```

### 3. Get All Transactions for a Driver

```sql
SELECT 
  ledger_id,
  transaction_type,
  amount,
  description,
  created_at,
  CASE 
    WHEN transaction_type = 'ADVANCE' THEN -amount
    WHEN transaction_type = 'EXPENSE_REIMBURSEMENT' THEN amount
    WHEN transaction_type = 'REVERSAL' THEN -amount
    WHEN transaction_type = 'MANUAL_ADJUSTMENT' THEN amount
  END as balance_impact
FROM driver_ledger
WHERE driver_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
ORDER BY created_at DESC;
```

### 4. Get Running Balance for All Drivers

```sql
SELECT 
  d.driver_id,
  d.driver_name,
  get_driver_balance(d.driver_id) as current_balance
FROM drivers d
WHERE d.status = 'Active'
ORDER BY current_balance DESC;
```

### 5. Drivers with Pending Advances (Negative Balance)

```sql
SELECT 
  d.driver_id,
  d.driver_name,
  get_driver_balance(d.driver_id) as amount_owed_to_company
FROM drivers d
WHERE get_driver_balance(d.driver_id) < 0
AND d.status = 'Active'
ORDER BY get_driver_balance(d.driver_id) ASC;
```

### 6. Company Liability to Drivers (Positive Balance)

```sql
SELECT 
  d.driver_id,
  d.driver_name,
  get_driver_balance(d.driver_id) as company_owes_driver
FROM drivers d
WHERE get_driver_balance(d.driver_id) > 0
AND d.status = 'Active'
ORDER BY get_driver_balance(d.driver_id) DESC;
```

### 7. Ledger Reconciliation by Trip

```sql
SELECT 
  t.trip_number,
  d.driver_name,
  SUM(CASE WHEN dl.transaction_type = 'ADVANCE' THEN dl.amount ELSE 0 END) as advance,
  SUM(CASE WHEN dl.transaction_type = 'EXPENSE_REIMBURSEMENT' THEN dl.amount ELSE 0 END) as reimbursement,
  SUM(CASE 
    WHEN dl.transaction_type = 'ADVANCE' THEN -dl.amount
    WHEN dl.transaction_type = 'EXPENSE_REIMBURSEMENT' THEN dl.amount
  END) as net_for_trip
FROM driver_ledger dl
INNER JOIN trips t ON t.trip_id = dl.trip_id
INNER JOIN drivers d ON d.driver_id = dl.driver_id
WHERE t.trip_id = '660e8400-e29b-41d4-a716-446655440001'::uuid
GROUP BY t.trip_number, d.driver_name;
```

## Integration Points - Automatic Triggers

### 1. Trip Creation (AUTOMATIC)
**Trigger:** `trigger_insert_driver_ledger_on_trip`

When a trip is created with `advance_to_driver > 0`:
- Automatically inserts ADVANCE entry in driver_ledger
- Captures trip_number, origin, destination in description
- Uses `created_by` from the trip record
- **Soft-fail:** Errors don't break trip creation (logged as warnings)

```sql
-- Example triggered entry:
INSERT INTO driver_ledger (
  driver_id, trip_id, transaction_type, amount,
  description, notes, created_by
) VALUES (
  $1, $2, 'ADVANCE', $3,
  'Advance for Trip TR1001: Mumbai to Bangalore',
  'Auto-created on trip creation. Payment via Diesel Card',
  $4
)
```

### 2. Trip Advance Update (AUTOMATIC)
**Trigger:** `trigger_handle_driver_ledger_on_trip_advance_update`

When a trip's `advance_to_driver` is modified:
- **Advance Increased:** Creates new ADVANCE entry for the difference
- **Advance Decreased:** Creates REVERSAL entry to reduce balance
- Maintains ledger immutability through new entries

### 3. Trip Expense Creation (AUTOMATIC)
**Trigger:** `trigger_insert_driver_ledger_on_trip_expense`

When an expense is added to a trip:
- Automatically inserts EXPENSE_REIMBURSEMENT entry
- Links trip_expense_id for traceability
- Captures expense head name in description
- Works even if trip has no advance

```sql
-- Example triggered entry:
INSERT INTO driver_ledger (
  driver_id, trip_id, trip_expense_id,
  transaction_type, amount, description, created_by
) VALUES (
  $1, $2, $3,
  'EXPENSE_REIMBURSEMENT', $4,
  'Toll for Trip TR1001',
  $5
)
```

### 4. Trip Expense Amount Update (AUTOMATIC)
**Trigger:** `trigger_handle_driver_ledger_on_expense_update`

When a trip expense amount is modified:
- **Amount Increased:** Creates EXPENSE_REIMBURSEMENT entry for the difference
- **Amount Decreased:** Creates REVERSAL entry to reduce the reimbursement
- Tracks old vs. new amount in notes

### 5. Accounts Settlement (MANUAL)
Accounts team can manually insert MANUAL_ADJUSTMENT or REVERSAL entries:
```sql
INSERT INTO driver_ledger (
  driver_id, transaction_type, amount,
  description, notes, created_by
) VALUES (...)
```

## Best Practices

1. **Immutable Records:** Never delete ledger entries. Use REVERSAL to correct errors.
2. **Audit Trail:** Always capture `created_by` and update `updated_by` for accountability.
3. **Link to Source:** Always link `trip_id` or `trip_expense_id` when applicable for traceability.
4. **Balance Queries:** Use the helper functions for better performance than ad-hoc aggregations.
5. **Regular Reconciliation:** Run balance queries monthly and reconcile with driver payments.
6. **Description Field:** Always populate with meaningful transaction description for audit trail.

## Performance Considerations

- Indexes on `(driver_id, transaction_type)` optimize balance calculations
- Helper functions use `SECURITY DEFINER` to bypass RLS for efficiency
- Consider materialized view for frequently accessed balance data if volume is high
- Ledger is append-only, so no cleanup needed

## RLS Security

- **Admin & Accounts:** Can insert new entries and view all entries
- **Fleet Manager:** Can view all entries
- **Operations Executive:** Can view entries for drivers on their trips
- **No Delete:** Deletion is prevented for all roles to maintain immutability

## Example Transaction Workflow

```
1. Trip TR1001 created with advance_to_driver = 5000
   → INSERT ADVANCE entry (-5000 impact)
   → Balance: -5000 (driver owes 5000)

2. Trip expense added: Toll 2000
   → INSERT EXPENSE_REIMBURSEMENT entry (+2000 impact)
   → Balance: -3000 (driver still owes 3000)

3. Trip expense added: Repair 1500
   → INSERT EXPENSE_REIMBURSEMENT entry (+1500 impact)
   → Balance: -1500 (driver still owes 1500)

4. Settlement: Driver paid 1500
   → INSERT MANUAL_ADJUSTMENT entry (+1500 impact)
   → Balance: 0 (settled)
```

## How It Works - Complete Flow

### Trip Creation Flow
```
1. User creates trip with advance_to_driver = 5000
2. Trip record inserted into trips table
3. Trigger fires: trigger_insert_driver_ledger_on_trip
4. Driver ledger ADVANCE entry auto-created
5. Balance becomes: -5000 (driver owes company)
```

### Trip Expense Flow
```
1. User adds trip expense (toll 2000)
2. Expense record inserted into trip_expenses table
3. Trigger fires: trigger_insert_driver_ledger_on_trip_expense
4. Driver ledger EXPENSE_REIMBURSEMENT entry auto-created
5. Balance updates: -5000 + 2000 = -3000
```

### Advance Modification Flow
```
1. User updates trip advance from 5000 to 7000
2. Trip record updated
3. Trigger fires: trigger_handle_driver_ledger_on_trip_advance_update
4. Driver ledger ADVANCE entry for 2000 difference auto-created
5. Balance updates: -5000 - 2000 = -7000
```

## Troubleshooting

### Ledger Entry Not Created After Trip Creation
- Check trip has `driver_id` and `advance_to_driver > 0`
- View database logs for trigger warnings
- Verify `driver_id` exists in drivers table
- Check RLS policies on driver_ledger table

### Query Shows Wrong Balance
- Verify all transactions are properly linked via `trip_id`
- Check `transaction_type` values are valid (ADVANCE, EXPENSE_REIMBURSEMENT, REVERSAL, MANUAL_ADJUSTMENT)
- Run `SELECT * FROM driver_ledger WHERE driver_id = ?` to inspect raw data
- Verify trigger functions executed: check database activity logs

### Cannot Insert Manual Ledger Entry
- Check user has 'Admin' or 'Accounts' role
- Verify `created_by` is set to current user
- Confirm `driver_id` exists in drivers table
- Ensure `amount > 0`

### Performance Issues with Balance Queries
- Use helper functions instead of raw aggregations: `SELECT get_driver_balance(driver_id)`
- Consider materialized view if querying high-volume datasets
- Check indexes are in place: `idx_driver_ledger_driver_type`
- Profile query execution time with EXPLAIN ANALYZE

### Trigger Not Firing
- Check trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_%driver%'`
- Verify trigger function exists: `SELECT * FROM pg_proc WHERE proname LIKE '%driver_ledger%'`
- Check for RLS blocking (triggers use SECURITY DEFINER to bypass)
- Review database logs for any errors during trigger execution
