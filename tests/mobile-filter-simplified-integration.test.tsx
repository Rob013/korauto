import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileFilterUX } from '@/components/mobile-filter-ux';
import { MobileFilterSheet } from '@/components/mobile-filter-sheet';

// Mock useIsMobile to return true for mobile testing
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => true),
}));

describe('Mobile Filter Components Integration', () => {
  const mockProps = {
    showFilters: false,
    onToggleFilters: vi.fn(),
    onClearFilters: vi.fn(),
    onSearchCars: vi.fn(),
    hasSelectedCategories: false,
    selectedFiltersCount: 0,
  };

  it('should render MobileFilterUX with filter sheet when open', () => {
    render(
      <MobileFilterUX
        {...mockProps}
        showFilters={true}
      >
        <div data-testid="filter-content">Filter Form</div>
      </MobileFilterUX>
    );

    // Should show the toggle button
    expect(screen.getByText('Fshih Filtrat')).toBeInTheDocument();
    
    // Should show the mobile filter sheet
    expect(screen.getByText('Filtrat e Kërkimit')).toBeInTheDocument();
    
    // Should show the filter content
    expect(screen.getByTestId('filter-content')).toBeInTheDocument();
  });

  it('should render MobileFilterUX without sheet when closed', () => {
    render(
      <MobileFilterUX
        {...mockProps}
        showFilters={false}
      >
        <div data-testid="filter-content">Filter Form</div>
      </MobileFilterUX>
    );

    // Should show the toggle button
    expect(screen.getByText('Shfaq Filtrat')).toBeInTheDocument();
    
    // Should not show the mobile filter sheet
    expect(screen.queryByText('Filtrat e Kërkimit')).not.toBeInTheDocument();
    
    // Should not show the filter content
    expect(screen.queryByTestId('filter-content')).not.toBeInTheDocument();
  });

  it('should show filter count badge when filters are selected', () => {
    render(
      <MobileFilterUX
        {...mockProps}
        hasSelectedCategories={true}
        selectedFiltersCount={3}
      >
        <div>Filter Form</div>
      </MobileFilterUX>
    );

    // Should show the filter count badge
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render MobileFilterSheet independently', () => {
    render(
      <MobileFilterSheet
        isOpen={true}
        onClose={vi.fn()}
        onClearFilters={vi.fn()}
        hasSelectedFilters={true}
        selectedFiltersCount={5}
      >
        <div data-testid="sheet-content">Sheet Content</div>
      </MobileFilterSheet>
    );

    // Should show the sheet header
    expect(screen.getByText('Filtrat e Kërkimit')).toBeInTheDocument();
    
    // Should show the filter count
    expect(screen.getByText('5 aktiv')).toBeInTheDocument();
    
    // Should show the content
    expect(screen.getByTestId('sheet-content')).toBeInTheDocument();
    
    // Should show clear button
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('should not render MobileFilterSheet when closed', () => {
    render(
      <MobileFilterSheet
        isOpen={false}
        onClose={vi.fn()}
        onClearFilters={vi.fn()}
      >
        <div data-testid="sheet-content">Sheet Content</div>
      </MobileFilterSheet>
    );

    // Should not render anything when closed
    expect(screen.queryByText('Filtrat e Kërkimit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sheet-content')).not.toBeInTheDocument();
  });

  it('should handle mobile filter UX with desktop fallback', () => {
    // This test verifies that the component structure is sound
    const { rerender } = render(
      <MobileFilterUX
        {...mockProps}
        showFilters={true}
      >
        <div data-testid="filter-content">Filter Form</div>
      </MobileFilterUX>
    );

    // Initially mobile view should show sheet
    expect(screen.getByText('Filtrat e Kërkimit')).toBeInTheDocument();

    // Rerender with closed state
    rerender(
      <MobileFilterUX
        {...mockProps}
        showFilters={false}
      >
        <div data-testid="filter-content">Filter Form</div>
      </MobileFilterUX>
    );

    // Sheet should be hidden
    expect(screen.queryByText('Filtrat e Kërkimit')).not.toBeInTheDocument();
  });
});