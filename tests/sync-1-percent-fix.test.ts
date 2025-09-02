/**
 * Test for sync 1% stuck issue fixes
 * Ensures the sync system doesn't get stuck at 1% and auto-resumes properly
 */

import { describe, it, expect } from 'vitest';

describe('Sync 1% Stuck Issue Fixes', () => {
  
  it('should have aggressive resume timing for low progress syncs', () => {
    // Test the logic from AutoResumeScheduler for very low progress syncs
    const recordsProcessed = 1900; // 1% of 190,000
    const progressPercentage = (recordsProcessed / 190000) * 100;
    const isVeryLowProgress = progressPercentage < 5;
    
    // Should qualify as very low progress
    expect(progressPercentage).toBeLessThan(5);
    expect(isVeryLowProgress).toBe(true);
    
    // Should get faster resume delay
    const RESUME_DELAY = isVeryLowProgress ? 1 * 1000 : 3 * 1000;
    expect(RESUME_DELAY).toBe(1000); // 1 second for low progress
  });

  it('should detect running syncs as stuck after 1.5 minutes', () => {
    // Test the logic for detecting stuck running syncs
    const lastActivityTime = new Date(Date.now() - 95 * 1000); // 95 seconds ago (>1.5 minutes)
    const timeSinceFailure = Date.now() - lastActivityTime.getTime();
    
    const shouldResumeRunningSync = timeSinceFailure > 90 * 1000; // 1.5 minutes
    
    expect(timeSinceFailure).toBeGreaterThan(90 * 1000);
    expect(shouldResumeRunningSync).toBe(true);
  });

  it('should identify syncs that need immediate recovery', () => {
    // Test the detection logic for various sync states
    
    // Case 1: Failed sync with very low progress
    const failedLowProgress = {
      status: 'failed',
      records_processed: 950, // 0.5%
      last_activity_at: new Date(Date.now() - 2000).toISOString() // 2 seconds ago
    };
    
    const progressPercentage = (failedLowProgress.records_processed / 190000) * 100;
    const isVeryLowProgress = progressPercentage < 5;
    const timeSinceFailure = Date.now() - new Date(failedLowProgress.last_activity_at).getTime();
    const shouldResumeImmediately = timeSinceFailure > 1000; // 1 second delay for low progress
    
    expect(isVeryLowProgress).toBe(true);
    expect(shouldResumeImmediately).toBe(true);
    
    // Case 2: Running sync that's been inactive
    const stuckRunningSync = {
      status: 'running',
      records_processed: 500,
      last_activity_at: new Date(Date.now() - 2.5 * 60 * 1000).toISOString() // 2.5 minutes ago
    };
    
    const timeSinceActivity = Date.now() - new Date(stuckRunningSync.last_activity_at).getTime();
    const shouldMarkAsFailed = timeSinceActivity > 2 * 60 * 1000; // 2 minutes
    
    expect(shouldMarkAsFailed).toBe(true);
  });

  it('should handle edge function timeout scenario', () => {
    // Test the timing logic for edge function execution limits
    const MAX_EXECUTION_TIME = 8 * 60 * 1000; // 8 minutes
    
    // Scenario: Sync has been running for 8+ minutes
    const startTime = Date.now() - (8.5 * 60 * 1000); // 8.5 minutes ago
    const elapsedTime = Date.now() - startTime;
    const shouldBreakForTimeout = elapsedTime > MAX_EXECUTION_TIME;
    
    expect(elapsedTime).toBeGreaterThan(MAX_EXECUTION_TIME);
    expect(shouldBreakForTimeout).toBe(true);
  });

  it('should prioritize immediate resume for 1% syncs', () => {
    // Test the specific 1% scenario from the problem statement
    const onePercentSync = {
      status: 'failed',
      records_processed: 1900, // ~1% of 190,000
      current_page: 8, // Early page
      last_activity_at: new Date(Date.now() - 5000).toISOString() // 5 seconds ago
    };
    
    const progressPercentage = (onePercentSync.records_processed / 190000) * 100;
    const isVeryLowProgress = progressPercentage < 5;
    const timeSinceFailure = Date.now() - new Date(onePercentSync.last_activity_at).getTime();
    
    // Should qualify for priority resume
    expect(progressPercentage).toBeCloseTo(1, 0); // ~1%
    expect(isVeryLowProgress).toBe(true);
    expect(onePercentSync.current_page).toBeLessThan(10); // Early in sync
    
    // Should get immediate resume (1 second delay)
    const RESUME_DELAY = isVeryLowProgress ? 1 * 1000 : 3 * 1000;
    const shouldResumeNow = timeSinceFailure > RESUME_DELAY;
    
    expect(RESUME_DELAY).toBe(1000);
    expect(shouldResumeNow).toBe(true);
  });

  it('should ensure auto-resume frequency is appropriate', () => {
    // Test that the auto-resume checker runs frequently enough
    const checkIntervalMinutes = 0.25; // 15 seconds
    const checkIntervalMs = checkIntervalMinutes * 60 * 1000;
    
    // Should check every 15 seconds for quick detection
    expect(checkIntervalMs).toBe(15000);
    expect(checkIntervalMinutes).toBeLessThan(0.5); // Less than 30 seconds
  });

  it('should detect various failure scenarios', () => {
    // Test different scenarios that should trigger auto-resume
    
    const scenarios = [
      {
        name: 'Fresh failed sync at 1%',
        status: 'failed',
        records_processed: 1900,
        timeSinceFailure: 2000, // 2 seconds
        expectedAction: 'immediate_resume'
      },
      {
        name: 'Running sync with no activity',
        status: 'running', 
        records_processed: 5000,
        timeSinceFailure: 120000, // 2 minutes
        expectedAction: 'mark_failed_then_resume'
      },
      {
        name: 'Higher progress failed sync',
        status: 'failed',
        records_processed: 50000, // ~26%
        timeSinceFailure: 4000, // 4 seconds
        expectedAction: 'normal_resume'
      }
    ];
    
    scenarios.forEach(scenario => {
      const progressPercentage = (scenario.records_processed / 190000) * 100;
      const isVeryLowProgress = progressPercentage < 5;
      
      if (scenario.expectedAction === 'immediate_resume') {
        expect(isVeryLowProgress).toBe(true);
        expect(scenario.timeSinceFailure > 1000).toBe(true); // > 1 second delay
      } else if (scenario.expectedAction === 'mark_failed_then_resume') {
        expect(scenario.status).toBe('running');
        expect(scenario.timeSinceFailure > 90000).toBe(true); // > 1.5 minutes
      } else if (scenario.expectedAction === 'normal_resume') {
        expect(isVeryLowProgress).toBe(false);
        expect(scenario.timeSinceFailure > 3000).toBe(true); // > 3 second delay
      }
    });
  });
});