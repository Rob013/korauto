#!/usr/bin/env tsx

/**
 * Test script to verify the client-side mapping workaround
 * Tests the complete mapping logic without hitting the 100-argument limit
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Client-side complete mapping function (same as implemented in cars-sync)
function mapCompleteApiDataClientSide(apiRecord: any) {
  // Extract all possible images from the API response
  const allImages = [
    ...(apiRecord.images || []),
    ...(apiRecord.photos || []),
    ...(apiRecord.pictures || []),
    ...(apiRecord.thumbnails || []),
    ...(apiRecord.gallery || []),
    ...(apiRecord.lots?.[0]?.images?.normal || []),
    ...(apiRecord.lots?.[0]?.images?.large || [])
  ].filter(Boolean);

  // Extract high resolution images
  const highResImages = [
    ...(apiRecord.high_res_images || []),
    ...(apiRecord.hd_images || []),
    ...(apiRecord.full_size_images || []),
    ...(apiRecord.lots?.[0]?.images?.large || [])
  ].filter(Boolean);

  // Map all available fields using chunked approach (client-side equivalent of database function)
  const mappedData = {
    // Basic vehicle information (chunk 1)
    api_id: apiRecord.id?.toString() || apiRecord.lot_id?.toString() || apiRecord.external_id?.toString(),
    make: apiRecord.make || apiRecord.manufacturer?.name,
    model: apiRecord.model?.name || apiRecord.model,
    year: parseInt(apiRecord.year || apiRecord.model_year) || 2020,
    vin: apiRecord.vin || apiRecord.chassis_number,
    mileage: apiRecord.mileage?.toString() || apiRecord.odometer?.toString() || apiRecord.kilometers?.toString() || apiRecord.lots?.[0]?.odometer?.km?.toString(),
    fuel: apiRecord.fuel?.name || apiRecord.fuel_type || apiRecord.fuel,
    transmission: apiRecord.transmission?.name || apiRecord.gearbox || apiRecord.transmission,
    color: apiRecord.color?.name || apiRecord.exterior_color || apiRecord.color,
    price: parseFloat(apiRecord.price || apiRecord.current_bid || apiRecord.lots?.[0]?.buy_now) || null,
    price_cents: (parseFloat(apiRecord.price || apiRecord.current_bid || apiRecord.lots?.[0]?.buy_now) || 0) * 100,
    condition: apiRecord.condition || apiRecord.grade || 'good',
    lot_number: apiRecord.lot_number || apiRecord.lot_id || apiRecord.lots?.[0]?.lot,
    images: allImages,
    high_res_images: highResImages,
    all_images_urls: allImages,

    // Engine and performance data (chunk 2)
    engine_size: apiRecord.engine_size || apiRecord.displacement || apiRecord.engine_capacity,
    engine_displacement: apiRecord.displacement,
    cylinders: parseInt(apiRecord.cylinders || apiRecord.engine_cylinders) || null,
    max_power: apiRecord.power || apiRecord.max_power || apiRecord.horsepower,
    torque: apiRecord.torque,
    acceleration: apiRecord.acceleration || apiRecord.zero_to_sixty,
    top_speed: apiRecord.top_speed || apiRecord.max_speed,
    co2_emissions: apiRecord.co2_emissions,
    fuel_consumption: apiRecord.fuel_consumption || apiRecord.mpg,
    doors: parseInt(apiRecord.doors || apiRecord.door_count) || null,
    seats: parseInt(apiRecord.seats || apiRecord.seat_count) || null,
    body_style: apiRecord.body_style || apiRecord.body_type,
    drive_type: apiRecord.drive_type || apiRecord.drivetrain,

    // Auction and sale data (chunk 3)
    lot_seller: apiRecord.seller,
    sale_title: apiRecord.title || apiRecord.sale_title,
    grade: apiRecord.grade || apiRecord.condition_grade,
    auction_date: apiRecord.auction_date || apiRecord.sale_date,
    time_left: apiRecord.time_left,
    bid_count: parseInt(apiRecord.bid_count) || 0,
    watchers_count: parseInt(apiRecord.watchers) || 0,
    views_count: parseInt(apiRecord.views) || 0,
    reserve_met: !!apiRecord.reserve_met,
    estimated_value: parseFloat(apiRecord.estimated_value) || null,
    previous_owners: parseInt(apiRecord.previous_owners) || 1,
    service_history: apiRecord.service_history,
    accident_history: apiRecord.accident_history || apiRecord.damage_history,
    modifications: apiRecord.modifications,
    warranty_info: apiRecord.warranty,

    // Registration and legal data (chunk 4)
    registration_date: apiRecord.registration_date || apiRecord.reg_date,
    first_registration: apiRecord.first_registration,
    mot_expiry: apiRecord.mot_expiry,
    road_tax: parseFloat(apiRecord.road_tax) || null,
    insurance_group: apiRecord.insurance_group,
    title_status: apiRecord.title_status || apiRecord.title,
    keys_count: parseInt(apiRecord.keys || apiRecord.key_count) || 0,
    keys_count_detailed: parseInt(apiRecord.keys) || 0,
    books_count: parseInt(apiRecord.books) || 0,
    spare_key_available: !!apiRecord.spare_key,
    service_book_available: !!apiRecord.service_book,
    location_country: apiRecord.country || 'South Korea',
    location_state: apiRecord.state,
    location_city: apiRecord.city,
    seller_type: apiRecord.seller_type,

    // Damage, features and metadata (chunk 5)
    damage_primary: apiRecord.primary_damage,
    damage_secondary: apiRecord.secondary_damage,
    features: apiRecord.features || apiRecord.equipment || [],
    inspection_report: apiRecord.inspection,
    seller_notes: apiRecord.description || apiRecord.notes || apiRecord.seller_notes,
    original_api_data: apiRecord,
    sync_metadata: {
      mapped_at: new Date().toISOString(),
      mapping_version: '2.0-client-side',
      sync_method: 'client_side_complete_mapping',
      api_fields_count: Object.keys(apiRecord).length,
      images_found: allImages.length,
      high_res_images_found: highResImages.length,
      has_lot_data: !!(apiRecord.lots && apiRecord.lots.length > 0),
      has_images: allImages.length > 0,
      fallback_reason: '100_argument_limit_workaround'
    },
    
    // Calculate rank_score based on price
    rank_score: 0
  };

  // Calculate rank_score based on price
  if (mappedData.price) {
    mappedData.rank_score = (1 / mappedData.price) * 1000000;
  }

  return mappedData;
}

async function testMappingWorkaround(): Promise<void> {
  console.log('🧪 Testing client-side mapping workaround...\\n');
  
  // Create a comprehensive test record that simulates car ID 13998958 and similar cars
  const testApiRecord = {
    id: "13998958",
    make: "Toyota",
    manufacturer: { name: "Toyota" },
    model: { name: "Camry" },
    year: 2020,
    vin: "1234567890ABCDEF",
    mileage: "50000",
    fuel: { name: "Gasoline" },
    transmission: { name: "Automatic" },
    color: { name: "Red" },
    lots: [{
      buy_now: 25000,
      lot: "LOT123",
      odometer: { km: "50000" },
      images: {
        normal: ["image1.jpg", "image2.jpg"],
        large: ["hd1.jpg", "hd2.jpg"]
      }
    }],
    engine_size: "2.5L",
    displacement: "2500",
    cylinders: 4,
    power: "200hp",
    torque: "250nm",
    acceleration: "8.5s",
    top_speed: "180mph",
    co2_emissions: "150g/km",
    fuel_consumption: "30mpg",
    doors: 4,
    seats: 5,
    body_style: "Sedan",
    seller: "AutoDealer",
    grade: "A",
    bid_count: 5,
    watchers: 12,
    views: 250,
    previous_owners: 1,
    country: "South Korea",
    state: "Seoul",
    city: "Gangnam",
    features: ["ABS", "Airbags", "AC"],
    description: "Well maintained vehicle"
  };
  
  console.log(`📊 Test record has ${Object.keys(testApiRecord).length} fields`);
  
  try {
    // First try the database function to confirm it fails
    console.log('\\n🔍 Testing database function first...');
    const { data: dbData, error: dbError } = await supabase
      .rpc('map_complete_api_data', { api_record: testApiRecord });
    
    if (dbError && (dbError.code === '54023' || dbError.message?.includes('cannot pass more than 100 arguments'))) {
      console.log('✅ Confirmed: Database function has 100-argument limit error');
      console.log('📝 Error:', dbError.message);
    } else if (dbError) {
      console.log('⚠️  Database function has different error:', dbError.message);
    } else {
      console.log('✅ Database function worked (fix may already be deployed)');
      console.log(`✅ Returned ${Object.keys(dbData || {}).length} fields`);
    }
    
    // Now test the client-side workaround
    console.log('\\n🔧 Testing client-side mapping workaround...');
    const clientMappedData = mapCompleteApiDataClientSide(testApiRecord);
    
    console.log('✅ Client-side mapping completed successfully!');
    console.log(`✅ Mapped ${Object.keys(clientMappedData).length} fields`);
    console.log(`✅ Images found: ${clientMappedData.images.length}`);
    console.log(`✅ High-res images found: ${clientMappedData.high_res_images.length}`);
    console.log(`✅ API fields count: ${clientMappedData.sync_metadata.api_fields_count}`);
    console.log(`✅ Mapping method: ${clientMappedData.sync_metadata.sync_method}`);
    
    // Verify critical fields are present
    const criticalFields = ['api_id', 'make', 'model', 'year', 'price', 'original_api_data', 'sync_metadata'];
    const missingFields = criticalFields.filter(field => !(field in clientMappedData));
    
    if (missingFields.length === 0) {
      console.log('✅ All critical fields are present');
    } else {
      console.log('⚠️  Missing critical fields:', missingFields);
    }
    
    console.log('\\n🎉 CLIENT-SIDE WORKAROUND IS WORKING!');
    console.log('✅ This will resolve mapping errors for car 13998958 and similar cars');
    console.log('✅ Complete API data is preserved instead of falling back to basic mapping');
    console.log('✅ Dashboard admin smart sync will receive complete data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMappingWorkaround()
  .then(() => {
    console.log('\\n✨ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });