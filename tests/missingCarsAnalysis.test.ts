import { describe, it, expect } from 'vitest';

/**
 * Test to identify the root cause of missing cars issue
 * Focus on data flow from database to frontend
 */
describe('Missing Cars Root Cause Analysis', () => {
  it('should identify issues with double filtering logic', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    // Cars that would come from the database active_cars view
    const carsFromDatabase = [
      // These should all be included by the active_cars view
      { id: '1', is_archived: false, archived_at: null, is_active: true, archive_reason: null },
      { id: '2', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      { id: '3', is_archived: true, archived_at: twelveHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      { id: '4', is_archived: true, archived_at: twentyThreeHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Edge case: exactly 24 hours - database includes it
      { id: '5', is_archived: true, archived_at: twentyFourHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Cars with missing or inconsistent archive data
      { id: '6', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: null }, // No archive_reason
      { id: '7', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: 'maintenance' }, // Different reason
      { id: '8', is_archived: true, archived_at: null, is_active: true, archive_reason: 'sold' }, // No archived_at
    ];

    // Simulate the active_cars view logic (this is what the database returns)
    const activeCarsViewResult = carsFromDatabase.filter(car => {
      // Active cars view logic from the migration
      const isNotArchived = !car.is_archived || car.archived_at === null;
      const isRecentlySold = car.is_archived && car.archived_at && 
                            new Date(car.archived_at).getTime() >= (now.getTime() - 24 * 60 * 60 * 1000);
      
      return (isNotArchived || isRecentlySold) && car.is_active;
    });

    // Simulate the frontend shouldHideSoldCar logic (CarCard/LazyCarCard)
    const frontendVisibleCars = activeCarsViewResult.filter(car => {
      // shouldHideSoldCar logic from CarCard.tsx and LazyCarCard.tsx
      if (!car.is_archived || !car.archived_at || car.archive_reason !== 'sold') {
        return true; // Not a sold car, show it
      }
      
      try {
        const archivedTime = new Date(car.archived_at);
        
        // Check if date is valid
        if (isNaN(archivedTime.getTime())) {
          return false; // Hide cars with invalid dates as safety measure
        }
        
        const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
        
        return hoursSinceArchived <= 24; // Show if sold within 24 hours
      } catch (error) {
        return false; // Hide on error
      }
    });

    console.log('Cars from database (active_cars view):', activeCarsViewResult.map(c => c.id));
    console.log('Cars visible in frontend:', frontendVisibleCars.map(c => c.id));

    // The issue: cars with archive_reason !== 'sold' should be visible
    // But the double filtering is unnecessarily strict
    
    // Expected behavior:
    // - Database should filter based on 24-hour rule for archived cars
    // - Frontend should NOT re-filter unless there's a specific UI need
    
    // Cars that should be visible based on business logic:
    // 1, 2, 3, 4, 5 (within 24h or not archived), 6, 7, 8 (not sold cars)
    const expectedVisible = ['1', '2', '3', '4', '5', '6', '7', '8'];
    
    expect(frontendVisibleCars.map(c => c.id)).toEqual(expectedVisible);
  });

  it('should test timing precision issues between database and frontend', () => {
    const now = new Date();
    
    // Test cars right at the 24-hour boundary
    const exactlyTwentyFourHours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const slightlyOver24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000 + 1000)); // 1 second over
    const slightlyUnder24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000 - 1000)); // 1 second under

    const boundaryTestCars = [
      { id: 'boundary1', is_archived: true, archived_at: exactlyTwentyFourHours.toISOString(), is_active: true, archive_reason: 'sold' },
      { id: 'boundary2', is_archived: true, archived_at: slightlyOver24Hours.toISOString(), is_active: true, archive_reason: 'sold' },
      { id: 'boundary3', is_archived: true, archived_at: slightlyUnder24Hours.toISOString(), is_active: true, archive_reason: 'sold' },
    ];

    // Database logic: >= NOW() - INTERVAL '24 hours'
    const dbVisible = boundaryTestCars.filter(car => {
      return car.is_archived && car.archived_at && 
             new Date(car.archived_at).getTime() >= (now.getTime() - 24 * 60 * 60 * 1000) &&
             car.is_active;
    });

    // Frontend logic: hoursSinceArchived <= 24
    const frontendVisible = dbVisible.filter(car => {
      if (!car.is_archived || !car.archived_at || car.archive_reason !== 'sold') {
        return true;
      }
      
      const archivedTime = new Date(car.archived_at);
      const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceArchived <= 24;
    });

    console.log('Database would include (boundary test):', dbVisible.map(c => c.id));
    console.log('Frontend would show (boundary test):', frontendVisible.map(c => c.id));

    // There might be a discrepancy here due to >= vs <= and precision differences
    // Database uses >= comparison, frontend uses <= comparison on hours calculation
  });

  it('should check for consistent is_active field maintenance', () => {
    const now = new Date();
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    // Simulate what could happen if the cleanup job doesn't run properly
    const problematicCars = [
      // Car that should have been marked inactive by cleanup job but wasn't
      { id: 'cleanup1', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Car that was properly cleaned up
      { id: 'cleanup2', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), is_active: false, archive_reason: 'sold' },
      
      // Car that should be visible but is incorrectly marked inactive
      { id: 'cleanup3', is_archived: false, archived_at: null, is_active: false, archive_reason: null },
    ];

    const activeCarsView = problematicCars.filter(car => {
      const isNotArchived = !car.is_archived || car.archived_at === null;
      const isRecentlySold = car.is_archived && car.archived_at && 
                            new Date(car.archived_at).getTime() >= (now.getTime() - 24 * 60 * 60 * 1000);
      
      return (isNotArchived || isRecentlySold) && car.is_active;
    });

    console.log('Cleanup test - active_cars view would show:', activeCarsView.map(c => c.id));

    // If cleanup doesn't run properly, cleanup1 would appear in the view
    // But the frontend would filter it out
    // cleanup3 should be visible but won't be due to is_active=false
  });
});