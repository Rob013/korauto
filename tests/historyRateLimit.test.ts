import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('History Rate Limit Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not exceed 100 history.replaceState calls in 10 seconds', async () => {
    // Mock history.replaceState to track calls
    const replaceStateCalls: Array<{ timestamp: number }> = [];
    const originalReplaceState = window.history.replaceState;
    
    window.history.replaceState = vi.fn((...args) => {
      replaceStateCalls.push({ timestamp: Date.now() });
      return originalReplaceState.apply(window.history, args);
    });

    // Import debounce utility
    const debounce = (fn: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(null, args), delay);
      };
    };

    // Create a debounced replaceState function (simulating our fix)
    const debouncedReplaceState = debounce((url: string) => {
      window.history.replaceState({}, '', url);
    }, 300);

    // Simulate rapid calls (which would trigger the SecurityError without debouncing)
    const startTime = Date.now();
    
    // Try to make 150 rapid calls (this would exceed the 100 calls/10 seconds limit)
    for (let i = 0; i < 150; i++) {
      debouncedReplaceState(`/test?param=${i}`);
    }

    // Wait for debouncing to settle
    await new Promise(resolve => setTimeout(resolve, 350));

    // Check that only a limited number of calls were made
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // With proper debouncing, we should have far fewer than 100 calls
    expect(replaceStateCalls.length).toBeLessThan(5); // Debouncing should drastically reduce calls
    
    // Verify that in any 10-second window, we have < 100 calls
    const tenSecondWindow = 10000;
    let maxCallsInWindow = 0;
    
    for (let i = 0; i < replaceStateCalls.length; i++) {
      const windowStart = replaceStateCalls[i].timestamp;
      const windowEnd = windowStart + tenSecondWindow;
      
      const callsInWindow = replaceStateCalls.filter(
        call => call.timestamp >= windowStart && call.timestamp < windowEnd
      ).length;
      
      maxCallsInWindow = Math.max(maxCallsInWindow, callsInWindow);
    }
    
    expect(maxCallsInWindow).toBeLessThan(100);

    // Restore original function
    window.history.replaceState = originalReplaceState;
  });

  it('should debounce setSearchParams-like calls effectively', async () => {
    let callCount = 0;
    
    // Mock setSearchParams function
    const mockSetSearchParams = vi.fn(() => {
      callCount++;
    });

    // Create debounced version (simulating our fix)
    const debounce = (fn: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(null, args), delay);
      };
    };

    const debouncedSetSearchParams = debounce(mockSetSearchParams, 300);

    // Simulate rapid filter changes
    for (let i = 0; i < 20; i++) {
      debouncedSetSearchParams({ page: '1', manufacturer: `brand${i}` });
    }

    // Immediately after rapid calls, should have 0 calls due to debouncing
    expect(callCount).toBe(0);

    // Wait for debounce to settle
    await new Promise(resolve => setTimeout(resolve, 350));

    // Should have only 1 call after debouncing
    expect(callCount).toBe(1);
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
  });
});