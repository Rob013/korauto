/**
 * Utility functions for car pricing logic
 */

const toNumericPrice = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const collectPriceCandidates = (car: any): number[] => {
  const candidates: number[] = [];

  if (car?.lots && Array.isArray(car.lots) && car.lots.length > 0) {
    const primaryLot = car.lots[0];
    candidates.push(
      toNumericPrice(primaryLot?.buy_now),
      toNumericPrice(primaryLot?.final_bid),
      toNumericPrice(primaryLot?.price)
    );
  }

  candidates.push(
    toNumericPrice(car?.buy_now),
    toNumericPrice(car?.final_bid),
    toNumericPrice(car?.price)
  );

  return candidates.filter((price) => price > 0);
};

/**
 * Determine the best available USD price for a car.
 * Priority order:
 * 1. Primary lot buy_now price
 * 2. Primary lot final_bid
 * 3. Primary lot price
 * 4. Car-level buy_now / final_bid / price
 */
export const getBestAvailablePriceUSD = (car: any): number => {
  const candidates = collectPriceCandidates(car);
  return candidates.length > 0 ? candidates[0] : 0;
};

/**
 * Check if a car has real pricing data (not default fallback price)
 * A car has real pricing if it has any positive pricing source.
 */
export const hasRealPricing = (car: any): boolean => getBestAvailablePriceUSD(car) > 0;

/**
 * Filter out cars that don't have real pricing data
 */
export const filterCarsWithRealPricing = <T>(cars: T[]): T[] => {
  return cars.filter(hasRealPricing);
};

/**
 * Calculate the final price in EUR: convert USD base price to EUR and add markup
 * @param basePriceUSD - The base price in USD from the API
 * @param usdToEurRate - The USD to EUR conversion rate
 * @returns Final price in EUR (base price converted + 2300 EUR markup)
 */
export const calculateFinalPriceEUR = (basePriceUSD: number, usdToEurRate: number): number => {
  const basePriceEUR = Math.round(basePriceUSD * usdToEurRate);
  return basePriceEUR + 2300; // Add 2300 EUR markup
};

/**
 * Check if a calculated price is the default fallback price
 * Default is 25000 USD converted to EUR + markup (25000 * 0.87 + 2300 = 24050 EUR)
 */
export const isDefaultPrice = (priceEUR: number): boolean => {
  return priceEUR === 24050; // 25000 USD * 0.87 + 2300 EUR markup
};

/**
 * Check if a car has buy_now pricing specifically (not fallback prices)
 * Only cars with real buy_now prices should be displayed
 */
export const hasBuyNowPricing = (car: any): boolean => {
  // Check if car has lots with buy_now pricing data
  if (car.lots && Array.isArray(car.lots) && car.lots.length > 0) {
    const lot = car.lots[0];
    return toNumericPrice(lot?.buy_now) > 0;
  }
  
  // Check direct buy_now field (for cached cars or different data structures)
  return toNumericPrice(car?.buy_now) > 0;
};

/**
 * Filter out cars that don't have buy_now pricing data
 */
export const filterCarsWithBuyNowPricing = <T>(cars: T[]): T[] => {
  return cars.filter(hasBuyNowPricing);
};