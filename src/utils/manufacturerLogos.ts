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
  // German brands - Local assets with multiple CDN fallbacks
  'BMW': [
    '/logos/bmw.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/bmw-vector-logo.png'
  ],
  'Mercedes-Benz': [
    '/logos/mercedes.svg',
    'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/mercedes-benz-vector-logo.png'
  ], 
  'Audi': [
    '/logos/audi.svg',
    'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/audi-vector-logo.png'
  ],
  'Volkswagen': [
    '/logos/volkswagen.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/volkswagen-vector-logo.png'
  ],
  'Porsche': [
    '/logos/porsche.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2e/Porsche_logo.svg',
    'https://logoeps.com/wp-content/uploads/2013/03/porsche-vector-logo.png'
  ],
  'Opel': [
    '/logos/opel.svg',
    'https://upload.wikimedia.org/wikipedia/commons/7/7b/Opel_logo_2017.svg'
  ],
  
  // Korean brands
  'Hyundai': [
    '/logos/hyundai.svg',
    'https://upload.wikimedia.org/wikipedia/commons/0/00/Hyundai_logo.svg'
  ],
  'Kia': [
    '/logos/kia.svg',
    'https://upload.wikimedia.org/wikipedia/commons/7/7d/Kia_logo2.svg'
  ],
  'Genesis': [
    '/logos/genesis.svg',
    'https://upload.wikimedia.org/wikipedia/commons/1/1c/Genesis_Motor_logo.svg'
  ],
  
  // Japanese brands
  'Toyota': [
    '/logos/toyota.svg',
    'https://upload.wikimedia.org/wikipedia/commons/5/5c/Toyota_logo.svg'
  ],
  'Honda': [
    '/logos/honda.svg',
    'https://upload.wikimedia.org/wikipedia/commons/7/76/Honda_logo.svg'
  ],
  'Nissan': [
    '/logos/nissan.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg'
  ],
  'Mazda': [
    '/logos/mazda.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/22/Mazda_logo.svg'
  ],
  'Subaru': [
    '/logos/subaru.svg',
    'https://upload.wikimedia.org/wikipedia/commons/0/0c/Subaru_logo.svg'
  ],
  'Mitsubishi': [
    '/logos/mitsubishi.svg',
    'https://upload.wikimedia.org/wikipedia/commons/5/5a/Mitsubishi_logo.svg'
  ],
  'Lexus': [
    '/logos/lexus.svg',
    'https://upload.wikimedia.org/wikipedia/commons/c/ce/Lexus_logo.svg'
  ],
  'Infiniti': [
    '/logos/infiniti.svg',
    'https://upload.wikimedia.org/wikipedia/commons/b/bb/Infiniti_logo_2013.svg'
  ],
  'Acura': [
    '/logos/acura.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/6c/Acura_logo.svg'
  ],
  
  // American brands  
  'Ford': [
    '/logos/ford.svg',
    'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg'
  ],
  'Chevrolet': [
    '/logos/chevrolet.svg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Chevrolet_logo.svg/500px-Chevrolet_logo.svg.png'
  ],
  'Cadillac': [
    '/logos/cadillac.svg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e1/Cadillac_logo.svg'
  ],
  'GMC': [
    '/logos/gmc.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/4c/GMC_logo.svg'
  ],
  'Tesla': [
    '/logos/tesla.svg',
    'https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg'
  ],
  'Chrysler': [
    '/logos/chrysler.svg'
  ],
  'Jeep': [
    '/logos/jeep.svg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e8/Jeep_logo.svg'
  ],
  'Dodge': [
    '/logos/dodge.svg'
  ],
  
  // Luxury/European brands
  'Land Rover': [
    '/logos/landrover.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/60/Land_Rover_logo.svg'
  ],
  'Jaguar': [
    '/logos/jaguar.svg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e8/Jaguar_logo_2012.svg'
  ],
  'Volvo': [
    '/logos/volvo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c1/Volvo_logo_%282014%29.svg'
  ],
  'Ferrari': [
    '/logos/ferrari.svg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c0/Ferrari_Logo.svg'
  ],
  'Lamborghini': [
    '/logos/lamborghini.svg'
  ],
  'Maserati': [
    '/logos/maserati.svg'
  ],
  'Bentley': [
    '/logos/bentley.svg'
  ],
  'Rolls-Royce': [
    '/logos/rollsroyce.svg'
  ],
  'Aston Martin': [
    '/logos/astonmartin.svg'
  ],
  'McLaren': [
    '/logos/mclaren.svg'
  ],
  
  // French brands
  'Peugeot': [
    '/logos/peugeot.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/20/Peugeot_logo.svg'
  ],
  'Renault': [
    '/logos/renault.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/49/Renault_logo.svg'
  ],
  'Citroën': [
    '/logos/citroen.svg'
  ],
  
  // Italian brands
  'Fiat': [
    '/logos/fiat.svg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f4/Fiat_logo.svg'
  ],
  'Alfa Romeo': [
    '/logos/alfaromeo.svg'
  ],
  
  // Other brands
  'Skoda': [
    '/logos/skoda.svg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f7/Škoda_Auto_logo.svg'
  ],
  'Seat': [
    '/logos/seat.svg'
  ],
  'Mini': [
    '/logos/mini.svg',
    'https://upload.wikimedia.org/wikipedia/commons/3/31/Mini_logo.svg'
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