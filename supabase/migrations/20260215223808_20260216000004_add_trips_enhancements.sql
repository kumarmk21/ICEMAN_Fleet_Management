/*
  # Add Trip Table Enhancements
  
  1. New Fields Added
    - distance_google to routes
    - enquiry_id to trips
    - vehicle_placement_datetime (renamed from actual_start_datetime)
    - veh_departure
    - loading_tat_hrs
    - actual_distance_manual_km
    - vehicle_number_text
    - trip_closure
    - trip_closed_by
    - closing_odometer
    - trip_type
    - load_type
    - veh_cur_status to vehicles
    - trip_status to enquiries
  
  2. Purpose
    - Support full trip lifecycle from enquiry to closure
    - Track loading times and vehicle placement
    - Support market vehicles with manual entry
    - Enable trip closure workflow
*/

-- Add distance_google to routes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'distance_google'
  ) THEN
    ALTER TABLE routes ADD COLUMN distance_google numeric DEFAULT 0;
  END IF;
END $$;

-- Rename actual_start_datetime to vehicle_placement_datetime in trips
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'actual_start_datetime'
  ) THEN
    ALTER TABLE trips RENAME COLUMN actual_start_datetime TO vehicle_placement_datetime;
  END IF;
END $$;

-- Add enquiry_id to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'enquiry_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN enquiry_id uuid REFERENCES enquiries(enquiry_id);
    CREATE INDEX IF NOT EXISTS idx_trips_enquiry_id ON trips(enquiry_id);
  END IF;
END $$;

-- Add veh_departure to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'veh_departure'
  ) THEN
    ALTER TABLE trips ADD COLUMN veh_departure timestamptz;
  END IF;
END $$;

-- Add loading_tat_hrs to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'loading_tat_hrs'
  ) THEN
    ALTER TABLE trips ADD COLUMN loading_tat_hrs decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add actual_distance_manual_km to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'actual_distance_manual_km'
  ) THEN
    ALTER TABLE trips ADD COLUMN actual_distance_manual_km decimal(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add vehicle_number_text to trips (for market vehicles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'vehicle_number_text'
  ) THEN
    ALTER TABLE trips ADD COLUMN vehicle_number_text text DEFAULT '';
  END IF;
END $$;

-- Add trip_closure fields to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'trip_closure'
  ) THEN
    ALTER TABLE trips ADD COLUMN trip_closure timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'trip_closed_by'
  ) THEN
    ALTER TABLE trips ADD COLUMN trip_closed_by text;
  END IF;
END $$;

-- Add closing_odometer to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'closing_odometer'
  ) THEN
    ALTER TABLE trips ADD COLUMN closing_odometer numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add trip_type to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'trip_type'
  ) THEN
    ALTER TABLE trips ADD COLUMN trip_type text DEFAULT 'Single' CHECK (trip_type IN ('Single', 'Milk Run'));
  END IF;
END $$;

-- Add load_type to trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'load_type'
  ) THEN
    ALTER TABLE trips ADD COLUMN load_type text CHECK (load_type IN ('Reefer-Chilled', 'Reefer-Ambient', 'Dry', 'Empty'));
  END IF;
END $$;

-- Add veh_cur_status to vehicles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'veh_cur_status'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN veh_cur_status text DEFAULT 'Free';
  END IF;
END $$;

-- Add trip_status to enquiries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enquiries' AND column_name = 'trip_status'
  ) THEN
    ALTER TABLE enquiries ADD COLUMN trip_status text CHECK (trip_status IN ('Planned', 'In Transit', 'Completed', 'Closed', 'Cancelled'));
  END IF;
END $$;

-- Make vehicle_id and driver_id nullable in trips (for market vehicles and trips without assigned drivers)
ALTER TABLE trips ALTER COLUMN vehicle_id DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN driver_id DROP NOT NULL;