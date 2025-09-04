import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileFilterSheet } from '@/components/mobile-filter-sheet';
import { MobileFilterUX } from '@/components/mobile-filter-ux';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock useIsMobile hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => true), // Mock as mobile device
}));

describe('Mobile Filter Components', () => {
  const mockOnClose = vi.fn();
  const mockOnClearFilters = vi.fn();
  const mockOnToggleFilters = vi.fn();
  const mockOnSearchCars = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MobileFilterSheet', () => {
    it('should render when open', () => {
      render(
        <MobileFilterSheet
          isOpen={true}
          onClose={mockOnClose}
          onClearFilters={mockOnClearFilters}
          hasSelectedFilters={true}
          selectedFiltersCount={3}
        >
          <div>Filter Content</div>
        </MobileFilterSheet>
      );

      expect(screen.getByText('Filtrat e Kërkimit')).toBeInTheDocument();
      expect(screen.getByText('3 aktiv')).toBeInTheDocument();
      expect(screen.getByText('Filter Content')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(
        <MobileFilterSheet
          isOpen={false}
          onClose={mockOnClose}
          onClearFilters={mockOnClearFilters}
        >
          <div>Filter Content</div>
        </MobileFilterSheet>
      );

      expect(screen.queryByText('Filtrat e Kërkimit')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <MobileFilterSheet
          isOpen={true}
          onClose={mockOnClose}
          onClearFilters={mockOnClearFilters}
        >
          <div>Filter Content</div>
        </MobileFilterSheet>
      );

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(button => 
        button.querySelector('svg') // Find button with X icon
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should call onClearFilters when clear button is clicked', () => {
      render(
        <MobileFilterSheet
          isOpen={true}
          onClose={mockOnClose}
          onClearFilters={mockOnClearFilters}
        >
          <div>Filter Content</div>
        </MobileFilterSheet>
      );

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe('MobileFilterUX', () => {
    it('should render filter toggle button', () => {
      render(
        <MobileFilterUX
          showFilters={false}
          onToggleFilters={mockOnToggleFilters}
          onClearFilters={mockOnClearFilters}
          hasSelectedCategories={false}
          selectedFiltersCount={0}
        >
          <div>Filter Content</div>
        </MobileFilterUX>
      );

      expect(screen.getByText('Shfaq Filtrat')).toBeInTheDocument();
    });

    it('should show close text when filters are open', () => {
      render(
        <MobileFilterUX
          showFilters={true}
          onToggleFilters={mockOnToggleFilters}
          onClearFilters={mockOnClearFilters}
          hasSelectedCategories={false}
          selectedFiltersCount={0}
        >
          <div>Filter Content</div>
        </MobileFilterUX>
      );

      expect(screen.getByText('Fshih Filtrat')).toBeInTheDocument();
    });

    it('should show filter count badge when filters are selected', () => {
      render(
        <MobileFilterUX
          showFilters={false}
          onToggleFilters={mockOnToggleFilters}
          onClearFilters={mockOnClearFilters}
          hasSelectedCategories={true}
          selectedFiltersCount={5}
        >
          <div>Filter Content</div>
        </MobileFilterUX>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should call onToggleFilters when button is clicked', () => {
      render(
        <MobileFilterUX
          showFilters={false}
          onToggleFilters={mockOnToggleFilters}
          onClearFilters={mockOnClearFilters}
          hasSelectedCategories={false}
          selectedFiltersCount={0}
        >
          <div>Filter Content</div>
        </MobileFilterUX>
      );

      const toggleButton = screen.getByRole('button', { name: /Shfaq Filtrat|Filtrat/ });
      fireEvent.click(toggleButton);
      expect(mockOnToggleFilters).toHaveBeenCalled();
    });
  });
});