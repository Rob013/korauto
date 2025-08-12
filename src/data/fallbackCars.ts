// Fallback car data for development when Supabase is unavailable
// This provides a working catalog experience without requiring database setup

export interface FallbackCar {
  id: string;
  external_id?: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  title?: string;
  vin?: string;
  color?: string;
  fuel?: string;
  transmission?: string;
  condition?: string;
  location?: string;
  lot_number?: string;
  current_bid?: number;
  buy_now_price?: number;
  final_bid?: number;
  sale_date?: string;
  image_url?: string;
  images?: string;
  source_api?: string;
  domain_name?: string;
  status?: string;
  is_live?: boolean;
  keys_available?: boolean;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string;
  is_active?: boolean;
}

export const fallbackCars: FallbackCar[] = [
  {
    id: "1",
    external_id: "1",
    make: "Hyundai",
    model: "Sonata",
    year: 2022,
    price: 25000,
    mileage: 35000,
    title: "2022 Hyundai Sonata SEL",
    vin: "KMHL14AA1NA123456",
    color: "White",
    fuel: "Gasoline",
    transmission: "Automatic",
    condition: "Good",
    location: "Seoul, South Korea",
    lot_number: "KR001",
    current_bid: 23000,
    buy_now_price: 25000,
    image_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development",
    status: "active",
    is_live: true,
    keys_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  },
  {
    id: "2",
    external_id: "2",
    make: "Kia",
    model: "Optima",
    year: 2021,
    price: 22000,
    mileage: 42000,
    title: "2021 Kia Optima LX",
    vin: "KNAGM4A79B5234567",
    color: "Black",
    fuel: "Gasoline",
    transmission: "Automatic",
    condition: "Excellent",
    location: "Busan, South Korea",
    lot_number: "KR002",
    current_bid: 20000,
    buy_now_price: 22000,
    image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development", 
    status: "active",
    is_live: true,
    keys_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  },
  {
    id: "3",
    external_id: "3",
    make: "Genesis",
    model: "G90",
    year: 2023,
    price: 45000,
    mileage: 15000,
    title: "2023 Genesis G90 3.3T Premium",
    vin: "KMHG14LA2PA345678",
    color: "Silver",
    fuel: "Gasoline",
    transmission: "Automatic",
    condition: "Excellent",
    location: "Seoul, South Korea",
    lot_number: "KR003",
    current_bid: 42000,
    buy_now_price: 45000,
    image_url: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development",
    status: "active",
    is_live: true,
    keys_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  },
  {
    id: "4",
    external_id: "4",
    make: "Hyundai",
    model: "Elantra",
    year: 2020,
    price: 18000,
    mileage: 55000,
    title: "2020 Hyundai Elantra SE",
    vin: "KMHL14AA6LA456789",
    color: "Blue",
    fuel: "Gasoline",
    transmission: "Manual",
    condition: "Good",
    location: "Incheon, South Korea",
    lot_number: "KR004",
    current_bid: 16500,
    buy_now_price: 18000,
    image_url: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development",
    status: "active",
    is_live: true,
    keys_available: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  },
  {
    id: "5",
    external_id: "5",
    make: "Kia",
    model: "Sorento",
    year: 2022,
    price: 32000,
    mileage: 28000,
    title: "2022 Kia Sorento S",
    vin: "5XYP34HC0NG567890",
    color: "Red",
    fuel: "Gasoline",
    transmission: "Automatic",
    condition: "Very Good",
    location: "Daegu, South Korea",
    lot_number: "KR005",
    current_bid: 30000,
    buy_now_price: 32000,
    image_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development",
    status: "active",
    is_live: true,
    keys_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  },
  {
    id: "6",
    external_id: "6",
    make: "Genesis",
    model: "GV70",
    year: 2023,
    price: 48000,
    mileage: 12000,
    title: "2023 Genesis GV70 2.5T Advanced",
    vin: "KMHGC4DD0PA678901",
    color: "White",
    fuel: "Gasoline",
    transmission: "Automatic", 
    condition: "Excellent",
    location: "Seoul, South Korea",
    lot_number: "KR006",
    current_bid: 45000,
    buy_now_price: 48000,
    image_url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development",
    status: "active",
    is_live: true,
    keys_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  },
  {
    id: "7",
    external_id: "7",
    make: "Hyundai",
    model: "Tucson",
    year: 2021,
    price: 28000,
    mileage: 38000,
    title: "2021 Hyundai Tucson SEL",
    vin: "KM8J3CAL8MU789012",
    color: "Gray",
    fuel: "Gasoline",
    transmission: "Automatic",
    condition: "Good",
    location: "Gwangju, South Korea",
    lot_number: "KR007",
    current_bid: 26000,
    buy_now_price: 28000,
    image_url: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development",
    status: "active",
    is_live: true,
    keys_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  },
  {
    id: "8",
    external_id: "8",
    make: "Kia",
    model: "Stinger",
    year: 2022,
    price: 35000,
    mileage: 22000,
    title: "2022 Kia Stinger GT",
    vin: "KNAE24BA4N8890123",
    color: "Black",
    fuel: "Gasoline", 
    transmission: "Automatic",
    condition: "Excellent",
    location: "Seoul, South Korea",
    lot_number: "KR008",
    current_bid: 33000,
    buy_now_price: 35000,
    image_url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop",
    source_api: "fallback",
    domain_name: "development",
    status: "active",
    is_live: true,
    keys_available: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  }
];

export const getFallbackCars = (page: number = 1, limit: number = 50, filters?: any): { data: FallbackCar[], totalCount: number } => {
  let filteredCars = [...fallbackCars];

  // Apply search filter if provided
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredCars = filteredCars.filter(car => 
      car.make.toLowerCase().includes(searchTerm) ||
      car.model.toLowerCase().includes(searchTerm) ||
      car.title?.toLowerCase().includes(searchTerm) ||
      car.vin?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply make filter if provided
  if (filters?.make?.length) {
    filteredCars = filteredCars.filter(car => 
      filters.make.includes(car.make)
    );
  }

  // Apply model filter if provided
  if (filters?.model?.length) {
    filteredCars = filteredCars.filter(car => 
      filters.model.includes(car.model)
    );
  }

  // Apply year filters if provided
  if (filters?.yearFrom) {
    filteredCars = filteredCars.filter(car => car.year >= filters.yearFrom);
  }
  if (filters?.yearTo) {
    filteredCars = filteredCars.filter(car => car.year <= filters.yearTo);
  }

  // Apply price filters if provided
  if (filters?.priceFrom) {
    filteredCars = filteredCars.filter(car => car.price >= filters.priceFrom);
  }
  if (filters?.priceTo) {
    filteredCars = filteredCars.filter(car => car.price <= filters.priceTo);
  }

  // Apply mileage filters if provided
  if (filters?.mileageFrom) {
    filteredCars = filteredCars.filter(car => (car.mileage || 0) >= filters.mileageFrom);
  }
  if (filters?.mileageTo) {
    filteredCars = filteredCars.filter(car => (car.mileage || 0) <= filters.mileageTo);
  }

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedCars = filteredCars.slice(startIndex, endIndex);

  return {
    data: paginatedCars,
    totalCount: filteredCars.length
  };
};