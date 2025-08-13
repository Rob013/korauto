import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useKorAutoMarketplace } from '@/hooks/korauto_marketplace';

// Mock the dependencies
vi.mock('@/hooks/useSecureAuctionAPI', () => ({
  useSecureAuctionAPI: () => ({
    cars: [],
    loading: false,
    error: null,
    fetchCars: vi.fn(),
    fetchCarById: vi.fn(),
    // Mock other auction API methods
    manufacturers: [],
    models: [],
    generations: [],
    fetchManufacturers: vi.fn(),
    fetchModels: vi.fn(),
    fetchGenerations: vi.fn(),
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

describe('useKorAutoMarketplace', () => {
  it('should initialize with empty listings', async () => {
    const { result } = renderHook(() => useKorAutoMarketplace());
    
    expect(result.current.listings).toEqual([]);
    expect(result.current.userListings).toEqual([]);
    expect(result.current.offers).toEqual([]);
    // Loading might be true initially due to useEffect
    expect(typeof result.current.marketplaceLoading).toBe('boolean');
    expect(result.current.marketplaceError).toBe(null);
  });

  it('should have all required marketplace functions', () => {
    const { result } = renderHook(() => useKorAutoMarketplace());
    
    expect(typeof result.current.fetchMarketplaceListings).toBe('function');
    expect(typeof result.current.createListing).toBe('function');
    expect(typeof result.current.makeOffer).toBe('function');
    expect(typeof result.current.getMarketplaceStats).toBe('function');
    expect(typeof result.current.getCarForListing).toBe('function');
  });

  it('should preserve existing auction API functionality', () => {
    const { result } = renderHook(() => useKorAutoMarketplace());
    
    // Verify that all existing auction API functions are preserved
    expect(typeof result.current.fetchCars).toBe('function');
    expect(typeof result.current.fetchCarById).toBe('function');
    expect(typeof result.current.fetchManufacturers).toBe('function');
    expect(typeof result.current.fetchModels).toBe('function');
    expect(typeof result.current.fetchGenerations).toBe('function');
    
    // Verify that auction API data is accessible
    expect(Array.isArray(result.current.cars)).toBe(true);
  });

  it('should have current user set after initialization', async () => {
    const { result } = renderHook(() => useKorAutoMarketplace());
    
    await waitFor(() => {
      expect(result.current.currentUser).not.toBe(null);
    });
    
    expect(result.current.currentUser?.username).toBe('marketplace_user');
    expect(result.current.currentUser?.verification_status).toBe('verified');
  });

  it('should create a listing successfully', async () => {
    const { result } = renderHook(() => useKorAutoMarketplace());
    
    const listingData = {
      car_id: 'test_car_123',
      seller_id: 'test_seller',
      listing_type: 'fixed_price' as const,
      asking_price: 25000,
      location: 'Seoul',
    };

    const newListing = await result.current.createListing(listingData);
    
    expect(newListing).toBeDefined();
    expect(newListing.car_id).toBe('test_car_123');
    expect(newListing.asking_price).toBe(25000);
    expect(newListing.status).toBe('active');
    expect(newListing.verification_status).toBe('pending');
  });

  it('should make an offer successfully', async () => {
    const { result } = renderHook(() => useKorAutoMarketplace());
    
    const offer = await result.current.makeOffer('test_listing_123', 22000, 'Great car!');
    
    expect(offer).toBeDefined();
    expect(offer.listing_id).toBe('test_listing_123');
    expect(offer.offer_amount).toBe(22000);
    expect(offer.message).toBe('Great car!');
    expect(offer.status).toBe('pending');
  });
});