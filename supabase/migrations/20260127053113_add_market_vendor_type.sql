/*
  # Add Market to Vendor Type Check Constraint

  1. Changes
    - Update vendors_vendor_type_check constraint to include 'Market' as a valid vendor type
    - Allows vendors to be categorized as Market suppliers
*/

ALTER TABLE vendors DROP CONSTRAINT vendors_vendor_type_check;

ALTER TABLE vendors ADD CONSTRAINT vendors_vendor_type_check
  CHECK (vendor_type = ANY (ARRAY['Fuel'::text, 'Workshop'::text, 'Tyre'::text, 'Toll'::text, 'Market'::text, 'Other'::text]));
