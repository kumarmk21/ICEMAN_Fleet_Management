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

## Integration Points

### 1. Trip Creation
When creating a trip with `advance_to_driver > 0`:
```sql
-- Auto-create ledger entry
INSERT INTO driver_ledger (...) VALUES (...)
```

### 2. Trip Expense Entry
When adding an expense to a trip:
```sql
-- Auto-create reimbursement ledger entry
INSERT INTO driver_ledger (
  driver_id,
  trip_id,
  trip_expense_id,
  transaction_type,
  amount,
  ...
) VALUES (...)
```

### 3. Accounts Settlement
Accounts team can manually insert MANUAL_ADJUSTMENT or REVERSAL entries.

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

## Troubleshooting

### Query Shows Wrong Balance
- Verify all transactions are properly linked via `trip_id`
- Check `transaction_type` values are valid
- Run `SELECT * FROM driver_ledger WHERE driver_id = ?` to inspect raw data

### Cannot Insert Ledger Entry
- Check user has 'Admin' or 'Accounts' role
- Verify `created_by` is set to current user
- Confirm `driver_id` exists in drivers table

### Performance Issues with Balance Queries
- Use helper functions instead of raw aggregations
- Consider materialized view if querying high-volume datasets
- Check indexes are in place: `idx_driver_ledger_driver_type`
