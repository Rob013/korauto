// Enhanced filter options that match Encar.com structure
// This configuration provides exact filter categories similar to Encar

// Body type categories (similar to Encar's vehicle classification)
export const BODY_TYPE_OPTIONS = {
  sedan: { id: 1, label: "Sedan", icon: "🚗" },
  suv: { id: 2, label: "SUV", icon: "🚙" },
  hatchback: { id: 3, label: "Hatchback", icon: "🚗" },
  coupe: { id: 4, label: "Coupe", icon: "🏎️" },
  convertible: { id: 5, label: "Convertible", icon: "🏎️" },
  wagon: { id: 6, label: "Wagon", icon: "🚐" },
  pickup: { id: 7, label: "Pickup", icon: "🛻" },
  van: { id: 8, label: "Van", icon: "🚐" },
  minivan: { id: 9, label: "Minivan", icon: "🚐" },
  other: { id: 10, label: "Other", icon: "🚗" }
};

// Drive type options (drivetrain configurations)
export const DRIVE_TYPE_OPTIONS = {
  fwd: { id: 1, label: "Front-Wheel Drive (FWD)", short: "FWD" },
  rwd: { id: 2, label: "Rear-Wheel Drive (RWD)", short: "RWD" },
  awd: { id: 3, label: "All-Wheel Drive (AWD)", short: "AWD" },
  "4wd": { id: 4, label: "4-Wheel Drive (4WD)", short: "4WD" }
};

// Engine displacement ranges (common in Korean market)
export const ENGINE_DISPLACEMENT_OPTIONS = {
  "under_1000": { id: 1, label: "Under 1.0L", min: 0, max: 999 },
  "1000_1499": { id: 2, label: "1.0L - 1.4L", min: 1000, max: 1499 },
  "1500_1999": { id: 3, label: "1.5L - 1.9L", min: 1500, max: 1999 },
  "2000_2499": { id: 4, label: "2.0L - 2.4L", min: 2000, max: 2499 },
  "2500_2999": { id: 5, label: "2.5L - 2.9L", min: 2500, max: 2999 },
  "3000_3499": { id: 6, label: "3.0L - 3.4L", min: 3000, max: 3499 },
  "3500_plus": { id: 7, label: "3.5L+", min: 3500, max: 9999 }
};

// Accident history categories (important in Korean used car market)
export const ACCIDENT_HISTORY_OPTIONS = {
  none: { id: 1, label: "No Accident History", value: "none" },
  minor: { id: 2, label: "Minor Accidents Only", value: "minor" },
  major: { id: 3, label: "Major Accidents", value: "major" },
  flood: { id: 4, label: "Flood Damage", value: "flood" },
  any: { id: 5, label: "Any Condition", value: "any" }
};

// Popular car brand groupings (Encar style)
export const BRAND_CATEGORIES = {
  korean: {
    label: "Korean Brands",
    brands: ["Hyundai", "Kia", "Genesis", "SsangYong", "Daewoo"]
  },
  german: {
    label: "German Brands", 
    brands: ["BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Porsche", "Opel"]
  },
  japanese: {
    label: "Japanese Brands",
    brands: ["Toyota", "Honda", "Nissan", "Mazda", "Subaru", "Lexus", "Infiniti", "Acura"]
  },
  american: {
    label: "American Brands",
    brands: ["Ford", "Chevrolet", "Cadillac", "Buick", "Chrysler", "Jeep", "Dodge"]
  },
  european: {
    label: "European Brands",
    brands: ["Volvo", "Peugeot", "Renault", "Fiat", "Alfa Romeo", "MINI"]
  }
};

// Price ranges (in EUR, adjusted for Kosovo market)
export const PRICE_RANGES = {
  "under_5000": { id: 1, label: "Under €5,000", min: 0, max: 5000 },
  "5000_10000": { id: 2, label: "€5,000 - €10,000", min: 5000, max: 10000 },
  "10000_15000": { id: 3, label: "€10,000 - €15,000", min: 10000, max: 15000 },
  "15000_20000": { id: 4, label: "€15,000 - €20,000", min: 15000, max: 20000 },
  "20000_30000": { id: 5, label: "€20,000 - €30,000", min: 20000, max: 30000 },
  "30000_50000": { id: 6, label: "€30,000 - €50,000", min: 30000, max: 50000 },
  "50000_plus": { id: 7, label: "€50,000+", min: 50000, max: 999999 }
};

// Mileage ranges (in kilometers)
export const MILEAGE_RANGES = {
  "under_50000": { id: 1, label: "Under 50,000 km", min: 0, max: 50000 },
  "50000_100000": { id: 2, label: "50,000 - 100,000 km", min: 50000, max: 100000 },
  "100000_150000": { id: 3, label: "100,000 - 150,000 km", min: 100000, max: 150000 },
  "150000_200000": { id: 4, label: "150,000 - 200,000 km", min: 150000, max: 200000 },
  "200000_plus": { id: 5, label: "200,000+ km", min: 200000, max: 999999 }
};

// Enhanced color options with Korean preferences
export const ENHANCED_COLOR_OPTIONS = {
  white: { id: 13, label: "White", korean: "흰색", popular: true },
  black: { id: 15, label: "Black", korean: "검정색", popular: true },
  silver: { id: 1, label: "Silver", korean: "은색", popular: true },
  grey: { id: 9, label: "Grey", korean: "회색", popular: true },
  blue: { id: 11, label: "Blue", korean: "파란색", popular: false },
  red: { id: 5, label: "Red", korean: "빨간색", popular: false },
  green: { id: 4, label: "Green", korean: "초록색", popular: false },
  yellow: { id: 16, label: "Yellow", korean: "노란색", popular: false },
  brown: { id: 8, label: "Brown", korean: "갈색", popular: false },
  gold: { id: 6, label: "Gold", korean: "금색", popular: false },
  beige: { id: 17, label: "Beige", korean: "베이지색", popular: false },
  orange: { id: 3, label: "Orange", korean: "주황색", popular: false },
  purple: { id: 2, label: "Purple", korean: "보라색", popular: false }
};

// Enhanced fuel type options
export const ENHANCED_FUEL_OPTIONS = {
  gasoline: { id: 4, label: "Gasoline", korean: "가솔린", eco: false },
  diesel: { id: 1, label: "Diesel", korean: "디젤", eco: false },
  hybrid: { id: 3, label: "Hybrid", korean: "하이브리드", eco: true },
  electric: { id: 2, label: "Electric", korean: "전기", eco: true },
  lpg: { id: 5, label: "LPG", korean: "LPG", eco: true },
  hydrogen: { id: 7, label: "Hydrogen", korean: "수소", eco: true }
};

// Transmission options
export const ENHANCED_TRANSMISSION_OPTIONS = {
  automatic: { id: 1, label: "Automatic", korean: "자동", popular: true },
  manual: { id: 2, label: "Manual", korean: "수동", popular: false },
  cvt: { id: 3, label: "CVT", korean: "CVT", popular: true },
  semi_automatic: { id: 4, label: "Semi-Automatic", korean: "반자동", popular: false }
};