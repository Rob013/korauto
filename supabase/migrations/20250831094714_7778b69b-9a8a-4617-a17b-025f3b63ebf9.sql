-- Complete Sync System: Resume from 116k and Map All API Data 1:1

-- 1. Enhanced cars_cache table for complete API data mapping
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS api_version TEXT DEFAULT '1.0';
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS last_api_response JSONB;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS all_images_urls TEXT[];
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS original_api_data JSONB;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT '{}';

-- Add missing critical fields for complete API mapping
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS lot_seller TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS sale_title TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS engine_displacement TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS max_power TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS torque TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS acceleration TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS top_speed TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS co2_emissions TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS fuel_consumption TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS warranty_info TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS service_history TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS modifications TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS accident_history TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS previous_owners INTEGER DEFAULT 1;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS registration_date DATE;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS first_registration DATE;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS mot_expiry DATE;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS road_tax NUMERIC;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS insurance_group TEXT;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS keys_count_detailed INTEGER DEFAULT 0;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS books_count INTEGER DEFAULT 0;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS spare_key_available BOOLEAN DEFAULT false;
ALTER TABLE cars_cache ADD COLUMN IF NOT EXISTS service_book_available BOOLEAN DEFAULT false;

-- Add indexes for performance on new fields
CREATE INDEX IF NOT EXISTS idx_cars_cache_api_version ON cars_cache(api_version);
CREATE INDEX IF NOT EXISTS idx_cars_cache_grade ON cars_cache(grade);
CREATE INDEX IF NOT EXISTS idx_cars_cache_previous_owners ON cars_cache(previous_owners);
CREATE INDEX IF NOT EXISTS idx_cars_cache_sync_metadata ON cars_cache USING GIN(sync_metadata);

-- 2. Enhanced sync_status for bulletproof resumability
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS api_endpoint_cursor TEXT;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS last_successful_record_id TEXT;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS failed_batches JSONB DEFAULT '[]';
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS retry_queue JSONB DEFAULT '[]';
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS data_mapping_version TEXT DEFAULT '2.0';
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS images_download_queue JSONB DEFAULT '[]';
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS images_processed INTEGER DEFAULT 0;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS images_failed INTEGER DEFAULT 0;
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create enhanced resume function that handles exactly where we left off
CREATE OR REPLACE FUNCTION get_precise_resume_position()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sync_info RECORD;
  last_processed_id TEXT;
  records_count INTEGER;
  resume_page INTEGER;
  resume_cursor TEXT;
BEGIN
  -- Get current sync status
  SELECT * INTO sync_info
  FROM sync_status 
  WHERE id = 'cars-sync-main'
  LIMIT 1;
  
  -- Get actual count from cars_cache
  SELECT COUNT(*) INTO records_count FROM cars_cache;
  
  -- If we have 116,193 records, calculate exact resume position
  IF records_count >= 116000 THEN
    -- Get the last processed record to resume from
    SELECT api_id INTO last_processed_id 
    FROM cars_cache 
    ORDER BY created_at DESC, api_id DESC 
    LIMIT 1;
    
    -- Calculate page based on actual processed records
    -- Assuming ~250 records per page on average
    resume_page := GREATEST(1, (records_count / 250) - 2); -- Start 2 pages back for safety
    
    -- Use the last successful cursor if available
    resume_cursor := COALESCE(sync_info.api_endpoint_cursor, sync_info.last_successful_record_id);
    
    RETURN jsonb_build_object(
      'should_resume', true,
      'resume_from_page', resume_page,
      'resume_cursor', resume_cursor,
      'last_processed_id', last_processed_id,
      'existing_records', records_count,
      'current_sync_status', COALESCE(sync_info.status, 'unknown'),
      'resume_strategy', 'precise_continuation',
      'data_mapping_version', '2.0'
    );
  ELSE
    -- Fresh start or small resume
    RETURN jsonb_build_object(
      'should_resume', false,
      'resume_from_page', 1,
      'existing_records', records_count,
      'resume_strategy', 'fresh_start',
      'data_mapping_version', '2.0'
    );
  END IF;
END;
$$;

-- 4. Enhanced data mapping function for complete API 1:1 mapping
CREATE OR REPLACE FUNCTION map_complete_api_data(api_record JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  mapped_data JSONB;
  all_images TEXT[];
  high_res_images TEXT[];
BEGIN
  -- Extract ALL possible images from the API response
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(
      COALESCE(api_record->'images', '[]'::jsonb) ||
      COALESCE(api_record->'photos', '[]'::jsonb) ||
      COALESCE(api_record->'pictures', '[]'::jsonb) ||
      COALESCE(api_record->'thumbnails', '[]'::jsonb) ||
      COALESCE(api_record->'gallery', '[]'::jsonb)
    )
  ) INTO all_images;
  
  -- Extract high resolution images
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(
      COALESCE(api_record->'high_res_images', '[]'::jsonb) ||
      COALESCE(api_record->'hd_images', '[]'::jsonb) ||
      COALESCE(api_record->'full_size_images', '[]'::jsonb)
    )
  ) INTO high_res_images;
  
  -- Map EVERY available field from API
  mapped_data := jsonb_build_object(
    'api_id', COALESCE(api_record->>'id', api_record->>'lot_id', api_record->>'external_id'),
    'make', api_record->>'make',
    'model', api_record->>'model',
    'year', COALESCE((api_record->>'year')::INTEGER, (api_record->>'model_year')::INTEGER),
    'vin', COALESCE(api_record->>'vin', api_record->>'chassis_number'),
    'mileage', COALESCE(api_record->>'mileage', api_record->>'odometer', api_record->>'kilometers'),
    'fuel', COALESCE(api_record->>'fuel', api_record->>'fuel_type'),
    'transmission', COALESCE(api_record->>'transmission', api_record->>'gearbox'),
    'color', COALESCE(api_record->>'color', api_record->>'exterior_color'),
    'price', COALESCE((api_record->>'price')::NUMERIC, (api_record->>'current_bid')::NUMERIC),
    'price_cents', COALESCE((api_record->>'price')::NUMERIC * 100, (api_record->>'current_bid')::NUMERIC * 100),
    'condition', COALESCE(api_record->>'condition', api_record->>'grade'),
    'lot_number', COALESCE(api_record->>'lot_number', api_record->>'lot_id'),
    'images', to_jsonb(all_images),
    'high_res_images', to_jsonb(high_res_images),
    'all_images_urls', all_images,
    
    -- Complete engine/performance data
    'engine_size', COALESCE(api_record->>'engine_size', api_record->>'displacement', api_record->>'engine_capacity'),
    'engine_displacement', api_record->>'displacement',
    'cylinders', COALESCE((api_record->>'cylinders')::INTEGER, (api_record->>'engine_cylinders')::INTEGER),
    'max_power', COALESCE(api_record->>'power', api_record->>'max_power', api_record->>'horsepower'),
    'torque', api_record->>'torque',
    'acceleration', COALESCE(api_record->>'acceleration', api_record->>'zero_to_sixty'),
    'top_speed', COALESCE(api_record->>'top_speed', api_record->>'max_speed'),
    'co2_emissions', api_record->>'co2_emissions',
    'fuel_consumption', COALESCE(api_record->>'fuel_consumption', api_record->>'mpg'),
    
    -- Complete vehicle details
    'doors', COALESCE((api_record->>'doors')::INTEGER, (api_record->>'door_count')::INTEGER),
    'seats', COALESCE((api_record->>'seats')::INTEGER, (api_record->>'seat_count')::INTEGER),
    'body_style', COALESCE(api_record->>'body_style', api_record->>'body_type'),
    'drive_type', COALESCE(api_record->>'drive_type', api_record->>'drivetrain'),
    
    -- Auction/sale specific data
    'lot_seller', api_record->>'seller',
    'sale_title', COALESCE(api_record->>'title', api_record->>'sale_title'),
    'grade', COALESCE(api_record->>'grade', api_record->>'condition_grade'),
    'auction_date', COALESCE(api_record->>'auction_date', api_record->>'sale_date'),
    'time_left', api_record->>'time_left',
    'bid_count', COALESCE((api_record->>'bid_count')::INTEGER, 0),
    'watchers_count', COALESCE((api_record->>'watchers')::INTEGER, 0),
    'views_count', COALESCE((api_record->>'views')::INTEGER, 0),
    'reserve_met', COALESCE((api_record->>'reserve_met')::BOOLEAN, false),
    'estimated_value', (api_record->>'estimated_value')::NUMERIC,
    
    -- History and documentation
    'previous_owners', COALESCE((api_record->>'previous_owners')::INTEGER, 1),
    'service_history', api_record->>'service_history',
    'accident_history', COALESCE(api_record->>'accident_history', api_record->>'damage_history'),
    'modifications', api_record->>'modifications',
    'warranty_info', api_record->>'warranty',
    
    -- Registration and legal
    'registration_date', COALESCE(api_record->>'registration_date', api_record->>'reg_date'),
    'first_registration', api_record->>'first_registration',
    'mot_expiry', api_record->>'mot_expiry',
    'road_tax', (api_record->>'road_tax')::NUMERIC,
    'insurance_group', api_record->>'insurance_group',
    'title_status', COALESCE(api_record->>'title_status', api_record->>'title'),
    
    -- Keys and documentation
    'keys_count', COALESCE((api_record->>'keys')::INTEGER, (api_record->>'key_count')::INTEGER, 0),
    'keys_count_detailed', COALESCE((api_record->>'keys')::INTEGER, 0),
    'books_count', COALESCE((api_record->>'books')::INTEGER, 0),
    'spare_key_available', COALESCE((api_record->>'spare_key')::BOOLEAN, false),
    'service_book_available', COALESCE((api_record->>'service_book')::BOOLEAN, false),
    
    -- Location data
    'location_country', COALESCE(api_record->>'country', 'South Korea'),
    'location_state', api_record->>'state',
    'location_city', api_record->>'city',
    'seller_type', api_record->>'seller_type',
    
    -- Damage information
    'damage_primary', api_record->>'primary_damage',
    'damage_secondary', api_record->>'secondary_damage',
    
    -- Features and equipment
    'features', COALESCE(api_record->'features', api_record->'equipment', '[]'::jsonb),
    'inspection_report', api_record->'inspection',
    
    -- Seller notes and descriptions
    'seller_notes', COALESCE(api_record->>'description', api_record->>'notes', api_record->>'seller_notes'),
    
    -- Metadata
    'original_api_data', api_record,
    'sync_metadata', jsonb_build_object(
      'mapped_at', NOW(),
      'mapping_version', '2.0',
      'fields_mapped', jsonb_object_keys(api_record),
      'images_found', array_length(all_images, 1),
      'high_res_images_found', array_length(high_res_images, 1)
    )
  );
  
  RETURN mapped_data;
END;
$$;

-- 5. Update sync checkpoint with precise tracking
CREATE OR REPLACE FUNCTION save_precise_sync_checkpoint(
  sync_id TEXT,
  page_number INTEGER,
  record_id TEXT,
  api_cursor TEXT,
  batch_results JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE sync_status 
  SET 
    current_page = page_number,
    last_successful_record_id = record_id,
    api_endpoint_cursor = api_cursor,
    checkpoint_data = jsonb_build_object(
      'page', page_number,
      'cursor', api_cursor,
      'last_record', record_id,
      'batch_results', batch_results,
      'timestamp', NOW()
    ),
    last_activity_at = NOW(),
    last_heartbeat = NOW(),
    updated_at = NOW()
  WHERE id = sync_id;
  
  -- Log checkpoint for debugging
  RAISE NOTICE 'Checkpoint saved: Page %, Record %, Cursor %', page_number, record_id, api_cursor;
END;
$$;

-- 6. Create global sorting indexes for performance
CREATE INDEX IF NOT EXISTS idx_cars_cache_price_cents_id ON cars_cache(price_cents ASC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_year_id ON cars_cache(year DESC NULLS LAST, id ASC);
CREATE INDEX IF NOT EXISTS idx_cars_cache_make_model ON cars_cache(make, model);
CREATE INDEX IF NOT EXISTS idx_cars_cache_created_at ON cars_cache(created_at DESC);

-- 7. Reset the stuck sync to allow resume
UPDATE sync_status 
SET 
  status = 'failed',
  error_message = 'Sync was stuck at 116,193 - reset for precise resume',
  completed_at = NOW(),
  last_activity_at = NOW()
WHERE id = 'cars-sync-main' AND status = 'running';

-- 8. Ensure cars_cache is ready for global sorting
ANALYZE cars_cache;