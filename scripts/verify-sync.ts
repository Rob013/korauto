#!/usr/bin/env tsx

/**
 * Manual Sync Verification Script
 * 
 * This script can be run manually to verify if the sync system is working
 * and actually writing data to the database correctly.
 * 
 * Usage: npm run tsx scripts/verify-sync.ts
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface VerificationReport {
  timestamp: string;
  totalCars: number;
  stagingRecords: number;
  cacheRecords: number;
  lastSyncTime: string | null;
  recentSyncCount: number;
  sampleValid: boolean;
  issues: string[];
}

async function runSyncVerification(): Promise<VerificationReport> {
  console.log('🔍 Starting manual sync verification...\n');
  
  const report: VerificationReport = {
    timestamp: new Date().toISOString(),
    totalCars: 0,
    stagingRecords: 0,
    cacheRecords: 0,
    lastSyncTime: null,
    recentSyncCount: 0,
    sampleValid: false,
    issues: []
  };

  try {
    // 1. Check total cars in main table
    console.log('📊 Checking main cars table...');
    const { count: totalCars, error: carsError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    if (carsError) {
      report.issues.push(`Failed to count cars: ${carsError.message}`);
    } else {
      report.totalCars = totalCars || 0;
      console.log(`   ✅ Found ${report.totalCars.toLocaleString()} cars in main table`);
    }

    // 2. Check staging table (should be empty after successful sync)
    console.log('🗂️  Checking staging table...');
    const { count: stagingCount, error: stagingError } = await supabase
      .from('cars_staging')
      .select('*', { count: 'exact', head: true });

    if (stagingError) {
      report.issues.push(`Failed to count staging records: ${stagingError.message}`);
    } else {
      report.stagingRecords = stagingCount || 0;
      if (report.stagingRecords === 0) {
        console.log('   ✅ Staging table is clean (as expected)');
      } else {
        console.log(`   ⚠️  Found ${report.stagingRecords} records in staging table`);
        report.issues.push(`Staging table not clean: ${report.stagingRecords} records remaining`);
      }
    }

    // 3. Check cache table
    console.log('💾 Checking cache table...');
    const { count: cacheCount, error: cacheError } = await supabase
      .from('cars_cache')
      .select('*', { count: 'exact', head: true });

    if (cacheError) {
      report.issues.push(`Failed to count cache records: ${cacheError.message}`);
    } else {
      report.cacheRecords = cacheCount || 0;
      console.log(`   ✅ Found ${report.cacheRecords.toLocaleString()} cars in cache table`);
      
      // Compare main vs cache
      const difference = Math.abs(report.totalCars - report.cacheRecords);
      const percentDiff = report.totalCars > 0 ? (difference / report.totalCars) * 100 : 0;
      
      if (percentDiff > 10) {
        report.issues.push(`Large difference between main (${report.totalCars}) and cache (${report.cacheRecords}) tables: ${percentDiff.toFixed(1)}%`);
      }
    }

    // 4. Check recent sync activity
    console.log('🕒 Checking recent sync activity...');
    const { data: recentCars, error: recentError } = await supabase
      .from('cars')
      .select('last_synced_at')
      .order('last_synced_at', { ascending: false })
      .limit(100);

    if (recentError) {
      report.issues.push(`Failed to check recent syncs: ${recentError.message}`);
    } else if (recentCars && recentCars.length > 0) {
      const latestSync = recentCars[0].last_synced_at;
      report.lastSyncTime = latestSync;
      
      if (latestSync) {
        const lastSyncDate = new Date(latestSync);
        const hoursSince = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
        
        console.log(`   ✅ Latest sync: ${lastSyncDate.toLocaleString()} (${hoursSince.toFixed(1)} hours ago)`);
        
        if (hoursSince > 48) {
          report.issues.push(`Last sync is very old: ${hoursSince.toFixed(1)} hours ago`);
        }
        
        // Count recent syncs (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentSyncs = recentCars.filter(car => car.last_synced_at && car.last_synced_at > oneDayAgo);
        report.recentSyncCount = recentSyncs.length;
        
        console.log(`   ✅ ${report.recentSyncCount} cars synced in last 24 hours`);
      }
    }

    // 5. Sample data validation
    console.log('🧪 Validating sample records...');
    const { data: sampleCars, error: sampleError } = await supabase
      .from('cars')
      .select('id, make, model, year, price, external_id, source_api, created_at, updated_at')
      .limit(20);

    if (sampleError) {
      report.issues.push(`Failed to fetch sample records: ${sampleError.message}`);
    } else if (sampleCars) {
      let validCount = 0;
      let totalSample = sampleCars.length;
      
      for (const car of sampleCars) {
        if (car.id && car.make && car.model && car.external_id && car.source_api) {
          validCount++;
        }
      }
      
      const validPercent = totalSample > 0 ? (validCount / totalSample) * 100 : 0;
      report.sampleValid = validPercent >= 90;
      
      console.log(`   ✅ Sample validation: ${validCount}/${totalSample} valid (${validPercent.toFixed(1)}%)`);
      
      if (!report.sampleValid) {
        report.issues.push(`Sample validation failed: only ${validPercent.toFixed(1)}% of records are valid`);
      }
    }

    // 6. Check sync status table
    console.log('📋 Checking sync status...');
    const { data: syncStatus, error: statusError } = await supabase
      .from('sync_status')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    if (statusError) {
      report.issues.push(`Failed to check sync status: ${statusError.message}`);
    } else if (syncStatus && syncStatus.length > 0) {
      const latest = syncStatus[0];
      console.log(`   ✅ Latest sync status: ${latest.status}`);
      console.log(`   ✅ Records processed: ${(latest.records_processed || 0).toLocaleString()}`);
      
      if (latest.status === 'failed') {
        report.issues.push(`Last sync failed: ${latest.error_message || 'Unknown error'}`);
      }
      
      if (latest.status === 'running') {
        const startTime = new Date(latest.started_at);
        const runningMinutes = (Date.now() - startTime.getTime()) / (1000 * 60);
        console.log(`   ⚠️  Sync has been running for ${runningMinutes.toFixed(1)} minutes`);
        
        if (runningMinutes > 30) {
          report.issues.push(`Sync has been running for ${runningMinutes.toFixed(1)} minutes - may be stuck`);
        }
      }
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    report.issues.push(`Verification failed: ${errorMsg}`);
    console.error('💥 Verification error:', error);
  }

  return report;
}

async function printReport(report: VerificationReport) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYNC VERIFICATION REPORT');
  console.log('='.repeat(60));
  console.log(`Report Time: ${new Date(report.timestamp).toLocaleString()}`);
  console.log('');
  
  console.log('📈 Database Statistics:');
  console.log(`  • Total Cars: ${report.totalCars.toLocaleString()}`);
  console.log(`  • Cache Records: ${report.cacheRecords.toLocaleString()}`);
  console.log(`  • Staging Records: ${report.stagingRecords.toLocaleString()}`);
  console.log(`  • Recent Syncs (24h): ${report.recentSyncCount.toLocaleString()}`);
  console.log('');
  
  console.log('🕒 Sync Activity:');
  if (report.lastSyncTime) {
    const lastSync = new Date(report.lastSyncTime);
    const hoursSince = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
    console.log(`  • Last Sync: ${lastSync.toLocaleString()}`);
    console.log(`  • Hours Since: ${hoursSince.toFixed(1)}`);
  } else {
    console.log(`  • Last Sync: No sync data found`);
  }
  console.log('');
  
  console.log('✅ Validation Results:');
  console.log(`  • Sample Data Valid: ${report.sampleValid ? 'Yes' : 'No'}`);
  console.log(`  • Staging Clean: ${report.stagingRecords === 0 ? 'Yes' : 'No'}`);
  console.log('');
  
  if (report.issues.length > 0) {
    console.log('⚠️  Issues Found:');
    report.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    console.log('');
  }
  
  const overallStatus = report.issues.length === 0 ? '✅ HEALTHY' : '⚠️  ISSUES DETECTED';
  console.log(`Overall Status: ${overallStatus}`);
  console.log('='.repeat(60));
  
  // Recommendations
  if (report.issues.length > 0) {
    console.log('\n💡 Recommendations:');
    
    if (report.stagingRecords > 0) {
      console.log('  • Run: DELETE FROM cars_staging; to clean staging table');
    }
    
    if (report.lastSyncTime) {
      const hoursSince = (Date.now() - new Date(report.lastSyncTime).getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        console.log('  • Consider running a new sync - data may be stale');
      }
    }
    
    if (!report.sampleValid) {
      console.log('  • Check data integrity - some records have missing required fields');
    }
    
    console.log('  • Review sync logs for more details');
    console.log('  • Consider running the verification again in a few minutes');
  } else {
    console.log('\n🎉 Everything looks good! The sync system is working properly.');
  }
}

// Main execution
async function main() {
  try {
    const report = await runSyncVerification();
    await printReport(report);
    
    // Exit with error code if issues found
    process.exit(report.issues.length > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('verify-sync.ts')) {
  main();
}

export default main;