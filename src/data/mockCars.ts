// Centralized mock car data to reduce duplication across components and hooks

export interface MockCar {
  id: number;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
  generation?: { id: number; name: string };
  year: number;
  title: string;
  color: string;
  fuel_type: string;
  transmission: string;
  body_type: string;
  odometer: { km: number };
  buy_now: number;
  images: { normal: string[] };
  status: string;
  location: string;
  trim_level?: string;
  grade_iaai?: string;
  seats_count?: number;
  accidents_count?: number;
}

export const MOCK_CARS: MockCar[] = [
  {
    id: 1001,
    manufacturer: { id: 9, name: 'BMW' },
    model: { id: 101, name: '3 Series' },
    generation: { id: 1001, name: 'E90/E91/E92/E93' },
    year: 2010,
    title: '2010 BMW 3 Series E90',
    color: 'Black',
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    body_type: 'Sedan',
    odometer: { km: 85000 },
    buy_now: 15000,
    images: { normal: ['/images/bmw-3-series-demo.jpg'] },
    status: 'Available',
    location: 'South Korea',
    trim_level: '325i',
    grade_iaai: 'B',
    seats_count: 5,
    accidents_count: 0
  },
  {
    id: 1002,
    manufacturer: { id: 9, name: 'BMW' },
    model: { id: 101, name: '3 Series' },
    generation: { id: 1002, name: 'F30/F31/F34/F35' },
    year: 2015,
    title: '2015 BMW 3 Series F30',
    color: 'White',
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    body_type: 'Sedan',
    odometer: { km: 65000 },
    buy_now: 22000,
    images: { normal: ['/images/bmw-3-series-f30-demo.jpg'] },
    status: 'Available',
    location: 'South Korea',
    trim_level: '320i',
    grade_iaai: 'A',
    seats_count: 5,
    accidents_count: 0
  },
  {
    id: 1003,
    manufacturer: { id: 1, name: 'Audi' },
    model: { id: 201, name: 'A6' },
    generation: { id: 2001, name: 'C7' },
    year: 2016,
    title: '2016 Audi A6 C7',
    color: 'Gray',
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    body_type: 'Sedan',
    odometer: { km: 75000 },
    buy_now: 18500,
    images: { normal: ['/images/audi-a6-demo.jpg'] },
    status: 'Available',
    location: 'South Korea',
    trim_level: '2.0T',
    grade_iaai: 'B',
    seats_count: 5,
    accidents_count: 1
  },
  {
    id: 1004,
    manufacturer: { id: 16, name: 'Mercedes-Benz' },
    model: { id: 301, name: 'C-Class' },
    generation: { id: 3001, name: 'W204' },
    year: 2012,
    title: '2012 Mercedes-Benz C-Class W204',
    color: 'Silver',
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    body_type: 'Sedan',
    odometer: { km: 90000 },
    buy_now: 16000,
    images: { normal: ['/images/mercedes-c-class-demo.jpg'] },
    status: 'Available',
    location: 'South Korea',
    trim_level: 'C250',
    grade_iaai: 'B',
    seats_count: 5,
    accidents_count: 0
  },
  {
    id: 1005,
    manufacturer: { id: 20, name: 'Toyota' },
    model: { id: 401, name: 'Camry' },
    year: 2018,
    title: '2018 Toyota Camry',
    color: 'Red',
    fuel_type: 'Gasoline',
    transmission: 'Automatic',
    body_type: 'Sedan',
    odometer: { km: 45000 },
    buy_now: 19500,
    images: { normal: ['/images/toyota-camry-demo.jpg'] },
    status: 'Available',
    location: 'South Korea',
    trim_level: 'LE',
    grade_iaai: 'A',
    seats_count: 5,
    accidents_count: 0
  }
];

// Filter mock cars based on provided filters
export const filterMockCars = (filters: any = {}): MockCar[] => {
  let cars = [...MOCK_CARS];

  if (filters.manufacturer_id) {
    cars = cars.filter(car => car.manufacturer.id === filters.manufacturer_id);
  }

  if (filters.year_from) {
    cars = cars.filter(car => car.year >= filters.year_from);
  }

  if (filters.year_to) {
    cars = cars.filter(car => car.year <= filters.year_to);
  }

  if (filters.price_from) {
    cars = cars.filter(car => car.buy_now >= filters.price_from);
  }

  if (filters.price_to) {
    cars = cars.filter(car => car.buy_now <= filters.price_to);
  }

  return cars;
};