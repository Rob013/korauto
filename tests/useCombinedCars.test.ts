import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCombinedCars } from '@/hooks/useCombinedCars';

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        neq: vi.fn(() => ({
          neq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ 
                data: [], 
                error: null 
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@/hooks/useSecureAuctionAPI', () => ({
  useSecureAuctionAPI: () => ({
    cars: [],
    loading: false,
    error: null,
    totalCount: 0,
    hasMorePages: false,
    fetchCars: vi.fn(),
    fetchAllCars: vi.fn(),
    filters: {},
    setFilters: vi.fn(),
    fetchManufacturers: vi.fn(),
    fetchModels: vi.fn(),
    fetchGenerations: vi.fn(),
    fetchAllGenerationsForManufacturer: vi.fn(),
    fetchFilterCounts: vi.fn(),
    fetchGrades: vi.fn(),
    fetchTrimLevels: vi.fn(),
    loadMore: vi.fn(),
    setCars: vi.fn(),
    setTotalCount: vi.fn(),
  })
}));

describe('useCombinedCars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize without errors', async () => {
    const { result } = renderHook(() => useCombinedCars());
    
    expect(result.current).toBeDefined();
    expect(result.current.cars).toBeDefined();
    expect(result.current.fetchCars).toBeDefined();
    expect(result.current.fetchAllCars).toBeDefined();
  });

  it('should have proper initial state', () => {
    const { result } = renderHook(() => useCombinedCars());
    
    expect(result.current.cars).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should combine database and API cars correctly', () => {
    const { result } = renderHook(() => useCombinedCars());
    
    // Test the basic structure
    expect(result.current.databaseCars).toEqual([]);
    expect(result.current.apiCars).toEqual([]);
    expect(result.current.hasDatabaseData).toBe(false);
    expect(result.current.hasApiData).toBe(false);
  });
});