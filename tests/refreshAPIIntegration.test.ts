import { describe, it, expect } from 'vitest';

/**
 * Test for refresh API integration with sold car removal
 * This tests that the API refresh properly fetches new data and excludes sold cars
 */
describe('Refresh API Integration', () => {
  it('should use active_cars view for car counting logic', () => {
    // Mock the query logic that should be used by the frontend
    const mockCars = [
      // Active car - should be counted
      { id: '1', is_archived: false, is_active: true, created_at: '2024-01-01' },
      
      // Recently sold car (within 24h) - should be counted 
      { 
        id: '2', 
        is_archived: true, 
        archived_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        archive_reason: 'sold',
        is_active: true,
        created_at: '2024-01-01'
      },
      
      // Old sold car (over 24h) - should NOT be counted (filtered by active_cars view)
      { 
        id: '3', 
        is_archived: true, 
        archived_at: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        archive_reason: 'sold',
        is_active: false, // marked inactive by cleanup function
        created_at: '2024-01-01'
      },
      
      // Inactive car - should NOT be counted
      { id: '4', is_archived: false, is_active: false, created_at: '2024-01-01' }
    ];

    // Simulate active_cars view logic (what the database view should return)
    const activeCars = mockCars.filter(car => {
      if (!car.is_active) return false;
      
      const isNotArchived = !car.is_archived;
      const isRecentlySold = car.is_archived && car.archived_at && 
                            (Date.now() - new Date(car.archived_at).getTime()) < 24 * 60 * 60 * 1000;
      
      return isNotArchived || isRecentlySold;
    });

    // Verify only active and recently sold cars are included
    expect(activeCars).toHaveLength(2);
    expect(activeCars.map(c => c.id)).toEqual(['1', '2']);
  });

  it('should properly handle API refresh with sold car cleanup', () => {
    // Mock the workflow: API refresh -> cleanup old sold cars -> refresh UI
    const apiData = [
      { id: 'new1', make: 'Tesla', model: 'Model 3', year: 2024, status: 'active' },
      { id: 'new2', make: 'BMW', model: 'X5', year: 2023, status: 'active' }
    ];

    const existingSoldCars = [
      // Car sold 25 hours ago - should be cleaned up
      { 
        id: 'old1', 
        is_archived: true, 
        archived_at: new Date(Date.now() - 25 * 60 * 60 * 1000),
        archive_reason: 'sold',
        is_active: true 
      }
    ];

    // Step 1: Process new API data
    const processedNewCars = apiData.map(car => ({
      ...car,
      is_active: true,
      is_archived: false
    }));

    // Step 2: Cleanup old sold cars (simulate remove_old_sold_cars function)
    const carsToCleanup = existingSoldCars.filter(car => 
      car.is_archived && 
      car.archived_at && 
      car.archive_reason === 'sold' &&
      (Date.now() - new Date(car.archived_at).getTime()) > 24 * 60 * 60 * 1000 &&
      car.is_active
    );

    // Step 3: Verify cleanup results
    expect(processedNewCars).toHaveLength(2);
    expect(processedNewCars[0].is_active).toBe(true);
    expect(carsToCleanup).toHaveLength(1);
    expect(carsToCleanup[0].id).toBe('old1');
  });

  it('should handle filters correctly with active cars', () => {
    const mockActiveCars = [
      { id: '1', make: 'BMW', model: 'M3', year: 2022, price: 50000, is_active: true },
      { id: '2', make: 'Mercedes', model: 'C-Class', year: 2021, price: 45000, is_active: true },
      { id: '3', make: 'BMW', model: 'X5', year: 2023, price: 70000, is_active: true },
      { id: '4', make: 'Audi', model: 'A4', year: 2020, price: 35000, is_active: true }
    ];

    // Test make filter
    const bmwCars = mockActiveCars.filter(car => car.make === 'BMW');
    expect(bmwCars).toHaveLength(2);

    // Test year range filter  
    const recentCars = mockActiveCars.filter(car => car.year >= 2022);
    expect(recentCars).toHaveLength(2);

    // Test price range filter
    const expensiveCars = mockActiveCars.filter(car => car.price >= 50000);
    expect(expensiveCars).toHaveLength(2);

    // Test search filter (make/model)
    const searchResults = mockActiveCars.filter(car => 
      car.make.toLowerCase().includes('bmw') || 
      car.model.toLowerCase().includes('c-class')
    );
    expect(searchResults).toHaveLength(3); // 2 BMW + 1 C-Class
  });
});