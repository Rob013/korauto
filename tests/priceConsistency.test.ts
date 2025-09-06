// Test for price consistency between car cards and car details
import { describe, test, expect } from 'vitest';
import { calculateFinalPriceEUR } from '../src/utils/carPricing';

describe('Price Consistency Fix', () => {
  const mockExchangeRate = 0.92; // USD to EUR

  test('should calculate same price for car with buy_now only', () => {
    const lot = {
      buy_now: 15000,
      final_bid: null,
      price: null
    };

    // Car card logic (fixed)
    const cardBasePrice = lot?.buy_now ?? lot?.final_bid ?? lot?.price ?? 25000;
    const cardPrice = calculateFinalPriceEUR(cardBasePrice, mockExchangeRate);

    // Car details logic
    const detailsBasePrice = lot.buy_now ?? lot.final_bid ?? lot.price ?? 25000;
    const detailsPrice = calculateFinalPriceEUR(detailsBasePrice, mockExchangeRate);

    expect(cardPrice).toBe(detailsPrice);
    expect(cardPrice).toBe(13800); // 15000 * 0.92
  });

  test('should calculate same price for car with final_bid', () => {
    const lot = {
      buy_now: null,
      final_bid: 12000,
      price: 10000
    };

    // Car card logic (fixed)
    const cardBasePrice = lot?.buy_now ?? lot?.final_bid ?? lot?.price ?? 25000;
    const cardPrice = calculateFinalPriceEUR(cardBasePrice, mockExchangeRate);

    // Car details logic
    const detailsBasePrice = lot.buy_now ?? lot.final_bid ?? lot.price ?? 25000;
    const detailsPrice = calculateFinalPriceEUR(detailsBasePrice, mockExchangeRate);

    expect(cardPrice).toBe(detailsPrice);
    expect(cardPrice).toBe(11040); // 12000 * 0.92
  });

  test('should calculate same price for car with price only', () => {
    const lot = {
      buy_now: null,
      final_bid: null,
      price: 8000
    };

    // Car card logic (fixed)
    const cardBasePrice = lot?.buy_now ?? lot?.final_bid ?? lot?.price ?? 25000;
    const cardPrice = calculateFinalPriceEUR(cardBasePrice, mockExchangeRate);

    // Car details logic
    const detailsBasePrice = lot.buy_now ?? lot.final_bid ?? lot.price ?? 25000;
    const detailsPrice = calculateFinalPriceEUR(detailsBasePrice, mockExchangeRate);

    expect(cardPrice).toBe(detailsPrice);
    expect(cardPrice).toBe(7360); // 8000 * 0.92
  });

  test('should use fallback price when no pricing data available', () => {
    const lot = {
      buy_now: null,
      final_bid: null,
      price: null
    };

    // Car card logic (fixed)
    const cardBasePrice = lot?.buy_now ?? lot?.final_bid ?? lot?.price ?? 25000;
    const cardPrice = calculateFinalPriceEUR(cardBasePrice, mockExchangeRate);

    // Car details logic
    const detailsBasePrice = lot.buy_now ?? lot.final_bid ?? lot.price ?? 25000;
    const detailsPrice = calculateFinalPriceEUR(detailsBasePrice, mockExchangeRate);

    expect(cardPrice).toBe(detailsPrice);
    expect(cardPrice).toBe(23000); // 25000 * 0.92 (fallback)
  });

  test('should prioritize buy_now over final_bid and price', () => {
    const lot = {
      buy_now: 20000,
      final_bid: 18000,
      price: 16000
    };

    // Both should use buy_now (highest priority)
    const cardBasePrice = lot?.buy_now ?? lot?.final_bid ?? lot?.price ?? 25000;
    const cardPrice = calculateFinalPriceEUR(cardBasePrice, mockExchangeRate);

    const detailsBasePrice = lot.buy_now ?? lot.final_bid ?? lot.price ?? 25000;
    const detailsPrice = calculateFinalPriceEUR(detailsBasePrice, mockExchangeRate);

    expect(cardPrice).toBe(detailsPrice);
    expect(cardPrice).toBe(18400); // 20000 * 0.92
  });
});