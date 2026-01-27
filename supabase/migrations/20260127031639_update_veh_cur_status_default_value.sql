/*
  # Update Vehicle Current Status Default Value

  1. Changes to vehicles table
    - Update column default from empty string to "Free"
    - Update existing records with empty string to "Free"
*/

ALTER TABLE vehicles ALTER COLUMN veh_cur_status SET DEFAULT 'Free';

UPDATE vehicles SET veh_cur_status = 'Free' WHERE veh_cur_status = '';
