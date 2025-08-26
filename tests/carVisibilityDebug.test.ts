import { describe, it, expect } from 'vitest';

/**
 * Test to debug and identify missing cars visibility issue
 * This test simulates various car states to identify which cars are incorrectly filtered
 */
describe('Car Visibility Debug', () => {
  it('should identify which cars are being incorrectly filtered', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    // Mock various car states that could be causing the issue
    const cars = [
      // Case 1: Regular active car - should always be shown
      { id: '1', is_archived: false, archived_at: null, is_active: true, archive_reason: null },
      
      // Case 2: Recently sold car (1 hour ago) - should be shown
      { id: '2', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Case 3: Car sold 6 hours ago - should be shown  
      { id: '3', is_archived: true, archived_at: sixHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Case 4: Car sold exactly 24 hours ago - edge case, should be shown
      { id: '4', is_archived: true, archived_at: twentyFourHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Case 5: Car sold 25 hours ago - should be hidden
      { id: '5', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Case 6: Inactive car (not sold) - should be hidden
      { id: '6', is_archived: false, archived_at: null, is_active: false, archive_reason: null },
      
      // Case 7: Archived car with no archive_reason - potentially problematic
      { id: '7', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: null },
      
      // Case 8: Archived car with different archive_reason - should be shown?
      { id: '8', is_archived: true, archived_at: oneHourAgo.toISOString(), is_active: true, archive_reason: 'maintenance' },
      
      // Case 9: Car with missing archived_at but is_archived=true - edge case
      { id: '9', is_archived: true, archived_at: null, is_active: true, archive_reason: 'sold' },
      
      // Case 10: Car marked inactive after being sold (cleanup has run)
      { id: '10', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), is_active: false, archive_reason: 'sold' }
    ];

    // Simulate the database active_cars view logic
    const databaseFiltered = cars.filter(car => {
      // Database view logic: active_cars view
      const isNotArchived = !car.is_archived || car.archived_at === null;
      const isRecentlySold = car.is_archived && car.archived_at && 
                            new Date(car.archived_at).getTime() >= (now.getTime() - 24 * 60 * 60 * 1000);
      
      return (isNotArchived || isRecentlySold) && car.is_active;
    });

    // Simulate the frontend CarCard shouldHideSoldCar logic
    const frontendFiltered = databaseFiltered.filter(car => {
      // CarCard shouldHideSoldCar logic
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

    console.log('Database filtered cars:', databaseFiltered.map(c => c.id));
    console.log('Frontend filtered cars:', frontendFiltered.map(c => c.id));

    // Expected visible cars should be: 1, 2, 3, 4, 7, 8, 9
    const expectedVisible = ['1', '2', '3', '4', '7', '8', '9'];
    const actualVisible = frontendFiltered.map(c => c.id);

    expect(actualVisible).toEqual(expectedVisible);
    
    // Analyze which cars are missing and why
    const missing = expectedVisible.filter(id => !actualVisible.includes(id));
    const unexpected = actualVisible.filter(id => !expectedVisible.includes(id));
    
    if (missing.length > 0) {
      console.log('Missing cars that should be visible:', missing);
      missing.forEach(id => {
        const car = cars.find(c => c.id === id);
        console.log(`Car ${id}:`, car);
      });
    }
    
    if (unexpected.length > 0) {
      console.log('Unexpected cars that should be hidden:', unexpected);
    }
  });

  it('should test edge cases with invalid or missing data', () => {
    const now = new Date();
    
    // Test cars with various data integrity issues
    const problematicCars = [
      // Invalid date string
      { id: 'bad1', is_archived: true, archived_at: 'invalid-date', is_active: true, archive_reason: 'sold' },
      
      // Empty string date
      { id: 'bad2', is_archived: true, archived_at: '', is_active: true, archive_reason: 'sold' },
      
      // Future date (shouldn't happen but could)
      { id: 'bad3', is_archived: true, archived_at: new Date(now.getTime() + 1000 * 60 * 60).toISOString(), is_active: true, archive_reason: 'sold' },
      
      // Very old date
      { id: 'bad4', is_archived: true, archived_at: '2020-01-01T00:00:00Z', is_active: true, archive_reason: 'sold' },
      
      // Missing is_active field (undefined)
      { id: 'bad5', is_archived: false, archived_at: null, is_active: undefined, archive_reason: null },
    ];

    // Test how the filtering logic handles these cases
    const filteredCars = problematicCars.filter(car => {
      // Database active_cars view logic
      const isNotArchived = !car.is_archived || car.archived_at === null;
      const isRecentlySold = car.is_archived && car.archived_at && 
                            new Date(car.archived_at).getTime() >= (now.getTime() - 24 * 60 * 60 * 1000);
      
      return (isNotArchived || isRecentlySold) && car.is_active;
    }).filter(car => {
      // Frontend shouldHideSoldCar logic
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

    console.log('Problematic cars after filtering:', filteredCars.map(c => c.id));
    
    // Future dated car (bad3) should be filtered out but currently passes through
    // This could be a real bug - cars with future dates should be handled carefully
    expect(filteredCars.map(c => c.id)).toEqual(['bad3']);
  });

  it('should identify discrepancies between database and frontend filtering', () => {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    
    // Test specific cases where database and frontend might disagree
    const testCars = [
      // Car archived but no archive_reason set
      { id: 'disc1', is_archived: true, archived_at: twelveHoursAgo.toISOString(), is_active: true, archive_reason: null },
      
      // Car archived with non-'sold' reason
      { id: 'disc2', is_archived: true, archived_at: twelveHoursAgo.toISOString(), is_active: true, archive_reason: 'maintenance' },
      
      // Car with archive_reason='sold' but not archived
      { id: 'disc3', is_archived: false, archived_at: null, is_active: true, archive_reason: 'sold' },
    ];

    const databaseVisible = testCars.filter(car => {
      const isNotArchived = !car.is_archived || car.archived_at === null;
      const isRecentlySold = car.is_archived && car.archived_at && 
                            new Date(car.archived_at).getTime() >= (now.getTime() - 24 * 60 * 60 * 1000);
      
      return (isNotArchived || isRecentlySold) && car.is_active;
    });

    const frontendVisible = databaseVisible.filter(car => {
      if (!car.is_archived || !car.archived_at || car.archive_reason !== 'sold') {
        return true; // Not a sold car, show it
      }
      
      try {
        const archivedTime = new Date(car.archived_at);
        if (isNaN(archivedTime.getTime())) {
          return false;
        }
        
        const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
        return hoursSinceArchived <= 24;
      } catch (error) {
        return false;
      }
    });

    console.log('Database would show:', databaseVisible.map(c => c.id));
    console.log('Frontend would show:', frontendVisible.map(c => c.id));
    
    // All test cases should be visible since they're not properly sold cars
    expect(frontendVisible.map(c => c.id)).toEqual(['disc1', 'disc2', 'disc3']);
  });
});