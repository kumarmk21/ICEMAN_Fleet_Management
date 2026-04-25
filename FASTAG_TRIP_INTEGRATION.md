# FastTag Trip Integration - Implementation Guide

## Overview

The FastTag Trip Integration system automatically links FastTag information from selected vehicles to trip records, enabling better tracking and reporting of FastTag usage across vehicle assignments.

## Status: COMPLETE & ACTIVE ✓

### What Was Implemented

#### 1. Database Schema Enhancement
- **New Column:** `fast_tag_id` added to `trips` table
  - Data Type: `uuid` (nullable)
  - Foreign Key: References `fast_tags_master(fast_tag_id)`
  - Constraint: ON DELETE SET NULL (allows vehicle/tag removal without breaking trip)

#### 2. Automatic Trigger System

Two triggers are now ACTIVE and functional:

##### Trigger 1: `trigger_populate_fast_tag_on_trip_vehicle_select`
**Event:** BEFORE INSERT on trips table
**Condition:** Always fires on trip creation
**Action:** Automatically populates `fast_tag_id` from selected vehicle

```sql
When: Trip created with vehicle_id
Then: Query vehicle → Fetch fast_tag_id → Insert into trip
Example: Select Vehicle "MH12AB1234" with FastTag ABC123 
         → Trip.fast_tag_id automatically set to ABC123's ID
```

##### Trigger 2: `trigger_populate_fast_tag_on_trip_update`
**Event:** BEFORE UPDATE on trips table
**Condition:** Fires only when `vehicle_id` changes
**Action:** Updates `fast_tag_id` to match new vehicle's FastTag

```sql
When: Trip vehicle changed mid-trip
Then: Query new vehicle → Fetch fast_tag_id → Update trip record
Example: Change vehicle from MH12AB1234 to MH14XY5678 with different FastTag
         → Trip.fast_tag_id automatically updated
```

#### 3. Performance Optimization
Two indexes created for optimal query performance:
- `idx_trips_fast_tag_id` — Fast lookup by FastTag
- `idx_trips_vehicle_fast_tag` — Optimized vehicle-FastTag join queries

## How It Works

### Automatic Population Flow

```
Step 1: User Creates Trip in UI
  ├─ Selects vehicle from dropdown (e.g., "MH12AB1234")
  └─ Submits trip form

Step 2: Trip Record Inserted into Database
  └─ INSERT INTO trips (..., vehicle_id = 'vehicle-uuid', ...)

Step 3: Trigger Fires (BEFORE INSERT)
  ├─ Trigger function reads vehicle_id from NEW trip
  ├─ Queries vehicles table for that vehicle_id
  ├─ Retrieves fast_tag_id from vehicle record
  └─ Sets NEW.fast_tag_id before row is inserted

Step 4: Trip Row Inserted with fast_tag_id
  └─ INSERT completes with fast_tag_id automatically populated
  
Result: Trip now has fast_tag_id linked for reporting/tracking
```

### Vehicle Change Flow (During Trip Execution)

```
Step 1: Trip Vehicle Changed (e.g., breakdown, reassignment)
  └─ UPDATE trips SET vehicle_id = 'new-vehicle-uuid' WHERE trip_id = ?

Step 2: Trigger Fires (BEFORE UPDATE, if vehicle_id changed)
  ├─ Trigger detects vehicle_id is different
  ├─ Queries NEW vehicle for its fast_tag_id
  ├─ Updates fast_tag_id to match new vehicle
  └─ Update completes

Result: Trip's fast_tag_id now reflects reassigned vehicle's FastTag
```

## No Frontend Changes Required

**Key Point:** The trigger handles everything automatically at the database level.

- ✓ TripModal doesn't need to send `fast_tag_id`
- ✓ No changes to trip creation logic
- ✓ No changes to trip update logic
- ✓ No changes to vehicle selection code
- ✓ Works transparently with existing code

The database trigger intercepts every trip INSERT/UPDATE and populates the field before the data is persisted.

## SQL Operations

### 1. Check if fast_tag_id is populated

```sql
SELECT trip_id, trip_number, vehicle_id, fast_tag_id
FROM trips
WHERE trip_id = 'your-trip-id';

-- Result: fast_tag_id will be populated if vehicle has a FastTag
```

### 2. Get trips by FastTag

```sql
SELECT t.trip_number, t.origin, t.destination, v.vehicle_number, ft.wallet_id
FROM trips t
LEFT JOIN vehicles v ON v.vehicle_id = t.vehicle_id
LEFT JOIN fast_tags_master ft ON ft.fast_tag_id = t.fast_tag_id
WHERE t.fast_tag_id = 'specific-fasttag-id'
ORDER BY t.created_at DESC;
```

### 3. Find trips without FastTag (manual vehicles)

```sql
SELECT t.trip_number, v.vehicle_number
FROM trips t
LEFT JOIN vehicles v ON v.vehicle_id = t.vehicle_id
WHERE t.fast_tag_id IS NULL
AND t.vehicle_id IS NOT NULL
ORDER BY t.created_at DESC;
```

### 4. FastTag usage summary by trip

```sql
SELECT 
  ft.wallet_id,
  ft.provider,
  ft.balance,
  COUNT(t.trip_id) as trip_count,
  MIN(t.created_at) as first_trip,
  MAX(t.created_at) as last_trip
FROM trips t
INNER JOIN fast_tags_master ft ON ft.fast_tag_id = t.fast_tag_id
GROUP BY ft.fast_tag_id, ft.wallet_id, ft.provider, ft.balance
ORDER BY trip_count DESC;
```

### 5. Current fast_tag_id value for a vehicle

```sql
SELECT vehicle_number, fast_tag_id
FROM vehicles
WHERE vehicle_number = 'MH12AB1234';
```

## Data Integrity & Error Handling

### Safe Deletion
If a FastTag is deleted from `fast_tags_master`:
- Foreign key constraint with ON DELETE SET NULL
- Affected trip records have `fast_tag_id` set to NULL
- Trip record itself is NOT deleted
- Historical data remains intact

### Vehicle Without FastTag
If a vehicle has no FastTag assigned:
- Trigger populates `fast_tag_id` as NULL
- Trip still created successfully
- No errors raised

### Error Handling
If trigger encounters an error:
- Error is logged as WARNING in database logs
- Trip creation/update proceeds normally
- `fast_tag_id` left as NULL or unchanged
- Soft-fail approach prevents trip operations from breaking

## Integration Points

### 1. Trip Creation (TripModal)
```typescript
// Frontend code - NO CHANGES NEEDED
const tripData = {
  vehicle_id: selectedVehicleId,
  driver_id: selectedDriverId,
  // ... other fields
  // NOTE: Don't include fast_tag_id - trigger will populate it
};

await supabase.from('trips').insert([tripData]);
```

The trigger automatically populates `fast_tag_id` from the vehicle.

### 2. Trip Updates (TripUpdateModal)
```typescript
// If vehicle_id is changed:
await supabase
  .from('trips')
  .update({ vehicle_id: newVehicleId })
  .eq('trip_id', tripId);
```

The trigger automatically updates `fast_tag_id` to match new vehicle.

### 3. Vehicle FastTag Changes
```sql
-- If a vehicle's FastTag is changed:
UPDATE vehicles
SET fast_tag_id = 'new-fast-tag-id'
WHERE vehicle_id = 'vehicle-uuid';

-- Existing trips keep their original fast_tag_id (historical accuracy)
-- New trips with this vehicle will use the new fast_tag_id
```

## Reporting & Analytics

### Active FastTag Usage by Vehicle

```sql
SELECT 
  v.vehicle_number,
  v.vehicle_type,
  ft.wallet_id,
  ft.balance,
  COUNT(t.trip_id) as recent_trips,
  MAX(t.created_at) as last_trip_date
FROM vehicles v
LEFT JOIN fast_tags_master ft ON ft.fast_tag_id = v.fast_tag_id
LEFT JOIN trips t ON t.fast_tag_id = ft.fast_tag_id AND t.created_at > NOW() - INTERVAL '30 days'
WHERE v.status = 'Active'
GROUP BY v.vehicle_id, v.vehicle_number, v.vehicle_type, ft.fast_tag_id, ft.wallet_id, ft.balance
ORDER BY recent_trips DESC;
```

### Trip FastTag Compliance

```sql
-- Verify all trips have FastTag (if required)
SELECT 
  CASE WHEN fast_tag_id IS NULL THEN 'Missing FastTag' ELSE 'Has FastTag' END as compliance,
  COUNT(*) as trip_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM trips
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY compliance;
```

## Verification

### Check Trigger Status
```sql
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE 'trigger_populate_fast%';

-- Should return 2 rows:
-- 1. trigger_populate_fast_tag_on_trip_vehicle_select (trips, INSERT)
-- 2. trigger_populate_fast_tag_on_trip_update (trips, UPDATE)
```

### Check Index Status
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'trips'
AND indexname LIKE '%fast_tag%';

-- Should return:
-- idx_trips_fast_tag_id
-- idx_trips_vehicle_fast_tag
```

### Test Trigger Functionality
```sql
-- Create a test trip with a vehicle that has a FastTag
INSERT INTO trips (
  trip_number,
  vehicle_id,
  driver_id,
  origin,
  destination,
  planned_start_datetime,
  created_by
) VALUES (
  'TEST-' || NOW()::text,
  (SELECT vehicle_id FROM vehicles WHERE fast_tag_id IS NOT NULL LIMIT 1),
  (SELECT driver_id FROM drivers WHERE status = 'Active' LIMIT 1),
  'Test Origin',
  'Test Destination',
  NOW(),
  (SELECT id FROM auth.users LIMIT 1)
);

-- Verify fast_tag_id was populated:
SELECT trip_number, vehicle_id, fast_tag_id
FROM trips
WHERE trip_number LIKE 'TEST-%'
ORDER BY created_at DESC LIMIT 1;

-- fast_tag_id should NOT be NULL
```

## Performance Considerations

### Query Optimization
- `idx_trips_fast_tag_id` enables fast filtering by FastTag
- `idx_trips_vehicle_fast_tag` optimizes vehicle+FastTag joins
- Trigger is BEFORE INSERT/UPDATE for minimal overhead
- No additional queries needed during trip operations

### Trigger Performance
- Trigger executes in microseconds (single row lookup)
- No complex logic - just a foreign key lookup
- Scales well even with high trip volume

## Troubleshooting

### fast_tag_id Not Populated

**Symptom:** Created trip but fast_tag_id is NULL

**Causes & Solutions:**
1. **Vehicle has no FastTag** (Expected)
   - Solution: Assign FastTag to vehicle first

2. **Vehicle doesn't exist**
   - Check: Verify vehicle_id exists in vehicles table
   - Verify: vehicle_id is provided during trip creation

3. **Trigger didn't fire**
   - Check: Verify trigger exists
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name LIKE 'trigger_populate_fast%';
   ```
   - Recreate if missing:
   ```sql
   -- Re-run the migration
   ```

### Vehicle FastTag Changed But Trip Still Shows Old FastTag

**Behavior:** This is CORRECT and INTENTIONAL

**Explanation:**
- Trip records capture the FastTag at the time of creation
- Changing vehicle's FastTag doesn't retroactively update old trips
- Preserves historical accuracy of which FastTag was used
- Only NEW trips with that vehicle will use the new FastTag

**If you need to update:** Manually update the trip or delete/recreate it

### Performance Issues

**Symptom:** Slow trip creation/update

**Causes & Solutions:**
1. **Missing indexes**
   - Check: Verify indexes exist
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'trips' AND indexname LIKE '%fast_tag%';
   ```
   - Recreate if missing: Re-run migration

2. **Trigger logic issue**
   - Enable query logging to debug
   - Check database logs for trigger errors

## Migration Details

**Migration:** `add_fast_tag_id_to_trips_and_trigger`

**Changes:**
- Added `fast_tag_id` column to trips table
- Created `populate_fast_tag_id_on_trip_creation()` function
- Created 2 active triggers
- Created 2 performance indexes

**Rollback (if needed):**
```sql
-- Remove triggers
DROP TRIGGER IF EXISTS trigger_populate_fast_tag_on_trip_update ON trips;
DROP TRIGGER IF EXISTS trigger_populate_fast_tag_on_trip_vehicle_select ON trips;

-- Remove function
DROP FUNCTION IF EXISTS populate_fast_tag_id_on_trip_creation();

-- Remove indexes
DROP INDEX IF EXISTS idx_trips_vehicle_fast_tag;
DROP INDEX IF EXISTS idx_trips_fast_tag_id;

-- Remove column
ALTER TABLE trips DROP COLUMN fast_tag_id;
```

## Summary

The FastTag Trip Integration is now **fully operational** with automatic trigger-based population of FastTag data for every trip. No frontend changes needed—the database handles everything transparently.

**Key Benefits:**
- ✓ Automatic FastTag tracking at trip level
- ✓ No manual code integration needed
- ✓ Historical data preservation
- ✓ Fast query performance
- ✓ Safe error handling
- ✓ Supports vehicle changes mid-trip
