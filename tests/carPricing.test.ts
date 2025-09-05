import { describe, it, expect } from 'vitest';
import { hasRealPricing, filterCarsWithRealPricing, isDefaultPrice, calculateFinalPriceEUR } from '../src/utils/carPricing';

describe('Car Pricing Utilities', () => {
  describe('hasRealPricing', () => {
    it('should return true for cars with buy_now price in lots', () => {
      const car = {
        id: '1',
        lots: [{ buy_now: 15000 }]
      };
      expect(hasRealPricing(car)).toBe(true);
    });

    it('should return true for cars with final_bid price in lots', () => {
      const car = {
        id: '1',
        lots: [{ final_bid: 12000 }]
      };
      expect(hasRealPricing(car)).toBe(true);
    });

    it('should return true for cars with price in lots', () => {
      const car = {
        id: '1',
        lots: [{ price: 18000 }]
      };
      expect(hasRealPricing(car)).toBe(true);
    });

    it('should return false for cars without any pricing data in lots', () => {
      const car = {
        id: '1',
        lots: [{}]
      };
      expect(hasRealPricing(car)).toBe(false);
    });

    it('should return false for cars with empty lots array', () => {
      const car = {
        id: '1',
        lots: []
      };
      expect(hasRealPricing(car)).toBe(false);
    });

    it('should return false for cars without lots', () => {
      const car = {
        id: '1'
      };
      expect(hasRealPricing(car)).toBe(false);
    });

    it('should return true for cars with direct pricing fields', () => {
      const car = {
        id: '1',
        buy_now: 20000
      };
      expect(hasRealPricing(car)).toBe(true);
    });
  });

  describe('filterCarsWithRealPricing', () => {
    it('should filter out cars without real pricing', () => {
      const cars = [
        { id: '1', lots: [{ buy_now: 15000 }] },
        { id: '2', lots: [{}] }, // No pricing
        { id: '3', lots: [{ final_bid: 18000 }] },
        { id: '4' }, // No lots
      ];

      const filtered = filterCarsWithRealPricing(cars);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('1');
      expect(filtered[1].id).toBe('3');
    });
  });

  describe('calculateFinalPriceEUR', () => {
    it('should convert USD to EUR and add 2200 EUR markup', () => {
      // 15000 USD * 0.92 = 13800 EUR + 2200 EUR = 16000 EUR
      expect(calculateFinalPriceEUR(15000, 0.92)).toBe(16000);
    });

    it('should handle different exchange rates', () => {
      // 20000 USD * 0.85 = 17000 EUR + 2200 EUR = 19200 EUR
      expect(calculateFinalPriceEUR(20000, 0.85)).toBe(19200);
    });

    it('should work with default fallback price', () => {
      // 25000 USD * 0.92 = 23000 EUR + 2200 EUR = 25200 EUR
      expect(calculateFinalPriceEUR(25000, 0.92)).toBe(25200);
    });
  });

  describe('isDefaultPrice', () => {
    it('should return true for the default calculated EUR price', () => {
      // 25000 USD * 0.92 = 23000 EUR + 2200 EUR = 25200 EUR
      expect(isDefaultPrice(25200)).toBe(true);
    });

    it('should return false for other prices', () => {
      expect(isDefaultPrice(15000)).toBe(false);
      expect(isDefaultPrice(30000)).toBe(false);
      expect(isDefaultPrice(25000)).toBe(false);
      expect(isDefaultPrice(25024)).toBe(false); // Old default price
    });
  });
});