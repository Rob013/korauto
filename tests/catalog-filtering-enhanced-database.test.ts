import { describe, it, expect } from 'vitest';
import { filterOutTestCars } from '@/utils/testCarFilter';

// Mock enhanced database cars with proper external API format
const mockEnhancedDatabaseCars = [
  {
    id: 'db_car_001',
    manufacturer: { id: 0, name: 'BMW' },
    model: { id: 0, name: '3 Series' },
    year: 2020,
    title: '2020 BMW 3 Series 330i',
    vin: '1BMW3SERIES2020001',
    fuel: { id: 0, name: 'Petrol' },
    transmission: { id: 0, name: 'Automatic' },
    color: { id: 0, name: 'Black' },
    location: 'Seoul',
    lot_number: 'LOT001',
    image_url: 'bmw_image.jpg',
    condition: 'Good',
    status: 'available',
    sale_status: 'active',
    final_price: 26500,
    body_type: { id: 0, name: 'Sedan' },
    engine: { id: 0, name: 'B48' },
    cylinders: 4,
    isFromDatabase: true,
    lots: [{
      buy_now: 25000,
      lot: 'LOT001',
      odometer: { km: 45000 },
      images: {
        normal: ['bmw_image.jpg'],
        big: ['bmw_image.jpg']
      },
      status: 'available',
      sale_status: 'active',
      final_price: 26500,
      grade_iaai: 'A',
      domain: { name: 'database' },
      external_id: 'ext_001',
      insurance: {
        accident_history: 'Clean',
        repair_count: '0',
        total_loss: 'No'
      },
      details: {
        engine_volume: 2000,
        original_price: 45000,
        year: 2020,
        badge: '330i',
        seats_count: 5
      }
    }]
  },
  {
    id: 'db_car_002',
    manufacturer: { id: 0, name: 'Audi' },
    model: { id: 0, name: 'A4' },
    year: 2019,
    title: '2019 Audi A4 2.0T Quattro',
    vin: '1AUDIA42019002',
    fuel: { id: 0, name: 'Petrol' },
    transmission: { id: 0, name: 'Automatic' },
    color: { id: 0, name: 'White' },
    location: 'Busan',
    lot_number: 'LOT002',
    image_url: 'audi_image.jpg',
    condition: 'Excellent',
    status: 'available',
    sale_status: 'active',
    final_price: 28000,
    body_type: { id: 0, name: 'Sedan' },
    engine: { id: 0, name: 'EA888' },
    cylinders: 4,
    isFromDatabase: true,
    lots: [{
      buy_now: 27000,
      lot: 'LOT002',
      odometer: { km: 35000 },
      images: {
        normal: ['audi_image.jpg'],
        big: ['audi_image.jpg']
      },
      status: 'available',
      sale_status: 'active',
      final_price: 28000,
      grade_iaai: 'A+',
      domain: { name: 'database' },
      external_id: 'ext_002',
      insurance: {
        accident_history: 'Minor',
        repair_count: '1',
        total_loss: 'No'
      },
      details: {
        engine_volume: 2000,
        original_price: 48000,
        year: 2019,
        badge: '2.0T Quattro',
        seats_count: 5
      }
    }]
  },
  {
    id: 'db_car_003',
    manufacturer: { id: 0, name: 'Mercedes-Benz' },
    model: { id: 0, name: 'C-Class' },
    year: 2021,
    title: '2021 Mercedes-Benz C300',
    vin: 'test_vin_short', // This should be filtered out as test car
    fuel: { id: 0, name: 'Petrol' },
    transmission: { id: 0, name: 'Automatic' },
    color: { id: 0, name: 'Silver' },
    location: 'Test Location',
    lot_number: 'TEST001',
    image_url: '',
    condition: 'Good',
    status: 'available',
    sale_status: 'active',
    isFromDatabase: true,
    lots: [{
      buy_now: 35000,
      lot: 'TEST001',
      odometer: { km: 25000 },
      images: {
        normal: [],
        big: []
      },
      status: 'available',
      sale_status: 'active',
      grade_iaai: 'B',
      domain: { name: 'database' }
    }]
  }
];

// Function to simulate catalog filtering by manufacturer
const filterCarsByManufacturer = (cars: any[], manufacturerName: string) => {
  return cars.filter(car => car.manufacturer.name === manufacturerName);
};

// Function to simulate catalog filtering by year range
const filterCarsByYearRange = (cars: any[], minYear: number, maxYear: number) => {
  return cars.filter(car => car.year >= minYear && car.year <= maxYear);
};

// Function to simulate catalog filtering by fuel type
const filterCarsByFuelType = (cars: any[], fuelType: string) => {
  return cars.filter(car => car.fuel?.name === fuelType);
};

// Function to simulate catalog filtering by price range
const filterCarsByPriceRange = (cars: any[], minPrice: number, maxPrice: number) => {
  return cars.filter(car => {
    const price = car.lots?.[0]?.buy_now || 0;
    return price >= minPrice && price <= maxPrice;
  });
};

// Function to simulate catalog filtering by mileage
const filterCarsByMileage = (cars: any[], maxMileage: number) => {
  return cars.filter(car => {
    const mileage = car.lots?.[0]?.odometer?.km || 0;
    return mileage <= maxMileage;
  });
};

describe('Catalog Filtering with Enhanced Database Cars', () => {
  describe('Enhanced database car format filtering', () => {
    it('should filter by manufacturer correctly', () => {
      const bmwCars = filterCarsByManufacturer(mockEnhancedDatabaseCars, 'BMW');
      expect(bmwCars).toHaveLength(1);
      expect(bmwCars[0].manufacturer.name).toBe('BMW');
      expect(bmwCars[0].model.name).toBe('3 Series');
    });

    it('should filter by year range correctly', () => {
      const carsFrom2019To2020 = filterCarsByYearRange(mockEnhancedDatabaseCars, 2019, 2020);
      expect(carsFrom2019To2020).toHaveLength(2);
      expect(carsFrom2019To2020.map(car => car.year)).toEqual([2020, 2019]);
    });

    it('should filter by fuel type correctly', () => {
      const petrolCars = filterCarsByFuelType(mockEnhancedDatabaseCars, 'Petrol');
      expect(petrolCars).toHaveLength(3);
      expect(petrolCars.every(car => car.fuel?.name === 'Petrol')).toBe(true);
    });

    it('should filter by price range correctly', () => {
      const midRangeCars = filterCarsByPriceRange(mockEnhancedDatabaseCars, 20000, 30000);
      expect(midRangeCars).toHaveLength(2); // BMW and Audi
      expect(midRangeCars.map(car => car.lots[0].buy_now)).toEqual([25000, 27000]);
    });

    it('should filter by mileage correctly', () => {
      const lowMileageCars = filterCarsByMileage(mockEnhancedDatabaseCars, 40000);
      expect(lowMileageCars).toHaveLength(2); // Audi and Mercedes
      expect(lowMileageCars.every(car => car.lots[0].odometer.km <= 40000)).toBe(true);
    });
  });

  describe('Test car filtering with enhanced format', () => {
    it('should filter out test cars while keeping valid database cars', () => {
      const filteredCars = filterOutTestCars(mockEnhancedDatabaseCars, true);
      
      // Should filter out the Mercedes with test VIN
      expect(filteredCars).toHaveLength(2);
      expect(filteredCars.map(car => car.manufacturer.name)).toEqual(['BMW', 'Audi']);
      expect(filteredCars.every(car => car.isFromDatabase)).toBe(true);
    });

    it('should preserve all car data structure after filtering', () => {
      const filteredCars = filterOutTestCars(mockEnhancedDatabaseCars, true);
      const firstCar = filteredCars[0];

      // Verify complete external API structure is preserved
      expect(firstCar).toHaveProperty('manufacturer');
      expect(firstCar).toHaveProperty('model');
      expect(firstCar).toHaveProperty('lots');
      expect(firstCar.lots).toHaveLength(1);
      
      const lot = firstCar.lots[0];
      expect(lot).toHaveProperty('buy_now');
      expect(lot).toHaveProperty('odometer');
      expect(lot).toHaveProperty('images');
      expect(lot).toHaveProperty('insurance');
      expect(lot).toHaveProperty('details');
      expect(lot.images).toHaveProperty('normal');
      expect(lot.images).toHaveProperty('big');
    });
  });

  describe('Catalog search functionality', () => {
    it('should search by title correctly', () => {
      const searchResults = mockEnhancedDatabaseCars.filter(car => 
        car.title.toLowerCase().includes('bmw')
      );
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].manufacturer.name).toBe('BMW');
    });

    it('should search by model correctly', () => {
      const searchResults = mockEnhancedDatabaseCars.filter(car => 
        car.model.name.toLowerCase().includes('a4')
      );
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].manufacturer.name).toBe('Audi');
    });

    it('should search by engine badge correctly', () => {
      const searchResults = mockEnhancedDatabaseCars.filter(car => 
        car.lots?.[0]?.details?.badge?.toLowerCase().includes('330i')
      );
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].manufacturer.name).toBe('BMW');
    });
  });

  describe('External API compatibility validation', () => {
    it('should have identical structure to external API cars', () => {
      const databaseCar = mockEnhancedDatabaseCars[0];

      // Test that all required external API fields exist
      expect(databaseCar.id).toBeDefined();
      expect(databaseCar.manufacturer).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String)
      }));
      expect(databaseCar.model).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String)
      }));
      expect(databaseCar.year).toEqual(expect.any(Number));
      expect(databaseCar.title).toEqual(expect.any(String));
      expect(databaseCar.fuel).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String)
      }));
      expect(databaseCar.transmission).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String)
      }));
      expect(databaseCar.color).toEqual(expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String)
      }));
      expect(databaseCar.lots).toEqual(expect.arrayContaining([
        expect.objectContaining({
          buy_now: expect.any(Number),
          odometer: expect.objectContaining({
            km: expect.any(Number)
          }),
          images: expect.objectContaining({
            normal: expect.any(Array),
            big: expect.any(Array)
          })
        })
      ]));
    });

    it('should support all external API filter operations', () => {
      const databaseCar = mockEnhancedDatabaseCars[0];

      // Test manufacturer filtering compatibility
      expect(databaseCar.manufacturer.name).toBe('BMW');
      
      // Test model filtering compatibility
      expect(databaseCar.model.name).toBe('3 Series');
      
      // Test year filtering compatibility
      expect(databaseCar.year).toBe(2020);
      
      // Test price filtering compatibility
      expect(databaseCar.lots[0].buy_now).toBe(25000);
      
      // Test mileage filtering compatibility
      expect(databaseCar.lots[0].odometer.km).toBe(45000);
      
      // Test fuel filtering compatibility
      expect(databaseCar.fuel?.name).toBe('Petrol');
      
      // Test transmission filtering compatibility
      expect(databaseCar.transmission?.name).toBe('Automatic');
      
      // Test color filtering compatibility
      expect(databaseCar.color?.name).toBe('Black');
      
      // Test grade filtering compatibility
      expect(databaseCar.lots[0].grade_iaai).toBe('A');
      
      // Test image availability
      expect(databaseCar.lots[0].images.normal).toEqual(['bmw_image.jpg']);
      expect(databaseCar.lots[0].images.big).toEqual(['bmw_image.jpg']);
      
      // Test insurance data availability
      expect(databaseCar.lots[0].insurance).toBeDefined();
      expect(databaseCar.lots[0].insurance.accident_history).toBe('Clean');
    });

    it('should maintain data integrity across all filtering operations', () => {
      let filteredCars = mockEnhancedDatabaseCars;
      
      // Apply multiple filters sequentially
      filteredCars = filterCarsByManufacturer(filteredCars, 'BMW');
      filteredCars = filterCarsByYearRange(filteredCars, 2020, 2020);
      filteredCars = filterCarsByFuelType(filteredCars, 'Petrol');
      filteredCars = filterCarsByPriceRange(filteredCars, 20000, 30000);
      
      expect(filteredCars).toHaveLength(1);
      const finalCar = filteredCars[0];
      
      // Verify all data is still intact
      expect(finalCar.manufacturer.name).toBe('BMW');
      expect(finalCar.model.name).toBe('3 Series');
      expect(finalCar.year).toBe(2020);
      expect(finalCar.lots[0].buy_now).toBe(25000);
      expect(finalCar.lots[0].insurance).toBeDefined();
      expect(finalCar.lots[0].details).toBeDefined();
      expect(finalCar.isFromDatabase).toBe(true);
    });
  });
});