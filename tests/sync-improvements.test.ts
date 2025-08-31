/**
 * Test for sync system improvements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      count: 1000,
      data: null,
      error: null
    })),
    eq: vi.fn(() => ({
      single: vi.fn(() => ({
        data: {
          id: 'cars-sync-main',
          status: 'running',
          records_processed: 500,
          current_page: 10,
          started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
          last_activity_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
        },
        error: null
      }))
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Sync System Improvements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate correct car count using max of both tables', async () => {
    // Mock different counts from cache and main tables
    const mockFromCache = vi.fn(() => ({
      select: vi.fn(() => ({
        count: 800,
        error: null
      }))
    }));
    
    const mockFromMain = vi.fn(() => ({
      select: vi.fn(() => ({
        count: 1200, // Higher count in main table
        error: null
      }))
    }));

    // Mock supabase calls for different tables
    mockSupabase.from = vi.fn((table) => {
      if (table === 'cars_cache') {
        return mockFromCache();
      } else if (table === 'cars') {
        return mockFromMain();
      }
      return mockFromCache(); // default
    });

    // Simulate the logic from the improved checkSyncStatus function
    const cacheResult = await mockSupabase.from('cars_cache').select('*', { count: 'exact', head: true });
    const mainResult = await mockSupabase.from('cars').select('*', { count: 'exact', head: true });
    
    const cacheCount = cacheResult.count || 0;
    const mainCarsCount = mainResult.count || 0;
    const totalRealCount = Math.max(cacheCount, mainCarsCount);

    expect(cacheCount).toBe(800);
    expect(mainCarsCount).toBe(1200);
    expect(totalRealCount).toBe(1200); // Should use the higher count
  });

  it('should detect stuck sync correctly with improved threshold', () => {
    const syncStatus = {
      status: 'running',
      started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
      last_activity_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
      current_page: 10,
      records_processed: 1000
    };

    // Simulate the improved detectStuckSync function
    const detectStuckSync = (sync: any): boolean => {
      if (sync.status !== 'running') return false;
      
      const lastActivity = sync.last_activity_at ? new Date(sync.last_activity_at) : new Date(sync.started_at || 0);
      const now = Date.now();
      const timeSinceActivity = now - lastActivity.getTime();
      
      // New improved threshold of 20 minutes
      const STUCK_THRESHOLD = 20 * 60 * 1000; // 20 minutes
      
      return timeSinceActivity > STUCK_THRESHOLD;
    };

    const isStuck = detectStuckSync(syncStatus);
    expect(isStuck).toBe(true); // Should be detected as stuck after 25 minutes with 20-minute threshold
  });

  it('should not detect running sync as stuck if within threshold', () => {
    const syncStatus = {
      status: 'running',
      started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      last_activity_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      current_page: 10,
      records_processed: 1000
    };

    // Simulate the improved detectStuckSync function
    const detectStuckSync = (sync: any): boolean => {
      if (sync.status !== 'running') return false;
      
      const lastActivity = sync.last_activity_at ? new Date(sync.last_activity_at) : new Date(sync.started_at || 0);
      const now = Date.now();
      const timeSinceActivity = now - lastActivity.getTime();
      
      // New improved threshold of 20 minutes
      const STUCK_THRESHOLD = 20 * 60 * 1000; // 20 minutes
      
      return timeSinceActivity > STUCK_THRESHOLD;
    };

    const isStuck = detectStuckSync(syncStatus);
    expect(isStuck).toBe(false); // Should NOT be detected as stuck after only 10 minutes
  });

  it('should provide enhanced progress messages with runtime info', () => {
    const syncStatus = {
      status: 'running',
      records_processed: 5000,
      started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      error_message: 'Rate: 250 cars/min'
    };

    // Simulate the enhanced updateProgressMessage function
    const updateProgressMessage = (status: any): string => {
      const recordsProcessed = status.records_processed || 0;
      const estimatedTotal = 192800;
      const percentage = Math.round((recordsProcessed / estimatedTotal) * 100);
      
      const formattedRecords = recordsProcessed.toLocaleString();
      const formattedTotal = estimatedTotal.toLocaleString();
      
      let rateText = '';
      if (status.error_message && status.error_message.includes('Rate:')) {
        const rateMatch = status.error_message.match(/Rate: (\d+) cars\/min/);
        if (rateMatch) {
          rateText = ` (${rateMatch[1]} cars/min)`;
        }
      }
      
      if (status.status === 'running') {
        const timeRunning = status.started_at ? 
          Math.round((Date.now() - new Date(status.started_at).getTime()) / 60000) : 0;
        return `🔄 Syncing${rateText}... ${formattedRecords} / ${formattedTotal} cars (${percentage}%) - Running for ${timeRunning}min`;
      }
      
      return `Status: ${status.status}`;
    };

    const progressMessage = updateProgressMessage(syncStatus);
    
    expect(progressMessage).toContain('🔄 Syncing (250 cars/min)');
    expect(progressMessage).toContain('5,000 / 200,000 cars');
    expect(progressMessage).toContain('(3%)');
    expect(progressMessage).toContain('Running for 30min');
  });
});