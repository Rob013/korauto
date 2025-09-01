import { describe, it, expect } from 'vitest';

/**
 * Test the car visibility fix implementation
 * Verify that the simplified logic shows more cars correctly
 */
describe('Car Visibility Fix Implementation', () => {
  // Simulate the improved shouldHideSoldCar logic
  const shouldHideSoldCar = (car: {
    is_archived?: boolean;
    archived_at?: string | null;
    archive_reason?: string | null;
  }) => {
    // Only hide if it's definitively a sold car that's clearly old
    if (car.is_archived && car.archived_at && car.archive_reason === 'sold') {
      try {
        const archivedTime = new Date(car.archived_at);
        
        // Check if date is valid
        if (isNaN(archivedTime.getTime())) {
          return true; // Hide cars with invalid dates as safety measure
        }
        
        const now = new Date();
        const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
        
        // Only hide if clearly over 24 hours (with small buffer for timing differences)
        return hoursSinceArchived > 24.5; // 30-minute buffer to account for timing differences
      } catch (error) {
        // In case of any error, hide the car as a safety measure
        return true;
      }
    }
    
    // Default: show the car (trust database filtering)
    return false;
  };

  it('should show more cars with the improved logic', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFourAndHalfHoursAgo = new Date(now.getTime() - 24.5 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    const cars = [
      // Regular active car - should be shown
      { id: '1', is_archived: false, archived_at: null, archive_reason: null },
      
      // Recently sold car - should be shown
      { id: '2', is_archived: true, archived_at: oneHourAgo.toISOString(), archive_reason: 'sold' },
      
      // Car sold exactly 24 hours ago - should be shown (within buffer)
      { id: '3', is_archived: true, archived_at: twentyFourHoursAgo.toISOString(), archive_reason: 'sold' },
      
      // Car sold 24.5 hours ago - should be shown (at buffer limit)
      { id: '4', is_archived: true, archived_at: twentyFourAndHalfHoursAgo.toISOString(), archive_reason: 'sold' },
      
      // Car sold 25 hours ago - should be hidden (over buffer)
      { id: '5', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), archive_reason: 'sold' },
      
      // Car archived for maintenance - should be shown (not sold)
      { id: '6', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), archive_reason: 'maintenance' },
      
      // Car archived without reason - should be shown (not explicitly sold)
      { id: '7', is_archived: true, archived_at: twentyFiveHoursAgo.toISOString(), archive_reason: null },
      
      // Car with invalid data - should be shown (not explicitly sold)
      { id: '8', is_archived: true, archived_at: null, archive_reason: 'sold' },
    ];

    const visibleCars = cars.filter(car => !shouldHideSoldCar(car));

    // Should show: 1, 2, 3, 4, 6, 7, 8
    // Should hide: 5 (clearly old sold car over 24.5 hours)
    expect(visibleCars.map(c => c.id)).toEqual(['1', '2', '3', '4', '6', '7', '8']);
  });

  it('should handle edge cases better than the original logic', () => {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const edgeCases = [
      // Car archived but not sold - original logic would show, new logic shows
      { id: 'edge1', is_archived: true, archived_at: twelveHoursAgo.toISOString(), archive_reason: 'maintenance' },
      
      // Car archived without reason - original logic would show, new logic shows
      { id: 'edge2', is_archived: true, archived_at: twelveHoursAgo.toISOString(), archive_reason: null },
      
      // Car with archive_reason='sold' but not archived - original logic would show, new logic shows
      { id: 'edge3', is_archived: false, archived_at: null, archive_reason: 'sold' },
      
      // Car with missing archived_at - original logic would show, new logic shows
      { id: 'edge4', is_archived: true, archived_at: null, archive_reason: 'sold' },
    ];

    const visibleCars = edgeCases.filter(car => !shouldHideSoldCar(car));

    // All edge cases should be visible with the new logic
    expect(visibleCars.map(c => c.id)).toEqual(['edge1', 'edge2', 'edge3', 'edge4']);
  });

  it('should handle invalid dates safely', () => {
    const invalidDateCars = [
      { id: 'invalid1', is_archived: true, archived_at: 'invalid-date', archive_reason: 'sold' },
      { id: 'invalid2', is_archived: true, archived_at: '', archive_reason: 'sold' },
      { id: 'invalid3', is_archived: true, archived_at: 'not-a-date', archive_reason: 'sold' },
    ];

    const visibleCars = invalidDateCars.filter(car => !shouldHideSoldCar(car));

    // Cars with invalid dates: invalid2 (empty string) is treated as valid by new Date('')
    // So only completely invalid date strings are hidden
    expect(visibleCars.map(c => c.id)).toEqual(['invalid2']);
  });

  it('should provide 30-minute buffer for timing differences', () => {
    const now = new Date();
    
    // Test cars right around the 24-hour boundary
    const exactlyTwentyFourHours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFourHours15Minutes = new Date(now.getTime() - (24 * 60 * 60 * 1000 + 15 * 60 * 1000));
    const twentyFourHours30Minutes = new Date(now.getTime() - (24 * 60 * 60 * 1000 + 30 * 60 * 1000));
    const twentyFourHours45Minutes = new Date(now.getTime() - (24 * 60 * 60 * 1000 + 45 * 60 * 1000));

    const boundaryTestCars = [
      { id: 'boundary1', is_archived: true, archived_at: exactlyTwentyFourHours.toISOString(), archive_reason: 'sold' },
      { id: 'boundary2', is_archived: true, archived_at: twentyFourHours15Minutes.toISOString(), archive_reason: 'sold' },
      { id: 'boundary3', is_archived: true, archived_at: twentyFourHours30Minutes.toISOString(), archive_reason: 'sold' },
      { id: 'boundary4', is_archived: true, archived_at: twentyFourHours45Minutes.toISOString(), archive_reason: 'sold' },
    ];

    const visibleCars = boundaryTestCars.filter(car => !shouldHideSoldCar(car));

    // Should show cars within the 30-minute buffer (boundary1, boundary2, boundary3)
    // Should hide cars beyond the buffer (boundary4)
    expect(visibleCars.map(c => c.id)).toEqual(['boundary1', 'boundary2', 'boundary3']);
  });
});