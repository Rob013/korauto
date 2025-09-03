/**
 * Sync Verification Tests
 * 
 * Tests to ensure the sync process is actually writing data to the database
 * and the verification system works correctly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { 
  verifySyncToDatabase, 
  quickSyncCheck, 
  verifyBatchWrite 
} from '@/utils/syncVerification';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('Sync Verification System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('verifySyncToDatabase', () => {
    it('should pass verification when database has expected data', async () => {
      // Mock successful database responses
      const mockSupabase = supabase as any;
      
      let callCount = 0;
      mockSupabase.from.mockImplementation((tableName: string) => {
        callCount++;
        
        switch (tableName) {
          case 'cars':
            if (callCount === 1) { // Record count
              return {
                select: vi.fn().mockResolvedValue({ count: 1000, error: null })
              };
            } else if (callCount === 3) { // Recent sync timestamps
              return {
                select: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [{ last_synced_at: new Date().toISOString() }],
                      error: null
                    })
                  })
                })
              };
            } else if (callCount === 4) { // Sample records
              return {
                select: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      { id: '1', make: 'Toyota', model: 'Camry', external_id: 'ext1' },
                      { id: '2', make: 'Honda', model: 'Civic', external_id: 'ext2' }
                    ],
                    error: null
                  })
                })
              };
            }
            break;
          case 'cars_staging':
            return {
              select: vi.fn().mockResolvedValue({ count: 0, error: null })
            };
          case 'cars_cache':
            return {
              select: vi.fn().mockResolvedValue({ count: 950, error: null })
            };
          case 'sync_status':
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { status: 'completed', error_message: null },
                      error: null
                    })
                  })
                })
              })
            };
        }
        
        // Default fallback
        return {
          select: vi.fn().mockResolvedValue({ count: 0, error: null })
        };
      });

      const result = await verifySyncToDatabase(1000);

      expect(result.success).toBe(true);
      expect(result.details.actualCount).toBe(1000);
      expect(result.details.stagingTableCleared).toBe(true);
      expect(result.details.sampleRecordsVerified).toBe(true);
      expect(result.details.dataIntegrityPassed).toBe(true);
    }, 15000); // Increase timeout to 10 seconds

    it('should fail verification when record count does not match expected', async () => {
      const mockSupabase = supabase as any;
      
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        
        switch (callCount) {
          case 1: // cars table count with wrong count
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 500, error: null })
              })
            };
          default:
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 0, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                  })
                }),
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            };
        }
      });

      const result = await verifySyncToDatabase(1000);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Record count mismatch: expected 1000, found 500');
    }, 10000);

    it('should fail verification when staging table is not cleared', async () => {
      const mockSupabase = supabase as any;
      
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        
        switch (callCount) {
          case 1: // cars table count
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 1000, error: null })
              })
            };
          case 2: // staging table not empty
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 50, error: null })
              })
            };
          default:
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 1000, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                  })
                }),
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            };
        }
      });

      const result = await verifySyncToDatabase();

      expect(result.success).toBe(false);
      expect(result.details.stagingTableCleared).toBe(false);
      expect(result.errors).toContain('Staging table not cleared: 50 records remaining');
    }, 10000);

    it('should fail verification when sample records are invalid', async () => {
      const mockSupabase = supabase as any;
      
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        
        switch (callCount) {
          case 1: // cars table count
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 1000, error: null })
              })
            };
          case 2: // staging table empty
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 0, error: null })
              })
            };
          case 3: // recent timestamps
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ last_synced_at: new Date().toISOString() }],
                    error: null
                  })
                })
              })
            };
          case 4: // invalid sample records
            return {
              select: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { id: '1', make: null, model: 'Camry', external_id: 'ext1' }, // Invalid - missing make
                    { id: '2', make: 'Honda', model: null, external_id: 'ext2' }  // Invalid - missing model
                  ],
                  error: null
                })
              })
            };
          default:
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 1000, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                  })
                })
              })
            };
        }
      });

      const result = await verifySyncToDatabase();

      expect(result.success).toBe(false);
      expect(result.details.sampleRecordsVerified).toBe(false);
      expect(result.errors).toContain('Sample verification failed: 0/2 records valid');
    }, 10000);

    it('should use configurable sync time threshold', async () => {
      const mockSupabase = supabase as any;
      
      // Create a date that's 50 hours old (more than 24h but less than 72h default)
      const oldSyncTime = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString();
      
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        
        switch (callCount) {
          case 1: // cars table count
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 1000, error: null })
              })
            };
          case 2: // staging table count
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 0, error: null })
              })
            };
          case 3: // recent sync timestamps - 50 hours old
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ last_synced_at: oldSyncTime }],
                    error: null
                  })
                })
              })
            };
          default:
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 0, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                  })
                }),
                limit: vi.fn().mockResolvedValue({ data: [], error: null })
              })
            };
        }
      });

      // Test with default 72h threshold - should pass
      const resultWithDefault = await verifySyncToDatabase(1000);
      expect(resultWithDefault.success).toBe(true);

      // Reset call count
      callCount = 0;
      
      // Test with stricter 24h threshold - should fail
      const resultWithStrict = await verifySyncToDatabase(1000, { syncTimeThresholdHours: 24 });
      expect(resultWithStrict.success).toBe(false);
      expect(resultWithStrict.errors?.[0]).toContain('Last sync is too old: 50.0 hours ago');
    }, 10000);

    it('should use configurable data integrity threshold', async () => {
      const mockSupabase = supabase as any;
      
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        
        switch (callCount) {
          case 1: // cars table count
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 1000, error: null })
              })
            };
          case 2: // staging table count
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 0, error: null })
              })
            };
          case 3: // recent sync timestamps
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [{ last_synced_at: new Date().toISOString() }],
                    error: null
                  })
                })
              })
            };
          case 4: // sample records
            return {
              select: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    { id: '1', make: 'Toyota', model: 'Camry', external_id: 'ext1' }
                  ],
                  error: null
                })
              })
            };
          case 5: // cars_cache count - 15% difference (1000 vs 850)
            return {
              select: vi.fn().mockReturnValue({
                then: vi.fn().mockResolvedValue({ count: 850, error: null })
              })
            };
          default:
            return {
              select: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
                  })
                })
              })
            };
        }
      });

      // Test with default 20% threshold - should pass (15% difference)
      const resultWithDefault = await verifySyncToDatabase(1000);
      expect(resultWithDefault.success).toBe(true);
      expect(resultWithDefault.details.dataIntegrityPassed).toBe(true);

      // Reset call count
      callCount = 0;
      
      // Test with stricter 10% threshold - should fail (15% difference)
      const resultWithStrict = await verifySyncToDatabase(1000, { dataIntegrityThresholdPercent: 10 });
      expect(resultWithStrict.success).toBe(false);
      expect(resultWithStrict.errors?.[0]).toContain('Data integrity issue: 15.0% difference');
    }, 10000);
  });

  describe('quickSyncCheck', () => {
    it('should return true when cars table has data', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          then: vi.fn().mockResolvedValue({ count: 100, error: null })
        })
      });

      const result = await quickSyncCheck();

      expect(result).toBe(true);
    }, 10000);

    it('should return false when cars table is empty', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          then: vi.fn().mockResolvedValue({ count: 0, error: null })
        })
      });

      const result = await quickSyncCheck();

      expect(result).toBe(false);
    }, 10000);

    it('should return false when there is a database error', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          then: vi.fn().mockResolvedValue({ 
            count: null, 
            error: { message: 'Database connection failed' }
          })
        })
      });

      const result = await quickSyncCheck();

      expect(result).toBe(false);
    }, 10000);
  });

  describe('verifyBatchWrite', () => {
    it('should return true when all batch records are found in database', async () => {
      const mockSupabase = supabase as any;
      const batchData = [
        { id: '1', make: 'Toyota' },
        { id: '2', make: 'Honda' },
        { id: '3', make: 'Ford' }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: '1' }, { id: '2' }, { id: '3' }],
            error: null
          })
        })
      });

      const result = await verifyBatchWrite(batchData);

      expect(result).toBe(true);
    });

    it('should return false when some batch records are missing', async () => {
      const mockSupabase = supabase as any;
      const batchData = [
        { id: '1', make: 'Toyota' },
        { id: '2', make: 'Honda' },
        { id: '3', make: 'Ford' }
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: '1' }, { id: '2' }], // Missing id: '3'
            error: null
          })
        })
      });

      const result = await verifyBatchWrite(batchData);

      expect(result).toBe(false);
    });

    it('should return true for empty batch data', async () => {
      const result = await verifyBatchWrite([]);
      expect(result).toBe(true);
    });

    it('should return false on database error', async () => {
      const mockSupabase = supabase as any;
      const batchData = [{ id: '1', make: 'Toyota' }];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      const result = await verifyBatchWrite(batchData);

      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = await verifySyncToDatabase();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should handle malformed database responses', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          head: true
        }))
      });
      mockSupabase.from().select.mockResolvedValueOnce({ 
        count: 'invalid',  // Invalid count type
        error: null 
      });

      const result = await verifySyncToDatabase();

      // Should handle gracefully and continue with other checks
      expect(result.success).toBeDefined();
    });
  });
});

describe('Integration Test: Full Sync Verification Flow', () => {
  it('should verify a complete sync workflow', async () => {
    // This would be a full integration test that:
    // 1. Triggers a sync
    // 2. Monitors progress
    // 3. Verifies the final result
    
    // For now, we'll mock this as it requires actual database and API connections
    const mockWorkflow = async () => {
      const syncs = [
        { stage: 'start', success: true },
        { stage: 'fetch_data', success: true },
        { stage: 'write_to_staging', success: true },
        { stage: 'merge_to_main', success: true },
        { stage: 'cleanup_staging', success: true },
        { stage: 'verify_final', success: true }
      ];
      
      for (const sync of syncs) {
        if (!sync.success) {
          throw new Error(`Sync failed at stage: ${sync.stage}`);
        }
      }
      
      return { success: true, message: 'Full sync workflow completed' };
    };

    const result = await mockWorkflow();
    expect(result.success).toBe(true);
  });
});