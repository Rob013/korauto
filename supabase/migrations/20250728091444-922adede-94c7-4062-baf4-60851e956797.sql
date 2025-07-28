-- Add a few test cars directly to verify database is working
INSERT INTO cars (id, external_id, make, model, year, price, title, source_api, last_synced_at)
VALUES 
  ('test-1', 'test-1', 'Toyota', 'Camry', 2022, 28000, 'Toyota Camry 2022', 'auctionapis', now()),
  ('test-2', 'test-2', 'Honda', 'Civic', 2021, 24000, 'Honda Civic 2021', 'auctionapis', now()),
  ('test-3', 'test-3', 'BMW', '3 Series', 2023, 45000, 'BMW 3 Series 2023', 'auctionapis', now())
ON CONFLICT (id) DO UPDATE SET last_synced_at = now();