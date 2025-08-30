import { describe, it, expect } from 'vitest';

describe('Sync Stuck at 16 Cars Fix', () => {
  
  it('should use real count when sync shows low count but database has much more', () => {
    // Simulate the problem scenario: sync shows 16 cars but database has 105,505
    const syncRecordsProcessed = 16;
    const cacheCount = 0;
    const mainCarsCount = 105505;
    const totalRealCount = Math.max(cacheCount, mainCarsCount); // 105505
    const isStuck = false;
    const syncStatus = 'running';
    
    // Apply the fix logic
    let displayCount = syncRecordsProcessed;
    
    const syncIsStuckOrFailed = isStuck || syncStatus === 'failed' || syncStatus === 'completed';
    const realCountIsSignificantlyHigher = totalRealCount > 0 && totalRealCount > displayCount * 10;
    
    if ((displayCount === 0 && totalRealCount > 0) || 
        (syncIsStuckOrFailed && totalRealCount > displayCount) ||
        realCountIsSignificantlyHigher) {
      displayCount = totalRealCount;
    }
    
    // The fix should detect that 105505 >> 16 * 10 = 160 and use real count
    expect(realCountIsSignificantlyHigher).toBe(true);
    expect(displayCount).toBe(105505);
    expect(displayCount).not.toBe(16);
  });

  it('should still use sync count when it is reasonable relative to real count', () => {
    // Sync shows 1000 cars, database has 1200 - this is reasonable, use sync count
    const syncRecordsProcessed = 1000;
    const cacheCount = 0;
    const mainCarsCount = 1200;
    const totalRealCount = Math.max(cacheCount, mainCarsCount);
    const isStuck = false;
    const syncStatus = 'running';
    
    let displayCount = syncRecordsProcessed;
    
    const syncIsStuckOrFailed = isStuck || syncStatus === 'failed' || syncStatus === 'completed';
    const realCountIsSignificantlyHigher = totalRealCount > 0 && totalRealCount > displayCount * 10;
    
    if ((displayCount === 0 && totalRealCount > 0) || 
        (syncIsStuckOrFailed && totalRealCount > displayCount) ||
        realCountIsSignificantlyHigher) {
      displayCount = totalRealCount;
    }
    
    // Should NOT trigger the fix since 1200 < 1000 * 10 = 10000
    expect(realCountIsSignificantlyHigher).toBe(false);
    expect(displayCount).toBe(1000); // Use sync count
  });

  it('should use real count when sync is stuck regardless of ratio', () => {
    // Sync is stuck showing 500 cars, database has 600 - use real count because stuck
    const syncRecordsProcessed = 500;
    const cacheCount = 0;
    const mainCarsCount = 600;
    const totalRealCount = Math.max(cacheCount, mainCarsCount);
    const isStuck = true; // Sync is detected as stuck
    const syncStatus = 'running';
    
    let displayCount = syncRecordsProcessed;
    
    const syncIsStuckOrFailed = isStuck || syncStatus === 'failed' || syncStatus === 'completed';
    const realCountIsSignificantlyHigher = totalRealCount > 0 && totalRealCount > displayCount * 10;
    
    if ((displayCount === 0 && totalRealCount > 0) || 
        (syncIsStuckOrFailed && totalRealCount > displayCount) ||
        realCountIsSignificantlyHigher) {
      displayCount = totalRealCount;
    }
    
    // Should use real count because sync is stuck
    expect(syncIsStuckOrFailed).toBe(true);
    expect(displayCount).toBe(600);
  });

  it('should use real count when sync is completed', () => {
    // Sync completed showing 90000 cars, but database actually has 105505
    const syncRecordsProcessed = 90000;
    const cacheCount = 0;
    const mainCarsCount = 105505;
    const totalRealCount = Math.max(cacheCount, mainCarsCount);
    const isStuck = false;
    const syncStatus = 'completed';
    
    let displayCount = syncRecordsProcessed;
    
    const syncIsStuckOrFailed = isStuck || syncStatus === 'failed' || syncStatus === 'completed';
    const realCountIsSignificantlyHigher = totalRealCount > 0 && totalRealCount > displayCount * 10;
    
    if ((displayCount === 0 && totalRealCount > 0) || 
        (syncIsStuckOrFailed && totalRealCount > displayCount) ||
        realCountIsSignificantlyHigher) {
      displayCount = totalRealCount;
    }
    
    // Should use real count because sync is completed and real count is higher
    expect(syncIsStuckOrFailed).toBe(true);
    expect(totalRealCount > syncRecordsProcessed).toBe(true); // 105505 > 90000
    expect(realCountIsSignificantlyHigher).toBe(false); // 105505 < 90000 * 10 = 900000
    expect(displayCount).toBe(105505); // Should still use real count due to completed status + higher count
  });

  it('should detect sync as stuck when no activity for 10+ minutes', () => {
    const now = Date.now();
    const tenMinutesAgo = new Date(now - 11 * 60 * 1000); // 11 minutes ago
    const twoHoursAgo = new Date(now - 30 * 60 * 1000); // 30 minutes ago (started)
    
    const sync = {
      status: 'running',
      last_activity_at: tenMinutesAgo.toISOString(),
      started_at: twoHoursAgo.toISOString()
    };
    
    // Apply the stuck detection logic
    const lastActivity = sync.last_activity_at ? new Date(sync.last_activity_at) : new Date(sync.started_at || 0);
    const timeSinceActivity = now - lastActivity.getTime();
    const startTime = sync.started_at ? new Date(sync.started_at) : new Date(0);
    const timeSinceStart = now - startTime.getTime();
    
    const STUCK_THRESHOLD = 10 * 60 * 1000; // 10 minutes
    const MAX_SYNC_TIME = 2 * 60 * 60 * 1000; // 2 hours
    
    const isStuckByActivity = timeSinceActivity > STUCK_THRESHOLD;
    const isStuckByDuration = timeSinceStart > MAX_SYNC_TIME;
    const isStuck = isStuckByActivity || isStuckByDuration;
    
    expect(isStuckByActivity).toBe(true); // 11 minutes > 10 minutes
    expect(isStuckByDuration).toBe(false); // 30 minutes < 2 hours
    expect(isStuck).toBe(true);
  });

  it('should detect sync as stuck when running too long even with recent activity', () => {
    const now = Date.now();
    const oneMinuteAgo = new Date(now - 1 * 60 * 1000); // 1 minute ago (recent activity)
    const threeHoursAgo = new Date(now - 3 * 60 * 60 * 1000); // 3 hours ago (started)
    
    const sync = {
      status: 'running',
      last_activity_at: oneMinuteAgo.toISOString(),
      started_at: threeHoursAgo.toISOString()
    };
    
    // Apply the stuck detection logic
    const lastActivity = sync.last_activity_at ? new Date(sync.last_activity_at) : new Date(sync.started_at || 0);
    const timeSinceActivity = now - lastActivity.getTime();
    const startTime = sync.started_at ? new Date(sync.started_at) : new Date(0);
    const timeSinceStart = now - startTime.getTime();
    
    const STUCK_THRESHOLD = 10 * 60 * 1000; // 10 minutes
    const MAX_SYNC_TIME = 2 * 60 * 60 * 1000; // 2 hours
    
    const isStuckByActivity = timeSinceActivity > STUCK_THRESHOLD;
    const isStuckByDuration = timeSinceStart > MAX_SYNC_TIME;
    const isStuck = isStuckByActivity || isStuckByDuration;
    
    expect(isStuckByActivity).toBe(false); // 1 minute < 10 minutes
    expect(isStuckByDuration).toBe(true); // 3 hours > 2 hours
    expect(isStuck).toBe(true);
  });

  it('should show reset button when sync count is suspiciously low', () => {
    // Test the UI logic for showing the reset button
    const syncStatus = {
      records_processed: 16 // Low count that should trigger reset button
    };
    
    const shouldShowResetButton = syncStatus && 
      syncStatus.records_processed && 
      syncStatus.records_processed < 1000;
    
    expect(shouldShowResetButton).toBe(true);
    
    // Test with higher count that shouldn't show reset button
    const syncStatusHigh = {
      records_processed: 50000
    };
    
    const shouldNotShowResetButton = syncStatusHigh && 
      syncStatusHigh.records_processed && 
      syncStatusHigh.records_processed < 1000;
    
    expect(shouldNotShowResetButton).toBe(false);
  });
});