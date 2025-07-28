-- Remove test cars and let real API cars populate
DELETE FROM cars WHERE id LIKE 'test-%';