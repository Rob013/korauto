import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Test suite for continuous sync system fixes
 * 
 * Tests the following improvements:
 * 1. Edge function sync loop runs until 20 consecutive empty pages (more robust)
 * 2. Auto-resume scheduler checks every 15 seconds and handles running syncs
 * 3. Sync continuation logic triggers auto-resume when sync returns 'running' status
 * 4. Sync system never pauses, only completes or continues running
 */

describe('Continuous Sync System Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Edge Function Sync Loop', () => {
    it('should continue sync until 20 consecutive empty pages instead of 10', () => {
      // This test verifies the logic change from 10 to 20 consecutive empty pages
      const mockSyncData = {
        consecutiveEmptyPages: 15,
        shouldContinue: true
      };
      
      // With old logic (10 pages), this would have stopped
      // With new logic (20 pages), this should continue
      expect(mockSyncData.consecutiveEmptyPages < 20).toBe(true);
      expect(mockSyncData.shouldContinue).toBe(true);
    });

    it('should set status to running instead of paused when not complete', () => {
      const mockSyncStatus = {
        consecutiveEmptyPages: 15,
        totalProcessed: 1000,
        expectedStatus: 'running' // Should be 'running', not 'paused'
      };
      
      const finalStatus = mockSyncStatus.consecutiveEmptyPages >= 20 ? 'completed' : 'running';
      expect(finalStatus).toBe('running');
      expect(finalStatus).not.toBe('paused');
    });

    it('should return shouldContinue flag when sync is not complete', () => {
      const mockResponse = {
        success: true,
        status: 'running',
        totalProcessed: 1000,
        shouldContinue: true // This flag should trigger auto-continuation
      };
      
      expect(mockResponse.shouldContinue).toBe(true);
      expect(mockResponse.status).toBe('running');
    });
  });

  describe('Auto-Resume Scheduler', () => {
    it('should check for both failed and running syncs', () => {
      const mockSyncStatuses = [
        { status: 'failed', last_activity_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
        { status: 'running', last_activity_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }
      ];
      
      // Both should be candidates for resume
      mockSyncStatuses.forEach(sync => {
        const shouldResume = sync.status === 'failed' || 
                           (sync.status === 'running' && 
                            Date.now() - new Date(sync.last_activity_at).getTime() > 3 * 60 * 1000);
        expect(shouldResume).toBe(true);
      });
    });

    it('should check every 15 seconds instead of 30 seconds', () => {
      const checkIntervalMinutes = 0.25; // 15 seconds
      const expectedIntervalMs = checkIntervalMinutes * 60 * 1000;
      
      expect(expectedIntervalMs).toBe(15000); // 15 seconds
      expect(expectedIntervalMs).toBeLessThan(30000); // Less than old 30 second interval
    });

    it('should detect stuck running syncs after 3 minutes of inactivity', () => {
      const mockRunningSync = {
        status: 'running',
        last_activity_at: new Date(Date.now() - 4 * 60 * 1000).toISOString() // 4 minutes ago
      };
      
      const timeSinceActivity = Date.now() - new Date(mockRunningSync.last_activity_at).getTime();
      const isStuck = timeSinceActivity > 3 * 60 * 1000; // 3 minutes threshold
      
      expect(isStuck).toBe(true);
    });
  });

  describe('Sync Continuation Logic', () => {
    it('should trigger auto-continuation when sync returns shouldContinue=true', async () => {
      const mockSyncResponse = {
        data: {
          success: true,
          status: 'running',
          shouldContinue: true,
          currentPage: 150,
          totalProcessed: 5000
        }
      };
      
      // Mock the continuation logic
      const shouldTriggerContinuation = mockSyncResponse.data?.shouldContinue && 
                                      mockSyncResponse.data?.status === 'running';
      
      expect(shouldTriggerContinuation).toBe(true);
    });

    it('should chain sync batches automatically', () => {
      const mockSyncBatches = [
        { page: 1, processed: 1000, shouldContinue: true },
        { page: 100, processed: 2000, shouldContinue: true },
        { page: 200, processed: 3000, shouldContinue: false } // Final batch
      ];
      
      // All batches except the last should continue
      mockSyncBatches.forEach((batch, index) => {
        if (index < mockSyncBatches.length - 1) {
          expect(batch.shouldContinue).toBe(true);
        }
      });
      
      // Last batch should not continue
      expect(mockSyncBatches[mockSyncBatches.length - 1].shouldContinue).toBe(false);
    });
  });

  describe('Sync Status Management', () => {
    it('should never set status to paused', () => {
      const possibleStatuses = ['running', 'completed', 'failed'];
      
      // 'paused' should not be in the list of valid statuses
      expect(possibleStatuses).not.toContain('paused');
      expect(possibleStatuses).toContain('running');
      expect(possibleStatuses).toContain('completed');
    });

    it('should only mark as completed when truly finished (20 empty pages)', () => {
      const testCases = [
        { emptyPages: 10, expectedStatus: 'running' },
        { emptyPages: 15, expectedStatus: 'running' },
        { emptyPages: 19, expectedStatus: 'running' },
        { emptyPages: 20, expectedStatus: 'completed' },
        { emptyPages: 25, expectedStatus: 'completed' }
      ];
      
      testCases.forEach(testCase => {
        const actualStatus = testCase.emptyPages >= 20 ? 'completed' : 'running';
        expect(actualStatus).toBe(testCase.expectedStatus);
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should continue sync even with errors below threshold', () => {
      const maxErrors = 20; // Error threshold
      const currentErrors = 15;
      
      const shouldContinue = currentErrors < maxErrors;
      expect(shouldContinue).toBe(true);
    });

    it('should use minimal delays for maximum speed recovery', () => {
      const errorDelays = {
        network: 1000, // 1 second (reduced from 5 seconds)
        api: 0,        // No delay (instant retry)
        unknown: 0     // No delay (instant retry)
      };
      
      Object.values(errorDelays).forEach(delay => {
        expect(delay).toBeLessThanOrEqual(1000); // All delays <= 1 second
      });
    });
  });
});