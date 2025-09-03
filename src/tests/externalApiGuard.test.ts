import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExternalApiGuard } from '@/guards/externalApiGuard';

// Mock the feature flags module
vi.mock('@/config/featureFlags', () => ({
  isDbOnlyMode: vi.fn(),
  isExternalApiAllowed: vi.fn(),
  FEATURE_FLAGS: {
    READ_SOURCE: 'db'
  }
}));

describe('ExternalApiGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Database-only mode (READ_SOURCE=db)', () => {
    beforeEach(() => {
      const { isDbOnlyMode } = require('@/config/featureFlags');
      isDbOnlyMode.mockReturnValue(true);
    });

    it('should block external API calls to auctionsapi.com', () => {
      expect(() => {
        ExternalApiGuard.checkExternalApiCall('https://auctionsapi.com/api/cars', 'test context');
      }).toThrow(/External API call blocked in DB-only mode/);
    });

    it('should block external API calls to api.auctionsapi.com', () => {
      expect(() => {
        ExternalApiGuard.checkExternalApiCall('https://api.auctionsapi.com/v1/cars', 'test context');
      }).toThrow(/External API call blocked in DB-only mode/);
    });

    it('should block secure-cars-api-external marker', () => {
      expect(() => {
        ExternalApiGuard.checkExternalApiCall('secure-cars-api-external', 'useSecureAuctionAPI call');
      }).toThrow(/External API call blocked in DB-only mode/);
    });

    it('should allow internal API calls (supabase functions)', () => {
      expect(() => {
        ExternalApiGuard.checkExternalApiCall('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api', 'internal API');
      }).not.toThrow();
    });

    it('should allow relative URLs', () => {
      expect(() => {
        ExternalApiGuard.checkExternalApiCall('/api/cars', 'relative URL');
      }).not.toThrow();
    });

    it('should identify external API URLs correctly', () => {
      expect(ExternalApiGuard.isExternalApiUrl('https://auctionsapi.com/api/cars')).toBe(true);
      expect(ExternalApiGuard.isExternalApiUrl('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api')).toBe(false);
      expect(ExternalApiGuard.isExternalApiUrl('/api/cars')).toBe(false);
    });
  });

  describe('External API mode (READ_SOURCE=external)', () => {
    beforeEach(() => {
      const { isDbOnlyMode } = require('@/config/featureFlags');
      isDbOnlyMode.mockReturnValue(false);
    });

    it('should allow external API calls', () => {
      expect(() => {
        ExternalApiGuard.checkExternalApiCall('https://auctionsapi.com/api/cars', 'test context');
      }).not.toThrow();
    });

    it('should allow secure-cars-api-external calls', () => {
      expect(() => {
        ExternalApiGuard.checkExternalApiCall('secure-cars-api-external', 'useSecureAuctionAPI call');
      }).not.toThrow();
    });
  });

  describe('GuardedFetch', () => {
    beforeEach(() => {
      const { isDbOnlyMode } = require('@/config/featureFlags');
      isDbOnlyMode.mockReturnValue(true);
      
      // Mock global fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });
    });

    it('should block external API calls via guardedFetch', async () => {
      await expect(
        ExternalApiGuard.guardedFetch('https://auctionsapi.com/api/cars', {}, 'test')
      ).rejects.toThrow(/External API call blocked in DB-only mode/);
    });

    it('should allow internal API calls via guardedFetch', async () => {
      const response = await ExternalApiGuard.guardedFetch('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api', {}, 'test');
      expect(response).toBeTruthy();
      expect(global.fetch).toHaveBeenCalledWith('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api', {});
    });
  });
});