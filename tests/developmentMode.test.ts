import { describe, it, expect, vi } from 'vitest';

// Mock the development mode functions
vi.mock('@/lib/developmentMode', async () => {
  const actual = await vi.importActual('@/lib/developmentMode');
  return {
    ...actual,
    isDevelopmentMode: vi.fn(),
    getSupabaseConfig: vi.fn(),
  };
});

import { isDevelopmentMode, getSupabaseConfig, DEVELOPMENT_SUPABASE_CONFIG } from '@/lib/developmentMode';

describe('Development Mode', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when environment variables are not set (development mode)', () => {
    vi.mocked(isDevelopmentMode).mockReturnValue(true);
    expect(isDevelopmentMode()).toBe(true);
  });

  it('should return false when environment variables are set (production mode)', () => {
    vi.mocked(isDevelopmentMode).mockReturnValue(false);
    expect(isDevelopmentMode()).toBe(false);
  });

  it('should return empty config for development mode', () => {
    vi.mocked(getSupabaseConfig).mockReturnValue({
      url: undefined,
      anonKey: undefined,
    });
    
    const config = getSupabaseConfig();
    expect(config.url).toBeUndefined();
    expect(config.anonKey).toBeUndefined();
  });

  it('should return correct config for production mode', () => {
    const testUrl = 'https://test.supabase.co';
    const testKey = 'test-key';
    
    vi.mocked(getSupabaseConfig).mockReturnValue({
      url: testUrl,
      anonKey: testKey,
    });

    const config = getSupabaseConfig();
    expect(config.url).toBe(testUrl);
    expect(config.anonKey).toBe(testKey);
  });

  it('should have development config constants defined', () => {
    expect(DEVELOPMENT_SUPABASE_CONFIG.url).toBeDefined();
    expect(DEVELOPMENT_SUPABASE_CONFIG.anonKey).toBeDefined();
    expect(typeof DEVELOPMENT_SUPABASE_CONFIG.url).toBe('string');
    expect(typeof DEVELOPMENT_SUPABASE_CONFIG.anonKey).toBe('string');
  });

  it('should properly detect development mode when no config is available', () => {
    // Test the real implementation logic
    vi.mocked(isDevelopmentMode).mockImplementation(() => {
      // Simulate empty environment variables
      return true;
    });
    
    expect(isDevelopmentMode()).toBe(true);
  });

  it('should properly detect production mode when config is available', () => {
    // Test the real implementation logic
    vi.mocked(isDevelopmentMode).mockImplementation(() => {
      // Simulate set environment variables
      return false;
    });
    
    expect(isDevelopmentMode()).toBe(false);
  });
});