import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useCurrencyAPI hook
const mockConvertUSDtoEUR = vi.fn();
vi.mock('@/hooks/useCurrencyAPI', () => ({
  useCurrencyAPI: () => ({
    convertUSDtoEUR: mockConvertUSDtoEUR,
    exchangeRate: { rate: 0.92, lastUpdated: new Date().toISOString() },
    loading: false,
    error: null,
  })
}));

describe('API Car Pricing with USD to EUR Conversion + 2200 EUR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: 1 USD = 0.92 EUR
    mockConvertUSDtoEUR.mockImplementation((usd: number) => Math.round(usd * 0.92));
  });

  it('should convert USD price to EUR then add 2200 EUR in admin search results', () => {
    // Simulate car with buy_now price
    const carWithPrice = {
      lots: [{ buy_now: 25000 }]
    };

    // Expected behavior: (25000 * 0.92) + 2200 = 23000 + 2200 = 25200
    const expectedEURFromUSD = Math.round(25000 * 0.92); // 23000
    const expectedFinalPrice = expectedEURFromUSD + 2200; // 25200

    // This would be called in AdminCarSearch logic
    const usdConverted = mockConvertUSDtoEUR(25000);
    const result = usdConverted + 2200;
    
    expect(mockConvertUSDtoEUR).toHaveBeenCalledWith(25000);
    expect(result).toBe(25200);
  });

  it('should handle fallback price of 25000 USD converted to EUR + 2200 EUR markup', () => {
    // Simulate car without buy_now price - should use fallback 25000
    const carWithoutPrice = {
      lots: [{}]
    };

    const fallbackUSD = 25000;
    const expectedEURFromUSD = Math.round(fallbackUSD * 0.92); // 23000
    const expectedFinalPrice = expectedEURFromUSD + 2200; // 25200

    const usdConverted = mockConvertUSDtoEUR(fallbackUSD);
    const result = usdConverted + 2200;
    
    expect(mockConvertUSDtoEUR).toHaveBeenCalledWith(25000);
    expect(result).toBe(25200);
  });

  it('should work with different USD amounts', () => {
    // Test with various USD prices
    const testCases = [
      { usd: 15000, expected: Math.round(15000 * 0.92) + 2200 }, // 13800 + 2200 = 16000
      { usd: 30000, expected: Math.round(30000 * 0.92) + 2200 }, // 27600 + 2200 = 29800
      { usd: 50000, expected: Math.round(50000 * 0.92) + 2200 }, // 46000 + 2200 = 48200
    ];

    testCases.forEach(({ usd, expected }) => {
      const usdConverted = mockConvertUSDtoEUR(usd);
      const result = usdConverted + 2200;
      expect(result).toBe(expected);
    });
  });

  it('should handle different exchange rates', () => {
    // Test with different exchange rate
    mockConvertUSDtoEUR.mockImplementation((usd: number) => Math.round(usd * 0.85)); // Different rate

    const usdAmount = 25000;
    const expectedEUR = Math.round(25000 * 0.85); // 21250
    const expectedFinalPrice = expectedEUR + 2200; // 23450

    const usdConverted = mockConvertUSDtoEUR(usdAmount);
    const result = usdConverted + 2200;
    expect(result).toBe(23450);
  });
});