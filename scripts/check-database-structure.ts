#!/usr/bin/env tsx

/**
 * Check Database Structure Script
 * 
 * This script checks the database structure to understand
 * where cars are stored and how the system works.
 */

import { createClient } from '@supabase/supabase-js';

// Use the environment variables directly
const SUPABASE_URL = "https://qtyyiqimkysmjnaocswe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check what tables exist
    console.log('\n1️⃣ Checking available tables...');
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');

      if (tablesError) {
        console.log('❌ Could not get table list:', tablesError.message);
      } else {
        console.log('✅ Available tables:');
        (tables || []).forEach(table => {
          console.log(`   • ${table.table_name}`);
        });
      }
    } catch (error) {
      console.log('❌ Error checking tables:', error);
    }

    // Check cars_cache table
    console.log('\n2️⃣ Checking cars_cache table...');
    try {
      const { data: cacheData, error: cacheError } = await supabase
        .from('cars_cache')
        .select('id, make, model, year, created_at')
        .limit(5);

      if (cacheError) {
        console.log('❌ cars_cache table error:', cacheError.message);
      } else {
        console.log(`✅ cars_cache table: ${cacheData?.length || 0} cars found`);
        if (cacheData && cacheData.length > 0) {
          console.log('   Sample cars:');
          cacheData.forEach((car, index) => {
            console.log(`     ${index + 1}. ${car.year} ${car.make} ${car.model} (${car.id})`);
          });
        }
      }
    } catch (error) {
      console.log('❌ cars_cache table error:', error);
    }

    // Check cars_staging table
    console.log('\n3️⃣ Checking cars_staging table...');
    try {
      const { data: stagingData, error: stagingError } = await supabase
        .from('cars_staging')
        .select('id, make, model, year, source_api')
        .limit(5);

      if (stagingError) {
        console.log('❌ cars_staging table error:', stagingError.message);
      } else {
        console.log(`✅ cars_staging table: ${stagingData?.length || 0} cars found`);
        if (stagingData && stagingData.length > 0) {
          console.log('   Sample cars:');
          stagingData.forEach((car, index) => {
            console.log(`     ${index + 1}. ${car.year} ${car.make} ${car.model} (${car.source_api})`);
          });
        }
      }
    } catch (error) {
      console.log('❌ cars_staging table error:', error);
    }

    // Check if we can insert into cars_staging
    console.log('\n4️⃣ Testing cars_staging insert...');
    try {
      const testCar = {
        id: 'test_auctions_001',
        external_id: 'test_auctions_001',
        make: 'Test',
        model: 'Car',
        year: 2024,
        price: 10000,
        mileage: 0,
        title: 'Test Car from Auctions API',
        vin: null,
        color: 'Red',
        fuel: 'Gasoline',
        transmission: 'Automatic',
        condition: 'good',
        location: 'South Korea',
        lot_number: 'TEST_001',
        current_bid: 0,
        buy_now_price: 10000,
        final_bid: 0,
        sale_date: null,
        image_url: 'https://picsum.photos/400/300?random=test',
        images: JSON.stringify(['https://picsum.photos/400/300?random=test']),
        source_api: 'auctions_api',
        domain_name: 'auctionsapi_com',
        status: 'active',
        is_active: true,
        is_live: false,
        is_archived: false,
        keys_available: true,
        last_synced_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('cars_staging')
        .insert([testCar]);

      if (insertError) {
        console.log('❌ cars_staging insert failed:', insertError.message);
      } else {
        console.log('✅ cars_staging insert successful');
        
        // Clean up test data
        await supabase
          .from('cars_staging')
          .delete()
          .eq('id', 'test_auctions_001');
        console.log('   Test data cleaned up');
      }
    } catch (error) {
      console.log('❌ cars_staging insert error:', error);
    }

    // Check what the main cars API actually returns
    console.log('\n5️⃣ Analyzing main cars API response...');
    try {
      const { data: apiResponse, error: apiError } = await supabase.functions.invoke('secure-cars-api', {
        body: {
          endpoint: 'cars',
          filters: {
            page: '1',
            per_page: '3'
          }
        }
      });

      if (apiError) {
        console.log('❌ Main cars API error:', apiError.message);
      } else {
        console.log('✅ Main cars API response structure:');
        console.log('   • Data length:', apiResponse?.data?.length || 0);
        console.log('   • Meta:', apiResponse?.meta);
        if (apiResponse?.data?.length > 0) {
          console.log('   • Sample car structure:');
          const sampleCar = apiResponse.data[0];
          Object.keys(sampleCar).forEach(key => {
            console.log(`     - ${key}: ${typeof sampleCar[key]}`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Main cars API analysis error:', error);
    }

    console.log('\n✨ Database structure check completed!');
    console.log('\n📋 Summary:');
    console.log('   • Check the results above to understand the data structure');
    console.log('   • If cars_staging insert works, we can sync Auctions API cars there');
    console.log('   • The main cars API seems to be working with external data');

  } catch (error) {
    console.error('❌ Database structure check failed:', error);
  }
}

// Run the check
checkDatabaseStructure().catch(console.error);
