/*
  # Add Missing Foreign Key Indexes
  
  1. Changes
    - Add indexes for all unindexed foreign keys to improve query performance
    - Indexes are created on foreign key columns that are frequently used in joins
  
  2. Security
    - No RLS changes, only performance improvements
  
  3. Performance Impact
    - Significantly improves JOIN performance on foreign key relationships
    - Speeds up queries that filter or sort by foreign key columns
*/

-- Cities table
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);

-- Customers table
CREATE INDEX IF NOT EXISTS idx_customers_sales_person_id ON customers(sales_person_id);

-- Enquiries table
CREATE INDEX IF NOT EXISTS idx_enquiries_converted_to_trip_id ON enquiries(converted_to_trip_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_by ON enquiries(created_by);
CREATE INDEX IF NOT EXISTS idx_enquiries_customer_id ON enquiries(customer_id);

-- Fuel transactions table
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_created_by ON fuel_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_trip_id ON fuel_transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle_id ON fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vendor_id ON fuel_transactions(vendor_id);

-- Maintenance jobs table
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_created_by ON maintenance_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_vehicle_id ON maintenance_jobs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_workshop_vendor_id ON maintenance_jobs(workshop_vendor_id);

-- Trip expenses table
CREATE INDEX IF NOT EXISTS idx_trip_expenses_created_by ON trip_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_expense_head_id ON trip_expenses(expense_head_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_vendor_id ON trip_expenses(vendor_id);

-- Trip stops table
CREATE INDEX IF NOT EXISTS idx_trip_stops_city_id ON trip_stops(city_id);

-- Trips table
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_customer_id ON trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_enquiry_id ON trips(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_trips_route_id ON trips(route_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);

-- Tyres table
CREATE INDEX IF NOT EXISTS idx_tyres_vehicle_id ON tyres(vehicle_id);

-- User profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id ON user_profiles(role_id);

-- Vehicle documents table
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_document_type_id ON vehicle_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);

-- Vehicles table
CREATE INDEX IF NOT EXISTS idx_vehicles_diesel_card_id ON vehicles(diesel_card_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_fast_tag_id ON vehicles(fast_tag_id);
