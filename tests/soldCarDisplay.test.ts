// Test for 24-hour sold car display logic
import { describe, test, expect } from 'vitest';

// Mock function to simulate the shouldHideSoldCar logic from CarCard
const shouldHideSoldCar = (is_archived: boolean, archived_at: string | null, archive_reason: string | null) => {
  if (!is_archived || !archived_at || archive_reason !== 'sold') {
    return false; // Not a sold car
  }
  
  try {
    const archivedTime = new Date(archived_at);
    
    // Check if date is valid
    if (isNaN(archivedTime.getTime())) {
      return true; // Hide cars with invalid dates as safety measure
    }
    
    const now = new Date();
    const hoursSinceArchived = (now.getTime() - archivedTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceArchived > 24; // Hide if sold more than 24 hours ago
  } catch (error) {
    // In case of any error, hide the car as a safety measure
    return true;
  }
};

describe('24-hour sold car display logic', () => {
  test('should not hide non-archived cars', () => {
    const result = shouldHideSoldCar(false, null, null);
    expect(result).toBe(false);
  });

  test('should not hide cars archived for reasons other than sold', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
    
    const result = shouldHideSoldCar(true, yesterday.toISOString(), 'removed');
    expect(result).toBe(false);
  });

  test('should not hide cars sold less than 24 hours ago', () => {
    const now = new Date();
    const recentlySold = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
    
    const result = shouldHideSoldCar(true, recentlySold.toISOString(), 'sold');
    expect(result).toBe(false);
  });

  test('should not hide cars sold exactly 24 hours ago', () => {
    const now = new Date();
    const exactly24HoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Exactly 24 hours ago
    
    const result = shouldHideSoldCar(true, exactly24HoursAgo.toISOString(), 'sold');
    expect(result).toBe(false);
  });

  test('should hide cars sold more than 24 hours ago', () => {
    const now = new Date();
    const moreThan24HoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
    
    const result = shouldHideSoldCar(true, moreThan24HoursAgo.toISOString(), 'sold');
    expect(result).toBe(true);
  });

  test('should hide cars sold 48 hours ago', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago
    
    const result = shouldHideSoldCar(true, twoDaysAgo.toISOString(), 'sold');
    expect(result).toBe(true);
  });

  test('edge case: should handle invalid date strings gracefully', () => {
    const result = shouldHideSoldCar(true, 'invalid-date', 'sold');
    // Should return true (hide) for invalid dates as a safety measure
    expect(result).toBe(true);
  });
});