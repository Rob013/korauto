// Car options constants for filters and forms - Enhanced for Encar.com compatibility

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

// Enhanced fuel type options with more options like Encar
export const FUEL_TYPE_OPTIONS = {
  gasoline: 1,
  diesel: 2,
  hybrid: 3,
  electric: 4,
  lpg: 5,
  cng: 6,
  hydrogen: 7,
  flexible: 8,
  plug_in_hybrid: 9
};

// Enhanced transmission options
export const TRANSMISSION_OPTIONS = {
  automatic: 1,
  manual: 2,
  cvt: 3,
  dual_clutch: 4,
  semi_automatic: 5
};

// Enhanced body type options matching Encar categories
export const BODY_TYPE_OPTIONS = {
  sedan: 1,
  suv: 2,
  hatchback: 3,
  coupe: 4,
  convertible: 5,
  wagon: 6,
  truck: 7,
  van: 8,
  crossover: 9,
  compact: 10,
  luxury: 11,
  sports: 12,
  minivan: 13,
  pickup: 14,
  roadster: 15
};

// Additional filter options for comprehensive filtering
export const DRIVETRAIN_OPTIONS = {
  fwd: 1, // Front-wheel drive
  rwd: 2, // Rear-wheel drive
  awd: 3, // All-wheel drive
  '4wd': 4 // Four-wheel drive
};

export const ENGINE_SIZE_OPTIONS = {
  'under_1000': 1,
  '1000_1500': 2,
  '1500_2000': 3,
  '2000_2500': 4,
  '2500_3000': 5,
  '3000_4000': 6,
  'over_4000': 7
};

export const CONDITION_OPTIONS = {
  excellent: 1,
  very_good: 2,
  good: 3,
  fair: 4,
  poor: 5,
  damaged: 6
};

export const LOCATION_OPTIONS = {
  seoul: 1,
  busan: 2,
  incheon: 3,
  daegu: 4,
  daejeon: 5,
  gwangju: 6,
  ulsan: 7,
  sejong: 8,
  gyeonggi: 9,
  gangwon: 10,
  chungbuk: 11,
  chungnam: 12,
  jeonbuk: 13,
  jeonnam: 14,
  gyeongbuk: 15,
  gyeongnam: 16,
  jeju: 17
};

// Mileage range presets
export const MILEAGE_PRESETS = [
  { label: 'Under 10,000 km', min: 0, max: 10000 },
  { label: '10,000 - 30,000 km', min: 10000, max: 30000 },
  { label: '30,000 - 50,000 km', min: 30000, max: 50000 },
  { label: '50,000 - 100,000 km', min: 50000, max: 100000 },
  { label: '100,000 - 150,000 km', min: 100000, max: 150000 },
  { label: 'Over 150,000 km', min: 150000, max: 999999 }
];

// Price range presets in EUR (converted from KRW)
export const PRICE_PRESETS = [
  { label: 'Under €10,000', min: 0, max: 10000 },
  { label: '€10,000 - €20,000', min: 10000, max: 20000 },
  { label: '€20,000 - €30,000', min: 20000, max: 30000 },
  { label: '€30,000 - €50,000', min: 30000, max: 50000 },
  { label: '€50,000 - €100,000', min: 50000, max: 100000 },
  { label: 'Over €100,000', min: 100000, max: 999999 }
];

// Popular Korean car manufacturers with their typical models
export const KOREAN_MANUFACTURERS = {
  hyundai: {
    id: 1,
    name: 'Hyundai',
    models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Genesis', 'Ioniq', 'Kona', 'Veloster']
  },
  kia: {
    id: 2, 
    name: 'Kia',
    models: ['Optima', 'Sportage', 'Sorento', 'Rio', 'Soul', 'Stinger', 'Niro', 'Telluride']
  },
  genesis: {
    id: 3,
    name: 'Genesis',
    models: ['G70', 'G80', 'G90', 'GV70', 'GV80']
  },
  ssangyong: {
    id: 4,
    name: 'SsangYong',
    models: ['Tivoli', 'Korando', 'Rexton', 'Musso']
  }
};

// International manufacturers commonly available in Korea
export const INTERNATIONAL_MANUFACTURERS = {
  bmw: {
    id: 5,
    name: 'BMW',
    models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i8']
  },
  mercedes: {
    id: 6,
    name: 'Mercedes-Benz', 
    models: ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'S-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'AMG GT']
  },
  audi: {
    id: 7,
    name: 'Audi',
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron']
  },
  toyota: {
    id: 8,
    name: 'Toyota',
    models: ['Corolla', 'Camry', 'Avalon', 'Prius', 'RAV4', 'Highlander', 'Land Cruiser', 'Sienna']
  },
  honda: {
    id: 9,
    name: 'Honda',
    models: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Passport', 'Ridgeline']
  },
  volkswagen: {
    id: 10,
    name: 'Volkswagen',
    models: ['Golf', 'Jetta', 'Passat', 'Tiguan', 'Atlas', 'Arteon', 'ID.4']
  }
};