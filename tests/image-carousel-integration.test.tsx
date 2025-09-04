import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LazyCarCard from '@/components/LazyCarCard';
import { BrowserRouter } from 'react-router-dom';
import { NavigationProvider } from '@/contexts/NavigationContext';

// Mock the hooks and external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } })
    }
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

// Mock intersection observer to trigger immediately
const mockIntersectionObserver = vi.fn((callback) => {
  return {
    observe: vi.fn(() => {
      // Immediately trigger intersection
      setTimeout(() => {
        callback([{ isIntersecting: true }]);
      }, 0);
    }),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  };
});

beforeEach(() => {
  window.IntersectionObserver = mockIntersectionObserver;
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <NavigationProvider>
      {children}
    </NavigationProvider>
  </BrowserRouter>
);

describe('Image Carousel Integration in Car Cards', () => {
  const mockCarProps = {
    id: 'test-car-1',
    make: 'BMW',
    model: 'X3',
    year: 2022,
    price: 45000,
    lot: 'LOT123'
  };

  it('should display image count indicator for multiple images', async () => {
    const multipleImages = [
      'https://example.com/car1.jpg',
      'https://example.com/car2.jpg',
      'https://example.com/car3.jpg'
    ];
    
    render(
      <TestWrapper>
        <LazyCarCard
          {...mockCarProps}
          images={multipleImages}
        />
      </TestWrapper>
    );

    // Wait for intersection observer to trigger and should show image count
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should not show count indicator for single image', async () => {
    const singleImage = 'https://example.com/car1.jpg';
    
    render(
      <TestWrapper>
        <LazyCarCard
          {...mockCarProps}
          images={[singleImage]}
        />
      </TestWrapper>
    );

    // Wait for intersection observer to trigger
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
    
    // Should not show image count for single image
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('should show multiple image count correctly', async () => {
    const fiveImages = [
      'https://example.com/car1.jpg',
      'https://example.com/car2.jpg',
      'https://example.com/car3.jpg',
      'https://example.com/car4.jpg',
      'https://example.com/car5.jpg'
    ];
    
    render(
      <TestWrapper>
        <LazyCarCard
          {...mockCarProps}
          images={fiveImages}
        />
      </TestWrapper>
    );

    // Wait for intersection observer to trigger and verify count
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should preserve car information display', async () => {
    render(
      <TestWrapper>
        <LazyCarCard
          {...mockCarProps}
          images={['https://example.com/car1.jpg']}
        />
      </TestWrapper>
    );

    // Wait for intersection observer to trigger
    await waitFor(() => {
      expect(screen.getByText('€45,000')).toBeInTheDocument();
      expect(screen.getByText('#LOT123')).toBeInTheDocument();
    });
  });

  it('should handle fallback when no images provided', async () => {
    render(
      <TestWrapper>
        <LazyCarCard
          {...mockCarProps}
        />
      </TestWrapper>
    );

    // Wait for intersection observer to trigger
    await waitFor(() => {
      expect(screen.getByText('€45,000')).toBeInTheDocument();
    });

    // Should not show camera icon with image count when no images
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    
    // Should show fallback car icon instead
    const carIcon = document.querySelector('svg.lucide-car');
    expect(carIcon).toBeInTheDocument();
  });
});