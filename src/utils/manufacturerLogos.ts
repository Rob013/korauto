import { generateLogoSources } from '@/services/logoAPI';

// Car manufacturer data with logos from reliable API sources
export interface ManufacturerWithLogo {
  id: number;
  name: string;
  image: string;
  cars_qty?: number;
  car_count?: number;
}

// Generate manufacturer logos using the new API service with multiple reliable sources
const generateManufacturerLogos = (): Record<string, string[]> => {
  const manufacturers = [
    // German brands
    'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche', 'Opel',
    // Korean brands  
    'Hyundai', 'Kia', 'Genesis',
    // Japanese brands
    'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Lexus', 'Infiniti', 'Acura',
    // American brands
    'Ford', 'Chevrolet', 'Cadillac', 'GMC', 'Tesla', 'Chrysler', 'Jeep', 'Dodge',
    // Luxury/European brands
    'Land Rover', 'Jaguar', 'Volvo', 'Ferrari', 'Lamborghini', 'Maserati', 'Bentley', 
    'Rolls-Royce', 'Aston Martin', 'McLaren',
    // French brands
    'Peugeot', 'Renault', 'Citroën',
    // Italian brands
    'Fiat', 'Alfa Romeo',
    // Other brands
    'Skoda', 'Seat', 'Mini'
  ];

  const logos: Record<string, string[]> = {};
  
  manufacturers.forEach(manufacturer => {
    const sources = generateLogoSources(manufacturer);
    logos[manufacturer] = sources.map(source => source.url);
  });

  return logos;
};

// Car manufacturer logos with reliable API sources and local fallbacks
export const MANUFACTURER_LOGOS: Record<string, string[]> = generateManufacturerLogos();

/**
 * Get manufacturer logo URL by name with fallback support
 */
export const getManufacturerLogo = (manufacturerName: string): string | undefined => {
  // Try exact match first
  if (MANUFACTURER_LOGOS[manufacturerName]) {
    return MANUFACTURER_LOGOS[manufacturerName][0]; // Return the first (local) option
  }
  
  // Try case-insensitive match
  const normalizedName = manufacturerName.trim();
  const foundKey = Object.keys(MANUFACTURER_LOGOS).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  );
  
  return foundKey ? MANUFACTURER_LOGOS[foundKey][0] : undefined;
};

/**
 * Get all fallback URLs for a manufacturer logo
 */
export const getManufacturerLogoFallbacks = (manufacturerName: string): string[] => {
  // Try exact match first
  if (MANUFACTURER_LOGOS[manufacturerName]) {
    return MANUFACTURER_LOGOS[manufacturerName];
  }
  
  // Try case-insensitive match
  const normalizedName = manufacturerName.trim();
  const foundKey = Object.keys(MANUFACTURER_LOGOS).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  );
  
  return foundKey ? MANUFACTURER_LOGOS[foundKey] : [];
};

/**
 * Enhance manufacturer data with logos
 */
export const enhanceManufacturerWithLogo = (manufacturer: any): ManufacturerWithLogo => {
  const logo = getManufacturerLogo(manufacturer.name);
  
  return {
    id: manufacturer.id,
    name: manufacturer.name,
    image: logo || '', // Empty string if no logo found
    cars_qty: manufacturer.cars_qty || manufacturer.car_count || 0,
    car_count: manufacturer.car_count || manufacturer.cars_qty || 0
  };
};

/**
 * Create fallback manufacturer data with realistic car counts
 */
export const createFallbackManufacturers = (): ManufacturerWithLogo[] => {
  const fallbackData = [
    // German brands (priority)
    { id: 9, name: 'BMW', cars_qty: 245 },
    { id: 16, name: 'Mercedes-Benz', cars_qty: 189 },
    { id: 1, name: 'Audi', cars_qty: 167 },
    { id: 147, name: 'Volkswagen', cars_qty: 134 },
    { id: 13, name: 'Porsche', cars_qty: 27 },
    { id: 22, name: 'Opel', cars_qty: 45 },
    
    // Korean brands
    { id: 7, name: 'Hyundai', cars_qty: 112 },
    { id: 8, name: 'Kia', cars_qty: 95 },
    { id: 19, name: 'Genesis', cars_qty: 12 },
    
    // Japanese brands
    { id: 3, name: 'Toyota', cars_qty: 156 },
    { id: 2, name: 'Honda', cars_qty: 98 },
    { id: 4, name: 'Nissan', cars_qty: 87 },
    { id: 10, name: 'Mazda', cars_qty: 43 },
    { id: 11, name: 'Subaru', cars_qty: 29 },
    { id: 12, name: 'Lexus', cars_qty: 38 },
    { id: 17, name: 'Infiniti', cars_qty: 18 },
    { id: 18, name: 'Acura', cars_qty: 15 },
    { id: 23, name: 'Mitsubishi', cars_qty: 25 },
    
    // American brands
    { id: 5, name: 'Ford', cars_qty: 76 },
    { id: 6, name: 'Chevrolet', cars_qty: 54 },
    { id: 24, name: 'Cadillac', cars_qty: 18 },
    { id: 25, name: 'GMC', cars_qty: 15 },
    { id: 20, name: 'Tesla', cars_qty: 8 },
    { id: 26, name: 'Chrysler', cars_qty: 12 },
    { id: 27, name: 'Jeep', cars_qty: 22 },
    { id: 28, name: 'Dodge', cars_qty: 16 },
    
    // Luxury/European brands
    { id: 14, name: 'Land Rover', cars_qty: 22 },
    { id: 21, name: 'Jaguar', cars_qty: 9 },
    { id: 15, name: 'Volvo', cars_qty: 31 },
    { id: 29, name: 'Ferrari', cars_qty: 3 },
    { id: 30, name: 'Lamborghini', cars_qty: 2 },
    { id: 31, name: 'Maserati', cars_qty: 4 },
    { id: 32, name: 'Bentley', cars_qty: 2 },
    { id: 33, name: 'Rolls-Royce', cars_qty: 1 },
    { id: 34, name: 'Aston Martin', cars_qty: 2 },
    { id: 35, name: 'McLaren', cars_qty: 1 },
    { id: 22, name: 'Mini', cars_qty: 14 },
    
    // French brands
    { id: 36, name: 'Peugeot', cars_qty: 28 },
    { id: 37, name: 'Renault', cars_qty: 35 },
    { id: 38, name: 'Citroën', cars_qty: 18 },
    
    // Italian brands
    { id: 39, name: 'Fiat', cars_qty: 22 },
    { id: 40, name: 'Alfa Romeo', cars_qty: 11 },
    
    // Other European brands
    { id: 41, name: 'Skoda', cars_qty: 24 },
    { id: 42, name: 'Seat', cars_qty: 16 }
  ];
  
  return fallbackData.map(enhanceManufacturerWithLogo);
};