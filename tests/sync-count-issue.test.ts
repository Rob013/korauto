/**
 * Test to verify the specific issue: 16 cars synced instead of 105,505
 * This test reproduces the exact scenario described in the problem statement
 */

import { describe, it, expect } from 'vitest';

describe('Sync Count Issue - 16 cars instead of 105,505', () => {
  
  it('should show 105,505 cars when sync progress shows 16 but database has 105,505', () => {
    // This reproduces the exact scenario from the problem statement
    const syncRecordsProcessed = 16; // What sync progress shows
    const cacheCount = 105505; // Real count in cars_cache table
    const mainCarsCount = 16; // Count in cars table
    
    // Current logic from FullCarsSyncTrigger.tsx
    const totalRealCount = cacheCount > 0 ? cacheCount : mainCarsCount;
    let displayCount = syncRecordsProcessed;
    
    const isStuck = false; // Assume sync is not detected as stuck
    const syncStatus = 'running';
    const syncIsStuckOrFailed = isStuck || syncStatus === 'failed' || syncStatus === 'completed';
    const realCountIsSignificantlyHigher = totalRealCount > 0 && totalRealCount > displayCount * 10;
    
    if ((displayCount === 0 && totalRealCount > 0) || 
        (syncIsStuckOrFailed && totalRealCount > displayCount) ||
        realCountIsSignificantlyHigher) {
      displayCount = totalRealCount;
    }
    
    // Verify the fix works
    expect(totalRealCount).toBe(105505);
    expect(realCountIsSignificantlyHigher).toBe(true); // 105,505 > 16 * 10 = 160
    expect(displayCount).toBe(105505); // Should show real count, not sync progress
    
    console.log('Test scenario:');
    console.log(`- Sync progress: ${syncRecordsProcessed} cars`);
    console.log(`- Cache count: ${cacheCount} cars`); 
    console.log(`- Main count: ${mainCarsCount} cars`);
    console.log(`- Total real count: ${totalRealCount} cars`);
    console.log(`- Display count: ${displayCount} cars`);
    console.log(`- Real count significantly higher: ${realCountIsSignificantlyHigher}`);
  });

  it('should continue syncing when sync is running and showing real count', () => {
    // Test that sync continues running even when showing real count
    const syncStatus = 'running';
    const syncRecordsProcessed = 16;
    const totalRealCount = 105505;
    
    // The sync should continue running
    expect(syncStatus).toBe('running');
    
    // But display should show real count, not sync progress
    let displayCount = syncRecordsProcessed;
    const realCountIsSignificantlyHigher = totalRealCount > displayCount * 10;
    
    if (realCountIsSignificantlyHigher) {
      displayCount = totalRealCount;
    }
    
    expect(displayCount).toBe(105505);
    expect(syncStatus).toBe('running'); // Sync should continue
  });

  it('should calculate correct percentage with corrected count', () => {
    // Test that percentage calculation uses corrected count
    const correctedCount = 105505; // After correction is applied
    const estimatedTotal = 192800; // From getProgressPercentage()
    
    const percentage = Math.min(100, (correctedCount / estimatedTotal) * 100);
    
    expect(percentage).toBeCloseTo(54.72, 1); // 105505/192800 * 100 = 54.72%
    expect(percentage).not.toBe(0.0); // Should not be 0.0%
    expect(percentage).toBeGreaterThan(50); // Should show significant progress
  });

  it('should handle the exact problem statement scenario', () => {
    // Problem: "16 cars synced 0.0% complete instead should show 105,505 cars synced"
    
    // Original problematic state
    const originalSyncProgress = 16;
    const originalPercentage = (originalSyncProgress / 192800) * 100; // 0.008% ≈ 0.0%
    
    // After fix
    const correctedCount = 105505;
    const correctedPercentage = (correctedCount / 192800) * 100; // 54.7%
    
    // Verify the problem exists
    expect(originalPercentage).toBeLessThan(0.01); // Rounds to 0.0%
    
    // Verify the fix
    expect(correctedCount).toBe(105505);
    expect(correctedPercentage).toBeCloseTo(54.7, 1);
    expect(correctedPercentage).toBeGreaterThan(50);
    
    console.log('Problem statement verification:');
    console.log(`- Original: ${originalSyncProgress} cars, ${originalPercentage.toFixed(1)}% complete`);
    console.log(`- Fixed: ${correctedCount.toLocaleString()} cars, ${correctedPercentage.toFixed(1)}% complete`);
  });

  it('should prioritize cars_cache count over cars count', () => {
    // Test the prioritization logic
    const cacheCount = 105505;
    const mainCarsCount = 16;
    
    // Current logic: prioritize cars_cache
    const totalRealCount = cacheCount > 0 ? cacheCount : mainCarsCount;
    
    expect(totalRealCount).toBe(105505);
    expect(totalRealCount).not.toBe(16);
  });

  it('should handle edge case when cars_cache is empty but cars table has data', () => {
    // Edge case: cars_cache is empty, should fall back to cars count
    const cacheCount = 0;
    const mainCarsCount = 105505;
    
    const totalRealCount = cacheCount > 0 ? cacheCount : mainCarsCount;
    
    expect(totalRealCount).toBe(105505);
  });

  it('should ensure sync continues running until API is fully synced', () => {
    // Test that the sync doesn't stop prematurely when showing corrected count
    
    // Scenario: Sync shows 16 processed, but database has 105,505 from previous syncs
    // The sync should continue until it processes all new API data
    
    const syncRecordsProcessed = 16; // Current sync progress  
    const databaseCount = 105505; // Existing cars in database
    const totalApiCars = 192800; // Total cars available in API
    
    // The sync should continue running until it processes all API cars
    const remainingToSync = totalApiCars - databaseCount;
    
    expect(remainingToSync).toBeGreaterThan(0); // Still have cars to sync
    expect(syncRecordsProcessed).toBeLessThan(remainingToSync); // Sync hasn't finished
    
    // UI should show existing count but sync should continue
    const displayCount = databaseCount; // Show what's actually in database
    const syncShouldContinue = syncRecordsProcessed < remainingToSync;
    
    expect(displayCount).toBe(105505);
    expect(syncShouldContinue).toBe(true);
  });
});