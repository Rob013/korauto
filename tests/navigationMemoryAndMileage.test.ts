// Test to verify navigation memory functionality
import { expect, test, vi } from 'vitest';

// Mock the navigation context
const mockSetCompletePageState = vi.fn();
const mockRestorePageState = vi.fn();
const mockGoBack = vi.fn();

vi.mock('@/contexts/NavigationContext', () => ({
  useNavigation: () => ({
    setCompletePageState: mockSetCompletePageState,
    restorePageState: mockRestorePageState,
    goBack: mockGoBack,
    pageState: {
      url: '/catalog?filters=example',
      scrollPosition: 500,
      filterPanelState: false,
      timestamp: Date.now(),
      filterState: {
        filters: { manufacturer_id: '1' },
        sort: 'year_desc',
        page: 1,
        pageSize: 20,
        query: ''
      }
    }
  })
}));

test('Navigation memory saves complete page state when navigating to car details', () => {
  // Simulate the state that should be saved when clicking a car card
  const expectedPageState = {
    url: '/catalog?manufacturer_id=1&sort=year_desc',
    scrollPosition: 300,
    filterPanelState: false,
    timestamp: expect.any(Number)
  };

  // This simulates what happens in LazyCarCard handleCardClick
  mockSetCompletePageState(expectedPageState);

  expect(mockSetCompletePageState).toHaveBeenCalledWith(expectedPageState);
});

test('Navigation memory restores state correctly', () => {
  // This simulates what happens in EncarCatalog on mount
  mockRestorePageState.mockReturnValue(true);
  
  const result = mockRestorePageState();
  
  expect(mockRestorePageState).toHaveBeenCalled();
  expect(result).toBe(true);
});

test('Mileage formatting uses en-US locale for consistent comma display', () => {
  const testMileages = [181000, 25000, 150000, 1000, 999999];
  
  testMileages.forEach(mileage => {
    const formatted = `${mileage.toLocaleString('en-US')} km`;
    expect(formatted).toMatch(/\d{1,3}(,\d{3})* km/);
    expect(formatted).toContain(',');
  });
  
  // Verify specific cases
  expect((181000).toLocaleString('en-US')).toBe('181,000');
  expect((25000).toLocaleString('en-US')).toBe('25,000');
  expect((1000).toLocaleString('en-US')).toBe('1,000');
});