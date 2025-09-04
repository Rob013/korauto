// Mock cars data for testing infinite scroll functionality
export interface MockCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  fuel?: string;
  transmission?: string;
  bodyType?: string;
  color?: string;
  location?: string;
  images?: string[];
}

const carMakes = ['Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai', 'Kia'];
export const carModels: Record<string, string[]> = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Prius', 'Highlander'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Fit'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'i3'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'],
  'Audi': ['A3', 'A4', 'A6', 'Q3', 'Q5'],
  'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Jetta', 'Atlas'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona'],
  'Kia': ['Forte', 'Optima', 'Sorento', 'Sportage', 'Soul']
};

const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const transmissions = ['Manual', 'Automatic', 'CVT'];
const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Wagon'];
const colors = ['Black', 'White', 'Silver', 'Gray', 'Blue', 'Red', 'Green'];
const locations = ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Ulsan', 'Daejeon'];

// Seeded random function for deterministic data generation
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate mock cars with deterministic seeded random
export const generateMockCars = (count: number, startId: number = 1): MockCar[] => {
  const cars: MockCar[] = [];
  
  for (let i = 0; i < count; i++) {
    // Use startId + i as seed for deterministic generation
    const seed = startId + i;
    
    const make = carMakes[Math.floor(seededRandom(seed * 1) * carMakes.length)];
    const model = carModels[make][Math.floor(seededRandom(seed * 2) * carModels[make].length)];
    const year = 2015 + Math.floor(seededRandom(seed * 3) * 10); // 2015-2024
    const basePrice = 15000 + Math.floor(seededRandom(seed * 4) * 85000); // 15k-100k
    const mileage = Math.floor(seededRandom(seed * 5) * 200000); // 0-200k km
    
    cars.push({
      id: `car-${startId + i}`,
      make,
      model,
      year,
      price: basePrice,
      mileage,
      fuel: fuelTypes[Math.floor(seededRandom(seed * 6) * fuelTypes.length)],
      transmission: transmissions[Math.floor(seededRandom(seed * 7) * transmissions.length)],
      bodyType: bodyTypes[Math.floor(seededRandom(seed * 8) * bodyTypes.length)],
      color: colors[Math.floor(seededRandom(seed * 9) * colors.length)],
      location: locations[Math.floor(seededRandom(seed * 10) * locations.length)],
      // Use a more realistic image URL pattern that could represent real API data
      // In production, this would be replaced with actual car image URLs from the API
      images: [
        `/api/car-images/${make.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}-${startId + i}-front.jpg`,
        `/api/car-images/${make.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}-${startId + i}-side.jpg`,
        `/api/car-images/${make.toLowerCase()}-${model.toLowerCase().replace(/\s+/g, '-')}-${startId + i}-interior.jpg`
      ]
    });
  }
  
  return cars;
};

// Generate a larger dataset for testing - increased to ensure multiple pages
export const mockCarsDatabase = generateMockCars(2000);

// Mock API response structure
export interface MockCarsResponse {
  cars: MockCar[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Simulate API with filtering, sorting, and pagination
export const mockFetchCars = async (
  filters: any,
  signal?: AbortSignal
): Promise<MockCarsResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }
  
  let filteredCars = [...mockCarsDatabase];
  
  // Apply filters
  if (filters.brand) {
    filteredCars = filteredCars.filter(car => 
      car.make.toLowerCase() === filters.brand.toLowerCase()
    );
  }
  
  if (filters.model) {
    filteredCars = filteredCars.filter(car => 
      car.model.toLowerCase().includes(filters.model.toLowerCase())
    );
  }
  
  if (filters.fuel) {
    filteredCars = filteredCars.filter(car => 
      car.fuel?.toLowerCase() === filters.fuel.toLowerCase()
    );
  }
  
  if (filters.yearMin) {
    filteredCars = filteredCars.filter(car => car.year >= parseInt(filters.yearMin));
  }
  
  if (filters.yearMax) {
    filteredCars = filteredCars.filter(car => car.year <= parseInt(filters.yearMax));
  }
  
  if (filters.priceMin) {
    filteredCars = filteredCars.filter(car => car.price >= parseInt(filters.priceMin));
  }
  
  if (filters.priceMax) {
    filteredCars = filteredCars.filter(car => car.price <= parseInt(filters.priceMax));
  }
  
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredCars = filteredCars.filter(car => 
      car.make.toLowerCase().includes(searchTerm) ||
      car.model.toLowerCase().includes(searchTerm) ||
      car.color?.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply sorting
  const sortBy = filters.sort || 'price_asc';
  switch (sortBy) {
    case 'price_asc':
      filteredCars.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filteredCars.sort((a, b) => b.price - a.price);
      break;
    case 'year_desc':
      filteredCars.sort((a, b) => b.year - a.year);
      break;
    case 'year_asc':
      filteredCars.sort((a, b) => a.year - b.year);
      break;
    case 'mileage_asc':
      filteredCars.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      break;
    case 'mileage_desc':
      filteredCars.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
      break;
    case 'recently_added':
    default:
      // Keep original order (simulates recently added)
      break;
  }
  
  // Apply pagination
  const page = parseInt(filters.page || '1');
  const pageSize = parseInt(filters.pageSize || '20');
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCars = filteredCars.slice(startIndex, endIndex);
  
  const totalPages = Math.ceil(filteredCars.length / pageSize);
  const hasMore = page < totalPages;
  
  return {
    cars: paginatedCars,
    total: filteredCars.length,
    page,
    totalPages,
    hasMore
  };
};