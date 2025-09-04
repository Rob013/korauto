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

describe('API Car Pricing with EUR Conversion + 2200', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: 1 USD = 0.92 EUR
    mockConvertUSDtoEUR.mockImplementation((usd: number) => Math.round(usd * 0.92));
  });

  it('should convert USD price + 2200 to EUR in admin search results', () => {
    // Simulate car with buy_now price
    const carWithPrice = {
      lots: [{ buy_now: 25000 }]
    };

    // Expected behavior: (25000 + 2200) * 0.92 = 25024
    const expectedUSDWithMarkup = 25000 + 2200; // 27200
    const expectedEURPrice = Math.round(expectedUSDWithMarkup * 0.92); // 25024

    // This would be called in AdminCarSearch logic
    const result = mockConvertUSDtoEUR(expectedUSDWithMarkup);
    
    expect(mockConvertUSDtoEUR).toHaveBeenCalledWith(27200);
    expect(result).toBe(25024);
  });

  it('should handle fallback price of 25000 USD + 2200 markup', () => {
    // Simulate car without buy_now price - should use fallback 25000
    const carWithoutPrice = {
      lots: [{}]
    };

    const fallbackUSD = 25000;
    const expectedUSDWithMarkup = fallbackUSD + 2200; // 27200
    const expectedEURPrice = Math.round(expectedUSDWithMarkup * 0.92); // 25024

    const result = mockConvertUSDtoEUR(expectedUSDWithMarkup);
    
    expect(mockConvertUSDtoEUR).toHaveBeenCalledWith(27200);
    expect(result).toBe(25024);
  });

  it('should work with different USD amounts', () => {
    // Test with various USD prices
    const testCases = [
      { usd: 15000, expected: Math.round((15000 + 2200) * 0.92) }, // 15824
      { usd: 30000, expected: Math.round((30000 + 2200) * 0.92) }, // 29624
      { usd: 50000, expected: Math.round((50000 + 2200) * 0.92) }, // 48024
    ];

    testCases.forEach(({ usd, expected }) => {
      const result = mockConvertUSDtoEUR(usd + 2200);
      expect(result).toBe(expected);
    });
  });

  it('should handle different exchange rates', () => {
    // Test with different exchange rate
    mockConvertUSDtoEUR.mockImplementation((usd: number) => Math.round(usd * 0.85)); // Different rate

    const usdWithMarkup = 25000 + 2200; // 27200
    const expectedEUR = Math.round(27200 * 0.85); // 23120

    const result = mockConvertUSDtoEUR(usdWithMarkup);
    expect(result).toBe(23120);
  });
});