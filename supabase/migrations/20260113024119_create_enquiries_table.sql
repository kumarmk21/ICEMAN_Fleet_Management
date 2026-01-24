/*
  # Create Enquiries Table
  
  ## Overview
  Creates the enquiries table for managing customer enquiries and quotations
  in the fleet management system.
  
  ## New Table Created
  
  ### `enquiries`
  Customer enquiry and quotation data
  - `enquiry_id` (uuid, primary key)
  - `enquiry_number` (text, unique, required) - Auto-generated enquiry reference
  - `enquiry_date` (date, required) - Date of enquiry
  - `customer_id` (uuid, FK to customers) - Customer making the enquiry
  - `contact_person` (text) - Contact person name
  - `contact_mobile` (text) - Contact mobile number
  - `contact_email` (text) - Contact email
  - `origin` (text, required) - Pickup location/city
  - `destination` (text, required) - Delivery location/city
  - `material_description` (text) - Description of goods to be transported
  - `weight_tons` (decimal) - Estimated weight in tons
  - `vehicle_type_required` (text) - Type of vehicle required
  - `loading_date` (date) - Expected loading date
  - `quoted_rate` (decimal) - Quoted freight rate
  - `remarks` (text) - Additional notes
  - `status` (text) - New, Quoted, Converted, Lost
  - `converted_to_trip_id` (uuid, FK to trips) - If converted to trip
  - `created_by` (uuid, FK to user_profiles) - User who created the enquiry
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ## Security
  - Enable RLS on enquiries table
  - Authenticated users can read all enquiries
  - Admin, Fleet Manager, and Operations Executive can create/update enquiries
  
  ## Notes
  - All monetary values in INR
  - Weights in TON
  - Status workflow: New → Quoted → Converted/Lost
*/

-- Create enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  enquiry_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number text UNIQUE NOT NULL,
  enquiry_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES customers(customer_id),
  contact_person text DEFAULT '',
  contact_mobile text DEFAULT '',
  contact_email text DEFAULT '',
  origin text NOT NULL,
  destination text NOT NULL,
  material_description text DEFAULT '',
  weight_tons decimal(10,2) DEFAULT 0,
  vehicle_type_required text DEFAULT '',
  loading_date date,
  quoted_rate decimal(12,2) DEFAULT 0,
  remarks text DEFAULT '',
  status text DEFAULT 'New' CHECK (status IN ('New', 'Quoted', 'Converted', 'Lost')),
  converted_to_trip_id uuid REFERENCES trips(trip_id),
  created_by uuid REFERENCES user_profiles(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for enquiries
CREATE POLICY "Authenticated users can read enquiries"
  ON enquiries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can insert enquiries"
  ON enquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Operations Executive')
    )
  );

CREATE POLICY "Authorized users can update enquiries"
  ON enquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Operations Executive')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name IN ('Admin', 'Fleet Manager', 'Operations Executive')
    )
  );

CREATE POLICY "Admins can delete enquiries"
  ON enquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.role_id
      WHERE up.user_id = auth.uid()
      AND r.role_name = 'Admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate enquiry number
CREATE OR REPLACE FUNCTION generate_enquiry_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_number text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(enquiry_number FROM 4) AS integer)), 0) + 1
  INTO next_num
  FROM enquiries
  WHERE enquiry_number ~ '^ENQ[0-9]+$';
  
  new_number := 'ENQ' || LPAD(next_num::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate enquiry number
CREATE OR REPLACE FUNCTION set_enquiry_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enquiry_number IS NULL OR NEW.enquiry_number = '' THEN
    NEW.enquiry_number := generate_enquiry_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_enquiry_number_trigger
  BEFORE INSERT ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION set_enquiry_number();
