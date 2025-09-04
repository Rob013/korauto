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
 * Check if a calculated price is the default fallback price
 * Default is 25000 USD converted to EUR + 2200 EUR markup
 * With default rate 0.92: (25000 * 0.92) + 2200 = 23000 + 2200 = 25200 EUR
 */
export const isDefaultPrice = (priceEUR: number): boolean => {
  return priceEUR === 25200;
};