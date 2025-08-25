import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmailConfirmationPage from '@/pages/EmailConfirmationPage';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      verifyOtp: vi.fn()
    }
  }
}));

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams]
  };
});

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

const renderEmailConfirmationPage = () => {
  return render(
    <BrowserRouter>
      <EmailConfirmationPage />
    </BrowserRouter>
  );
};

describe('EmailConfirmationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear search params by creating a new instance
    mockSearchParams.delete('token');
    mockSearchParams.delete('type');
  });

  it('shows loading state initially', () => {
    mockSearchParams.set('token', 'test-token');
    mockSearchParams.set('type', 'signup');
    
    renderEmailConfirmationPage();
    
    expect(screen.getByText('Confirming Your Email...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we verify your email address.')).toBeInTheDocument();
  });

  it('shows error when no token is provided', async () => {
    renderEmailConfirmationPage();
    
    await waitFor(() => {
      expect(screen.getByText('Confirmation Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid confirmation link.')).toBeInTheDocument();
    });
  });

  it('shows error when wrong type is provided', async () => {
    mockSearchParams.set('token', 'test-token');
    mockSearchParams.set('type', 'wrong-type');
    
    renderEmailConfirmationPage();
    
    await waitFor(() => {
      expect(screen.getByText('Confirmation Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid confirmation link.')).toBeInTheDocument();
    });
  });

  it('shows success when confirmation is successful', async () => {
    mockSearchParams.set('token', 'test-token');
    mockSearchParams.set('type', 'signup');
    
    const mockUser = { id: 'user-id', email: 'test@example.com' };
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    renderEmailConfirmationPage();
    
    await waitFor(() => {
      expect(screen.getByText('Email Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('Your email has been confirmed successfully!')).toBeInTheDocument();
    });
    
    expect(mockToast).toHaveBeenCalledWith({
      title: "Email Confirmed! 🎉",
      description: "Your account is now active. Welcome to KORAUTO!",
    });
  });

  it('shows error when verification fails', async () => {
    mockSearchParams.set('token', 'test-token');
    mockSearchParams.set('type', 'signup');
    
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });
    
    renderEmailConfirmationPage();
    
    await waitFor(() => {
      expect(screen.getByText('Confirmation Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });

  it('navigates to auth page when back to sign up is clicked', async () => {
    renderEmailConfirmationPage();
    
    await waitFor(() => {
      expect(screen.getByText('Confirmation Failed')).toBeInTheDocument();
    });
    
    const backButton = screen.getByText('Back to Sign Up');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('navigates to homepage when return to homepage is clicked', async () => {
    renderEmailConfirmationPage();
    
    await waitFor(() => {
      expect(screen.getByText('Confirmation Failed')).toBeInTheDocument();
    });
    
    const homeButton = screen.getByText('Return to Homepage');
    fireEvent.click(homeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});