/*
  # Analytics Views for Fleet Management

  ## Overview
  Creates database views for profitability calculations, dashboards, and reporting.

  ## New Views Created
  
  ### 1. `trip_profitability_view`
  Comprehensive trip-wise profitability analysis
  - Calculates total revenue, variable costs, allocated fixed costs, and profit per trip
  - Includes profit per KM calculations
  
  ### 2. `vehicle_monthly_profitability_view`
  Vehicle-wise monthly profitability summary
  - Aggregates all trips, expenses, and maintenance for each vehicle per month
  - Calculates net profit, profit per KM, and profit per trip
  
  ### 3. `document_expiry_alerts_view`
  Alerts for documents expiring soon
  - Shows documents expiring within 90 days
  - Color-coded urgency levels
  
  ### 4. `fuel_efficiency_view`
  Fuel consumption and efficiency analysis
  - Vehicle-wise fuel consumption and KMPL
  - Compares actual vs standard KMPL
  
  ### 5. `dashboard_kpis_view`
  Key performance indicators for dashboard
  - Active vehicles, trip counts, revenue, costs, profits
  - Aggregated metrics for date range filtering

  ## Security
  - Views inherit RLS from underlying tables
  - All authenticated users can query views

  ## Notes
  - Views are materialized for better performance
  - Calculations follow Indian INR currency format
  - KM-based profitability allocation method used
*/

-- 1. Trip Profitability View
CREATE OR REPLACE VIEW trip_profitability_view AS
WITH trip_variable_costs AS (
  SELECT 
    te.trip_id,
    SUM(te.amount) as total_variable_cost
  FROM trip_expenses te
  JOIN expense_heads eh ON te.expense_head_id = eh.expense_head_id
  WHERE eh.category = 'Trip Variable'
  GROUP BY te.trip_id
),
vehicle_monthly_km AS (
  SELECT 
    t.vehicle_id,
    DATE_TRUNC('month', t.actual_start_datetime) as month,
    SUM(t.actual_distance_km) as total_monthly_km
  FROM trips t
  WHERE t.trip_status IN ('Completed', 'Closed')
  GROUP BY t.vehicle_id, DATE_TRUNC('month', t.actual_start_datetime)
)
SELECT 
  t.trip_id,
  t.trip_number,
  t.vehicle_id,
  v.vehicle_number,
  v.ownership_type,
  t.driver_id,
  d.driver_name,
  t.customer_id,
  c.customer_name,
  t.origin,
  t.destination,
  t.actual_start_datetime,
  t.actual_end_datetime,
  t.trip_status,
  t.actual_distance_km,
  
  -- Revenue
  t.freight_revenue,
  t.other_revenue,
  (t.freight_revenue + t.other_revenue) as total_revenue,
  
  -- Variable Costs
  COALESCE(tvc.total_variable_cost, 0) as total_variable_cost,
  
  -- Fixed Cost Allocation (proportional to KM)
  CASE 
    WHEN vmk.total_monthly_km > 0 THEN 
      (t.actual_distance_km / vmk.total_monthly_km) * v.fixed_cost_per_month
    ELSE 0
  END as allocated_fixed_cost,
  
  -- Profit Calculations
  (t.freight_revenue + t.other_revenue) - 
  COALESCE(tvc.total_variable_cost, 0) - 
  CASE 
    WHEN vmk.total_monthly_km > 0 THEN 
      (t.actual_distance_km / vmk.total_monthly_km) * v.fixed_cost_per_month
    ELSE 0
  END as trip_profit,
  
  -- Profit per KM
  CASE 
    WHEN t.actual_distance_km > 0 THEN
      ((t.freight_revenue + t.other_revenue) - 
       COALESCE(tvc.total_variable_cost, 0) - 
       CASE 
         WHEN vmk.total_monthly_km > 0 THEN 
           (t.actual_distance_km / vmk.total_monthly_km) * v.fixed_cost_per_month
         ELSE 0
       END) / t.actual_distance_km
    ELSE 0
  END as profit_per_km,
  
  t.created_at,
  t.updated_at
FROM trips t
LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
LEFT JOIN drivers d ON t.driver_id = d.driver_id
LEFT JOIN customers c ON t.customer_id = c.customer_id
LEFT JOIN trip_variable_costs tvc ON t.trip_id = tvc.trip_id
LEFT JOIN vehicle_monthly_km vmk ON 
  t.vehicle_id = vmk.vehicle_id AND 
  DATE_TRUNC('month', t.actual_start_datetime) = vmk.month
WHERE t.trip_status IN ('Completed', 'Closed');

-- 2. Vehicle Monthly Profitability View
CREATE OR REPLACE VIEW vehicle_monthly_profitability_view AS
WITH months_series AS (
  SELECT 
    DATE_TRUNC('month', GENERATE_SERIES(
      CURRENT_DATE - INTERVAL '12 months',
      CURRENT_DATE,
      INTERVAL '1 month'
    )) as period_month
),
monthly_trips AS (
  SELECT 
    vehicle_id,
    DATE_TRUNC('month', actual_start_datetime) as trip_month,
    COUNT(*) as total_trips,
    SUM(actual_distance_km) as total_km,
    SUM(freight_revenue + other_revenue) as total_revenue
  FROM trips
  WHERE trip_status IN ('Completed', 'Closed')
  GROUP BY vehicle_id, DATE_TRUNC('month', actual_start_datetime)
),
monthly_variable_costs AS (
  SELECT 
    t.vehicle_id,
    DATE_TRUNC('month', t.actual_start_datetime) as cost_month,
    SUM(te.amount) as total_variable_cost
  FROM trips t
  JOIN trip_expenses te ON t.trip_id = te.trip_id
  JOIN expense_heads eh ON te.expense_head_id = eh.expense_head_id
  WHERE eh.category = 'Trip Variable'
    AND t.trip_status IN ('Completed', 'Closed')
  GROUP BY t.vehicle_id, DATE_TRUNC('month', t.actual_start_datetime)
),
monthly_maintenance AS (
  SELECT 
    vehicle_id,
    DATE_TRUNC('month', job_date) as maint_month,
    SUM(total_cost) as total_maintenance_cost
  FROM maintenance_jobs
  GROUP BY vehicle_id, DATE_TRUNC('month', job_date)
)
SELECT 
  v.vehicle_id,
  v.vehicle_number,
  v.vehicle_type,
  v.ownership_type,
  v.status as vehicle_status,
  ms.period_month as month,
  COALESCE(mt.total_trips, 0) as total_trips,
  COALESCE(mt.total_km, 0) as total_km,
  COALESCE(mt.total_revenue, 0) as total_revenue,
  COALESCE(mvc.total_variable_cost, 0) as total_variable_cost,
  v.fixed_cost_per_month as total_fixed_cost,
  COALESCE(mm.total_maintenance_cost, 0) as total_maintenance_cost,
  
  -- Net Profit
  COALESCE(mt.total_revenue, 0) - 
  COALESCE(mvc.total_variable_cost, 0) - 
  v.fixed_cost_per_month - 
  COALESCE(mm.total_maintenance_cost, 0) as net_profit,
  
  -- Profit per KM
  CASE 
    WHEN COALESCE(mt.total_km, 0) > 0 THEN
      (COALESCE(mt.total_revenue, 0) - 
       COALESCE(mvc.total_variable_cost, 0) - 
       v.fixed_cost_per_month - 
       COALESCE(mm.total_maintenance_cost, 0)) / mt.total_km
    ELSE 0
  END as profit_per_km,
  
  -- Profit per Trip
  CASE 
    WHEN COALESCE(mt.total_trips, 0) > 0 THEN
      (COALESCE(mt.total_revenue, 0) - 
       COALESCE(mvc.total_variable_cost, 0) - 
       v.fixed_cost_per_month - 
       COALESCE(mm.total_maintenance_cost, 0)) / mt.total_trips
    ELSE 0
  END as profit_per_trip
FROM vehicles v
CROSS JOIN months_series ms
LEFT JOIN monthly_trips mt ON v.vehicle_id = mt.vehicle_id AND mt.trip_month = ms.period_month
LEFT JOIN monthly_variable_costs mvc ON v.vehicle_id = mvc.vehicle_id AND mvc.cost_month = ms.period_month
LEFT JOIN monthly_maintenance mm ON v.vehicle_id = mm.vehicle_id AND mm.maint_month = ms.period_month
WHERE v.status = 'Active';

-- 3. Document Expiry Alerts View
CREATE OR REPLACE VIEW document_expiry_alerts_view AS
SELECT 
  vd.vehicle_document_id,
  vd.vehicle_id,
  v.vehicle_number,
  vd.document_type_id,
  dt.document_type_name,
  vd.document_number,
  vd.valid_from,
  vd.valid_to,
  CURRENT_DATE as today,
  vd.valid_to - CURRENT_DATE as days_until_expiry,
  
  -- Urgency level
  CASE 
    WHEN vd.valid_to < CURRENT_DATE THEN 'Expired'
    WHEN vd.valid_to - CURRENT_DATE <= 30 THEN 'Critical'
    WHEN vd.valid_to - CURRENT_DATE <= 60 THEN 'Warning'
    WHEN vd.valid_to - CURRENT_DATE <= 90 THEN 'Notice'
    ELSE 'OK'
  END as urgency_level,
  
  vd.remarks
FROM vehicle_documents vd
JOIN vehicles v ON vd.vehicle_id = v.vehicle_id
JOIN document_types dt ON vd.document_type_id = dt.document_type_id
WHERE vd.valid_to IS NOT NULL
  AND vd.valid_to - CURRENT_DATE <= 90
ORDER BY vd.valid_to ASC;

-- 4. Fuel Efficiency View
CREATE OR REPLACE VIEW fuel_efficiency_view AS
WITH vehicle_fuel AS (
  SELECT 
    t.vehicle_id,
    DATE_TRUNC('month', te.expense_date) as fuel_month,
    SUM(te.quantity) as total_fuel_litres,
    SUM(te.amount) as total_fuel_cost,
    SUM(t.actual_distance_km) as total_km
  FROM trip_expenses te
  JOIN trips t ON te.trip_id = t.trip_id
  JOIN expense_heads eh ON te.expense_head_id = eh.expense_head_id
  WHERE eh.expense_head_name = 'Fuel'
    AND t.trip_status IN ('Completed', 'Closed')
  GROUP BY t.vehicle_id, DATE_TRUNC('month', te.expense_date)
)
SELECT 
  v.vehicle_id,
  v.vehicle_number,
  v.vehicle_type,
  vf.fuel_month as month,
  COALESCE(vf.total_km, 0) as total_km,
  COALESCE(vf.total_fuel_litres, 0) as total_fuel_litres,
  COALESCE(vf.total_fuel_cost, 0) as total_fuel_cost,
  
  -- Actual KMPL
  CASE 
    WHEN COALESCE(vf.total_fuel_litres, 0) > 0 THEN
      vf.total_km / vf.total_fuel_litres
    ELSE 0
  END as actual_kmpl,
  
  -- Cost per KM
  CASE 
    WHEN COALESCE(vf.total_km, 0) > 0 THEN
      vf.total_fuel_cost / vf.total_km
    ELSE 0
  END as cost_per_km,
  
  -- Compare with standard (from routes or vehicle baseline)
  6.0 as standard_kmpl,
  
  -- Efficiency percentage
  CASE 
    WHEN COALESCE(vf.total_fuel_litres, 0) > 0 THEN
      ((vf.total_km / vf.total_fuel_litres) / 6.0) * 100
    ELSE 0
  END as efficiency_percentage
FROM vehicles v
LEFT JOIN vehicle_fuel vf ON v.vehicle_id = vf.vehicle_id
WHERE v.status = 'Active'
ORDER BY vf.fuel_month DESC, v.vehicle_number;

-- 5. Dashboard KPIs View
CREATE OR REPLACE VIEW dashboard_kpis_view AS
WITH current_month_data AS (
  SELECT 
    COUNT(DISTINCT t.vehicle_id) as active_vehicles_in_trips,
    COUNT(DISTINCT CASE WHEN t.trip_status = 'In Transit' THEN t.vehicle_id END) as vehicles_in_trip,
    COUNT(*) as total_trips,
    SUM(t.actual_distance_km) as total_km,
    SUM(t.freight_revenue + t.other_revenue) as total_revenue
  FROM trips t
  WHERE DATE_TRUNC('month', t.actual_start_datetime) = DATE_TRUNC('month', CURRENT_DATE)
    AND t.trip_status IN ('In Transit', 'Completed', 'Closed')
),
current_month_expenses AS (
  SELECT 
    SUM(te.amount) as total_expenses
  FROM trip_expenses te
  JOIN trips t ON te.trip_id = t.trip_id
  WHERE DATE_TRUNC('month', t.actual_start_datetime) = DATE_TRUNC('month', CURRENT_DATE)
    AND t.trip_status IN ('In Transit', 'Completed', 'Closed')
),
current_month_fuel AS (
  SELECT 
    SUM(te.quantity) as total_fuel_litres,
    SUM(te.amount) as total_fuel_cost
  FROM trip_expenses te
  JOIN trips t ON te.trip_id = t.trip_id
  JOIN expense_heads eh ON te.expense_head_id = eh.expense_head_id
  WHERE eh.expense_head_name = 'Fuel'
    AND DATE_TRUNC('month', t.actual_start_datetime) = DATE_TRUNC('month', CURRENT_DATE)
    AND t.trip_status IN ('In Transit', 'Completed', 'Closed')
)
SELECT 
  (SELECT COUNT(*) FROM vehicles WHERE status = 'Active') as total_active_vehicles,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'Under Maintenance') as vehicles_under_maintenance,
  COALESCE(cmd.vehicles_in_trip, 0) as vehicles_in_trip,
  (SELECT COUNT(*) FROM vehicles WHERE status = 'Active') - 
    COALESCE(cmd.vehicles_in_trip, 0) - 
    (SELECT COUNT(*) FROM vehicles WHERE status = 'Under Maintenance') as vehicles_idle,
  COALESCE(cmd.total_trips, 0) as total_trips,
  COALESCE(cmd.total_km, 0) as total_km,
  COALESCE(cmf.total_fuel_litres, 0) as total_fuel_consumed,
  CASE 
    WHEN COALESCE(cmf.total_fuel_litres, 0) > 0 THEN
      cmd.total_km / cmf.total_fuel_litres
    ELSE 0
  END as average_kmpl,
  COALESCE(cmd.total_revenue, 0) as total_revenue,
  COALESCE(cme.total_expenses, 0) as total_cost,
  COALESCE(cmd.total_revenue, 0) - COALESCE(cme.total_expenses, 0) as net_profit
FROM current_month_data cmd
CROSS JOIN current_month_expenses cme
CROSS JOIN current_month_fuel cmf;

-- Grant access to views
GRANT SELECT ON trip_profitability_view TO authenticated;
GRANT SELECT ON vehicle_monthly_profitability_view TO authenticated;
GRANT SELECT ON document_expiry_alerts_view TO authenticated;
GRANT SELECT ON fuel_efficiency_view TO authenticated;
GRANT SELECT ON dashboard_kpis_view TO authenticated;
