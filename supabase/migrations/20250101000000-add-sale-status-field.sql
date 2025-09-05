-- Add sale_status field to cars table for enhanced status tracking
-- This enables the status badge functionality with granular sale status tracking

ALTER TABLE cars ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT NULL;

-- Create index for sale_status to improve query performance
CREATE INDEX IF NOT EXISTS idx_cars_sale_status ON cars(sale_status);

-- Create combined index for status and sale_status for badge queries
CREATE INDEX IF NOT EXISTS idx_cars_status_sale_status ON cars(status, sale_status);

-- Update existing cars with default sale_status based on current status
-- This ensures existing data works with the new status badge system
UPDATE cars 
SET sale_status = CASE 
  WHEN status = '3' THEN 'sold'
  WHEN status = '2' THEN 'pending'
  WHEN status = '1' THEN 'active'
  ELSE 'active'
END
WHERE sale_status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN cars.sale_status IS 'Granular sale status: active, pending, reserved, sold';