import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckNewUpdates } from '../src/components/CheckNewUpdates';

// Mock the supabase integration
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { created_at: new Date().toISOString() }, 
              error: null 
            }))
          }))
        })),
        eq: vi.fn(() => ({
          gte: vi.fn(() => Promise.resolve({ count: 0, error: null }))
        })),
      }))
    }))
  }
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

describe('CheckNewUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the updates component', async () => {
    render(<CheckNewUpdates />);
    
    expect(screen.getByText('Updates')).toBeInTheDocument();
    
    // Wait for initial check to complete
    await waitFor(() => {
      expect(screen.getByText('Check Updates')).toBeInTheDocument();
    });
  });

  it('shows loading state when checking for updates', async () => {
    render(<CheckNewUpdates />);
    
    // The component automatically checks on mount, so we should see "Checking..." initially
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });
});