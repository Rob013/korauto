#!/usr/bin/env tsx

/**
 * Test Catalog Integration Script
 * 
 * This script tests the catalog integration by checking if the
 * Auctions API cars are properly integrated into the existing system.
 */

import { createClient } from '@supabase/supabase-js';

// Use the environment variables directly
const SUPABASE_URL = "https://qtyyiqimkysmjnaocswe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCatalogIntegration() {
  console.log('🔍 Testing catalog integration...');
  
  try {
    // Test 1: Check if the auctions-cars-api endpoint works
    console.log('\n1️⃣ Testing Auctions API endpoint...');
    try {
      const { data: apiTest, error: apiError } = await supabase.functions.invoke('auctions-cars-api', {
        body: {
          page: 1,
          per_page: 5
        }
      });

      if (apiError) {
        console.log('❌ Auctions API endpoint failed:', apiError.message);
      } else {
        console.log(`✅ Auctions API endpoint working: ${apiTest?.data?.length || 0} cars returned`);
        if (apiTest?.data?.length > 0) {
          console.log('   Sample car:', apiTest.data[0].title);
        }
      }
    } catch (endpointError) {
      console.log('❌ Auctions API endpoint error:', endpointError);
    }

    // Test 2: Check the main cars API endpoint
    console.log('\n2️⃣ Testing main cars API endpoint...');
    try {
      const { data: carsApiTest, error: carsApiError } = await supabase.functions.invoke('secure-cars-api', {
        body: {
          endpoint: 'cars',
          filters: {
            page: '1',
            per_page: '5'
          }
        }
      });

      if (carsApiError) {
        console.log('❌ Main cars API failed:', carsApiError.message);
      } else {
        console.log(`✅ Main cars API working: ${carsApiTest?.data?.length || 0} cars returned`);
        if (carsApiTest?.data?.length > 0) {
          console.log('   Sample car:', carsApiTest.data[0].title);
        }
      }
    } catch (carsApiError) {
      console.log('❌ Main cars API error:', carsApiError);
    }

    // Test 3: Check the unified cars endpoint
    console.log('\n3️⃣ Testing unified cars endpoint...');
    try {
      const { data: unifiedTest, error: unifiedError } = await supabase.functions.invoke('unified-cars', {
        body: {
          page: 1,
          pageSize: 5
        }
      });

      if (unifiedError) {
        console.log('❌ Unified cars API failed:', unifiedError.message);
      } else {
        console.log(`✅ Unified cars API working: ${unifiedTest?.cars?.length || 0} cars returned`);
        if (unifiedTest?.cars?.length > 0) {
          console.log('   Sample car:', unifiedTest.cars[0].title);
        }
      }
    } catch (unifiedError) {
      console.log('❌ Unified cars API error:', unifiedError);
    }

    // Test 4: Check database functions
    console.log('\n4️⃣ Testing database functions...');
    try {
      const { data: countTest, error: countError } = await supabase
        .rpc('cars_filtered_count', { p_filters: {} });

      if (countError) {
        console.log('❌ cars_filtered_count function failed:', countError.message);
      } else {
        console.log(`✅ cars_filtered_count function working: ${countTest} total cars`);
      }
    } catch (functionError) {
      console.log('❌ cars_filtered_count function error:', functionError);
    }

    // Test 5: Check if we can read from cars table
    console.log('\n5️⃣ Testing cars table access...');
    try {
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('id, make, model, year, source_api')
        .limit(5);

      if (carsError) {
        console.log('❌ Cars table access failed:', carsError.message);
      } else {
        console.log(`✅ Cars table accessible: ${carsData?.length || 0} cars found`);
        if (carsData && carsData.length > 0) {
          console.log('   Sample cars:');
          carsData.forEach((car, index) => {
            console.log(`     ${index + 1}. ${car.year} ${car.make} ${car.model} (${car.source_api})`);
          });
        }
      }
    } catch (carsError) {
      console.log('❌ Cars table access error:', carsError);
    }

    // Test 6: Check active_cars view
    console.log('\n6️⃣ Testing active_cars view...');
    try {
      const { data: activeCarsData, error: activeCarsError } = await supabase
        .from('active_cars')
        .select('id, make, model, year')
        .limit(5);

      if (activeCarsError) {
        console.log('❌ Active cars view failed:', activeCarsError.message);
      } else {
        console.log(`✅ Active cars view working: ${activeCarsData?.length || 0} cars found`);
        if (activeCarsData && activeCarsData.length > 0) {
          console.log('   Sample cars:');
          activeCarsData.forEach((car, index) => {
            console.log(`     ${index + 1}. ${car.year} ${car.make} ${car.model}`);
          });
        }
      }
    } catch (activeCarsError) {
      console.log('❌ Active cars view error:', activeCarsError);
    }

    console.log('\n✨ Integration test completed!');
    console.log('\n📋 Summary:');
    console.log('   • Check the results above to see which components are working');
    console.log('   • If Auctions API endpoint works but returns 0 cars, you need to sync data');
    console.log('   • If main cars API works, the existing system is functional');
    console.log('   • If unified cars API works, the integration is complete');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run the test
testCatalogIntegration().catch(console.error);
