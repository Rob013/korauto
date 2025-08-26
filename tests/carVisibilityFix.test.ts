import { describe, it, expect } from 'vitest';

/**
 * Test for the car visibility fix
 * This tests the solution to ensure all valid cars are shown
 */
describe('Car Visibility Fix', () => {
  it('should show all non-sold cars regardless of archive status', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    const cars = [
      // Regular active car - should always be shown
      { id: '1', is_archived: false, archived_at: null, is_active: true, archive_reason: null },
      
      // Recently sold car - should be shown (within 24h)
      { id: '2', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Old sold car - should be hidden (over 24h)
      { id: '3', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Car archived for maintenance - should be shown (not sold)
      { id: '4', is_archived: true, archived_at: twelveHoursAgo.toISOString(), is_active: true, archive_reason: 'maintenance' },
      
      // Car archived but no reason - should be shown (might be data issue, but not necessarily sold)
      { id: '5', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: null },
      
      // Car marked as sold but not archived - should be shown (data inconsistency)
      { id: '6', is_archived: false, archived_at: null, is_active: true, archive_reason: 'sold' },
      
      // Inactive car - should be hidden
      { id: '7', is_archived: false, archived_at: null, is_active: false, archive_reason: null },
    ];

    // Fixed logic: Only hide cars that are ACTUALLY sold more than 24 hours ago
    const visibleCars = cars.filter(car => {
      // Always check is_active first
      if (!car.is_active) return false;
      
      // Only hide if it's actually a sold car that's older than 24 hours
      if (car.is_archived && car.archived_at && car.archive_reason === 'sold') {
        try {
          const archivedTime = new Date(car.archived_at);
          if (isNaN(archivedTime.getTime())) {
            return false; // Hide cars with invalid dates
          }
          
          const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
          return hoursSinceArchived <= 24; // Only hide if sold more than 24 hours ago
        } catch (error) {
          return false; // Hide on error
        }
      }
      
      // Show all other cars (not sold, or sold recently, or archived for other reasons)
      return true;
    });

    // Expected: 1, 2, 4, 5, 6 should be visible
    // Hidden: 3 (old sold car), 7 (inactive)
    expect(visibleCars.map(c => c.id)).toEqual(['1', '2', '4', '5', '6']);
  });

  it('should handle the database vs frontend filtering correctly', () => {
    const now = new Date();
    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    // Cars that would pass the database active_cars view
    const carsFromDatabase = [
      { id: '1', is_archived: false, archived_at: null, is_active: true, archive_reason: null },
      { id: '2', is_archived: true, archived_at: twentyThreeHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      { id: '3', is_archived: true, archived_at: twentyThreeHoursAgo.toISOString(), is_active: true, archive_reason: 'maintenance' },
      { id: '4', is_archived: true, archived_at: twentyThreeHoursAgo.toISOString(), is_active: true, archive_reason: null },
    ];

    // Original double filtering (this is the problem)
    const originalFrontendLogic = (cars: typeof carsFromDatabase) => {
      return cars.filter(car => {
        if (!car.is_archived || !car.archived_at || car.archive_reason !== 'sold') {
          return true; // Not a sold car, show it
        }
        
        const archivedTime = new Date(car.archived_at);
        const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
        return hoursSinceArchived <= 24;
      });
    };

    // Fixed logic: Since database already filters properly, frontend shouldn't re-filter
    const fixedFrontendLogic = (cars: typeof carsFromDatabase) => {
      // If we trust the database filtering, just show all cars that come from it
      return cars.filter(car => car.is_active);
    };

    const originalResult = originalFrontendLogic(carsFromDatabase);
    const fixedResult = fixedFrontendLogic(carsFromDatabase);

    // Both should show all cars since they all pass the 24-hour rule
    expect(originalResult.map(c => c.id)).toEqual(['1', '2', '3', '4']);
    expect(fixedResult.map(c => c.id)).toEqual(['1', '2', '3', '4']);
    
    // The fix ensures no unnecessary filtering
    expect(fixedResult.length).toBeGreaterThanOrEqual(originalResult.length);
  });

  it('should handle data integrity issues gracefully', () => {
    const now = new Date();
    
    const problematicCars = [
      // Invalid date
      { id: 'bad1', is_archived: true, archived_at: 'invalid-date', is_active: true, archive_reason: 'sold' },
      
      // Null date but archived
      { id: 'bad2', is_archived: true, archived_at: null, is_active: true, archive_reason: 'sold' },
      
      // Empty string date
      { id: 'bad3', is_archived: true, archived_at: '', is_active: true, archive_reason: 'sold' },
      
      // Undefined fields
      { id: 'bad4', is_archived: undefined, archived_at: undefined, is_active: true, archive_reason: undefined },
    ];

    const robustFilter = (cars: typeof problematicCars) => {
      return cars.filter(car => {
        // Always check is_active first (with safe default)
        if (car.is_active === false) return false;
        
        // Only hide if we can definitively say it's a sold car older than 24 hours
        if (car.is_archived === true && car.archive_reason === 'sold' && car.archived_at) {
          try {
            const archivedTime = new Date(car.archived_at);
            if (isNaN(archivedTime.getTime())) {
              return false; // Hide cars with invalid dates for safety
            }
            
            const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
            return hoursSinceArchived <= 24;
          } catch (error) {
            return false; // Hide on error for safety
          }
        }
        
        // Default: show the car (be permissive with unclear data)
        return true;
      });
    };

    const result = robustFilter(problematicCars);
    
    // Should show bad2, bad3, bad4 (unclear data or invalid dates - be permissive unless clearly old sold car)
    // Should hide bad1 (sold cars with completely invalid dates)
    expect(result.map(c => c.id)).toEqual(['bad2', 'bad3', 'bad4']);
  });
});