/*
  # Create Document Expiry Alerts View

  1. New Views
    - `document_expiry_alerts_view`
      - Joins `vehicle_documents`, `vehicles`, and `document_types`
      - Calculates `days_until_expiry` from `valid_to - CURRENT_DATE`
      - Assigns `urgency_level`: Expired, Critical (<=30d), Warning (<=60d), Notice (<=90d)
      - Filters to documents expiring within 90 days or already expired

  2. Security
    - Grants SELECT on the view to authenticated users

  3. Notes
    - This view powers the Dashboard "Document Expiry Alerts" widget
    - Shows documents for vehicle MH14LX4540 Insurance expiring 2026-04-11 (21 days) as Critical
*/

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
  (vd.valid_to - CURRENT_DATE)::integer as days_until_expiry,
  CASE 
    WHEN vd.valid_to < CURRENT_DATE THEN 'Expired'
    WHEN (vd.valid_to - CURRENT_DATE) <= 30 THEN 'Critical'
    WHEN (vd.valid_to - CURRENT_DATE) <= 60 THEN 'Warning'
    WHEN (vd.valid_to - CURRENT_DATE) <= 90 THEN 'Notice'
    ELSE 'OK'
  END as urgency_level,
  vd.remarks
FROM vehicle_documents vd
JOIN vehicles v ON vd.vehicle_id = v.vehicle_id
JOIN document_types dt ON vd.document_type_id = dt.document_type_id
WHERE vd.valid_to IS NOT NULL
  AND (vd.valid_to - CURRENT_DATE) <= 90
ORDER BY vd.valid_to ASC;

GRANT SELECT ON document_expiry_alerts_view TO authenticated;
