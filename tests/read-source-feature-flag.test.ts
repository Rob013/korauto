/**
 * Tests for READ_SOURCE=db feature flag and external API blocking
 * Validates that external API calls are blocked when READ_SOURCE=db
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  isDbOnlyMode, 
  isExternalApiCall, 
  guardExternalApiCall,
  guardedFetch 
} from '@/guards/externalApiGuard';

describe('READ_SOURCE Feature Flag Tests', () => {
  const originalEnv = process.env;
  const originalImportMeta = global.importMeta;

  beforeEach(() => {
    // Clear environment
    process.env = { ...originalEnv };
    delete process.env.READ_SOURCE;
    delete process.env.VITE_READ_SOURCE;
    
    // Mock import.meta
    global.importMeta = {
      env: {}
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.importMeta = originalImportMeta;
  });

  describe('isDbOnlyMode', () => {
    it('should default to db mode when no READ_SOURCE is set', () => {
      expect(isDbOnlyMode()).toBe(true);
    });

    it('should return true when READ_SOURCE=db (server env)', () => {
      process.env.READ_SOURCE = 'db';
      expect(isDbOnlyMode()).toBe(true);
    });

    it('should return true when VITE_READ_SOURCE=db (client env)', () => {
      // Clear server env first
      delete process.env.READ_SOURCE;
      global.importMeta = { env: { VITE_READ_SOURCE: 'db' } };
      expect(isDbOnlyMode()).toBe(true);
    });

    it('should return false when READ_SOURCE=api', () => {
      process.env.READ_SOURCE = 'api';
      expect(isDbOnlyMode()).toBe(false);
    });

    it('should return false when VITE_READ_SOURCE=api', () => {
      // Clear server env first
      delete process.env.READ_SOURCE;
      global.importMeta = { env: { VITE_READ_SOURCE: 'api' } };
      expect(isDbOnlyMode()).toBe(false);
    });

    it('should prioritize server env over client env', () => {
      process.env.READ_SOURCE = 'api';
      global.importMeta = { env: { VITE_READ_SOURCE: 'db' } };
      expect(isDbOnlyMode()).toBe(false);
    });
  });

  describe('isExternalApiCall', () => {
    it('should identify external API hosts', () => {
      expect(isExternalApiCall('https://api.encar.com/data')).toBe(true);
      expect(isExternalApiCall('https://encar.com/api/cars')).toBe(true);
      expect(isExternalApiCall('https://www.encar.com/search')).toBe(true);
      expect(isExternalApiCall('https://api.auction.co.kr/vehicles')).toBe(true);
      expect(isExternalApiCall('https://autoauction.co.kr/api/data')).toBe(true);
    });

    it('should not identify internal/local URLs as external', () => {
      expect(isExternalApiCall('/api/cars')).toBe(false);
      expect(isExternalApiCall('http://localhost:3000/api')).toBe(false);
      expect(isExternalApiCall('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api')).toBe(false);
      expect(isExternalApiCall('https://app.example.com/internal-api')).toBe(false);
    });

    it('should handle subdomain matching', () => {
      expect(isExternalApiCall('https://api.sub.encar.com/data')).toBe(true);
      expect(isExternalApiCall('https://v2.api.auction.co.kr/cars')).toBe(true);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(isExternalApiCall('not-a-url')).toBe(false);
      expect(isExternalApiCall('')).toBe(false);
      expect(isExternalApiCall('://invalid')).toBe(false);
    });
  });

  describe('guardExternalApiCall', () => {
    it('should not throw when READ_SOURCE=api', () => {
      process.env.READ_SOURCE = 'api';
      expect(() => {
        guardExternalApiCall('https://api.encar.com/data');
      }).not.toThrow();
    });

    it('should not throw for internal URLs even when READ_SOURCE=db', () => {
      process.env.READ_SOURCE = 'db';
      expect(() => {
        guardExternalApiCall('/api/cars');
      }).not.toThrow();
      
      expect(() => {
        guardExternalApiCall('https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api');
      }).not.toThrow();
    });

    it('should throw when READ_SOURCE=db and URL is external API', () => {
      process.env.READ_SOURCE = 'db';
      
      expect(() => {
        guardExternalApiCall('https://api.encar.com/data');
      }).toThrow('🚫 External API call blocked: READ_SOURCE=db mode is enabled');

      expect(() => {
        guardExternalApiCall('https://auction.co.kr/api/cars');
      }).toThrow('External API call blocked');
    });

    it('should include context in error message', () => {
      process.env.READ_SOURCE = 'db';
      
      expect(() => {
        guardExternalApiCall('https://api.encar.com/data', 'Fetching car listings');
      }).toThrow('Context: Fetching car listings');
    });

    it('should include helpful error message', () => {
      process.env.READ_SOURCE = 'db';
      
      expect(() => {
        guardExternalApiCall('https://api.encar.com/data');
      }).toThrow('This application is configured to read ONLY from the database');
      
      expect(() => {
        guardExternalApiCall('https://api.encar.com/data');
      }).toThrow('To allow external API calls, set READ_SOURCE=api');
    });
  });

  describe('guardedFetch', () => {
    const mockFetch = vi.fn();
    
    beforeEach(() => {
      global.fetch = mockFetch;
      mockFetch.mockClear();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call fetch when READ_SOURCE=api', async () => {
      process.env.READ_SOURCE = 'api';
      mockFetch.mockResolvedValue(new Response('{}'));
      
      await guardedFetch('https://api.encar.com/data');
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.encar.com/data', undefined);
    });

    it('should call fetch for internal URLs even when READ_SOURCE=db', async () => {
      process.env.READ_SOURCE = 'db';
      mockFetch.mockResolvedValue(new Response('{}'));
      
      await guardedFetch('/api/cars');
      
      expect(mockFetch).toHaveBeenCalledWith('/api/cars', undefined);
    });

    it('should throw before calling fetch when READ_SOURCE=db and URL is external', async () => {
      process.env.READ_SOURCE = 'db';
      
      await expect(
        guardedFetch('https://api.encar.com/data')
      ).rejects.toThrow('External API call blocked');
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should pass fetch options correctly', async () => {
      process.env.READ_SOURCE = 'api';
      mockFetch.mockResolvedValue(new Response('{}'));
      
      const options = { method: 'POST', body: '{}' };
      await guardedFetch('https://api.encar.com/data', options);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.encar.com/data', options);
    });
  });

  describe('Integration Test: External API blocking in production', () => {
    it('should block any attempt to call external API when READ_SOURCE=db', () => {
      // Set to db-only mode (production setting)
      process.env.READ_SOURCE = 'db';
      
      // Test various external API patterns that might be used
      const externalUrls = [
        'https://api.encar.com/v1/cars',
        'https://encar.com/search',
        'https://www.encar.com/api/search',
        'https://api.auction.co.kr/vehicles',
        'https://auction.co.kr/api/search',
        'https://autoauction.co.kr/api/data',
        'https://api.autoauction.co.kr/search'
      ];

      externalUrls.forEach(url => {
        expect(() => {
          guardExternalApiCall(url, `Testing URL: ${url}`);
        }).toThrow('External API call blocked');
      });
    });

    it('should allow internal API calls when READ_SOURCE=db', () => {
      process.env.READ_SOURCE = 'db';
      
      const internalUrls = [
        '/api/cars',
        '/api/cars/123',
        'https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api',
        'https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/cars-api/123',
        'http://localhost:3000/api/cars',
        'https://app.korauto.com/api/cars'
      ];

      internalUrls.forEach(url => {
        expect(() => {
          guardExternalApiCall(url, `Testing internal URL: ${url}`);
        }).not.toThrow();
      });
    });
  });
});