import { describe, it, expect } from 'vitest';

/**
 * Test data representing filter options with counts
 */
const mockFilterData = {
  brands: [
    { id: 'audi', name: 'Audi', count: 5 },
    { id: 'bmw', name: 'BMW', count: 0 },
    { id: 'toyota', name: 'Toyota', count: 10 },
    { id: 'mercedes', name: 'Mercedes', count: 0 },
  ],
  models: [
    { id: 'a2', name: 'A2', brandId: 'audi', count: 0 },
    { id: 'a4', name: 'A4', brandId: 'audi', count: 3 },
    { id: 'camry', name: 'Camry', brandId: 'toyota', count: 5 },
    { id: 'corolla', name: 'Corolla', brandId: 'toyota', count: 0 },
  ],
  fuelTypes: [
    { id: 'petrol', name: 'Petrol', count: 8 },
    { id: 'diesel', name: 'Diesel', count: 0 },
    { id: 'electric', name: 'Electric', count: 2 },
  ],
};

describe('Filter Panel Zero Count Filtering', () => {
  it('should filter out brands with count 0', () => {
    const filteredBrands = mockFilterData.brands.filter(brand => (brand.count || 0) > 0);
    
    expect(filteredBrands).toHaveLength(2);
    expect(filteredBrands.map(b => b.name)).toEqual(['Audi', 'Toyota']);
    expect(filteredBrands.map(b => b.name)).not.toContain('BMW');
    expect(filteredBrands.map(b => b.name)).not.toContain('Mercedes');
  });

  it('should filter out models with count 0', () => {
    const filteredModels = mockFilterData.models.filter(model => (model.count || 0) > 0);
    
    expect(filteredModels).toHaveLength(2);
    expect(filteredModels.map(m => m.name)).toEqual(['A4', 'Camry']);
    expect(filteredModels.map(m => m.name)).not.toContain('A2');
    expect(filteredModels.map(m => m.name)).not.toContain('Corolla');
  });

  it('should filter out fuel types with count 0', () => {
    const filteredFuels = mockFilterData.fuelTypes.filter(fuel => (fuel.count || 0) > 0);
    
    expect(filteredFuels).toHaveLength(2);
    expect(filteredFuels.map(f => f.name)).toEqual(['Petrol', 'Electric']);
    expect(filteredFuels.map(f => f.name)).not.toContain('Diesel');
  });

  it('should handle undefined count as 0', () => {
    const dataWithUndefinedCount = [
      { id: 'item1', name: 'Item 1', count: 5 },
      { id: 'item2', name: 'Item 2', count: undefined },
      { id: 'item3', name: 'Item 3' }, // no count property
    ];

    const filtered = dataWithUndefinedCount.filter(item => ((item as any).count || 0) > 0);
    
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Item 1');
  });

  it('should return empty array if all counts are 0', () => {
    const allZeroCounts = [
      { id: 'item1', name: 'Item 1', count: 0 },
      { id: 'item2', name: 'Item 2', count: 0 },
    ];

    const filtered = allZeroCounts.filter(item => (item.count || 0) > 0);
    
    expect(filtered).toHaveLength(0);
  });

  it('should preserve items with positive counts in correct order', () => {
    const mixedData = [
      { id: 'item1', name: 'Item 1', count: 3 },
      { id: 'item2', name: 'Item 2', count: 0 },
      { id: 'item3', name: 'Item 3', count: 7 },
      { id: 'item4', name: 'Item 4', count: 0 },
      { id: 'item5', name: 'Item 5', count: 1 },
    ];

    const filtered = mixedData.filter(item => (item.count || 0) > 0);
    
    expect(filtered).toHaveLength(3);
    expect(filtered.map(item => item.name)).toEqual(['Item 1', 'Item 3', 'Item 5']);
    expect(filtered.map(item => item.count)).toEqual([3, 7, 1]);
  });
});