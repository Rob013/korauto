#!/usr/bin/env tsx

/**
 * Check Cars Status Script
 * 
 * This script checks the current state of cars in the database
 * and verifies the Auctions API integration.
 */

import { createClient } from '@supabase/supabase-js';

// Use the environment variables directly
const SUPABASE_URL = "https://qtyyiqimkysmjnaocswe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCarsStatus() {
  console.log('🔍 Checking cars status in database...');
  
  try {
    // Check total cars count
    const { data: totalCars, error: totalError } = await supabase
      .from('cars')
      .select('id', { count: 'exact' })
      .eq('is_archived', false)
      .eq('is_active', true);

    if (totalError) {
      console.error('❌ Error getting total cars count:', totalError);
      return;
    }

    console.log(`📊 Total active cars: ${totalCars?.length || 0}`);

    // Check cars by source
    const { data: sourceStats, error: sourceError } = await supabase
      .from('cars')
      .select('source_api')
      .eq('is_archived', false)
      .eq('is_active', true);

    if (sourceError) {
      console.error('❌ Error getting source stats:', sourceError);
      return;
    }

    // Calculate source counts
    const sourceCounts = (sourceStats || []).reduce((acc, car) => {
      acc[car.source_api] = (acc[car.source_api] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📈 Cars by Source:');
    Object.entries(sourceCounts).forEach(([source, count]) => {
      const sourceName = source === 'auctions_api' ? 'Auctions API (kbchachacha)' : 
                        source === 'auctionapis' ? 'Auction APIs' :
                        source === 'encar' ? 'Encar' : source;
      console.log(`   • ${sourceName}: ${count.toLocaleString()}`);
    });

    // Check recent Auctions API cars
    const { data: recentAuctionsCars, error: recentError } = await supabase
      .from('cars')
      .select('id, make, model, year, title, last_synced_at, source_api')
      .eq('source_api', 'auctions_api')
      .eq('is_archived', false)
      .eq('is_active', true)
      .order('last_synced_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Error getting recent Auctions API cars:', recentError);
    } else {
      console.log('\n🚗 Recent Auctions API Cars (last 10):');
      (recentAuctionsCars || []).forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.year} ${car.make} ${car.model} (${car.title}) - Synced: ${new Date(car.last_synced_at).toLocaleString()}`);
      });
    }

    // Check if Auctions API cars are being fetched in the catalog
    console.log('\n🔍 Checking catalog integration...');
    
    // Test the auctions-cars-api endpoint
    try {
      const { data: apiTest, error: apiError } = await supabase.functions.invoke('auctions-cars-api', {
        body: {
          page: 1,
          per_page: 5
        }
      });

      if (apiError) {
        console.log('⚠️ Auctions API endpoint test failed:', apiError.message);
      } else {
        console.log(`✅ Auctions API endpoint working: ${apiTest?.data?.length || 0} cars returned`);
        if (apiTest?.data?.length > 0) {
          console.log('   Sample car:', apiTest.data[0].title);
        }
      }
    } catch (endpointError) {
      console.log('⚠️ Could not test Auctions API endpoint:', endpointError);
    }

    // Check database functions
    console.log('\n🔧 Checking database functions...');
    
    try {
      const { data: countTest, error: countError } = await supabase
        .rpc('cars_filtered_count', { p_filters: {} });

      if (countError) {
        console.log('⚠️ cars_filtered_count function error:', countError.message);
      } else {
        console.log(`✅ cars_filtered_count function working: ${countTest} total cars`);
      }
    } catch (functionError) {
      console.log('⚠️ Could not test cars_filtered_count function:', functionError);
    }

    console.log('\n✨ Status check completed!');
    console.log('\n📋 Summary:');
    console.log(`   • Total cars in database: ${totalCars?.length || 0}`);
    console.log(`   • Auctions API cars: ${sourceCounts['auctions_api'] || 0}`);
    console.log(`   • Other API cars: ${(sourceCounts['auctionapis'] || 0) + (sourceCounts['encar'] || 0)}`);
    
    if ((sourceCounts['auctions_api'] || 0) > 0) {
      console.log('✅ Auctions API integration is working!');
    } else {
      console.log('⚠️ No Auctions API cars found. You may need to run the sync script.');
    }

  } catch (error) {
    console.error('❌ Error checking cars status:', error);
  }
}

// Run the check
checkCarsStatus().catch(console.error);

export { checkCarsStatus };
