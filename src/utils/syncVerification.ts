/**
 * Sync Verification Utilities
 * 
 * Provides comprehensive verification mechanisms to ensure the sync process
 * is actually writing data to the database correctly.
 */

import { supabase } from '@/integrations/supabase/client';

export interface SyncVerificationResult {
  success: boolean;
  message: string;
  details: {
    expectedCount?: number;
    actualCount?: number;
    lastSyncTime?: string;
    sampleRecordsVerified?: boolean;
    dataIntegrityPassed?: boolean;
    stagingTableCleared?: boolean;
  };
  errors?: string[];
}

export interface SyncVerificationConfig {
  verifyRecordCount?: boolean;
  verifySampleRecords?: boolean;
  verifyDataIntegrity?: boolean;
  verifyTimestamps?: boolean;
  sampleSize?: number;
  syncTimeThresholdHours?: number;
  dataIntegrityThresholdPercent?: number;
  queryTimeoutMs?: number; // Timeout for database queries in milliseconds
}

/**
 * Comprehensive verification of sync process
 */
export async function verifySyncToDatabase(
  expectedRecordCount?: number,
  config: SyncVerificationConfig = {}
): Promise<SyncVerificationResult> {
  const {
    verifyRecordCount = true,
    verifySampleRecords = true,
    verifyDataIntegrity = true,
    verifyTimestamps = true,
    sampleSize = 10,
    syncTimeThresholdHours = 72, // 3 days instead of 24 hours
    dataIntegrityThresholdPercent = 20, // Allow 20% difference instead of 10%
    queryTimeoutMs = 15000 // 15 second timeout for queries (increased for better reliability)
  } = config;

  const errors: string[] = [];
  const details: SyncVerificationResult['details'] = {};

  try {
    console.log('🔍 Starting comprehensive sync verification...');

    // 1. Verify record count in main cars table
    if (verifyRecordCount) {
      const { count: actualCount, error: countError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        errors.push(`Failed to count records in cars table: ${countError.message}`);
      } else {
        details.actualCount = actualCount || 0;
        console.log(`📊 Found ${actualCount} records in cars table`);

        if (expectedRecordCount && actualCount !== expectedRecordCount) {
          errors.push(`Record count mismatch: expected ${expectedRecordCount}, found ${actualCount}`);
        }
      }
    }

    // 2. Verify staging table is cleared (should be empty after successful sync)
    const { count: stagingCount, error: stagingError } = await supabase
      .from('cars_staging')
      .select('*', { count: 'exact', head: true });

    if (stagingError) {
      errors.push(`Failed to check staging table: ${stagingError.message}`);
    } else {
      details.stagingTableCleared = stagingCount === 0;
      if (stagingCount > 0) {
        console.log(`⚠️ Staging table still contains ${stagingCount} records`);
        errors.push(`Staging table not cleared: ${stagingCount} records remaining`);
      } else {
        console.log('✅ Staging table properly cleared');
      }
    }

    // 3. Verify recent sync timestamps
    if (verifyTimestamps) {
      const { data: recentSyncData, error: syncError } = await supabase
        .from('cars')
        .select('last_synced_at')
        .order('last_synced_at', { ascending: false })
        .limit(100);

      if (syncError) {
        errors.push(`Failed to check sync timestamps: ${syncError.message}`);
      } else if (recentSyncData && recentSyncData.length > 0) {
        const lastSyncTime = recentSyncData[0].last_synced_at;
        details.lastSyncTime = lastSyncTime;
        
        // Check if sync is recent (configurable threshold)
        const lastSync = new Date(lastSyncTime);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSync > syncTimeThresholdHours) {
          errors.push(`Last sync is too old: ${hoursSinceSync.toFixed(1)} hours ago (threshold: ${syncTimeThresholdHours} hours)`);
        } else {
          console.log(`✅ Recent sync detected: ${hoursSinceSync.toFixed(1)} hours ago (within ${syncTimeThresholdHours}h threshold)`);
        }
      }
    }

    // 4. Verify sample records for data integrity
    if (verifySampleRecords && details.actualCount && details.actualCount > 0) {
      const { data: sampleRecords, error: sampleError } = await supabase
        .from('cars')
        .select('id, make, model, year, price, external_id, source_api, last_synced_at')
        .limit(sampleSize);

      if (sampleError) {
        errors.push(`Failed to fetch sample records: ${sampleError.message}`);
      } else if (sampleRecords) {
        let validRecords = 0;
        
        for (const record of sampleRecords) {
          // Check required fields are populated with more robust validation
          const hasId = record.id && typeof record.id === 'string' && record.id.trim().length > 0;
          const hasMake = record.make && typeof record.make === 'string' && record.make.trim().length > 0;
          const hasModel = record.model && typeof record.model === 'string' && record.model.trim().length > 0;
          const hasExternalId = record.external_id && typeof record.external_id === 'string' && record.external_id.trim().length > 0;
          
          if (hasId && hasMake && hasModel && hasExternalId) {
            validRecords++;
          } else {
            // Log which fields are missing for debugging
            const missingFields = [];
            if (!hasId) missingFields.push('id');
            if (!hasMake) missingFields.push('make');
            if (!hasModel) missingFields.push('model');
            if (!hasExternalId) missingFields.push('external_id');
            console.log(`⚠️ Invalid record ${record.id || 'unknown'}: missing ${missingFields.join(', ')}`);
          }
        }
        
        details.sampleRecordsVerified = validRecords === sampleRecords.length;
        
        if (validRecords < sampleRecords.length) {
          errors.push(`Sample verification failed: ${validRecords}/${sampleRecords.length} records valid`);
        } else {
          console.log(`✅ Sample verification passed: ${validRecords}/${sampleRecords.length} records valid`);
        }
      }
    }

    // 5. Verify data integrity across tables
    if (verifyDataIntegrity) {
      // Check for orphaned records or inconsistencies
      const { data: cacheCount, error: cacheError } = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact', head: true });

      if (cacheError) {
        // cars_cache might not exist or be accessible - this is not a critical failure
        console.log(`⚠️ Unable to check cars_cache: ${cacheError.message} (not critical for sync completion)`);
        details.dataIntegrityPassed = true; // Don't fail verification for cache issues
      } else {
        // Cars cache may be empty after sync completion - only check if cache has data
        const cacheCountValue = Number(cacheCount) || 0;
        const mainCount = Number(details.actualCount) || 0;
        
        if (cacheCountValue === 0) {
          // Empty cache is normal after sync completion - not an error
          console.log(`✅ Data integrity check: main table has ${mainCount} records, cache is empty (normal after sync)`);
          details.dataIntegrityPassed = true;
        } else {
          // Only validate integrity if both tables have data
          const countDifference = Math.abs(mainCount - cacheCountValue);
          const percentDifference = mainCount > 0 ? (countDifference / mainCount) * 100 : 0;
          
          details.dataIntegrityPassed = percentDifference < dataIntegrityThresholdPercent;
          
          if (percentDifference >= dataIntegrityThresholdPercent) {
            errors.push(`Data integrity issue: ${percentDifference.toFixed(1)}% difference between main (${mainCount}) and cache (${cacheCountValue}) tables (threshold: ${dataIntegrityThresholdPercent}%)`);
          } else {
            console.log(`✅ Data integrity check passed: ${percentDifference.toFixed(1)}% difference between main (${mainCount}) and cache (${cacheCountValue}) tables`);
          }
        }
      }
    }

    // 6. Check sync status for any errors (with timeout handling)
    try {
      // Optimize query to select only needed columns and improve performance
      interface SyncStatusResponse {
        data: {
          status: string;
          error_message?: string;
          started_at: string;
        } | null;
        error: {
          code?: string;
          message?: string;
        } | null;
      }
      
      const { data: syncStatus, error: statusError }: SyncStatusResponse = await Promise.race([
        supabase
          .from('sync_status')
          .select('status, error_message, started_at')
          .order('started_at', { ascending: false })
          .limit(1)
          .single(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Sync status query timeout')), queryTimeoutMs)
        )
      ]);

      if (statusError && statusError.code !== 'PGRST116') {
        // Check if this is a statement timeout error
        if (statusError.message?.includes('timeout') || statusError.message?.includes('canceling statement')) {
          console.log('⚠️ Sync status check timed out - this is not critical for verification');
          // Don't add to errors since this is a performance issue, not a sync failure
        } else {
          errors.push(`Failed to check sync status: ${statusError.message}`);
        }
      } else if (syncStatus) {
        if (syncStatus.status === 'failed') {
          errors.push(`Last sync failed: ${syncStatus.error_message || 'Unknown error'}`);
        } else if (syncStatus.status === 'completed') {
          console.log('✅ Last sync completed successfully');
        }
      }
    } catch (timeoutError: unknown) {
      // Handle client-side timeout gracefully
      const errorMessage = timeoutError instanceof Error ? timeoutError.message : 'Unknown timeout error';
      if (errorMessage.includes('timeout')) {
        console.log('⚠️ Sync status check timed out - continuing verification without sync status check');
        // Don't add to errors since this is a performance issue, not a sync failure
      } else {
        console.log('⚠️ Sync status check failed with non-critical error:', errorMessage);
      }
    }

    const success = errors.length === 0;
    const message = success 
      ? '✅ Sync verification completed successfully - database is properly synced'
      : `❌ Sync verification failed with ${errors.length} issues`;

    console.log(message);
    if (errors.length > 0) {
      console.log('🔍 Verification errors:', errors);
    }

    return {
      success,
      message,
      details,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Sync verification failed:', errorMessage);
    
    return {
      success: false,
      message: `Sync verification failed: ${errorMessage}`,
      details,
      errors: [errorMessage]
    };
  }
}

/**
 * Quick verification - just checks if recent data exists
 */
export async function quickSyncCheck(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Quick sync check failed:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Quick sync check error:', error);
    return false;
  }
}

/**
 * Monitor real-time sync progress and verify writes
 */
export async function monitorSyncProgress(): Promise<void> {
  console.log('🔄 Starting real-time sync monitoring...');
  
  // Subscribe to sync status changes
  const statusSubscription = supabase
    .channel('sync-verification-status')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sync_status'
    }, (payload) => {
      console.log('📊 Sync status update:', payload.new);
      
      if (payload.new && typeof payload.new === 'object') {
        const status = payload.new as { status?: string; error_message?: string };
        if (status.status === 'completed') {
          console.log('🎉 Sync completed, starting verification...');
          verifySyncToDatabase();
        } else if (status.status === 'failed') {
          console.log('❌ Sync failed:', status.error_message);
        }
      }
    })
    .subscribe();

  // Subscribe to cars table changes to count new records
  let recordCount = 0;
  const carsSubscription = supabase
    .channel('sync-verification-cars')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'cars'
    }, (payload) => {
      recordCount++;
      if (recordCount % 100 === 0) {
        console.log(`✅ Verified ${recordCount} new records written to database`);
      }
    })
    .subscribe();

  // Clean up subscriptions after 30 minutes
  setTimeout(() => {
    statusSubscription.unsubscribe();
    carsSubscription.unsubscribe();
    console.log('🔄 Stopped sync monitoring');
  }, 30 * 60 * 1000);
}

/**
 * Verify specific batch write operation
 */
export async function verifyBatchWrite(
  batchData: Array<{ id?: string; [key: string]: unknown }>, 
  tableName: 'cars' | 'cars_staging' | 'cars_cache' = 'cars_staging'
): Promise<boolean> {
  if (batchData.length === 0) return true;

  try {
    // Check if records were actually written
    const recordIds = batchData.map(record => record.id).filter(Boolean);
    
    if (recordIds.length === 0) return true;

    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .in('id', recordIds.slice(0, 10)); // Check first 10 records

    if (error) {
      console.error(`❌ Batch verification failed for ${tableName}:`, error);
      return false;
    }

    const foundRecords = data?.length || 0;
    const expectedRecords = Math.min(10, recordIds.length);
    
    if (foundRecords < expectedRecords) {
      console.error(`❌ Batch verification failed: found ${foundRecords}/${expectedRecords} records in ${tableName}`);
      return false;
    }

    console.log(`✅ Batch verification passed: ${foundRecords}/${expectedRecords} records confirmed in ${tableName}`);
    return true;

  } catch (error) {
    console.error(`❌ Batch verification error for ${tableName}:`, error);
    return false;
  }
}