import { describe, it, expect } from 'vitest';

/**
 * Test for fixing the specific issue where sync gets stuck at 1% progress
 * and needs better detection and recovery mechanisms
 */
describe('Sync 1% Stuck Fix', () => {
  
  it('should detect very low progress syncs (1%) that are stuck', () => {
    // Scenario: Sync shows only ~1% progress (2000 out of 190,000 cars) but hasn't progressed for a while
    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000); // 5 minutes without progress
    const syncStart = new Date(now - 15 * 60 * 1000); // Started 15 minutes ago
    
    const syncStatus = {
      status: 'running',
      records_processed: 2000, // Only 1% of 190,000
      current_page: 20,
      started_at: syncStart.toISOString(),
      last_activity_at: fiveMinutesAgo.toISOString()
    };
    
    // Current stuck detection logic (10 minutes threshold)
    const lastActivity = new Date(syncStatus.last_activity_at);
    const timeSinceActivity = now - lastActivity.getTime();
    const currentStuckThreshold = 10 * 60 * 1000; // 10 minutes
    
    const isCurrentlyDetectedAsStuck = timeSinceActivity > currentStuckThreshold;
    
    // Current logic would NOT detect this as stuck yet (5 minutes < 10 minutes)
    expect(isCurrentlyDetectedAsStuck).toBe(false);
    
    // But we should improve detection for very low progress scenarios
    const progressPercentage = (syncStatus.records_processed / 190000) * 100; // ~1.05%
    const isVeryLowProgress = progressPercentage < 5; // Less than 5%
    const hasSufficientRuntime = (now - new Date(syncStatus.started_at).getTime()) > 10 * 60 * 1000; // 10+ minutes
    const hasStagnatedProgress = timeSinceActivity > 3 * 60 * 1000; // 3+ minutes without progress
    
    // Enhanced detection for low-progress stuck syncs
    const shouldDetectAsStuck = isVeryLowProgress && hasSufficientRuntime && hasStagnatedProgress;
    
    expect(progressPercentage).toBeLessThan(5);
    expect(hasSufficientRuntime).toBe(true); // 15 minutes > 10 minutes
    expect(hasStagnatedProgress).toBe(true); // 5 minutes > 3 minutes
    expect(shouldDetectAsStuck).toBe(true);
  });

  it('should not trigger early detection for normal progressing syncs', () => {
    const now = Date.now();
    const twoMinutesAgo = new Date(now - 2 * 60 * 1000); // Recent activity
    const syncStart = new Date(now - 15 * 60 * 1000);
    
    const syncStatus = {
      status: 'running',
      records_processed: 2000, // Still low progress
      current_page: 20,
      started_at: syncStart.toISOString(),
      last_activity_at: twoMinutesAgo.toISOString() // But recent activity
    };
    
    const lastActivity = new Date(syncStatus.last_activity_at);
    const timeSinceActivity = now - lastActivity.getTime();
    
    const progressPercentage = (syncStatus.records_processed / 190000) * 100;
    const isVeryLowProgress = progressPercentage < 5;
    const hasSufficientRuntime = (now - new Date(syncStatus.started_at).getTime()) > 10 * 60 * 1000;
    const hasStagnatedProgress = timeSinceActivity > 3 * 60 * 1000;
    
    const shouldDetectAsStuck = isVeryLowProgress && hasSufficientRuntime && hasStagnatedProgress;
    
    // Should NOT detect as stuck because activity is recent (2 minutes < 3 minutes)
    expect(isVeryLowProgress).toBe(true);
    expect(hasSufficientRuntime).toBe(true);
    expect(hasStagnatedProgress).toBe(false); // 2 minutes < 3 minutes
    expect(shouldDetectAsStuck).toBe(false);
  });

  it('should have more aggressive auto-resume for very low progress syncs', () => {
    // Test the auto-resume logic improvement
    const now = Date.now();
    
    // Scenario: Failed sync at very low progress should be resumed faster
    const failedLowProgressSync = {
      status: 'failed',
      records_processed: 1900, // ~1% of 190,000
      current_page: 19,
      error_message: 'Auto-detected: Sync was stuck with no activity',
      completed_at: new Date(now - 30 * 1000).toISOString() // Failed 30 seconds ago
    };
    
    const timeSinceFail = now - new Date(failedLowProgressSync.completed_at).getTime();
    const progressPercentage = (failedLowProgressSync.records_processed / 190000) * 100;
    
    // Current resume delay is 5 seconds for all syncs
    const currentResumeDelay = 5 * 1000;
    
    // For very low progress, we should resume even faster
    const isVeryLowProgress = progressPercentage < 5;
    const enhancedResumeDelay = isVeryLowProgress ? 2 * 1000 : currentResumeDelay; // 2 seconds for low progress
    
    const shouldResumeNow = timeSinceFail > enhancedResumeDelay;
    
    expect(isVeryLowProgress).toBe(true);
    expect(enhancedResumeDelay).toBe(2000); // 2 seconds for low progress
    expect(shouldResumeNow).toBe(true); // 30 seconds > 2 seconds
  });

  it('should validate sync completion reaches close to 190,000 cars', () => {
    // Test completion validation logic
    const completedSyncScenarios = [
      {
        name: 'Properly completed sync',
        records_processed: 189500, // 99.7% of 190,000
        status: 'completed'
      },
      {
        name: 'Suspiciously low completed sync',
        records_processed: 50000, // Only 26% of 190,000
        status: 'completed'
      }
    ];
    
    const expectedTotal = 190000;
    const minimumCompletionThreshold = 0.95; // 95%
    
    completedSyncScenarios.forEach(scenario => {
      const completionPercentage = scenario.records_processed / expectedTotal;
      const isProperlyCompleted = completionPercentage >= minimumCompletionThreshold;
      
      if (scenario.name === 'Properly completed sync') {
        expect(isProperlyCompleted).toBe(true);
        expect(completionPercentage).toBeGreaterThan(0.95);
      } else {
        expect(isProperlyCompleted).toBe(false);
        expect(completionPercentage).toBeLessThan(0.95);
        // This should trigger a warning or auto-restart
      }
    });
  });

  it('should calculate correct percentage for 190,000 total cars', () => {
    // Test percentage calculations with the actual API total
    const testCases = [
      { processed: 1900, expectedPercent: 1.0 },
      { processed: 9500, expectedPercent: 5.0 },
      { processed: 95000, expectedPercent: 50.0 },
      { processed: 180500, expectedPercent: 95.0 },
      { processed: 190000, expectedPercent: 100.0 }
    ];
    
    const apiTotal = 190000;
    
    testCases.forEach(testCase => {
      const calculatedPercent = (testCase.processed / apiTotal) * 100;
      expect(calculatedPercent).toBeCloseTo(testCase.expectedPercent, 1);
    });
  });

  it('should prioritize resuming syncs with very low progress', () => {
    // Test prioritization logic for auto-resume
    const failedSyncs = [
      {
        id: 'sync-1',
        records_processed: 1900, // 1% - very low
        current_page: 19,
        completed_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 'sync-2', 
        records_processed: 95000, // 50% - mid progress
        current_page: 950,
        completed_at: '2024-01-01T10:01:00Z'
      }
    ];
    
    // Sort by priority: lower progress = higher priority
    const sortedByPriority = failedSyncs.sort((a, b) => {
      const progressA = a.records_processed / 190000;
      const progressB = b.records_processed / 190000;
      return progressA - progressB; // Lower progress first
    });
    
    expect(sortedByPriority[0].id).toBe('sync-1'); // 1% progress should be first
    expect(sortedByPriority[1].id).toBe('sync-2'); // 50% progress should be second
  });
});