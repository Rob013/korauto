-- Fix map_complete_api_data function to avoid 100-argument limit
-- This replaces the single large jsonb_build_object call with chunked calls

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
  
  -- Map EVERY available field from API (split into chunks to avoid 100-argument limit)
  mapped_data := 
    -- Basic vehicle information (chunk 1)
    jsonb_build_object(
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
      'all_images_urls', all_images
    ) ||
    -- Engine and performance data (chunk 2)
    jsonb_build_object(
      'engine_size', COALESCE(api_record->>'engine_size', api_record->>'displacement', api_record->>'engine_capacity'),
      'engine_displacement', api_record->>'displacement',
      'cylinders', COALESCE((api_record->>'cylinders')::INTEGER, (api_record->>'engine_cylinders')::INTEGER),
      'max_power', COALESCE(api_record->>'power', api_record->>'max_power', api_record->>'horsepower'),
      'torque', api_record->>'torque',
      'acceleration', COALESCE(api_record->>'acceleration', api_record->>'zero_to_sixty'),
      'top_speed', COALESCE(api_record->>'top_speed', api_record->>'max_speed'),
      'co2_emissions', api_record->>'co2_emissions',
      'fuel_consumption', COALESCE(api_record->>'fuel_consumption', api_record->>'mpg'),
      'doors', COALESCE((api_record->>'doors')::INTEGER, (api_record->>'door_count')::INTEGER),
      'seats', COALESCE((api_record->>'seats')::INTEGER, (api_record->>'seat_count')::INTEGER),
      'body_style', COALESCE(api_record->>'body_style', api_record->>'body_type'),
      'drive_type', COALESCE(api_record->>'drive_type', api_record->>'drivetrain')
    ) ||
    -- Auction and sale data (chunk 3)
    jsonb_build_object(
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
      'previous_owners', COALESCE((api_record->>'previous_owners')::INTEGER, 1),
      'service_history', api_record->>'service_history',
      'accident_history', COALESCE(api_record->>'accident_history', api_record->>'damage_history'),
      'modifications', api_record->>'modifications',
      'warranty_info', api_record->>'warranty'
    ) ||
    -- Registration and legal data (chunk 4)
    jsonb_build_object(
      'registration_date', COALESCE(api_record->>'registration_date', api_record->>'reg_date'),
      'first_registration', api_record->>'first_registration',
      'mot_expiry', api_record->>'mot_expiry',
      'road_tax', (api_record->>'road_tax')::NUMERIC,
      'insurance_group', api_record->>'insurance_group',
      'title_status', COALESCE(api_record->>'title_status', api_record->>'title'),
      'keys_count', COALESCE((api_record->>'keys')::INTEGER, (api_record->>'key_count')::INTEGER, 0),
      'keys_count_detailed', COALESCE((api_record->>'keys')::INTEGER, 0),
      'books_count', COALESCE((api_record->>'books')::INTEGER, 0),
      'spare_key_available', COALESCE((api_record->>'spare_key')::BOOLEAN, false),
      'service_book_available', COALESCE((api_record->>'service_book')::BOOLEAN, false),
      'location_country', COALESCE(api_record->>'country', 'South Korea'),
      'location_state', api_record->>'state',
      'location_city', api_record->>'city',
      'seller_type', api_record->>'seller_type'
    ) ||
    -- Damage, features and metadata (chunk 5)
    jsonb_build_object(
      'damage_primary', api_record->>'primary_damage',
      'damage_secondary', api_record->>'secondary_damage',
      'features', COALESCE(api_record->'features', api_record->'equipment', '[]'::jsonb),
      'inspection_report', api_record->'inspection',
      'seller_notes', COALESCE(api_record->>'description', api_record->>'notes', api_record->>'seller_notes'),
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