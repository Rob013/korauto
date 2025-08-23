// Mock car details data for fallback when APIs fail
// This provides a better UX than showing "blank" error pages

export interface MockCarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  vin?: string;
  mileage?: string;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  images?: string[];
  odometer?: {
    km: number;
    mi: number;
    status: {
      name: string;
    };
  };
  engine?: {
    name: string;
  };
  cylinders?: number;
  drive_wheel?: {
    name: string;
  };
  body_type?: {
    name: string;
  };
  damage?: {
    main: string | null;
    second: string | null;
  };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  seller?: string;
  seller_type?: string;
  sale_date?: string;
  bid?: number;
  buy_now?: number;
  final_bid?: number;
  features?: string[];
  safety_features?: string[];
  comfort_features?: string[];
  performance_rating?: number;
  popularity_score?: number;
  insurance?: any;
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
}

// Sample car details for different makes/models
const mockCarDetailsTemplates: MockCarDetails[] = [
  {
    id: "demo-car-1",
    make: "BMW",
    model: "530i",
    year: 2022,
    price: 45000,
    vin: "WBAJE7C56NCE12345",
    mileage: "25,000",
    transmission: "automatic",
    fuel: "petrol",
    color: "Alpine White",
    condition: "Good",
    lot: "demo-car-1",
    title: "Clean Title",
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&auto=format", 
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&h=600&fit=crop&auto=format"
    ],
    odometer: {
      km: 40234,
      mi: 25000,
      status: { name: "Accurate" }
    },
    engine: {
      name: "2.0L Turbo I4"
    },
    cylinders: 4,
    drive_wheel: {
      name: "Rear Wheel Drive"
    },
    body_type: {
      name: "Sedan"
    },
    damage: {
      main: "Minor scratches",
      second: null
    },
    keys_available: true,
    airbags: "All deployed properly",
    grade_iaai: "4.5",
    seller: "BMW Dealership",
    seller_type: "Dealer",
    sale_date: "2024-08-25",
    bid: 42000,
    buy_now: 45000,
    final_bid: 45000,
    features: [
      "Navigation System",
      "Leather Seats", 
      "Sunroof",
      "Premium Sound System",
      "Parking Sensors"
    ],
    safety_features: [
      "ABS",
      "Electronic Stability Control",
      "Airbags",
      "Lane Departure Warning",
      "Blind Spot Monitoring"
    ],
    comfort_features: [
      "Automatic Climate Control", 
      "Heated Seats",
      "Electric Windows",
      "Electric Mirrors",
      "Cruise Control"
    ],
    performance_rating: 4.5,
    popularity_score: 88,
    details: {
      options: ["Premium Package", "Technology Package", "Sport Package"],
      inspect: {
        engine: { status: "Good", notes: "Well maintained" },
        transmission: { status: "Excellent", notes: "Smooth operation" },
        exterior: { status: "Good", notes: "Minor wear" },
        interior: { status: "Excellent", notes: "Clean condition" }
      }
    },
    location: {
      country: "South Korea",
      city: "Seoul",
      facility: "Seoul Auto Auction"
    }
  },
  {
    id: "demo-car-2", 
    make: "Toyota",
    model: "Camry",
    year: 2021,
    price: 28000,
    vin: "4T1C11AK6MU123456",
    mileage: "35,000",
    transmission: "automatic",
    fuel: "hybrid",
    color: "Magnetic Gray",
    condition: "Excellent",
    lot: "demo-car-2",
    title: "Clean Title",
    images: [
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop&auto=format", 
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&auto=format"
    ],
    odometer: {
      km: 56327,
      mi: 35000,
      status: { name: "Accurate" }
    },
    engine: {
      name: "2.5L Hybrid I4"
    },
    cylinders: 4,
    drive_wheel: {
      name: "Front Wheel Drive"
    },
    body_type: {
      name: "Sedan"
    },
    damage: {
      main: null,
      second: null
    },
    keys_available: true,
    airbags: "All functional",
    grade_iaai: "4.8",
    seller: "Toyota Certified",
    seller_type: "Dealer",
    sale_date: "2024-08-26",
    bid: 26500,
    buy_now: 28000,
    final_bid: 28000,
    features: [
      "Toyota Safety Sense 2.0",
      "Infotainment System",
      "Wireless Charging",
      "Dual-Zone Climate Control"
    ],
    safety_features: [
      "Pre-Collision System",
      "Lane Departure Alert", 
      "Automatic High Beams",
      "Dynamic Radar Cruise Control"
    ],
    comfort_features: [
      "JBL Premium Audio",
      "SofTex Seating",
      "Power Driver Seat",
      "Smart Key System"
    ],
    performance_rating: 4.7,
    popularity_score: 92,
    details: {
      options: ["Hybrid System", "Technology Package"],
      inspect: {
        engine: { status: "Excellent", notes: "Hybrid system working perfectly" },
        transmission: { status: "Excellent", notes: "CVT operating smoothly" },
        exterior: { status: "Excellent", notes: "Like new condition" },
        interior: { status: "Excellent", notes: "No wear visible" }
      }
    },
    location: {
      country: "South Korea", 
      city: "Busan",
      facility: "Busan Auto Center"
    }
  },
  {
    id: "demo-car-3",
    make: "Hyundai",
    model: "Sonata",
    year: 2020,
    price: 22000,
    vin: "KMHL14JA6LA123456", 
    mileage: "45,000",
    transmission: "automatic",
    fuel: "petrol",
    color: "Shimmering Silver",
    condition: "Good",
    lot: "demo-car-3", 
    title: "Clean Title",
    images: [
      "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1607853554439-0069ec0f29b6?w=800&h=600&fit=crop&auto=format"
    ],
    odometer: {
      km: 72420,
      mi: 45000,
      status: { name: "Accurate" }
    },
    engine: {
      name: "2.5L I4"
    },
    cylinders: 4,
    drive_wheel: {
      name: "Front Wheel Drive"
    },
    body_type: {
      name: "Sedan" 
    },
    damage: {
      main: "Door ding",
      second: null
    },
    keys_available: true,
    airbags: "All functional",
    grade_iaai: "4.2",
    seller: "Hyundai Dealer",
    seller_type: "Dealer", 
    sale_date: "2024-08-24",
    bid: 20500,
    buy_now: 22000,
    final_bid: 22000,
    features: [
      "SmartSense Safety Suite",
      "8-inch Display",
      "Android Auto/Apple CarPlay", 
      "Remote Start"
    ],
    safety_features: [
      "Forward Collision-Avoidance Assist",
      "Blind-Spot Collision-Avoidance Assist",
      "Driver Attention Warning",
      "Lane Keeping Assist"
    ],
    comfort_features: [
      "Heated Front Seats",
      "Dual Automatic Temperature Control", 
      "60/40 Split-Folding Rear Seatback",
      "Proximity Key Entry"
    ],
    performance_rating: 4.3,
    popularity_score: 85,
    details: {
      options: ["Convenience Package", "Popular Package"],
      inspect: {
        engine: { status: "Good", notes: "Regular maintenance done" },
        transmission: { status: "Good", notes: "Shifts well" },
        exterior: { status: "Good", notes: "Minor cosmetic issues" }, 
        interior: { status: "Good", notes: "Normal wear for age" }
      }
    },
    location: {
      country: "South Korea",
      city: "Incheon", 
      facility: "Incheon Motors"
    }
  }
];

// Function to get a mock car by ID or return a random one
export const getMockCarDetails = (carId?: string): MockCarDetails => {
  if (carId && carId.startsWith('demo-car-')) {
    const mockCar = mockCarDetailsTemplates.find(car => car.id === carId);
    if (mockCar) return mockCar;
  }
  
  // Return a random mock car if no specific ID matches
  return mockCarDetailsTemplates[Math.floor(Math.random() * mockCarDetailsTemplates.length)];
};

// Function to check if we should use mock data (for development/demo)
export const shouldUseMockData = (): boolean => {
  // Use mock data in development or when APIs are unavailable
  return import.meta.env.DEV || import.meta.env.VITE_USE_MOCK_DATA === 'true';
};

// Function to simulate API delay for mock data
export const simulateApiDelay = async (ms: number = 1000): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms));
};