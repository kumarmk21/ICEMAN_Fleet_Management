/*
  # Fix Unindexed Foreign Key and Drop Unused Indexes

  ## Changes
  1. Adds a covering index on `vehicles.vehicle_type_id` to fix the unindexed foreign key warning
  2. Drops all unused indexes across multiple tables to reduce storage overhead and write amplification

  ## Dropped Indexes
  - enquiries: idx_enquiries_customer_id, idx_enquiries_converted_to_trip_id, idx_enquiries_created_by
  - fuel_transactions: idx_fuel_transactions_created_by/trip_id/vehicle_id/vendor_id
  - maintenance_jobs: idx_maintenance_jobs_created_by/vehicle_id/workshop_vendor_id
  - trip_expenses: idx_trip_expenses_trip_id/vendor_id/created_by/expense_head_id
  - trip_stops: idx_trip_stops_city_id
  - trips: idx_trips_created_by/customer_id/driver_id/enquiry_id/route_id/vehicle_id
  - tyres: idx_tyres_vehicle_id
  - user_profiles: idx_user_profiles_role_id
  - vehicle_documents: idx_vehicle_documents_document_type_id/vehicle_id
  - vehicles: idx_vehicles_diesel_card_id, idx_vehicles_fast_tag_id
  - cities: idx_cities_state_id
  - customers: idx_customers_sales_person_id
  - fast_tags_master: idx_fast_tags_vehicle

  ## Notes
  - These indexes were reported as unused by Supabase performance advisor
  - Removing unused indexes reduces write overhead and storage without impacting read performance
*/

CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON public.vehicles(vehicle_type_id);

DROP INDEX IF EXISTS public.idx_enquiries_customer_id;
DROP INDEX IF EXISTS public.idx_enquiries_converted_to_trip_id;
DROP INDEX IF EXISTS public.idx_enquiries_created_by;
DROP INDEX IF EXISTS public.idx_fuel_transactions_created_by;
DROP INDEX IF EXISTS public.idx_fuel_transactions_trip_id;
DROP INDEX IF EXISTS public.idx_fuel_transactions_vehicle_id;
DROP INDEX IF EXISTS public.idx_fuel_transactions_vendor_id;
DROP INDEX IF EXISTS public.idx_maintenance_jobs_created_by;
DROP INDEX IF EXISTS public.idx_maintenance_jobs_vehicle_id;
DROP INDEX IF EXISTS public.idx_maintenance_jobs_workshop_vendor_id;
DROP INDEX IF EXISTS public.idx_trip_expenses_trip_id;
DROP INDEX IF EXISTS public.idx_trip_expenses_vendor_id;
DROP INDEX IF EXISTS public.idx_trip_expenses_created_by;
DROP INDEX IF EXISTS public.idx_trip_expenses_expense_head_id;
DROP INDEX IF EXISTS public.idx_trip_stops_city_id;
DROP INDEX IF EXISTS public.idx_trips_created_by;
DROP INDEX IF EXISTS public.idx_trips_customer_id;
DROP INDEX IF EXISTS public.idx_trips_driver_id;
DROP INDEX IF EXISTS public.idx_trips_enquiry_id;
DROP INDEX IF EXISTS public.idx_trips_route_id;
DROP INDEX IF EXISTS public.idx_trips_vehicle_id;
DROP INDEX IF EXISTS public.idx_tyres_vehicle_id;
DROP INDEX IF EXISTS public.idx_user_profiles_role_id;
DROP INDEX IF EXISTS public.idx_vehicle_documents_document_type_id;
DROP INDEX IF EXISTS public.idx_vehicle_documents_vehicle_id;
DROP INDEX IF EXISTS public.idx_vehicles_diesel_card_id;
DROP INDEX IF EXISTS public.idx_vehicles_fast_tag_id;
DROP INDEX IF EXISTS public.idx_cities_state_id;
DROP INDEX IF EXISTS public.idx_customers_sales_person_id;
DROP INDEX IF EXISTS public.idx_fast_tags_vehicle;
