import { describe, test, expect } from 'vitest';
import { calculateFinalPriceEUR } from '../src/utils/carPricing';

describe('Price Consistency Fix Verification', () => {
  const standardRate = 0.85;
  
  test('ensures catalog and details calculate same price for valid data', () => {
    // Simulate data structures from both catalog and details
    const catalogCarData = {
      lots: [{ buy_now: 40000 }]
    };
    
    const detailsCarData = {
      lot_data: { buy_now: 40000 },
      price: null // This would be fallback
    };
    
    // Catalog calculation (from EncarCatalog.tsx)
    const catalogUsdPrice = catalogCarData.lots[0]?.buy_now;
    const catalogPrice = calculateFinalPriceEUR(catalogUsdPrice, standardRate);
    
    // Details calculation (from CarDetails.tsx) 
    const detailsBasePrice = detailsCarData.lot_data.buy_now || detailsCarData.price;
    const detailsPrice = calculateFinalPriceEUR(detailsBasePrice, standardRate);
    
    // Both should calculate the same price
    expect(catalogPrice).toBe(detailsPrice);
    expect(catalogPrice).toBe(36200);
  });
  
  test('validates that invalid prices are properly rejected', () => {
    const invalidPrices = [
      null,
      undefined, 
      "",
      "not a number",
      NaN,
      0,
      -100
    ];
    
    invalidPrices.forEach(invalidPrice => {
      expect(() => calculateFinalPriceEUR(invalidPrice as any, standardRate))
        .toThrow(`Invalid base price USD: ${invalidPrice}`);
    });
  });
  
  test('validates that invalid exchange rates are properly rejected', () => {
    const invalidRates = [
      null,
      undefined,
      "",
      "not a number", 
      NaN,
      0,
      -0.5
    ];
    
    invalidRates.forEach(invalidRate => {
      expect(() => calculateFinalPriceEUR(40000, invalidRate as any))
        .toThrow(`Invalid USD to EUR rate: ${invalidRate}`);
    });
  });
  
  test('ensures consistency across different valid scenarios', () => {
    const testScenarios = [
      { usd: 30000, rate: 0.85, expected: 27700 },
      { usd: 35000, rate: 0.85, expected: 31950 },
      { usd: 40000, rate: 0.85, expected: 36200 },
      { usd: 45000, rate: 0.85, expected: 40450 },
      { usd: 40000, rate: 0.90, expected: 38200 },
    ];
    
    testScenarios.forEach(({ usd, rate, expected }) => {
      const result = calculateFinalPriceEUR(usd, rate);
      expect(result).toBe(expected);
    });
  });
  
  test('verifies price calculation formula consistency', () => {
    // The formula should be: Math.round(USD * rate) + 2200
    const usdPrice = 39876;
    const rate = 0.85;
    
    const expectedBasePriceEur = Math.round(usdPrice * rate); // 33895 (not 33894)
    const expectedFinalPrice = expectedBasePriceEur + 2200; // 36095
    
    const actualPrice = calculateFinalPriceEUR(usdPrice, rate);
    expect(actualPrice).toBe(expectedFinalPrice);
    expect(actualPrice).toBe(36095); // Corrected expectation
  });
});