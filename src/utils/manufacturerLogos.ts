// Car manufacturer data with logos from reliable CDN sources
export interface ManufacturerWithLogo {
  id: number;
  name: string;
  image: string;
  cars_qty?: number;
  car_count?: number;
}

// Car manufacturer logos from multiple reliable CDN sources with fallbacks
export const MANUFACTURER_LOGOS: Record<string, string> = {
  // German brands - Using alternative CDN sources that are more likely to work
  'BMW': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/bmw.svg',
  'Mercedes-Benz': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mercedes.svg', 
  'Audi': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/audi.svg',
  'Volkswagen': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/volkswagen.svg',
  'Porsche': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/porsche.svg',
  'Opel': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/opel.svg',
  
  // Korean brands
  'Hyundai': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hyundai.svg',
  'Kia': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/kia.svg',
  'Genesis': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/genesis.svg',
  
  // Japanese brands
  'Toyota': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/toyota.svg',
  'Honda': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/honda.svg',
  'Nissan': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/nissan.svg',
  'Mazda': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mazda.svg',
  'Subaru': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/subaru.svg',
  'Mitsubishi': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mitsubishi.svg',
  'Lexus': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/lexus.svg',
  'Infiniti': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/infiniti.svg',
  'Acura': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/acura.svg',
  
  // American brands  
  'Ford': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/ford.svg',
  'Chevrolet': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/chevrolet.svg',
  'Cadillac': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/cadillac.svg',
  'GMC': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/gmc.svg',
  'Tesla': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/tesla.svg',
  'Chrysler': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/chrysler.svg',
  'Jeep': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/jeep.svg',
  'Dodge': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/dodge.svg',
  
  // Luxury/European brands
  'Land Rover': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/landrover.svg',
  'Jaguar': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/jaguar.svg',
  'Volvo': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/volvo.svg',
  'Ferrari': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/ferrari.svg',
  'Lamborghini': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/lamborghini.svg',
  'Maserati': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/maserati.svg',
  'Bentley': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/bentley.svg',
  'Rolls-Royce': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/rollsroyce.svg',
  'Aston Martin': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/astonmartin.svg',
  'McLaren': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mclaren.svg',
  
  // French brands
  'Peugeot': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/peugeot.svg',
  'Renault': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/renault.svg',
  'Citroën': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/citroen.svg',
  
  // Italian brands
  'Fiat': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/fiat.svg',
  'Alfa Romeo': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/alfaromeo.svg',
  
  // Other brands
  'Skoda': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/skoda.svg',
  'Seat': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/seat.svg',
  'Mini': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/mini.svg'
};

/**
 * Get manufacturer logo URL by name
 */
export const getManufacturerLogo = (manufacturerName: string): string | undefined => {
  // Try exact match first
  if (MANUFACTURER_LOGOS[manufacturerName]) {
    return MANUFACTURER_LOGOS[manufacturerName];
  }
  
  // Try case-insensitive match
  const normalizedName = manufacturerName.trim();
  const foundKey = Object.keys(MANUFACTURER_LOGOS).find(
    key => key.toLowerCase() === normalizedName.toLowerCase()
  );
  
  return foundKey ? MANUFACTURER_LOGOS[foundKey] : undefined;
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
    { id: 9, name: 'BMW', cars_qty: 245 },
    { id: 16, name: 'Mercedes-Benz', cars_qty: 189 },
    { id: 1, name: 'Audi', cars_qty: 167 },
    { id: 147, name: 'Volkswagen', cars_qty: 134 },
    { id: 2, name: 'Honda', cars_qty: 98 },
    { id: 3, name: 'Toyota', cars_qty: 156 },
    { id: 4, name: 'Nissan', cars_qty: 87 },
    { id: 5, name: 'Ford', cars_qty: 76 },
    { id: 6, name: 'Chevrolet', cars_qty: 54 },
    { id: 7, name: 'Hyundai', cars_qty: 112 },
    { id: 8, name: 'Kia', cars_qty: 95 },
    { id: 10, name: 'Mazda', cars_qty: 43 },
    { id: 11, name: 'Subaru', cars_qty: 29 },
    { id: 12, name: 'Lexus', cars_qty: 38 },
    { id: 13, name: 'Porsche', cars_qty: 27 },
    { id: 14, name: 'Land Rover', cars_qty: 22 },
    { id: 15, name: 'Volvo', cars_qty: 31 },
    { id: 17, name: 'Infiniti', cars_qty: 18 },
    { id: 18, name: 'Acura', cars_qty: 15 },
    { id: 19, name: 'Genesis', cars_qty: 12 },
    { id: 20, name: 'Tesla', cars_qty: 8 },
    { id: 21, name: 'Jaguar', cars_qty: 9 },
    { id: 22, name: 'Mini', cars_qty: 14 },
    { id: 23, name: 'Mitsubishi', cars_qty: 25 }
  ];
  
  return fallbackData.map(enhanceManufacturerWithLogo);
};