import { describe, test, expect } from 'vitest';
import { calculateFinalPriceEUR } from '../src/utils/carPricing';

describe('Price Consistency Investigation', () => {
  const mockExchangeRate = 0.85; // Standard rate from currency API
  
  test('calculateFinalPriceEUR produces consistent results', () => {
    const testCases = [
      { usd: 40000, expectedEur: 36200 }, // €36,200 from screenshot
      { usd: 39900, expectedEur: 36115 }, // €36,115 from screenshot  
      { usd: 39800, expectedEur: 36030 }, // €36,030 from screenshot
      { usd: 39700, expectedEur: 35945 }, // €35,945 from screenshot
    ];
    
    testCases.forEach(({ usd, expectedEur }) => {
      const result = calculateFinalPriceEUR(usd, mockExchangeRate);
      expect(result).toBe(expectedEur);
    });
  });
  
  test('price calculation with different exchange rates', () => {
    const usdPrice = 40000;
    
    // Test with different rates
    const rates = [0.85, 0.90, 0.80];
    
    rates.forEach(rate => {
      const result = calculateFinalPriceEUR(usdPrice, rate);
      const expectedBasePriceEur = Math.round(usdPrice * rate);
      const expectedFinalPrice = expectedBasePriceEur + 2200;
      
      expect(result).toBe(expectedFinalPrice);
      console.log(`USD $${usdPrice} at rate ${rate} = EUR €${result.toLocaleString()}`);
    });
  });
  
  test('price handling with undefined or null values', () => {
    // Test edge cases that might cause inconsistencies
    expect(() => calculateFinalPriceEUR(0, 0.85)).toThrow(); // Zero should be invalid
    expect(() => calculateFinalPriceEUR(null as any, 0.85)).toThrow();
    expect(() => calculateFinalPriceEUR(undefined as any, 0.85)).toThrow();
    expect(() => calculateFinalPriceEUR(40000, null as any)).toThrow();
    expect(() => calculateFinalPriceEUR(40000, undefined as any)).toThrow();
    expect(() => calculateFinalPriceEUR(NaN, 0.85)).toThrow();
    expect(() => calculateFinalPriceEUR(40000, NaN)).toThrow();
    
    // Valid inputs should work
    expect(() => calculateFinalPriceEUR(40000, 0.85)).not.toThrow();
    expect(calculateFinalPriceEUR(40000, 0.85)).toBe(36200);
  });
});

// Mock car data structures to test the complete price flow
describe('Car Data Price Flow Investigation', () => {
  test('catalog car data structure', () => {
    // Simulate car data as it comes from EncarCatalog
    const mockCatalogCar = {
      id: 'test-123',
      manufacturer: { name: 'BMW' },
      model: { name: '320i' },
      year: 2020,
      lots: [{
        buy_now: 40000, // USD price from API
        lot: 'LOT123',
        images: { normal: ['test-image.jpg'] }
      }]
    };
    
    const usdPrice = mockCatalogCar.lots[0].buy_now;
    const eurPrice = calculateFinalPriceEUR(usdPrice, 0.85);
    
    expect(eurPrice).toBe(36200);
    console.log('Catalog car price calculation:', { usdPrice, eurPrice });
  });
  
  test('details car data structure', () => {
    // Simulate car data as it comes from CarDetails
    const mockDetailsCar = {
      id: 'test-123',
      make: 'BMW',
      model: '320i', 
      year: 2020,
      lot: 'LOT123',
      // This could come from different sources: cached data, API data, etc.
      price: 40000 // USD base price
    };
    
    const usdPrice = mockDetailsCar.price;
    const eurPrice = calculateFinalPriceEUR(usdPrice, 0.85);
    
    expect(eurPrice).toBe(36200);
    console.log('Details car price calculation:', { usdPrice, eurPrice });
  });
});