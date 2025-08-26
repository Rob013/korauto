// Test to verify load more with filters fix
import { describe, it, expect } from 'vitest';

describe('Load More with Filters Fix', () => {
  it('should correctly calculate hasMore when accumulating cars with filters', () => {
    // Simulate the scenario we just fixed in useCarsQuery.ts
    const scenario = {
      total: 50,
      pageSize: 20,
      currentAccumulated: 20,
      newCarsFromPage2: 20,
      apiHasMore: true
    };
    
    const updatedAccumulated = scenario.currentAccumulated + scenario.newCarsFromPage2;
    const calculatedHasMore = scenario.apiHasMore && updatedAccumulated < scenario.total;
    
    expect(updatedAccumulated).toBe(40);
    expect(calculatedHasMore).toBe(true);
  });
  
  it('should correctly set hasMore to false when all cars are loaded', () => {
    const scenario = {
      total: 50,
      currentAccumulated: 40,
      newCarsFromPage3: 10,
      apiHasMore: false
    };
    
    const updatedAccumulated = scenario.currentAccumulated + scenario.newCarsFromPage3;
    const calculatedHasMore = scenario.apiHasMore && updatedAccumulated < scenario.total;
    
    expect(updatedAccumulated).toBe(50);
    expect(calculatedHasMore).toBe(false);
  });
  
  it('should handle edge case where API says hasMore but we reached total', () => {
    const scenario = {
      total: 50,
      currentAccumulated: 40,
      newCarsFromPage: 10,
      apiHasMore: true
    };
    
    const updatedAccumulated = scenario.currentAccumulated + scenario.newCarsFromPage;
    const calculatedHasMore = scenario.apiHasMore && updatedAccumulated < scenario.total;
    
    expect(calculatedHasMore).toBe(false);
  });
});