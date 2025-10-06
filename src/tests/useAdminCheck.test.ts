import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminCheck } from '@/hooks/useAdminCheck';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    rpc: vi.fn()
  }
}));

const { supabase } = await import('@/integrations/supabase/client');

describe('useAdminCheck Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null
    });

    const { result } = renderHook(() => useAdminCheck());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle non-admin user correctly', async () => {
    const mockUser = { id: 'user-123', email: 'user@test.com' };
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: false,
      error: null
    });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle admin user correctly', async () => {
    const mockUser = { id: 'admin-123', email: 'admin@test.com' };
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: true,
      error: null
    });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle admin check error gracefully', async () => {
    const mockUser = { id: 'user-123', email: 'user@test.com' };
    
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Admin check failed' }
    });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle unauthenticated user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null
    });

    const { result } = renderHook(() => useAdminCheck());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });
});