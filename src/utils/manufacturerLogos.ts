// Car manufacturer data with logos from reliable CDN sources
export interface ManufacturerWithLogo {
  id: number;
  name: string;
  image: string;
  cars_qty?: number;
  car_count?: number;
}

// Car manufacturer logos with local fallbacks and multiple CDN sources
export const MANUFACTURER_LOGOS: Record<string, string[]> = {
  // German brands - Using more reliable logo sources
  'BMW': [
    '/logos/bmw.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/bmw-vector-logo.png',
    'https://cdn.freebiesupply.com/logos/large/2x/bmw-logo-png-transparent.png'
  ],
  'Mercedes-Benz': [
    '/logos/mercedes.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/mercedes-benz-vector-logo.png',
    'https://cdn.freebiesupply.com/logos/large/2x/mercedes-benz-6-logo-png-transparent.png'
  ], 
  'Audi': [
    '/logos/audi.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/audi-vector-logo.png',
    'https://cdn.freebiesupply.com/logos/large/2x/audi-logo-png-transparent.png'
  ],
  'Volkswagen': [
    '/logos/volkswagen.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/volkswagen-vector-logo.png',
    'https://cdn.freebiesupply.com/logos/large/2x/volkswagen-logo-png-transparent.png'
  ],
  'Porsche': [
    '/logos/porsche.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/porsche-vector-logo.png',
    'https://cdn.freebiesupply.com/logos/large/2x/porsche-logo-png-transparent.png'
  ],
  'Opel': [
    '/logos/opel.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/opel-logo-png-transparent.png'
  ],
  
  // Korean brands
  'Hyundai': [
    '/logos/hyundai.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/hyundai-logo-png-transparent.png'
  ],
  'Kia': [
    '/logos/kia.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/kia-logo-png-transparent.png'
  ],
  'Genesis': [
    '/logos/genesis.svg',
    'https://www.carlogos.org/car-logos/genesis-logo.png'
  ],
  
  // Japanese brands
  'Toyota': [
    '/logos/toyota.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/toyota-logo-png-transparent.png'
  ],
  'Honda': [
    '/logos/honda.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/honda-logo-png-transparent.png'
  ],
  'Nissan': [
    '/logos/nissan.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/nissan-logo-png-transparent.png'
  ],
  'Mazda': [
    '/logos/mazda.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/mazda-logo-png-transparent.png'
  ],
  'Subaru': [
    '/logos/subaru.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/subaru-logo-png-transparent.png'
  ],
  'Mitsubishi': [
    '/logos/mitsubishi.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/mitsubishi-logo-png-transparent.png'
  ],
  'Lexus': [
    '/logos/lexus.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/lexus-logo-png-transparent.png'
  ],
  'Infiniti': [
    '/logos/infiniti.svg',
    'https://www.carlogos.org/car-logos/infiniti-logo.png'
  ],
  'Acura': [
    '/logos/acura.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/acura-logo-png-transparent.png'
  ],
  
  // American brands  
  'Ford': [
    '/logos/ford.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/ford-logo-png-transparent.png'
  ],
  'Chevrolet': [
    '/logos/chevrolet.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/chevrolet-logo-png-transparent.png'
  ],
  'Cadillac': [
    '/logos/cadillac.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/cadillac-logo-png-transparent.png'
  ],
  'GMC': [
    '/logos/gmc.svg',
    'https://www.carlogos.org/car-logos/gmc-logo.png'
  ],
  'Tesla': [
    '/logos/tesla.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/tesla-logo-png-transparent.png'
  ],
  'Chrysler': [
    '/logos/chrysler.svg',
    'https://www.carlogos.org/car-logos/chrysler-logo.png'
  ],
  'Jeep': [
    '/logos/jeep.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/jeep-logo-png-transparent.png'
  ],
  'Dodge': [
    '/logos/dodge.svg',
    'https://www.carlogos.org/car-logos/dodge-logo.png'
  ],
  
  // Luxury/European brands
  'Land Rover': [
    '/logos/landrover.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/land-rover-logo-png-transparent.png'
  ],
  'Jaguar': [
    '/logos/jaguar.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/jaguar-logo-png-transparent.png'
  ],
  'Volvo': [
    '/logos/volvo.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/volvo-logo-png-transparent.png'
  ],
  'Ferrari': [
    '/logos/ferrari.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/ferrari-logo-png-transparent.png'
  ],
  'Lamborghini': [
    '/logos/lamborghini.svg',
    'https://www.carlogos.org/car-logos/lamborghini-logo.png'
  ],
  'Maserati': [
    '/logos/maserati.svg',
    'https://www.carlogos.org/car-logos/maserati-logo.png'
  ],
  'Bentley': [
    '/logos/bentley.svg',
    'https://www.carlogos.org/car-logos/bentley-logo.png'
  ],
  'Rolls-Royce': [
    '/logos/rollsroyce.svg',
    'https://www.carlogos.org/car-logos/rolls-royce-logo.png'
  ],
  'Aston Martin': [
    '/logos/astonmartin.svg',
    'https://www.carlogos.org/car-logos/aston-martin-logo.png'
  ],
  'McLaren': [
    '/logos/mclaren.svg',
    'https://www.carlogos.org/car-logos/mclaren-logo.png'
  ],
  
  // French brands
  'Peugeot': [
    '/logos/peugeot.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/peugeot-logo-png-transparent.png'
  ],
  'Renault': [
    '/logos/renault.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/renault-logo-png-transparent.png'
  ],
  'Citroën': [
    '/logos/citroen.svg',
    'https://www.carlogos.org/car-logos/citroen-logo.png'
  ],
  
  // Italian brands
  'Fiat': [
    '/logos/fiat.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/fiat-logo-png-transparent.png'
  ],
  'Alfa Romeo': [
    '/logos/alfaromeo.svg',
    'https://www.carlogos.org/car-logos/alfa-romeo-logo.png'
  ],
  
  // Other brands
  'Skoda': [
    '/logos/skoda.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/skoda-logo-png-transparent.png'
  ],
  'Seat': [
    '/logos/seat.svg',
    'https://www.carlogos.org/car-logos/seat-logo.png'
  ],
  'Mini': [
    '/logos/mini.svg',
    'https://cdn.freebiesupply.com/logos/large/2x/mini-logo-png-transparent.png'
  ]
};

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