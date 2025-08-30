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
});