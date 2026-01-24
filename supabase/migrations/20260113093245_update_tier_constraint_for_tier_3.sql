/*
  # Update Tier Constraint to Allow Tier 3 Cities

  1. Changes
    - Drop existing check constraint on cities.tier column
    - Add new check constraint that allows 'Tier 1', 'Tier 2', and 'Tier 3'
    - This enables the city master to include smaller cities and district headquarters

  2. Notes
    - Existing Tier 1 and Tier 2 cities remain unchanged
    - System will now support three-tier city classification
*/

-- Drop the existing constraint
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_tier_check;

-- Add new constraint with Tier 3 support
ALTER TABLE cities ADD CONSTRAINT cities_tier_check 
  CHECK (tier IN ('Tier 1', 'Tier 2', 'Tier 3'));
