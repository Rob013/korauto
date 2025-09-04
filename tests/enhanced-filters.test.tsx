import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FiltersPanel from '@/components/FiltersPanel';
import type { FilterState } from '@/hooks/useFiltersFromUrl';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('Enhanced FiltersPanel for Old Layout', () => {
  const mockFiltersData = {
    brands: [{ id: 'bmw', name: 'BMW', count: 150 }],
    models: [{ id: 'x3', name: 'X3', brandId: 'bmw', count: 25 }],
    fuelTypes: [{ id: 'gasoline', name: 'Gasoline', count: 300 }],
    transmissions: [{ id: 'automatic', name: 'Automatic', count: 200 }],
    bodyTypes: [{ id: 'suv', name: 'SUV', count: 100 }],
    colors: [{ id: 'black', name: 'Black', count: 80 }],
    locations: [{ id: 'tirana', name: 'Tirana', count: 120 }],
    
    // Enhanced filter data
    conditions: [
      { id: 'new', name: 'New', count: 50 },
      { id: 'used', name: 'Used', count: 250 },
      { id: 'certified', name: 'Certified Pre-Owned', count: 75 }
    ],
    saleStatuses: [
      { id: 'available', name: 'Available', count: 280 },
      { id: 'sold', name: 'Sold', count: 45 },
      { id: 'pending', name: 'Pending', count: 15 }
    ],
    drivetrains: [
      { id: 'fwd', name: 'Front-Wheel Drive', count: 120 },
      { id: 'awd', name: 'All-Wheel Drive', count: 80 },
      { id: 'rwd', name: 'Rear-Wheel Drive', count: 60 }
    ],
    doorCounts: [
      { id: '2', name: '2 Doors', count: 30 },
      { id: '4', name: '4 Doors', count: 200 },
      { id: '5', name: '5 Doors', count: 110 }
    ],
    
    // Ranges
    yearRange: { min: 2010, max: 2024 },
    priceRange: { min: 5000, max: 100000 },
    mileageRange: { min: 0, max: 200000 },
    engineSizeRange: { min: 1.0, max: 6.0 }
  };

  const mockFilters: FilterState = {
    brand: '',
    model: '',
    fuel: '',
    transmission: '',
    bodyType: '',
    color: '',
    location: '',
    condition: '',
    saleStatus: '',
    drivetrain: '',
    doors: '',
    yearMin: 2010,
    yearMax: 2024,
    priceMin: 5000,
    priceMax: 100000,
    mileageMin: 0,
    mileageMax: 200000,
    engineSizeMin: 1.0,
    engineSizeMax: 6.0,
    accidentCountMax: 0,
    hasImages: false,
    isCertified: false,
    noAccidents: false
  };

  const mockOnFiltersChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render enhanced filter labels in advanced section', () => {
    render(
      <FiltersPanel
        filters={mockFilters}
        data={mockFiltersData}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Click to expand advanced filters
    const advancedButton = screen.getByText('Filtrat e Avancuar');
    fireEvent.click(advancedButton);

    // Check for enhanced filter options labels
    expect(screen.getByText('Gjendja')).toBeInTheDocument(); // Car condition
    expect(screen.getByText('Statusi i Shitjes')).toBeInTheDocument(); // Sale status
    expect(screen.getByText('Sistemi i Nxitjes')).toBeInTheDocument(); // Drivetrain
    expect(screen.getByText('Numri i Dyerve')).toBeInTheDocument(); // Door count
  });

  it('should render boolean filter options', () => {
    render(
      <FiltersPanel
        filters={mockFilters}
        data={mockFiltersData}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Click to expand advanced filters
    const advancedButton = screen.getByText('Filtrat e Avancuar');
    fireEvent.click(advancedButton);

    // Check for boolean filter options
    expect(screen.getByText('Vetëm me fotografi')).toBeInTheDocument();
    expect(screen.getByText('Vetëm të certifikuara')).toBeInTheDocument();
    expect(screen.getByText('Pa aksidente')).toBeInTheDocument();
  });

  it('should render engine size filter when data is available', () => {
    render(
      <FiltersPanel
        filters={mockFilters}
        data={mockFiltersData}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Click to expand advanced filters
    const advancedButton = screen.getByText('Filtrat e Avancuar');
    fireEvent.click(advancedButton);

    // Check for engine size filter
    expect(screen.getByText('Vëllimi i Motorrit (L)')).toBeInTheDocument();
  });

  it('should handle boolean filter checkbox changes', () => {
    render(
      <FiltersPanel
        filters={mockFilters}
        data={mockFiltersData}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Click to expand advanced filters
    const advancedButton = screen.getByText('Filtrat e Avancuar');
    fireEvent.click(advancedButton);

    // Click the "Only with images" checkbox
    const hasImagesCheckbox = screen.getByLabelText('Vetëm me fotografi');
    fireEvent.click(hasImagesCheckbox);

    // Should call onFiltersChange with hasImages: true
    expect(mockOnFiltersChange).toHaveBeenCalledWith({ hasImages: true });
  });

  it('should not render enhanced filters when data is not available', () => {
    const limitedData = {
      ...mockFiltersData,
      conditions: [],
      saleStatuses: [],
      drivetrains: [],
      doorCounts: [],
      engineSizeRange: undefined
    };

    render(
      <FiltersPanel
        filters={mockFilters}
        data={limitedData}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Click to expand advanced filters
    const advancedButton = screen.getByText('Filtrat e Avancuar');
    fireEvent.click(advancedButton);

    // Enhanced filters should not be visible when data is not available
    expect(screen.queryByText('Gjendja')).not.toBeInTheDocument();
    expect(screen.queryByText('Statusi i Shitjes')).not.toBeInTheDocument();
    expect(screen.queryByText('Vëllimi i Motorrit (L)')).not.toBeInTheDocument();
  });

  it('should verify enhanced filtering integration', () => {
    render(
      <FiltersPanel
        filters={mockFilters}
        data={mockFiltersData}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Should render the filters panel successfully
    expect(screen.getByText('Filtrat e Kërkimit')).toBeInTheDocument();
    expect(screen.getByText('Pastro të gjitha')).toBeInTheDocument();
  });
});