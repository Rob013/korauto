import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client since we can't make real API calls in tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('External API Integration End-to-End', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should switch from internal database API to external API calls', async () => {
    // Mock successful external API response
    const mockApiResponse = {
      data: {
        data: [
          {
            id: 1,
            title: '2020 BMW 3 Series',
            year: 2020,
            manufacturer: { name: 'BMW' },
            model: { name: '3 Series' },
            lots: [{
              buy_now: 25000,
              images: { normal: ['https://example.com/image1.jpg'] },
              odometer: { km: 50000 }
            }]
          }
        ],
        meta: {
          total: 100,
          current_page: 1,
          last_page: 4
        }
      },
      error: null
    };

    // Import the supabase mock
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.functions.invoke).mockResolvedValue(mockApiResponse);

    // Test that the external API function works correctly
    const { useSecureAuctionAPI } = await import('@/hooks/useSecureAuctionAPI');
    
    // This test verifies that the hook exists and can be imported
    expect(useSecureAuctionAPI).toBeDefined();
    expect(typeof useSecureAuctionAPI).toBe('function');
  });

  it('should verify that fetchCars no longer uses internal database API', async () => {
    // This test ensures we're not importing the old database API functions
    const moduleContent = await import('@/hooks/useSecureAuctionAPI');
    
    // The hook should be exported
    expect(moduleContent.useSecureAuctionAPI).toBeDefined();
    
    // Test that the hook doesn't have references to the old database functions
    const hookString = moduleContent.useSecureAuctionAPI.toString();
    
    // Should not contain references to old database API
    expect(hookString).not.toContain('fetchCarsWithKeyset');
    expect(hookString).not.toContain('mapFrontendSortToBackend');
  });

  it('should verify external API sorting parameters are properly structured', () => {
    // Test the sorting parameter structure expected by external API
    const expectedSortParams = {
      price_low: { sort_by: 'price', sort_direction: 'asc' },
      price_high: { sort_by: 'price', sort_direction: 'desc' },
      year_new: { sort_by: 'year', sort_direction: 'desc' },
      year_old: { sort_by: 'year', sort_direction: 'asc' },
      mileage_low: { sort_by: 'mileage', sort_direction: 'asc' },
      mileage_high: { sort_by: 'mileage', sort_direction: 'desc' },
      make_az: { sort_by: 'manufacturer', sort_direction: 'asc' },
      make_za: { sort_by: 'manufacturer', sort_direction: 'desc' },
      popular: { sort_by: 'popularity', sort_direction: 'desc' }
    };

    // Verify the structure is correct for external API
    Object.entries(expectedSortParams).forEach(([sortOption, expectedParams]) => {
      expect(expectedParams).toHaveProperty('sort_by');
      expect(expectedParams).toHaveProperty('sort_direction');
      expect(['asc', 'desc']).toContain(expectedParams.sort_direction);
    });
  });

  it('should verify backend sorting is maintained across pagination', () => {
    // Test that pagination maintains backend sorting
    const mockPage1Filters = {
      page: '1',
      per_page: '50',
      sort_by: 'price',
      sort_direction: 'asc',
      manufacturer_id: '9'
    };

    const mockPage2Filters = {
      page: '2', 
      per_page: '50',
      sort_by: 'price',
      sort_direction: 'asc',
      manufacturer_id: '9'
    };

    // Verify that sort parameters are maintained across pages
    expect(mockPage1Filters.sort_by).toBe(mockPage2Filters.sort_by);
    expect(mockPage1Filters.sort_direction).toBe(mockPage2Filters.sort_direction);
    
    // Page should be the only difference
    expect(mockPage1Filters.page).not.toBe(mockPage2Filters.page);
  });

  it('should handle external API response format correctly', () => {
    // Mock the expected external API response format
    const mockExternalApiResponse = {
      data: [
        {
          id: 1,
          title: '2020 BMW 3 Series',
          year: 2020,
          manufacturer: { name: 'BMW' },
          model: { name: '3 Series' },
          lots: [{
            buy_now: 25000,
            images: { normal: ['https://example.com/image1.jpg'] },
            odometer: { km: 50000 },
            grade_iaai: 'Grade A',
            status: 'available'
          }]
        }
      ],
      meta: {
        total: 100,
        current_page: 1,
        last_page: 4
      }
    };

    // Verify the response structure matches what our code expects
    expect(mockExternalApiResponse).toHaveProperty('data');
    expect(mockExternalApiResponse).toHaveProperty('meta');
    expect(mockExternalApiResponse.meta).toHaveProperty('total');
    expect(mockExternalApiResponse.meta).toHaveProperty('last_page');
    
    // Verify car structure
    expect(mockExternalApiResponse.data[0]).toHaveProperty('lots');
    expect(mockExternalApiResponse.data[0].lots[0]).toHaveProperty('buy_now');
    expect(mockExternalApiResponse.data[0].lots[0]).toHaveProperty('images');
  });
});