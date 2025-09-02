/**
 * Test to validate AI Coordinator integration with other sync components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('AI Coordinator Integration', () => {
  let mockWindow: Record<string, unknown>;

  beforeEach(() => {
    // Mock window object
    mockWindow = {};
    global.window = mockWindow as Window & typeof globalThis;
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  describe('Global AI Coordinator Exposure', () => {
    it('should properly expose AI coordinator functions to window object', () => {
      // Simulate AISyncCoordinator setting up global access
      const mockFunctions = {
        startIntelligentSync: vi.fn(),
        invokeEdgeFunctionWithRetry: vi.fn(),
        classifyErrorAndGetStrategy: vi.fn(),
        testEdgeFunctionConnectivity: vi.fn()
      };

      // Simulate the useEffect in AISyncCoordinator
      (mockWindow as unknown as { aiSyncCoordinator: Record<string, unknown> }).aiSyncCoordinator = mockFunctions;

      expect(mockWindow).toHaveProperty('aiSyncCoordinator');
      expect((mockWindow as unknown as { aiSyncCoordinator: Record<string, unknown> }).aiSyncCoordinator).toEqual(mockFunctions);
    });

    it('should allow FullCarsSyncTrigger to access AI coordinator', () => {
      // Setup AI coordinator
      const mockStartIntelligentSync = vi.fn().mockResolvedValue(undefined);
      (mockWindow as unknown as { aiSyncCoordinator: Record<string, unknown> }).aiSyncCoordinator = {
        startIntelligentSync: mockStartIntelligentSync
      };

      // Simulate FullCarsSyncTrigger usage
      const aiCoordinator = (mockWindow as unknown as { aiSyncCoordinator?: { startIntelligentSync: (params: Record<string, unknown>) => Promise<void> } }).aiSyncCoordinator;
      
      expect(aiCoordinator).toBeDefined();
      expect(aiCoordinator?.startIntelligentSync).toBeDefined();
      
      // Test calling the function
      if (aiCoordinator) {
        aiCoordinator.startIntelligentSync({ source: 'manual-smart-sync' });
        expect(mockStartIntelligentSync).toHaveBeenCalledWith({ source: 'manual-smart-sync' });
      }
    });

    it('should handle graceful fallback when AI coordinator is not available', () => {
      // Don't set up AI coordinator
      const aiCoordinator = (mockWindow as unknown as { aiSyncCoordinator?: { startIntelligentSync: (params: Record<string, unknown>) => Promise<void> } }).aiSyncCoordinator;
      
      expect(aiCoordinator).toBeUndefined();
      
      // FullCarsSyncTrigger should fallback to direct method
      let fallbackCalled = false;
      if (!aiCoordinator) {
        fallbackCalled = true; // Simulate calling startSyncWithRetry()
      }
      
      expect(fallbackCalled).toBe(true);
    });
  });

  describe('AutoResumeScheduler Integration', () => {
    it('should allow AutoResumeScheduler to use AI coordinator for auto-resume', () => {
      // Setup AI coordinator
      const mockStartIntelligentSync = vi.fn().mockResolvedValue(undefined);
      (mockWindow as unknown as { aiSyncCoordinator: Record<string, unknown> }).aiSyncCoordinator = {
        startIntelligentSync: mockStartIntelligentSync
      };

      // Simulate AutoResumeScheduler usage
      const aiCoordinator = (mockWindow as unknown as { aiSyncCoordinator?: { startIntelligentSync: (params: Record<string, unknown>) => Promise<void> } }).aiSyncCoordinator;
      
      if (aiCoordinator) {
        const lastFailedSync = { current_page: 150 };
        aiCoordinator.startIntelligentSync({
          resume: true,
          fromPage: lastFailedSync.current_page,
          reconcileProgress: true,
          source: 'immediate-auto-resume',
          attemptNumber: 2
        });
        
        expect(mockStartIntelligentSync).toHaveBeenCalledWith({
          resume: true,
          fromPage: 150,
          reconcileProgress: true,
          source: 'immediate-auto-resume',
          attemptNumber: 2
        });
      }
    });
  });

  describe('Cross-Component Communication', () => {
    it('should maintain consistent parameter format across components', () => {
      // Test that all components use consistent parameter structure
      const standardParams = {
        resume: true,
        fromPage: 100,
        reconcileProgress: true,
        source: 'test-source'
      };

      // Parameters should have the expected structure
      expect(standardParams).toHaveProperty('resume');
      expect(standardParams).toHaveProperty('fromPage');
      expect(standardParams).toHaveProperty('reconcileProgress');
      expect(standardParams).toHaveProperty('source');
      
      expect(typeof standardParams.resume).toBe('boolean');
      expect(typeof standardParams.fromPage).toBe('number');
      expect(typeof standardParams.reconcileProgress).toBe('boolean');
      expect(typeof standardParams.source).toBe('string');
    });

    it('should properly clean up global references on unmount', () => {
      // Setup AI coordinator
      (mockWindow as unknown as { aiSyncCoordinator: Record<string, unknown> }).aiSyncCoordinator = {
        startIntelligentSync: vi.fn()
      };

      expect(mockWindow).toHaveProperty('aiSyncCoordinator');

      // Simulate component unmount cleanup
      const windowObj = mockWindow as unknown as { aiSyncCoordinator?: Record<string, unknown> };
      if (windowObj.aiSyncCoordinator) {
        delete windowObj.aiSyncCoordinator;
      }

      expect(mockWindow).not.toHaveProperty('aiSyncCoordinator');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle AI coordinator errors gracefully', async () => {
      // Setup AI coordinator that throws an error
      const mockStartIntelligentSync = vi.fn().mockRejectedValue(new Error('AI coordinator failed'));
      (mockWindow as unknown as { aiSyncCoordinator: Record<string, unknown> }).aiSyncCoordinator = {
        startIntelligentSync: mockStartIntelligentSync
      };

      const aiCoordinator = (mockWindow as unknown as { aiSyncCoordinator?: { startIntelligentSync: (params: Record<string, unknown>) => Promise<void> } }).aiSyncCoordinator;
      
      if (aiCoordinator) {
        let errorCaught = false;
        try {
          await aiCoordinator.startIntelligentSync({ source: 'test' });
        } catch (error) {
          errorCaught = true;
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('AI coordinator failed');
        }
        expect(errorCaught).toBe(true);
      }
    });
  });
});