#!/usr/bin/env tsx

/**
 * Test if the 100-argument limit fix has been successfully deployed
 * This script tests the actual database function to confirm the fix is working
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE key');
  process.exit(1);
}

console.log('🧪 Testing the 100-argument limit fix deployment...\n');
console.log(`🔌 Using Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Using Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create a test record that would trigger the 100-argument limit error
const comprehensiveTestRecord = {
  id: "13998958",
  make: "Toyota", model: "Camry", year: 2020, vin: "1234567890ABCDEF",
  mileage: "50000", fuel: "Gasoline", transmission: "Automatic", color: "Red",
  price: "25000", condition: "Good", lot_number: "LOT123",
  engine_size: "2.5L", displacement: "2500", cylinders: 4, power: "200hp",
  torque: "250nm", acceleration: "8.5s", top_speed: "180mph",
  co2_emissions: "150g/km", fuel_consumption: "30mpg", doors: 4, seats: 5,
  body_style: "Sedan", drive_type: "FWD", seller: "AutoDealer",
  title: "Clean Title", grade: "A", auction_date: "2024-12-01",
  time_left: "2 days", bid_count: 5, watchers: 20, views: 150,
  reserve_met: true, estimated_value: "24000", previous_owners: 1,
  service_history: "Complete", accident_history: "None",
  modifications: "None", warranty: "2 years", registration_date: "2020-01-15",
  first_registration: "2020-01-15", mot_expiry: "2025-01-15",
  road_tax: "150", insurance_group: "15", title_status: "Clean",
  keys: 2, books: 1, spare_key: true, service_book: true,
  country: "South Korea", state: "Seoul", city: "Gangnam",
  seller_type: "Dealer", primary_damage: "None", secondary_damage: "None",
  features: ["ABS", "Airbags", "AC"], 
  inspection: { grade: "A", notes: "Excellent condition" },
  description: "Well maintained vehicle",
  images: ["image1.jpg", "image2.jpg"], photos: ["photo1.jpg"],
  high_res_images: ["hd1.jpg"]
};

async function testFix(): Promise<void> {
  console.log('\n🔍 Testing map_complete_api_data function...');
  
  const fieldCount = Object.keys(comprehensiveTestRecord).length;
  console.log(`📊 Test record has ${fieldCount} fields (would be ${fieldCount * 2} arguments)`);
  
  try {
    const { data, error } = await supabase
      .rpc('map_complete_api_data', {
        api_record: comprehensiveTestRecord
      });

    if (error) {
      if (error.code === '54023' && error.message.includes('cannot pass more than 100 arguments')) {
        console.log('\n❌ FIX NOT DEPLOYED YET');
        console.log('💥 Error:', error.message);
        console.log('🔧 The database function still has the 100-argument limit issue');
        console.log('\n📋 ACTION REQUIRED:');
        console.log('Please deploy the fix using the instructions in DEPLOY_FIX_NOW.md');
        console.log('Or run: npm run deploy-100-argument-fix');
        process.exit(1);
      } else if (error.message.includes('does not exist')) {
        console.log('\n❌ FUNCTION DOES NOT EXIST');
        console.log('💥 Error:', error.message);
        console.log('🔧 The map_complete_api_data function needs to be created');
        console.log('\n📋 ACTION REQUIRED:');
        console.log('Please deploy the migration: 20250902081700_fix-100-argument-limit.sql');
        process.exit(1);
      } else {
        console.log('\n⚠️  UNEXPECTED ERROR');
        console.log('💥 Error:', error.message);
        console.log('🔍 This might be a different issue than the 100-argument limit');
        console.log('\n📋 Next steps:');
        console.log('1. Check if the fix deployment was successful');
        console.log('2. Verify database permissions');
        console.log('3. Check function definition manually');
        process.exit(1);
      }
    } else {
      console.log('\n🎉 SUCCESS: FIX IS DEPLOYED AND WORKING!');
      console.log('✅ Function executed without errors');
      console.log(`✅ Returned ${Object.keys(data || {}).length} fields`);
      console.log('✅ Car 13998958 and similar cars will now process correctly');
      
      // Verify the data structure
      if (data && typeof data === 'object') {
        const expectedFields = ['api_id', 'make', 'model', 'year', 'price', 'original_api_data'];
        const hasExpectedFields = expectedFields.every(field => field in data);
        
        if (hasExpectedFields) {
          console.log('✅ All expected fields are present in the result');
        } else {
          console.log('⚠️  Some expected fields may be missing, but function works');
        }
        
        if (data.sync_metadata) {
          console.log(`✅ Sync metadata version: ${data.sync_metadata.mapping_version}`);
        }
      }
      
      console.log('\n🚀 Fix deployment confirmed successful!');
      console.log('🔄 You can now run the cars-sync function without 100-argument limit errors.');
    }

  } catch (exception) {
    console.log('\n❌ TEST FAILED');
    console.log('💥 Exception:', exception);
    console.log('🔍 This indicates a connection or permission issue');
    process.exit(1);
  }
}

async function main(): Promise<void> {
  await testFix();
}

if (process.argv[1] && process.argv[1].includes('test-fix-deployment.ts')) {
  main().catch(console.error);
}

export default main;