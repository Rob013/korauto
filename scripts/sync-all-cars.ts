#!/usr/bin/env tsx

/**
 * Sync All Cars Script
 * 
 * This script syncs cars from all available APIs and merges them into the unified system.
 * It runs the Auctions API sync and ensures all cars are properly merged.
 */

import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUCTIONS_API_KEY = process.env.AUCTIONS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function syncAllCars() {
  console.log('🚀 Starting comprehensive car sync from all APIs...');
  
  try {
    // Step 1: Sync from Auctions API
    if (AUCTIONS_API_KEY) {
      console.log('📡 Syncing from Auctions API...');
      try {
        execSync('npx tsx scripts/sync-auctions-cars.ts', { 
          stdio: 'inherit',
          env: { 
            ...process.env,
            AUCTIONS_API_KEY,
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
          }
        });
        console.log('✅ Auctions API sync completed');
      } catch (error) {
        console.error('❌ Auctions API sync failed:', error);
      }
    } else {
      console.log('⚠️ AUCTIONS_API_KEY not provided, skipping Auctions API sync');
    }

    // Step 2: Get statistics
    console.log('📊 Gathering car statistics...');
    
    const { data: totalCars } = await supabase
      .from('cars')
      .select('id', { count: 'exact' })
      .eq('is_archived', false)
      .eq('is_active', true);

    const { data: sourceStats } = await supabase
      .from('cars')
      .select('source_api')
      .eq('is_archived', false)
      .eq('is_active', true);

    const { data: makeStats } = await supabase
      .from('cars')
      .select('make')
      .eq('is_archived', false)
      .eq('is_active', true);

    // Calculate statistics
    const sourceCounts = (sourceStats || []).reduce((acc, car) => {
      acc[car.source_api] = (acc[car.source_api] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const makeCounts = (makeStats || []).reduce((acc, car) => {
      acc[car.make] = (acc[car.make] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Step 3: Display results
    console.log('\n🎉 Sync completed successfully!');
    console.log('📊 Final Statistics:');
    console.log(`   • Total active cars: ${totalCars?.length || 0}`);
    console.log('\n📈 By Source:');
    Object.entries(sourceCounts).forEach(([source, count]) => {
      const sourceName = source === 'auctions_api' ? 'Auctions API' : 
                        source === 'auctionapis' ? 'Auction APIs' :
                        source === 'encar' ? 'Encar' : source;
      console.log(`   • ${sourceName}: ${count.toLocaleString()}`);
    });
    
    console.log('\n🚗 Top Makes:');
    Object.entries(makeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([make, count]) => {
        console.log(`   • ${make}: ${count.toLocaleString()}`);
      });

    console.log('\n✨ All cars are now merged and available in the unified catalog!');
    console.log('🌐 Visit your catalog to see all cars from all sources.');

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run the sync
if (require.main === module) {
  syncAllCars().catch(console.error);
}

export { syncAllCars };
