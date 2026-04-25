# Truck Arrival Modal Enhancement

## Overview

The Truck Arrival Modal has been enhanced to include a new "Actual Travelled Km" field that allows operators to record the actual distance travelled by a vehicle during a trip.

## Changes Made

### 1. Form Field Addition

**Field Name:** "Actual Travelled Km"
- **Type:** Number input
- **Required:** Yes (marked with red asterisk)
- **Min Value:** 0
- **Step:** 0.01 (allows decimal precision)
- **Position:** After "Closing Odometer" field
- **Icon:** Gauge (distance icon)

### 2. Form Interface Update

```typescript
interface ArrivalForm {
  arrival_datetime: string;
  closing_odometer: string;
  actual_travelled_km: string;  // NEW FIELD
  pod_file: File | null;
}
```

### 3. Form Validation

Added validation for the new field:
- Checks if value is provided
- Validates it's a valid number
- Ensures value is not negative (>= 0)
- Shows error message: "Valid actual travelled km is required"

### 4. Error Handling

```typescript
interface FormErrors {
  arrival_datetime?: string;
  closing_odometer?: string;
  actual_travelled_km?: string;  // NEW ERROR FIELD
}
```

### 5. Database Update Logic

**Direct Storage** - The entered value is stored directly in `trips.actual_distance_manual_km`:

```typescript
const actualTravelledKm = Number(form.actual_travelled_km);

const { error: tripError } = await supabase
  .from('trips')
  .update({
    actual_end_datetime: new Date(form.arrival_datetime).toISOString(),
    closing_odometer: closingOdo,
    pod_file: podPath,
    trip_status: `Available at ${destination}`,
    actual_distance_manual_km: actualTravelledKm,  // Direct storage
  })
  .eq('trip_id', trip.trip_id);
```

**Key Point:** The value is stored directly **without any pre-existing calculation logic**. The user's input is the source of truth.

## UI/UX Details

### Field Styling
- **Label:** "Actual Travelled Km" with required indicator
- **Icon:** Gauge icon on the left
- **Placeholder:** "Enter actual distance travelled"
- **Styling:** Matches existing form fields with consistent error highlighting
- **Error Display:** Red border and error message with alert icon

### Form Flow

1. User enters "Arrival Date & Time"
2. User enters "Closing Odometer" reading
3. **User enters "Actual Travelled Km"** (NEW)
4. User optionally uploads POD document
5. User clicks "Confirm Arrival"

All three fields are required for successful submission.

## Validation Order

```
1. Arrival Date & Time - Required
2. Closing Odometer - Required, must be > opening odometer
3. Actual Travelled Km - Required, must be >= 0 ← NEW
4. All validations must pass before save
```

## Database Field Mapping

| Form Field | Database Column | Data Type | Notes |
|---|---|---|---|
| Actual Travelled Km | `trips.actual_distance_manual_km` | numeric | Stores user input directly |

## Example Usage

### Scenario: Trip Completion

```
Trip Details:
├─ Vehicle: MH12AB1234
├─ Driver: John Doe
├─ Opening Odometer: 5000 km
└─ Route: Mumbai to Bangalore

Truck Arrival Form:
├─ Arrival Date & Time: 2026-04-25 18:30
├─ Closing Odometer: 5328
└─ Actual Travelled Km: 328 ← User enters actual distance

Result:
└─ trips.actual_distance_manual_km = 328
```

## Implementation Details

### File Modified
- `/src/components/trips/TruckArrivalModal.tsx`

### Changes Summary
1. Added `actual_travelled_km` to `ArrivalForm` interface
2. Added `actual_travelled_km` error field to `FormErrors` interface
3. Initialize form state with empty `actual_travelled_km`
4. Added validation logic for the new field
5. Updated `handleSave()` to read and store the value directly
6. Added form UI field with proper styling and error handling

### Backwards Compatibility
- ✓ Existing trips unaffected
- ✓ Old actual_distance_manual_km values preserved
- ✓ New field is optional for existing workflows (but required when modal is used)

## Testing

### Manual Test Cases

#### Test 1: Valid Input
```
Arrival Date: 2026-04-25 18:30
Closing Odometer: 5328
Actual Travelled Km: 328
Expected: Save successful, actual_distance_manual_km = 328
```

#### Test 2: Missing Actual Travelled Km
```
Arrival Date: 2026-04-25 18:30
Closing Odometer: 5328
Actual Travelled Km: (empty)
Expected: Validation error - "Valid actual travelled km is required"
```

#### Test 3: Invalid Value (Negative)
```
Arrival Date: 2026-04-25 18:30
Closing Odometer: 5328
Actual Travelled Km: -50
Expected: Validation error - "Valid actual travelled km is required"
```

#### Test 4: Invalid Value (Non-numeric)
```
Arrival Date: 2026-04-25 18:30
Closing Odometer: 5328
Actual Travelled Km: abc
Expected: Validation error - "Valid actual travelled km is required"
```

#### Test 5: Decimal Precision
```
Arrival Date: 2026-04-25 18:30
Closing Odometer: 5328.75
Actual Travelled Km: 328.75
Expected: Save successful, actual_distance_manual_km = 328.75
```

## Query Examples

### Get trips with manually entered distance

```sql
SELECT 
  trip_number,
  vehicle_number_text,
  actual_distance_manual_km,
  closing_odometer - opening_odometer as calculated_distance,
  CASE 
    WHEN actual_distance_manual_km != (closing_odometer - opening_odometer) 
    THEN 'Discrepancy' 
    ELSE 'Match' 
  END as verification
FROM trips
WHERE actual_distance_manual_km IS NOT NULL
ORDER BY created_at DESC;
```

### Get trips where manual distance differs from calculated

```sql
SELECT 
  trip_number,
  actual_distance_manual_km,
  (closing_odometer - opening_odometer) as calculated_distance,
  actual_distance_manual_km - (closing_odometer - opening_odometer) as difference
FROM trips
WHERE actual_distance_manual_km IS NOT NULL
AND actual_distance_manual_km != (closing_odometer - opening_odometer)
ORDER BY ABS(difference) DESC;
```

## Notes

- The value entered in "Actual Travelled Km" is stored directly without any calculation
- Users can enter any value >= 0; it doesn't need to match the calculated distance (closing_odometer - opening_odometer)
- This allows for flexibility in recording actual distance travelled for various scenarios:
  - GPS-based accurate measurements
  - Driver-provided manual readings
  - Corrected distance after reconciliation
  - Alternative routing or actual path taken

## Build Status

✓ Build successful - No compilation errors
✓ All TypeScript types validated
✓ Form validation logic working
✓ Database update logic configured

## Deployment Notes

- No database schema changes required
- Field uses existing `actual_distance_manual_km` column
- No migration needed
- Fully backwards compatible
