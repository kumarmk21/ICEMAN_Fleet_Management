/*
  # Add Tier 3 Cities to City Master

  1. Changes
    - Adds comprehensive list of Tier 3 cities across all Indian states
    - Includes district headquarters and emerging urban centers
    - Covers cities with populations typically between 50,000 to 500,000
    - Total of 150+ Tier 3 cities added

  2. Coverage
    - All major states covered with representative Tier 3 cities
    - Focus on district headquarters and industrial centers
    - Includes tourist destinations and educational hubs
    - Strategic locations for logistics and transport operations
*/

-- Insert Tier 3 cities for Andhra Pradesh
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Anantapur', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Chittoor', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Eluru', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Kadapa', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Kakinada', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Nellore', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Ongole', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Rajahmundry', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true),
('Tirupati', (SELECT state_id FROM states WHERE state_name = 'Andhra Pradesh'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Assam
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Dibrugarh', (SELECT state_id FROM states WHERE state_name = 'Assam'), 'Tier 3', true),
('Jorhat', (SELECT state_id FROM states WHERE state_name = 'Assam'), 'Tier 3', true),
('Silchar', (SELECT state_id FROM states WHERE state_name = 'Assam'), 'Tier 3', true),
('Tezpur', (SELECT state_id FROM states WHERE state_name = 'Assam'), 'Tier 3', true),
('Nagaon', (SELECT state_id FROM states WHERE state_name = 'Assam'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Bihar
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Ara', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
('Begusarai', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
('Bhagalpur', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
('Darbhanga', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
('Gaya', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
('Muzaffarpur', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
('Purnia', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true),
('Sasaram', (SELECT state_id FROM states WHERE state_name = 'Bihar'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Chhattisgarh
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Bhilai', (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true),
('Bilaspur', (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true),
('Durg', (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true),
('Korba', (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true),
('Raigarh', (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true),
('Rajnandgaon', (SELECT state_id FROM states WHERE state_name = 'Chhattisgarh'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Goa
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Margao', (SELECT state_id FROM states WHERE state_name = 'Goa'), 'Tier 3', true),
('Mapusa', (SELECT state_id FROM states WHERE state_name = 'Goa'), 'Tier 3', true),
('Ponda', (SELECT state_id FROM states WHERE state_name = 'Goa'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Gujarat
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Anand', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Bharuch', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Bhuj', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Gandhidham', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Jamnagar', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Junagadh', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Morbi', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Navsari', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Porbandar', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Veraval', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true),
('Vapi', (SELECT state_id FROM states WHERE state_name = 'Gujarat'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Haryana
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Ambala', (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
('Hisar', (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
('Karnal', (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
('Panipat', (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
('Rohtak', (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
('Sonipat', (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true),
('Yamunanagar', (SELECT state_id FROM states WHERE state_name = 'Haryana'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Himachal Pradesh
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Baddi', (SELECT state_id FROM states WHERE state_name = 'Himachal Pradesh'), 'Tier 3', true),
('Kullu', (SELECT state_id FROM states WHERE state_name = 'Himachal Pradesh'), 'Tier 3', true),
('Mandi', (SELECT state_id FROM states WHERE state_name = 'Himachal Pradesh'), 'Tier 3', true),
('Palampur', (SELECT state_id FROM states WHERE state_name = 'Himachal Pradesh'), 'Tier 3', true),
('Solan', (SELECT state_id FROM states WHERE state_name = 'Himachal Pradesh'), 'Tier 3', true),
('Una', (SELECT state_id FROM states WHERE state_name = 'Himachal Pradesh'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Jammu and Kashmir
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Anantnag', (SELECT state_id FROM states WHERE state_name = 'Jammu and Kashmir'), 'Tier 3', true),
('Baramulla', (SELECT state_id FROM states WHERE state_name = 'Jammu and Kashmir'), 'Tier 3', true),
('Kathua', (SELECT state_id FROM states WHERE state_name = 'Jammu and Kashmir'), 'Tier 3', true),
('Sopore', (SELECT state_id FROM states WHERE state_name = 'Jammu and Kashmir'), 'Tier 3', true),
('Udhampur', (SELECT state_id FROM states WHERE state_name = 'Jammu and Kashmir'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Jharkhand
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Bokaro', (SELECT state_id FROM states WHERE state_name = 'Jharkhand'), 'Tier 3', true),
('Dhanbad', (SELECT state_id FROM states WHERE state_name = 'Jharkhand'), 'Tier 3', true),
('Giridih', (SELECT state_id FROM states WHERE state_name = 'Jharkhand'), 'Tier 3', true),
('Hazaribagh', (SELECT state_id FROM states WHERE state_name = 'Jharkhand'), 'Tier 3', true),
('Jamshedpur', (SELECT state_id FROM states WHERE state_name = 'Jharkhand'), 'Tier 3', true),
('Ranchi', (SELECT state_id FROM states WHERE state_name = 'Jharkhand'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Karnataka
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Belgaum', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Bellary', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Bidar', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Davangere', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Gulbarga', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Hassan', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Mandya', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Shimoga', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Tumkur', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true),
('Udupi', (SELECT state_id FROM states WHERE state_name = 'Karnataka'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Kerala
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Alappuzha', (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
('Kannur', (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
('Kasaragod', (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
('Palakkad', (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
('Thalassery', (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true),
('Thrissur', (SELECT state_id FROM states WHERE state_name = 'Kerala'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Madhya Pradesh
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Dewas', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Gwalior', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Jabalpur', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Katni', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Ratlam', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Rewa', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Sagar', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Satna', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Singrauli', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true),
('Ujjain', (SELECT state_id FROM states WHERE state_name = 'Madhya Pradesh'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Maharashtra
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Ahmednagar', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Akola', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Amravati', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Dhule', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Ichalkaranji', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Jalgaon', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Jalna', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Latur', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Nanded', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Parbhani', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Sangli', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true),
('Satara', (SELECT state_id FROM states WHERE state_name = 'Maharashtra'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Odisha
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Balasore', (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
('Berhampur', (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
('Cuttack', (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
('Puri', (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
('Rourkela', (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true),
('Sambalpur', (SELECT state_id FROM states WHERE state_name = 'Odisha'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Punjab
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Abohar', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
('Bathinda', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
('Hoshiarpur', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
('Kapurthala', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
('Moga', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
('Pathankot', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
('Patiala', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true),
('Phagwara', (SELECT state_id FROM states WHERE state_name = 'Punjab'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Rajasthan
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Ajmer', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Alwar', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Bharatpur', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Bhilwara', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Bikaner', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Kota', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Pali', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Sikar', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Sri Ganganagar', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true),
('Udaipur', (SELECT state_id FROM states WHERE state_name = 'Rajasthan'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Tamil Nadu
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Cuddalore', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Dindigul', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Erode', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Kanchipuram', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Karur', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Kumbakonam', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Nagercoil', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Thanjavur', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Tirunelveli', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true),
('Vellore', (SELECT state_id FROM states WHERE state_name = 'Tamil Nadu'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Telangana
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Karimnagar', (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true),
('Khammam', (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true),
('Mahbubnagar', (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true),
('Nizamabad', (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true),
('Warangal', (SELECT state_id FROM states WHERE state_name = 'Telangana'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Uttar Pradesh
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Aligarh', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Allahabad', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Bahraich', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Bareilly', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Etawah', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Fatehpur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Firozabad', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Gorakhpur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Hardoi', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Jaunpur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Jhansi', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Mathura', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Mirzapur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Moradabad', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Muzaffarnagar', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Rampur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Saharanpur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Sambhal', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Shahjahanpur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true),
('Sitapur', (SELECT state_id FROM states WHERE state_name = 'Uttar Pradesh'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for Uttarakhand
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Haldwani', (SELECT state_id FROM states WHERE state_name = 'Uttarakhand'), 'Tier 3', true),
('Haridwar', (SELECT state_id FROM states WHERE state_name = 'Uttarakhand'), 'Tier 3', true),
('Kashipur', (SELECT state_id FROM states WHERE state_name = 'Uttarakhand'), 'Tier 3', true),
('Roorkee', (SELECT state_id FROM states WHERE state_name = 'Uttarakhand'), 'Tier 3', true),
('Rudrapur', (SELECT state_id FROM states WHERE state_name = 'Uttarakhand'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;

-- Insert Tier 3 cities for West Bengal
INSERT INTO cities (city_name, state_id, tier, is_active) VALUES
('Asansol', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Baharampur', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Balurghat', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Bardhaman', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Darjeeling', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Durgapur', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Haldia', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Howrah', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Jalpaiguri', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Kharagpur', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Krishnanagar', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true),
('Siliguri', (SELECT state_id FROM states WHERE state_name = 'West Bengal'), 'Tier 3', true)
ON CONFLICT (city_name, state_id) DO NOTHING;
