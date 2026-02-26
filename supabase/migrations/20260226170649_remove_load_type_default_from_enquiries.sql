/*
  # Remove Default Value from Load Type Column
  
  1. Changes
    - Remove DEFAULT 'Dry' from load_type column in enquiries table
    - Keep NOT NULL constraint to enforce mandatory selection
  
  2. Notes
    - Existing records already have load_type values set
    - Users must now explicitly select a load type when creating new enquiries
    - This prevents automatic default assignment and enforces intentional selection
*/

ALTER TABLE enquiries ALTER COLUMN load_type DROP DEFAULT;
