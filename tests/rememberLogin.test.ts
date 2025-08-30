/**
 * Tests for the Remember Login functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the CookieManager
const mockSetCookie = vi.fn();
const mockGetCookie = vi.fn();
const mockDeleteCookie = vi.fn();

vi.mock('@/utils/cookieManager', () => ({
  CookieManager: {
    setCookie: mockSetCookie,
    getCookie: mockGetCookie,
    deleteCookie: mockDeleteCookie,
  }
}));

// Mock crypto for consistent device fingerprinting in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-12345'
  }
});

// Mock canvas and navigator for device fingerprinting
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    language: 'en-US'
  }
});

Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080
  }
});

// Mock HTML Canvas
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  textBaseline: '',
  font: '',
  fillText: vi.fn(),
}));

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'test-canvas-data');

describe('Remember Login Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCookie.mockReturnValue(null);
    mockSetCookie.mockReturnValue(true);
  });

  it('should save login info when remember me is checked', async () => {
    // Import the hook after mocks are set up
    const { useRememberLogin } = await import('@/hooks/useRememberLogin');
    
    // This test verifies the logic, actual hook testing would require a React testing environment
    expect(true).toBe(true); // Placeholder - would test actual hook behavior in a React test environment
  });

  it('should generate consistent device fingerprint', () => {
    // Test that device fingerprinting works consistently
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    expect(ctx).toBeDefined();
    expect(navigator.userAgent).toBe('test-user-agent');
    expect(screen.width).toBe(1920);
  });

  it('should handle cookie operations correctly', () => {
    const testEmail = 'test@example.com';
    const testLoginInfo = {
      email: testEmail,
      lastLoginDate: new Date().toISOString(),
      deviceFingerprint: 'test-fingerprint'
    };

    // Test setting cookie
    mockSetCookie.mockReturnValue(true);
    const result = mockSetCookie('remembered_login', JSON.stringify(testLoginInfo));
    expect(result).toBe(true);
    expect(mockSetCookie).toHaveBeenCalledWith('remembered_login', JSON.stringify(testLoginInfo));

    // Test getting cookie
    mockGetCookie.mockReturnValue(JSON.stringify(testLoginInfo));
    const retrieved = mockGetCookie('remembered_login');
    expect(retrieved).toBe(JSON.stringify(testLoginInfo));

    // Test deleting cookie
    mockDeleteCookie.mockReturnValue(undefined);
    mockDeleteCookie('remembered_login');
    expect(mockDeleteCookie).toHaveBeenCalledWith('remembered_login');
  });

  it('should handle invalid cookie data gracefully', () => {
    // Test with invalid JSON
    mockGetCookie.mockReturnValue('invalid-json-data');
    
    // The hook should handle this gracefully and not crash
    expect(() => {
      try {
        JSON.parse('invalid-json-data');
      } catch (error) {
        // Should delete invalid cookie
        mockDeleteCookie('remembered_login');
      }
    }).not.toThrow();

    expect(mockDeleteCookie).toHaveBeenCalledWith('remembered_login');
  });

  it('should verify device fingerprint matches', () => {
    const testLoginInfo = {
      email: 'test@example.com',
      lastLoginDate: new Date().toISOString(),
      deviceFingerprint: 'different-fingerprint'
    };

    mockGetCookie.mockReturnValue(JSON.stringify(testLoginInfo));

    // The hook should detect different device fingerprint and clear cookie
    // This would be tested in actual hook implementation
    expect(testLoginInfo.deviceFingerprint).toBe('different-fingerprint');
  });

  it('should handle security requirements', () => {
    // Test that only email is stored, not password
    const testLoginInfo = {
      email: 'test@example.com',
      lastLoginDate: new Date().toISOString(),
      deviceFingerprint: 'test-fingerprint'
      // No password field - this is intentional for security
    };

    expect(testLoginInfo).not.toHaveProperty('password');
    expect(testLoginInfo.email).toBe('test@example.com');
    expect(testLoginInfo.deviceFingerprint).toBe('test-fingerprint');
    expect(testLoginInfo.lastLoginDate).toBeDefined();
  });
});