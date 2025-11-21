/**
 * Utility functions for car pricing logic
 */

/**
 * Check if a car has real pricing data (not default fallback price)
 * A car has real pricing if it has any of: buy_now, final_bid, or price
 */
export const hasRealPricing = (car: any): boolean => {
  // Check if car has lots with pricing data
  if (car.lots && Array.isArray(car.lots) && car.lots.length > 0) {
    const lot = car.lots[0];
    return !!(lot.buy_now || lot.final_bid || lot.price);
  }
  
  // Check direct pricing fields (for cached cars or different data structures)
  return !!(car.buy_now || car.final_bid || car.price);
};

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
 * @returns Final price in EUR (base price converted + 2350 EUR markup)
 */
export const calculateFinalPriceEUR = (basePriceUSD: number, usdToEurRate: number): number => {
  const basePriceEUR = Math.round(basePriceUSD * usdToEurRate);
  return basePriceEUR + 2350; // Add 2350 EUR markup
};

/**
 * Check if a calculated price is the default fallback price
 * Default is 25000 USD converted to EUR + markup (25000 * 0.87 + 2350 = 24100 EUR)
 */
export const isDefaultPrice = (priceEUR: number): boolean => {
  return priceEUR === 24100; // 25000 USD * 0.87 + 2350 EUR markup
};

/**
 * Check if a car has buy_now pricing specifically (not fallback prices)
 * Only cars with real buy_now prices should be displayed
 */
export const hasBuyNowPricing = (car: any): boolean => {
  // Check if car has lots with buy_now pricing data
  if (car.lots && Array.isArray(car.lots) && car.lots.length > 0) {
    const lot = car.lots[0];
    return !!(lot.buy_now && lot.buy_now > 0);
  }
  
  // Check direct buy_now field (for cached cars or different data structures)
  return !!(car.buy_now && car.buy_now > 0);
};

/**
 * Filter out cars that don't have buy_now pricing data
 */
export const filterCarsWithBuyNowPricing = <T>(cars: T[]): T[] => {
  return cars.filter(hasBuyNowPricing);
};