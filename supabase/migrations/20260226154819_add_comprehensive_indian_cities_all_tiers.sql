/*
  # Add Comprehensive Indian Cities Data (All Four Tiers)

  1. Cities Added
    - Tier 1: Additional major metropolitan cities (Total: 15+)
    - Tier 2: Important urban centers with significant economic activity (Total: 30+)
    - Tier 3: Smaller cities with developing infrastructure (Total: 50+)
    - Tier 4: Towns and smaller urban areas (Total: 50+)
  
  2. Data Quality
    - All cities mapped to their respective states
    - Tier classification based on economic activity and infrastructure
    - Cities distributed across all major Indian states
  
  3. Notes
    - Check constraint updated to include 'Tier 4'
    - Duplicate prevention using ON CONFLICT
*/

-- First, update the tier check constraint to include Tier 4
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_tier_check;
ALTER TABLE cities ADD CONSTRAINT cities_tier_check 
  CHECK (tier = ANY (ARRAY['Tier 1'::text, 'Tier 2'::text, 'Tier 3'::text, 'Tier 4'::text]));

-- Insert Tier 1 Cities (Major Metropolitan Cities) - Additional cities
INSERT INTO cities (city_name, state_id, tier, is_active)
SELECT 'Gurgaon', state_id, 'Tier 1', true FROM states WHERE state_name = 'Haryana'
ON CONFLICT DO NOTHING;

INSERT INTO cities (city_name, state_id, tier, is_active)
SELECT 'Noida', state_id, 'Tier 1', true FROM states WHERE state_name = 'Uttar Pradesh'
ON CONFLICT DO NOTHING;

INSERT INTO cities (city_name, state_id, tier, is_active)
SELECT 'Thane', state_id, 'Tier 1', true FROM states WHERE state_name = 'Maharashtra'
ON CONFLICT DO NOTHING;

INSERT INTO cities (city_name, state_id, tier, is_active)
SELECT 'Navi Mumbai', state_id, 'Tier 1', true FROM states WHERE state_name = 'Maharashtra'
ON CONFLICT DO NOTHING;

-- Insert Tier 2 Cities (Important Urban Centers) - Additional cities
INSERT INTO cities (city_name, state_id, tier, is_active)
VALUES
  ((SELECT city_name FROM (SELECT 'Bhopal' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Vadodara' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Rajkot' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Patna' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Ludhiana' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Agra' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Varanasi' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Nashik' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Aurangabad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Madurai' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Vijayawada' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Guwahati' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Assam'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Thiruvananthapuram' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Bhubaneswar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 2', true),
  ((SELECT city_name FROM (SELECT 'Raipur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 2', true)
ON CONFLICT DO NOTHING;

-- Insert Tier 3 Cities (Smaller cities with developing infrastructure)
INSERT INTO cities (city_name, state_id, tier, is_active)
VALUES
  -- Andhra Pradesh
  ((SELECT city_name FROM (SELECT 'Guntur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Nellore' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Tirupati' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Kakinada' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
  
  -- Bihar
  ((SELECT city_name FROM (SELECT 'Gaya' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Muzaffarpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Bhagalpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
  
  -- Chhattisgarh
  ((SELECT city_name FROM (SELECT 'Bilaspur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Korba' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true),
  
  -- Gujarat
  ((SELECT city_name FROM (SELECT 'Bhavnagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Jamnagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Junagadh' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Anand' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
  
  -- Haryana
  ((SELECT city_name FROM (SELECT 'Faridabad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Panipat' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Ambala' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Karnal' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
  
  -- Karnataka
  ((SELECT city_name FROM (SELECT 'Mysore' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Mangalore' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Hubli' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Belgaum' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
  
  -- Kerala
  ((SELECT city_name FROM (SELECT 'Kozhikode' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Thrissur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Kannur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
  
  -- Madhya Pradesh
  ((SELECT city_name FROM (SELECT 'Jabalpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Gwalior' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Ujjain' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
  
  -- Maharashtra
  ((SELECT city_name FROM (SELECT 'Solapur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Kolhapur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Amravati' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Sangli' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
  
  -- Odisha
  ((SELECT city_name FROM (SELECT 'Cuttack' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Rourkela' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Brahmapur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
  
  -- Punjab
  ((SELECT city_name FROM (SELECT 'Amritsar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Jalandhar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Patiala' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
  
  -- Rajasthan
  ((SELECT city_name FROM (SELECT 'Jodhpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Kota' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Udaipur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Ajmer' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
  
  -- Tamil Nadu
  ((SELECT city_name FROM (SELECT 'Tiruchirappalli' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Salem' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Tirunelveli' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Erode' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
  
  -- Telangana
  ((SELECT city_name FROM (SELECT 'Warangal' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Nizamabad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Karimnagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true),
  
  -- Uttar Pradesh
  ((SELECT city_name FROM (SELECT 'Meerut' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Ghaziabad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Allahabad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Bareilly' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
  
  -- West Bengal
  ((SELECT city_name FROM (SELECT 'Durgapur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Asansol' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
  ((SELECT city_name FROM (SELECT 'Siliguri' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true)
ON CONFLICT DO NOTHING;

-- Insert Tier 4 Cities (Towns and smaller urban areas)
INSERT INTO cities (city_name, state_id, tier, is_active)
VALUES
  -- Andhra Pradesh
  ((SELECT city_name FROM (SELECT 'Rajahmundry' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Anantapur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Kurnool' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Eluru' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 4', true),
  
  -- Bihar
  ((SELECT city_name FROM (SELECT 'Purnia' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Darbhanga' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Arrah' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Begusarai' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 4', true),
  
  -- Chhattisgarh
  ((SELECT city_name FROM (SELECT 'Durg' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Bhilai' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Rajnandgaon' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 4', true),
  
  -- Gujarat
  ((SELECT city_name FROM (SELECT 'Gandhinagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Nadiad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Morbi' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Surendranagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 4', true),
  
  -- Haryana
  ((SELECT city_name FROM (SELECT 'Rohtak' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Hisar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Sonipat' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Yamunanagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 4', true),
  
  -- Karnataka
  ((SELECT city_name FROM (SELECT 'Bellary' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Gulbarga' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Shimoga' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Tumkur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 4', true),
  
  -- Kerala
  ((SELECT city_name FROM (SELECT 'Kollam' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Palakkad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Alappuzha' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Kottayam' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 4', true),
  
  -- Madhya Pradesh
  ((SELECT city_name FROM (SELECT 'Sagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Dewas' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Satna' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Ratlam' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 4', true),
  
  -- Maharashtra
  ((SELECT city_name FROM (SELECT 'Ahmednagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Akola' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Latur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Jalgaon' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 4', true),
  
  -- Odisha
  ((SELECT city_name FROM (SELECT 'Sambalpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Balasore' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Puri' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 4', true),
  
  -- Punjab
  ((SELECT city_name FROM (SELECT 'Bathinda' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Hoshiarpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Moga' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Pathankot' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 4', true),
  
  -- Rajasthan
  ((SELECT city_name FROM (SELECT 'Bikaner' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Alwar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Bharatpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Bhilwara' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 4', true),
  
  -- Tamil Nadu
  ((SELECT city_name FROM (SELECT 'Vellore' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Thoothukudi' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Dindigul' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Thanjavur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 4', true),
  
  -- Telangana
  ((SELECT city_name FROM (SELECT 'Khammam' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Mahbubnagar' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Ramagundam' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 4', true),
  
  -- Uttar Pradesh
  ((SELECT city_name FROM (SELECT 'Moradabad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Aligarh' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Saharanpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Gorakhpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Firozabad' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 4', true),
  
  -- West Bengal
  ((SELECT city_name FROM (SELECT 'Howrah' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Bardhaman' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Kharagpur' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 4', true),
  ((SELECT city_name FROM (SELECT 'Raiganj' as city_name) t), (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 4', true)
ON CONFLICT DO NOTHING;