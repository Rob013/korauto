// Car options constants for filters and forms

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
  hydrogen: 7,
  lpg: 8,
  cng: 9
};

// Transmission options mapping
export const TRANSMISSION_OPTIONS = {
  automatic: 1,
  manual: 2,
  cvt: 3,
  dual_clutch: 4,
  semi_automatic: 5
};

// Body type options mapping
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

// Drive type options for enhanced filtering
export const DRIVE_TYPE_OPTIONS = {
  fwd: 1,    // Front-wheel drive
  rwd: 2,    // Rear-wheel drive  
  awd: 3,    // All-wheel drive
  '4wd': 4   // 4-wheel drive
};

// Engine displacement ranges
export const ENGINE_DISPLACEMENT_OPTIONS = {
  '0.8-1.0': { min: 800, max: 1000 },
  '1.0-1.2': { min: 1000, max: 1200 },
  '1.2-1.4': { min: 1200, max: 1400 },
  '1.4-1.6': { min: 1400, max: 1600 },
  '1.6-1.8': { min: 1600, max: 1800 },
  '1.8-2.0': { min: 1800, max: 2000 },
  '2.0-2.5': { min: 2000, max: 2500 },
  '2.5-3.0': { min: 2500, max: 3000 },
  '3.0-4.0': { min: 3000, max: 4000 },
  '4.0+': { min: 4000, max: 10000 }
};

// Seats count options
export const SEATS_COUNT_OPTIONS = {
  '2': 2,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9+': 9
};

// Accident history options
export const ACCIDENT_HISTORY_OPTIONS = {
  'no_accident': 0,
  '1_minor': 1,
  '2_minor': 2,
  '3_plus': 3,
  'major_accident': 10
};

// Registration type options
export const REGISTRATION_TYPE_OPTIONS = {
  'personal': 1,
  'commercial': 2,
  'lease': 3,
  'rental': 4,
  'government': 5,
  'taxi': 6
};

// Certification options
export const CERTIFICATION_OPTIONS = {
  'manufacturer_certified': 1,
  'dealer_certified': 2,
  'inspection_passed': 3,
  'warranty_included': 4,
  'service_history': 5
};

// Price range presets (in EUR)
export const PRICE_RANGE_PRESETS = [
  { label: 'Under €10,000', min: 0, max: 10000 },
  { label: '€10,000 - €20,000', min: 10000, max: 20000 },
  { label: '€20,000 - €30,000', min: 20000, max: 30000 },
  { label: '€30,000 - €50,000', min: 30000, max: 50000 },
  { label: '€50,000 - €75,000', min: 50000, max: 75000 },
  { label: '€75,000 - €100,000', min: 75000, max: 100000 },
  { label: 'Over €100,000', min: 100000, max: 999999 }
];

// Mileage range presets (in km)
export const MILEAGE_RANGE_PRESETS = [
  { label: 'Under 10,000 km', min: 0, max: 10000 },
  { label: '10,000 - 25,000 km', min: 10000, max: 25000 },
  { label: '25,000 - 50,000 km', min: 25000, max: 50000 },
  { label: '50,000 - 75,000 km', min: 50000, max: 75000 },
  { label: '75,000 - 100,000 km', min: 75000, max: 100000 },
  { label: '100,000 - 150,000 km', min: 100000, max: 150000 },
  { label: 'Over 150,000 km', min: 150000, max: 999999 }
];

// Year range presets  
export const YEAR_RANGE_PRESETS = [
  { label: '2024', min: 2024, max: 2024 },
  { label: '2023', min: 2023, max: 2023 },
  { label: '2022', min: 2022, max: 2022 },
  { label: '2020-2021', min: 2020, max: 2021 },
  { label: '2018-2019', min: 2018, max: 2019 },
  { label: '2015-2017', min: 2015, max: 2017 },
  { label: '2010-2014', min: 2010, max: 2014 },
  { label: 'Before 2010', min: 1980, max: 2009 }
];