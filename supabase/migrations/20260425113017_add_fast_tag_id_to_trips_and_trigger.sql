/*
  # Add FastTag Support to Trips

  ## Purpose
  Enable tracking of FastTag information at the trip level by:
  1. Adding fast_tag_id column to trips table
  2. Creating automatic trigger to populate fast_tag_id from selected vehicle
  3. Linking trip-level FastTag data for reporting and compliance

  ## Changes
  - `trips` table: Add `fast_tag_id` column (uuid, nullable, FK to fast_tags_master)
  - Create trigger function: `populate_fast_tag_id_on_trip_creation()`
  - Create triggers: On INSERT and UPDATE when vehicle_id changes

  ## Design Rationale
  - Denormalizes fast_tag_id at trip level for faster queries
  - Reduces need for vehicle JOIN when analyzing trip-level FastTag usage
  - Trigger ensures consistency: trip always reflects vehicle's current FastTag
  - Nullable to support trips without vehicles or vehicles without FastTags
  - Works with vehicle updates: trigger fires on vehicle_id changes
  - Foreign key to fast_tags_master ensures data integrity

  ## Data Integrity
  - Foreign key constraint ensures fast_tag_id references valid fast_tags_master record
  - ON DELETE SET NULL: If vehicle/fastTag removed, trip reference becomes null
  - Trigger handles NULL vehicles gracefully
  - Soft-fail approach: errors logged but don't break trip creation
*/

-- Step 1: Add fast_tag_id column to trips table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'fast_tag_id'
  ) THEN
    ALTER TABLE trips
    ADD COLUMN fast_tag_id uuid REFERENCES fast_tags_master(fast_tag_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Create trigger function to populate fast_tag_id from vehicle
CREATE OR REPLACE FUNCTION populate_fast_tag_id_on_trip_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_fast_tag_id uuid;
  v_error_msg TEXT;
BEGIN
  -- Only process if vehicle_id is provided
  IF NEW.vehicle_id IS NOT NULL THEN
    BEGIN
      -- Get fast_tag_id from the selected vehicle
      SELECT fast_tag_id
      INTO v_fast_tag_id
      FROM vehicles
      WHERE vehicle_id = NEW.vehicle_id;

      -- Set the fast_tag_id (will be NULL if vehicle has no fast_tag)
      NEW.fast_tag_id := v_fast_tag_id;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail trip creation
      RAISE WARNING 'Failed to populate fast_tag_id for trip %: %', NEW.trip_id, SQLERRM;
      -- Leave fast_tag_id as NULL
      NEW.fast_tag_id := NULL;
    END;
  ELSE
    -- No vehicle selected, set fast_tag_id to NULL
    NEW.fast_tag_id := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Drop existing trigger if present to avoid conflicts
DROP TRIGGER IF EXISTS trigger_populate_fast_tag_on_trip_vehicle_select ON trips;

-- Step 4: Create trigger on INSERT for new trips
-- This trigger fires BEFORE INSERT to populate fast_tag_id from the selected vehicle
CREATE TRIGGER trigger_populate_fast_tag_on_trip_vehicle_select
BEFORE INSERT ON trips
FOR EACH ROW
EXECUTE FUNCTION populate_fast_tag_id_on_trip_creation();

-- Step 5: Also handle trip UPDATEs when vehicle_id changes
-- This ensures if vehicle is changed after trip creation, fast_tag_id is updated
DROP TRIGGER IF EXISTS trigger_populate_fast_tag_on_trip_update ON trips;

CREATE TRIGGER trigger_populate_fast_tag_on_trip_update
BEFORE UPDATE ON trips
FOR EACH ROW
WHEN (OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id)
EXECUTE FUNCTION populate_fast_tag_id_on_trip_creation();

-- Step 6: Create index on fast_tag_id for faster queries and reporting
CREATE INDEX IF NOT EXISTS idx_trips_fast_tag_id ON trips(fast_tag_id);

-- Step 7: Create index on vehicle_id and fast_tag_id together for common join patterns
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_fast_tag ON trips(vehicle_id, fast_tag_id);
