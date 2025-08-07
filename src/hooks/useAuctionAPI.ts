import { useSecureAuctionAPI } from './useSecureAuctionAPI';

// DEPRECATED: This hook has been replaced with useSecureAuctionAPI for security
// This is kept for backward compatibility but all API calls now go through secure edge functions
console.warn('⚠️ useAuctionAPI is deprecated. Please use useSecureAuctionAPI instead for secure API access.');

// Re-export the secure API with all types
export const useAuctionAPI = () => {
  return useSecureAuctionAPI();
};

// Color options mapping
export const COLOR_OPTIONS = {
  silver: 1,
  purple: 2,
  orange: 3,
  green: 4,
  red: 5,
  gold: 6,
  charcoal: 7,
  brown: 8,
  grey: 9,
  turquoise: 10,
  blue: 11,
  bronze: 12,
  white: 13,
  cream: 14,
  black: 15,
  yellow: 16,
  beige: 17,
  pink: 18,
  two_colors: 100
};

// Fuel type options mapping
export const FUEL_TYPE_OPTIONS = {
  diesel: 1,
  electric: 2,
  hybrid: 3,
  gasoline: 4,
  gas: 5,
  flexible: 6,
  hydrogen: 7
};

// Transmission options mapping
export const TRANSMISSION_OPTIONS = {
  automatic: 1,
  manual: 2
};

// Body type options mapping
export const BODY_TYPE_OPTIONS = {
  sedan: 1,
  suv: 2,
  hatchback: 3,
  coupe: 4,
  wagon: 5,
  convertible: 6,
  pickup: 7,
  van: 8,
  minivan: 9,
  crossover: 10,
  roadster: 11,
  limousine: 12
};

export default useAuctionAPI;