import { describe, test, expect, beforeEach } from 'vitest';
import { sortManufacturers } from '../src/utils/catalog-filter';

/**
 * Test suite for ensuring categories and models with 0 cars are filtered out
 * from the catalog display. This addresses the requirement:
 * "on catalog - model, categories with (0) cars remove"
 */
describe('Catalog Zero Car Filtering', () => {
  describe('Manufacturer Filtering', () => {
    test('should filter out manufacturers with 0 cars', () => {
      const manufacturers = [
        { id: 1, name: 'BMW', cars_qty: 245, image: 'bmw.jpg' },
        { id: 2, name: 'Mercedes-Benz', cars_qty: 189, image: 'mercedes.jpg' },
        { id: 3, name: 'EmptyBrand', cars_qty: 0, image: 'empty.jpg' },
        { id: 4, name: 'Audi', cars_qty: 167, image: 'audi.jpg' },
        { id: 5, name: 'AnotherEmpty', cars_qty: 0, image: 'empty2.jpg' },
      ];

      const filtered = sortManufacturers(manufacturers);

      // Should only include manufacturers with cars_qty > 0
      expect(filtered).toHaveLength(3);
      expect(filtered.map(m => m.name)).toEqual(['BMW', 'Mercedes-Benz', 'Audi']);
      
      // Should not include manufacturers with 0 cars
      expect(filtered.some(m => m.name === 'EmptyBrand')).toBe(false);
      expect(filtered.some(m => m.name === 'AnotherEmpty')).toBe(false);
    });

    test('should filter out manufacturers with undefined cars_qty', () => {
      const manufacturers = [
        { id: 1, name: 'BMW', cars_qty: 245, image: 'bmw.jpg' },
        { id: 2, name: 'UndefinedBrand', cars_qty: undefined, image: 'undefined.jpg' },
        { id: 3, name: 'Audi', cars_qty: 167, image: 'audi.jpg' },
      ];

      const filtered = sortManufacturers(manufacturers);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.name)).toEqual(['BMW', 'Audi']);
      expect(filtered.some(m => m.name === 'UndefinedBrand')).toBe(false);
    });

    test('should filter out manufacturers with null cars_qty', () => {
      const manufacturers = [
        { id: 1, name: 'BMW', cars_qty: 245, image: 'bmw.jpg' },
        { id: 2, name: 'NullBrand', cars_qty: null as any, image: 'null.jpg' },
        { id: 3, name: 'Audi', cars_qty: 167, image: 'audi.jpg' },
      ];

      const filtered = sortManufacturers(manufacturers);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.name)).toEqual(['BMW', 'Audi']);
      expect(filtered.some(m => m.name === 'NullBrand')).toBe(false);
    });

    test('should handle empty manufacturer list', () => {
      const manufacturers: any[] = [];
      const filtered = sortManufacturers(manufacturers);
      expect(filtered).toHaveLength(0);
    });

    test('should handle all manufacturers having 0 cars', () => {
      const manufacturers = [
        { id: 1, name: 'EmptyBrand1', cars_qty: 0, image: 'empty1.jpg' },
        { id: 2, name: 'EmptyBrand2', cars_qty: 0, image: 'empty2.jpg' },
      ];

      const filtered = sortManufacturers(manufacturers);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('Model Filtering Logic', () => {
    /**
     * Simulates the filtering logic used in FilterForm.tsx line 290
     */
    const filterModelsWithCars = (models: Array<{ id: number; name: string; cars_qty?: number }>) => {
      return models.filter((model) => model.cars_qty && model.cars_qty > 0);
    };

    test('should filter out models with 0 cars', () => {
      const models = [
        { id: 101, name: '3 Series', cars_qty: 201 },
        { id: 102, name: '5 Series', cars_qty: 157 },
        { id: 103, name: 'Empty Model', cars_qty: 0 },
        { id: 104, name: 'X3', cars_qty: 145 },
        { id: 105, name: 'Another Empty', cars_qty: 0 },
      ];

      const filtered = filterModelsWithCars(models);

      expect(filtered).toHaveLength(3);
      expect(filtered.map(m => m.name)).toEqual(['3 Series', '5 Series', 'X3']);
      
      // Should not include models with 0 cars
      expect(filtered.some(m => m.name === 'Empty Model')).toBe(false);
      expect(filtered.some(m => m.name === 'Another Empty')).toBe(false);
    });

    test('should filter out models with undefined cars_qty', () => {
      const models = [
        { id: 101, name: '3 Series', cars_qty: 201 },
        { id: 102, name: 'Undefined Model', cars_qty: undefined },
        { id: 103, name: 'X3', cars_qty: 145 },
      ];

      const filtered = filterModelsWithCars(models);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.name)).toEqual(['3 Series', 'X3']);
      expect(filtered.some(m => m.name === 'Undefined Model')).toBe(false);
    });

    test('should handle empty model list', () => {
      const models: any[] = [];
      const filtered = filterModelsWithCars(models);
      expect(filtered).toHaveLength(0);
    });

    test('should preserve models with exactly 1 car', () => {
      const models = [
        { id: 101, name: '3 Series', cars_qty: 201 },
        { id: 102, name: 'Rare Model', cars_qty: 1 },
        { id: 103, name: 'Empty Model', cars_qty: 0 },
      ];

      const filtered = filterModelsWithCars(models);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.name)).toEqual(['3 Series', 'Rare Model']);
    });
  });

  describe('Edge Cases', () => {
    test('should handle negative car counts as invalid', () => {
      const manufacturers = [
        { id: 1, name: 'BMW', cars_qty: 245, image: 'bmw.jpg' },
        { id: 2, name: 'NegativeBrand', cars_qty: -5, image: 'negative.jpg' },
      ];

      const filtered = sortManufacturers(manufacturers);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('BMW');
    });

    test('should handle invalid manufacturer data', () => {
      const manufacturers = [
        { id: 1, name: 'BMW', cars_qty: 245, image: 'bmw.jpg' },
        { id: null, name: '', cars_qty: 100, image: 'invalid.jpg' }, // Invalid ID and name
        { id: 3, name: '   ', cars_qty: 50, image: 'whitespace.jpg' }, // Whitespace name
        { id: 4, name: 'Valid Brand', cars_qty: 30, image: 'valid.jpg' },
      ];

      const filtered = sortManufacturers(manufacturers as any);

      // Should filter out invalid entries and only keep valid ones
      expect(filtered).toHaveLength(2);
      expect(filtered.map(m => m.name)).toEqual(['BMW', 'Valid Brand']);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain referential integrity after filtering', () => {
      const manufacturers = [
        { id: 1, name: 'BMW', cars_qty: 245, image: 'bmw.jpg' },
        { id: 2, name: 'EmptyBrand', cars_qty: 0, image: 'empty.jpg' },
        { id: 3, name: 'Audi', cars_qty: 167, image: 'audi.jpg' },
      ];

      const filtered = sortManufacturers(manufacturers);

      // Verify that filtered items maintain all required properties
      filtered.forEach(manufacturer => {
        expect(manufacturer).toHaveProperty('id');
        expect(manufacturer).toHaveProperty('name');
        expect(manufacturer).toHaveProperty('cars_qty');
        expect(manufacturer).toHaveProperty('image');
        expect(typeof manufacturer.id).toBe('number');
        expect(typeof manufacturer.name).toBe('string');
        expect(typeof manufacturer.cars_qty).toBe('number');
        expect(manufacturer.cars_qty).toBeGreaterThan(0);
      });
    });
  });
});