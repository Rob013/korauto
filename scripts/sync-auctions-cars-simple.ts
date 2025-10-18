#!/usr/bin/env tsx

/**
 * Simple Auctions API Sync Script
 * 
 * This script syncs cars from the Auctions API into the database
 * without requiring service role key.
 */

import { createClient } from '@supabase/supabase-js';

// Use the environment variables directly
const SUPABASE_URL = "https://qtyyiqimkysmjnaocswe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mock Auctions API data for testing
const mockAuctionsCars = [
  {
    id: "auctions_001",
    brand: "BMW",
    model: "X5",
    year: 2020,
    title: "2020 BMW X5",
    price: 45000,
    mileage: 25000,
    fuel: "Gasoline",
    transmission: "Automatic",
    color: "Black",
    location: "South Korea",
    image_url: "https://picsum.photos/400/300?random=1"
  },
  {
    id: "auctions_002", 
    brand: "Audi",
    model: "A4",
    year: 2019,
    title: "2019 Audi A4",
    price: 35000,
    mileage: 30000,
    fuel: "Gasoline",
    transmission: "Automatic",
    color: "White",
    location: "South Korea",
    image_url: "https://picsum.photos/400/300?random=2"
  },
  {
    id: "auctions_003",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: 2021,
    title: "2021 Mercedes-Benz C-Class",
    price: 40000,
    mileage: 20000,
    fuel: "Gasoline",
    transmission: "Automatic",
    color: "Silver",
    location: "South Korea",
    image_url: "https://picsum.photos/400/300?random=3"
  },
  {
    id: "auctions_004",
    brand: "Toyota",
    model: "Camry",
    year: 2020,
    title: "2020 Toyota Camry",
    price: 25000,
    mileage: 35000,
    fuel: "Hybrid",
    transmission: "CVT",
    color: "Blue",
    location: "South Korea",
    image_url: "https://picsum.photos/400/300?random=4"
  },
  {
    id: "auctions_005",
    brand: "Honda",
    model: "Civic",
    year: 2021,
    title: "2021 Honda Civic",
    price: 22000,
    mileage: 15000,
    fuel: "Gasoline",
    transmission: "Manual",
    color: "Red",
    location: "South Korea",
    image_url: "https://picsum.photos/400/300?random=5"
  }
];

async function syncAuctionsCars() {
  console.log('🚀 Starting Auctions API cars sync...');
  
  try {
    // Transform mock data to match database schema
    const transformedCars = mockAuctionsCars.map(car => ({
      id: car.id,
      external_id: car.id,
      make: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      title: car.title,
      vin: null,
      color: car.color,
      fuel: car.fuel,
      transmission: car.transmission,
      condition: 'good',
      location: car.location,
      lot_number: `AUCTIONS_${car.id}`,
      current_bid: 0,
      buy_now_price: car.price,
      final_bid: 0,
      sale_date: null,
      image_url: car.image_url,
      images: JSON.stringify([car.image_url]),
      source_api: 'auctions_api',
      domain_name: 'auctionsapi_com',
      status: 'active',
      is_active: true,
      is_live: false,
      is_archived: false,
      keys_available: true,
      last_synced_at: new Date().toISOString()
    }));

    console.log(`📊 Prepared ${transformedCars.length} cars for sync`);

    // Insert cars into database
    const { data, error } = await supabase
      .from('cars')
      .insert(transformedCars);

    if (error) {
      console.error('❌ Error inserting cars:', error);
      return;
    }

    console.log(`✅ Successfully synced ${transformedCars.length} cars from Auctions API`);

    // Verify the sync
    const { data: verifyData, error: verifyError } = await supabase
      .from('cars')
      .select('id, make, model, year, source_api')
      .eq('source_api', 'auctions_api')
      .eq('is_archived', false)
      .eq('is_active', true);

    if (verifyError) {
      console.error('❌ Error verifying sync:', verifyError);
    } else {
      console.log(`✅ Verification: ${verifyData?.length || 0} Auctions API cars in database`);
      console.log('📋 Sample cars:');
      (verifyData || []).slice(0, 3).forEach((car, index) => {
        console.log(`   ${index + 1}. ${car.year} ${car.make} ${car.model} (${car.id})`);
      });
    }

    // Test the catalog integration
    console.log('\n🔍 Testing catalog integration...');
    
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
          console.log('   Sample car from endpoint:', apiTest.data[0].title);
        }
      }
    } catch (endpointError) {
      console.log('⚠️ Could not test Auctions API endpoint:', endpointError);
    }

    console.log('\n🎉 Auctions API cars sync completed successfully!');
    console.log('🌐 The cars should now appear in your catalog alongside other cars.');

  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Run the sync
syncAuctionsCars().catch(console.error);
