/*
  # Add Sample Card Data

  1. Sample Data
    - Add sample diesel cards for common fuel providers
    - Add sample debit cards for common banks

  2. Notes
    - Using ON CONFLICT to avoid duplicates
    - Cards are marked as active by default
*/

INSERT INTO diesel_cards_master (card_name, card_number, provider) VALUES
  ('HP Fuel Card 001', '1234567890', 'HP'),
  ('Indian Oil Card 001', '2345678901', 'Indian Oil'),
  ('BPCL Card 001', '3456789012', 'Bharat Petroleum'),
  ('Shell Card 001', '4567890123', 'Shell')
ON CONFLICT (card_number) DO NOTHING;

INSERT INTO debit_cards_master (card_name, card_number_last4, bank_name) VALUES
  ('HDFC Business Card', '1234', 'HDFC Bank'),
  ('ICICI Fleet Card', '5678', 'ICICI Bank'),
  ('SBI Corporate Card', '9012', 'State Bank of India'),
  ('Axis Business Card', '3456', 'Axis Bank')
ON CONFLICT DO NOTHING;