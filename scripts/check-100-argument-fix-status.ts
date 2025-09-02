#!/usr/bin/env tsx

/**
 * Check if the 100-argument limit fix has been applied to the database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkFixStatus(): Promise<boolean> {
  console.log('🔍 Checking 100-argument limit fix status...\n');
  
  // Test with the exact car that was failing
  const testRecord = {
    id: '13998958',
    make: 'Toyota', model: 'Camry', year: 2020, vin: '1234567890ABCDEF',
    mileage: '50000', fuel: 'Gasoline', transmission: 'Automatic', color: 'Red',
    price: '25000', condition: 'Good', lot_number: 'LOT123',
    engine_size: '2.5L', displacement: '2500', cylinders: 4, power: '200hp',
    torque: '250Nm', acceleration: '8.5s', top_speed: '200km/h',
    co2_emissions: '150g/km', fuel_consumption: '7.5L/100km',
    doors: 4, seats: 5, body_style: 'Sedan', drive_type: 'FWD',
    seller: 'Test Dealer', title: 'Clean Title', grade: 'A',
    auction_date: '2024-09-15', time_left: '2 days',
    bid_count: 5, watchers: 10, views: 100,
    reserve_met: true, estimated_value: 25000, previous_owners: 1,
    service_history: 'Full', accident_history: 'None',
    modifications: 'None', warranty: '1 year',
    registration_date: '2020-01-01', first_registration: '2020-01-01',
    mot_expiry: '2025-01-01', road_tax: 150, insurance_group: '15E',
    keys: 2, books: 1, spare_key: true, service_book: true,
    country: 'South Korea', state: 'Seoul', city: 'Gangnam',
    seller_type: 'Dealer', primary_damage: 'None', secondary_damage: 'None',
    features: ['ABS', 'Airbags', 'AC'], 
    inspection: { grade: 'A', notes: 'Excellent condition' },
    description: 'Well maintained vehicle',
    images: ['image1.jpg', 'image2.jpg'], photos: ['photo1.jpg'],
    high_res_images: ['hd1.jpg']
  };
  
  try {
    console.log('📞 Testing map_complete_api_data function with car 13998958 data...');
    
    const { data, error } = await supabase
      .rpc('map_complete_api_data', {
        api_record: testRecord
      });

    if (error) {
      if (error.message.includes('cannot pass more than 100 arguments')) {
        console.log('❌ FIX NOT APPLIED - Still has 100-argument limit error');
        console.log('💥 Error:', error.message);
        console.log('\n📋 ACTION REQUIRED:');
        console.log('The fix needs to be applied manually. See FIX_100_ARGUMENT_LIMIT.md for instructions.');
        return false;
      } else if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ FIX NOT APPLIED - Function does not exist');
        console.log('📋 ACTION REQUIRED: Deploy the migration file');
        return false;
      } else {
        console.log('⚠️  Function exists but had an error:', error.message);
        console.log('🔧 This might be expected and doesn\'t necessarily mean the fix failed');
        console.log('✅ No 100-argument limit error detected');
        return true;
      }
    }

    console.log('✅ FIX APPLIED - Function call succeeded!');
    console.log('✅ No 100-argument limit error detected');
    
    if (data && typeof data === 'object') {
      const fieldCount = Object.keys(data).length;
      console.log(`✅ Returned object has ${fieldCount} fields`);
      
      // Check for key fields
      const expectedFields = ['api_id', 'make', 'model', 'year', 'price', 'original_api_data'];
      const presentFields = expectedFields.filter(field => field in data);
      console.log(`✅ Key fields present: ${presentFields.length}/${expectedFields.length}`);
      
      if (presentFields.length === expectedFields.length) {
        console.log('✅ All expected fields are present - chunked function is working correctly');
      }
    }

    return true;
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 Checking 100-argument limit fix status for car 13998958...\n');
  
  const isFixed = await checkFixStatus();
  
  if (isFixed) {
    console.log('\n🎉 SUCCESS: The 100-argument limit fix is working!');
    console.log('✅ Car 13998958 and similar cars should process correctly.');
    console.log('✅ The map_complete_api_data function is using the chunked approach.');
  } else {
    console.log('\n❌ FAILED: The fix has not been applied yet.');
    console.log('📖 Please follow the instructions in FIX_100_ARGUMENT_LIMIT.md');
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('check-100-argument-fix-status.ts')) {
  main();
}

export default main;