import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthLogin from '../src/components/AuthLogin';
import { BrowserRouter } from 'react-router-dom';

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AuthLogin Component', () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onLoginSuccess callback after successful admin login', async () => {
    // Get mocked functions
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSignInWithPassword = supabase.auth.signInWithPassword as any;
    const mockRpc = supabase.rpc as any;

    // Mock successful authentication and admin check
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: true, error: null });

    render(
      <TestWrapper>
        <AuthLogin onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    // Fill in the form
    const emailInput = screen.getByPlaceholderText('Admin Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(loginButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('is_admin');
    });

    // Verify that onLoginSuccess callback was called
    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('should not call onLoginSuccess when login fails', async () => {
    // Get mocked functions
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSignInWithPassword = supabase.auth.signInWithPassword as any;

    // Mock failed authentication
    mockSignInWithPassword.mockResolvedValue({ 
      error: { message: 'Invalid credentials' } 
    });

    render(
      <TestWrapper>
        <AuthLogin onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    // Fill in the form
    const emailInput = screen.getByPlaceholderText('Admin Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    // Submit the form
    fireEvent.click(loginButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'wrongpassword',
      });
    });

    // Verify that onLoginSuccess callback was NOT called
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('should not call onLoginSuccess when user is not admin', async () => {
    // Get mocked functions
    const { supabase } = await import('@/integrations/supabase/client');
    const mockSignInWithPassword = supabase.auth.signInWithPassword as any;
    const mockRpc = supabase.rpc as any;

    // Mock successful authentication but failed admin check
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ data: false, error: null });

    render(
      <TestWrapper>
        <AuthLogin onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    // Fill in the form
    const emailInput = screen.getByPlaceholderText('Admin Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(loginButton);

    // Wait for the async operations to complete
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('is_admin');
    });

    // Verify that onLoginSuccess callback was NOT called
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });
});