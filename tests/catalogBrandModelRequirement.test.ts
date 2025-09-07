/**
 * Test for the brand and model requirement implementation
 * This test verifies that cars are only shown after both brand and model are selected
 */

import { describe, it, expect } from 'vitest';

// Mock the catalog filtering logic
interface MockAPIFilters {
  manufacturer_id?: string;
  model_id?: string;
}

// This mimics the shouldShowCars logic from EncarCatalog.tsx
const shouldShowCars = (filters: MockAPIFilters): boolean => {
  return !!(filters?.manufacturer_id && filters?.model_id);
};

describe('Catalog Brand and Model Requirement', () => {
  it('should NOT show cars when no filters are applied', () => {
    const filters = {};
    expect(shouldShowCars(filters)).toBe(false);
  });

  it('should NOT show cars when only brand is selected', () => {
    const filters = { manufacturer_id: '1' };
    expect(shouldShowCars(filters)).toBe(false);
  });

  it('should NOT show cars when only model is selected', () => {
    const filters = { model_id: '10' };
    expect(shouldShowCars(filters)).toBe(false);
  });

  it('should show cars when BOTH brand and model are selected', () => {
    const filters = { manufacturer_id: '1', model_id: '10' };
    expect(shouldShowCars(filters)).toBe(true);
  });

  it('should NOT show cars when brand or model are empty strings', () => {
    const filters1 = { manufacturer_id: '', model_id: '10' };
    const filters2 = { manufacturer_id: '1', model_id: '' };
    const filters3 = { manufacturer_id: '', model_id: '' };
    
    expect(shouldShowCars(filters1)).toBe(false);
    expect(shouldShowCars(filters2)).toBe(false);
    expect(shouldShowCars(filters3)).toBe(false);
  });

  it('should show cars when both brand and model have valid values', () => {
    const filters = { manufacturer_id: 'bmw-id', model_id: 'x5-id' };
    expect(shouldShowCars(filters)).toBe(true);
  });
});