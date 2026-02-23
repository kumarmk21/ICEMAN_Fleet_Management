/*
  # Remove Unused Indexes - Performance Optimization

  ## Performance Optimizations
  
  Drop indexes that are not being used by queries to reduce storage overhead
  and improve write performance. These can be recreated later if needed.
  
  Indexes to be removed:
  - Trip-related indexes (8 indexes)
  - Trip stops indexes (3 indexes)
  - Trip expenses indexes (4 indexes)
  - Fuel transaction indexes (4 indexes)
  - Maintenance indexes (3 indexes)
  - Enquiry indexes (3 indexes)
  - Vehicle document indexes (2 indexes)
  - City/State indexes (6 indexes)
  - Other miscellaneous indexes (3 indexes)
  
  Total: 36 unused indexes removed
*/

-- Drop unused trip-related indexes
DROP INDEX IF EXISTS public.idx_trips_enquiry_id;
DROP INDEX IF EXISTS public.idx_trips_vehicle_id;
DROP INDEX IF EXISTS public.idx_trips_driver_id;
DROP INDEX IF EXISTS public.idx_trips_status;
DROP INDEX IF EXISTS public.idx_trips_dates;
DROP INDEX IF EXISTS public.idx_trips_created_by;
DROP INDEX IF EXISTS public.idx_trips_customer_id;
DROP INDEX IF EXISTS public.idx_trips_route_id;

-- Drop unused trip_stops indexes
DROP INDEX IF EXISTS public.idx_trip_stops_trip_id;
DROP INDEX IF EXISTS public.idx_trip_stops_sequence;
DROP INDEX IF EXISTS public.idx_trip_stops_city_id;

-- Drop unused trip_expenses indexes
DROP INDEX IF EXISTS public.idx_trip_expenses_trip_id;
DROP INDEX IF EXISTS public.idx_trip_expenses_created_by;
DROP INDEX IF EXISTS public.idx_trip_expenses_expense_head_id;
DROP INDEX IF EXISTS public.idx_trip_expenses_vendor_id;

-- Drop unused fuel_transactions indexes
DROP INDEX IF EXISTS public.idx_fuel_transactions_vehicle_id;
DROP INDEX IF EXISTS public.idx_fuel_transactions_created_by;
DROP INDEX IF EXISTS public.idx_fuel_transactions_trip_id;
DROP INDEX IF EXISTS public.idx_fuel_transactions_vendor_id;

-- Drop unused maintenance_jobs indexes
DROP INDEX IF EXISTS public.idx_maintenance_jobs_vehicle_id;
DROP INDEX IF EXISTS public.idx_maintenance_jobs_created_by;
DROP INDEX IF EXISTS public.idx_maintenance_jobs_workshop_vendor_id;

-- Drop unused tyres index
DROP INDEX IF EXISTS public.idx_tyres_vehicle_id;

-- Drop unused enquiries indexes
DROP INDEX IF EXISTS public.idx_enquiries_converted_to_trip_id;
DROP INDEX IF EXISTS public.idx_enquiries_created_by;
DROP INDEX IF EXISTS public.idx_enquiries_customer_id;

-- Drop unused vehicle_documents indexes
DROP INDEX IF EXISTS public.idx_vehicle_documents_document_type_id;
DROP INDEX IF EXISTS public.idx_vehicle_documents_vehicle_id;

-- Drop unused vehicles index
DROP INDEX IF EXISTS public.idx_vehicles_diesel_card_id;

-- Drop unused user_profiles index
DROP INDEX IF EXISTS public.idx_user_profiles_role_id;

-- Drop unused states indexes
DROP INDEX IF EXISTS public.idx_states_code;
DROP INDEX IF EXISTS public.idx_states_active;

-- Drop unused cities indexes
DROP INDEX IF EXISTS public.idx_cities_state;
DROP INDEX IF EXISTS public.idx_cities_tier;
DROP INDEX IF EXISTS public.idx_cities_active;
DROP INDEX IF EXISTS public.idx_cities_name;
