import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCarDetails } from '@/hooks/useCarDetails';
import { useCarDetailsPerformance } from '@/hooks/useCarDetailsPerformance';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      }))
    }))
  }
}));

vi.mock('@/utils/analytics', () => ({
  trackCarView: vi.fn()
}));

vi.mock('@/data/fallbackData', () => ({
  fallbackCars: [
    {
      id: 'test-123',
      lot_number: 'test-123',
      manufacturer: { name: 'Test Make' },
      model: { name: 'Test Model' },
      year: 2020,
      price: 25000,
      features: ['Test Feature']
    }
  ]
}));

describe('Car Details Performance Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const mockOptions = {
    convertUSDtoEUR: vi.fn((amount: number) => amount * 0.92),
    getCarFeatures: vi.fn(() => ['Feature 1', 'Feature 2']),
    getSafetyFeatures: vi.fn(() => ['ABS', 'Airbags']),
    getComfortFeatures: vi.fn(() => ['AC', 'Power Windows'])
  };

  it('should handle invalid lot parameter gracefully', async () => {
    const { result } = renderHook(
      () => useCarDetails('', mockOptions),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Invalid car identifier provided');
      expect(result.current.car).toBe(null);
    });
  });

  it('should handle cache timeout gracefully', async () => {
    // Mock slow cache response
    const { supabase } = await import('@/integrations/supabase/client');
    const mockQuery = vi.fn(() => new Promise(resolve => setTimeout(resolve, 5000)));
    
    (supabase.from as any).mockReturnValue({
      select: () => ({
        or: () => ({
          maybeSingle: mockQuery
        })
      })
    });

    const { result } = renderHook(
      () => useCarDetails('test-123', mockOptions),
      { wrapper }
    );

    // Should eventually load fallback data
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
        expect(result.current.car).toBeTruthy();
      },
      { timeout: 10000 }
    );
  });

  it('should use fallback data when API calls fail', async () => {
    // Mock failed cache and API calls
    const { supabase } = await import('@/integrations/supabase/client');
    
    (supabase.from as any).mockReturnValue({
      select: () => ({
        or: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
        })
      })
    });

    // Mock fetch to fail
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useCarDetails('test-123', mockOptions),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.car).toBeTruthy();
      expect(result.current.car?.make).toBe('Test Make');
      expect(result.current.car?.model).toBe('Test Model');
    });
  });

  it('should track performance metrics', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Mock successful cache response
    (supabase.from as any).mockReturnValue({
      select: () => ({
        or: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: 'test-123',
              make: 'Test Make',
              model: 'Test Model',
              year: 2020,
              price: 25000,
              car_data: '{}',
              lot_data: '{}',
              images: '[]'
            },
            error: null
          })
        })
      })
    });

    const consoleSpy = vi.spyOn(console, 'log');

    const { result } = renderHook(
      () => useCarDetails('test-123', mockOptions),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.car).toBeTruthy();
    });

    // Should log performance metrics
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/⚡ Cache hit - loaded in \d+\.\d+ms/)
    );

    consoleSpy.mockRestore();
  });

  it('should abort requests on unmount', async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    
    // Mock slow cache response that would still be running
    const { supabase } = await import('@/integrations/supabase/client');
    const slowPromise = new Promise(resolve => setTimeout(resolve, 5000));
    
    (supabase.from as any).mockReturnValue({
      select: () => ({
        or: () => ({
          maybeSingle: () => slowPromise
        })
      })
    });

    const { unmount } = renderHook(
      () => useCarDetails('test-123', mockOptions),
      { wrapper }
    );

    // Wait a bit for the request to start
    await new Promise(resolve => setTimeout(resolve, 10));
    
    unmount();

    // Abort should be called when component unmounts
    expect(abortSpy).toHaveBeenCalled();

    abortSpy.mockRestore();
  });
});

describe('Car Details Performance Hook Tests', () => {
  it('should preload critical images', () => {
    const mockCar = {
      image: 'https://example.com/car1.jpg',
      images: ['https://example.com/car1.jpg', 'https://example.com/car2.jpg', 'https://example.com/car3.jpg'],
      make: 'Test',
      model: 'Car',
      year: 2020
    };

    const { result } = renderHook(() => useCarDetailsPerformance(mockCar));

    expect(result.current.criticalImages).toHaveLength(3);
    expect(result.current.criticalImages).toContain('https://example.com/car1.jpg');
  });

  it('should handle null car data gracefully', () => {
    const { result } = renderHook(() => useCarDetailsPerformance(null));

    expect(result.current.criticalImages).toHaveLength(0);
    expect(result.current.preloadedCount).toBeGreaterThanOrEqual(0);
  });
});