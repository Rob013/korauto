import { describe, it, expect } from 'vitest';
import { isTestCar, filterOutTestCars } from '../src/utils/testCarFilter';

describe('testCarFilter', () => {
  describe('isTestCar', () => {
    it('should not filter out legitimate cars with Elite trim', () => {
      const car = {
        id: 1,
        title: '2020 BMW X5 Elite Package',
        manufacturer: { name: 'BMW' },
        model: { name: 'X5' },
        year: 2020,
        lots: [{
          buy_now: 45000,
          images: { normal: ['image1.jpg'] }
        }],
        vin: 'WBAHW92F8XC123456'
      };
      
      expect(isTestCar(car)).toBe(false);
    });

    it('should not filter out Nissan Altima cars', () => {
      const car = {
        id: 2,
        title: '2019 Nissan Altima SV',
        manufacturer: { name: 'Nissan' },
        model: { name: 'Altima' },
        year: 2019,
        lots: [{
          buy_now: 25000,
          images: { normal: ['image1.jpg'] }
        }],
        vin: '1N4AL3AP5KC123456'
      };
      
      expect(isTestCar(car)).toBe(false);
    });

    it('should not filter out cars with lot numbers', () => {
      const car = {
        id: 3,
        title: '2021 Mercedes C-Class',
        manufacturer: { name: 'Mercedes-Benz' },
        model: { name: 'C-Class' },
        year: 2021,
        lot_number: 'LOT12345',
        lots: [{
          buy_now: 35000,
          images: { normal: ['image1.jpg'] }
        }],
        vin: 'WDD2053021N123456'
      };
      
      expect(isTestCar(car)).toBe(false);
    });

    it('should not filter out cars without images', () => {
      const car = {
        id: 4,
        title: '2020 Toyota Camry',
        manufacturer: { name: 'Toyota' },
        model: { name: 'Camry' },
        year: 2020,
        lots: [{
          buy_now: 28000,
          images: { normal: [] } // No images
        }],
        vin: '4T1BZ1FK5LU123456'
      };
      
      expect(isTestCar(car)).toBe(false);
    });

    it('should allow cars with expanded price range', () => {
      // Car with low price (should be allowed now)
      const lowPriceCar = {
        id: 5,
        title: '2010 Hyundai Accent',
        manufacturer: { name: 'Hyundai' },
        model: { name: 'Accent' },
        year: 2010,
        lots: [{
          buy_now: 500, // Low price but above 100
          images: { normal: ['image1.jpg'] }
        }],
        vin: 'KMHCN46C8AU123456'
      };
      
      expect(isTestCar(lowPriceCar)).toBe(false);

      // Car with high price (should be allowed now)
      const highPriceCar = {
        id: 6,
        title: '2023 Ferrari SF90',
        manufacturer: { name: 'Ferrari' },
        model: { name: 'SF90' },
        year: 2023,
        lots: [{
          buy_now: 750000, // High price but below 1M
          images: { normal: ['image1.jpg'] }
        }],
        vin: 'ZFF4H35A1N0123456'
      };
      
      expect(isTestCar(highPriceCar)).toBe(false);
    });

    it('should still filter out obvious test cars', () => {
      const testCar = {
        id: 7,
        title: '2020 Test Car Sample Vehicle',
        manufacturer: { name: 'Test Vehicle' },
        model: { name: 'Demo Vehicle' },
        year: 2020,
        lots: [{
          buy_now: 25000,
          images: { normal: ['image1.jpg'] }
        }],
        vin: 'TESTVIN123456789'
      };
      
      expect(isTestCar(testCar)).toBe(true);
    });

    it('should filter out cars with extremely unrealistic pricing', () => {
      const extremelyLowPrice = {
        id: 8,
        title: '2020 BMW X5',
        manufacturer: { name: 'BMW' },
        model: { name: 'X5' },
        year: 2020,
        lots: [{
          buy_now: 50, // Too low
          images: { normal: ['image1.jpg'] }
        }],
        vin: 'WBAHW92F8XC123456'
      };
      
      expect(isTestCar(extremelyLowPrice)).toBe(true);

      const extremelyHighPrice = {
        id: 9,
        title: '2020 Toyota Corolla',
        manufacturer: { name: 'Toyota' },
        model: { name: 'Corolla' },
        year: 2020,
        lots: [{
          buy_now: 1500000, // Too high
          images: { normal: ['image1.jpg'] }
        }],
        vin: '2T1BURHE5LC123456'
      };
      
      expect(isTestCar(extremelyHighPrice)).toBe(true);
    });

    it('should allow cars with partial missing data', () => {
      const carWithSomeData = {
        id: 10,
        title: '2020 Unknown Car', // Has title
        // manufacturer: missing but has title
        year: 2020,
        lots: [{
          buy_now: 25000,
          images: { normal: ['image1.jpg'] }
        }],
        vin: 'UNKNOWN123456789'
      };
      
      expect(isTestCar(carWithSomeData)).toBe(false);
    });
  });

  describe('filterOutTestCars', () => {
    it('should filter out test cars but keep legitimate ones', () => {
      const cars = [
        {
          id: 1,
          title: '2020 BMW X5 Elite',
          manufacturer: { name: 'BMW' },
          model: { name: 'X5' },
          year: 2020,
          lots: [{ buy_now: 45000, images: { normal: ['image1.jpg'] } }],
          vin: 'WBAHW92F8XC123456'
        },
        {
          id: 2,
          title: '2020 Test Car Sample',
          manufacturer: { name: 'Test' },
          model: { name: 'Test' },
          year: 2020,
          lots: [{ buy_now: 25000, images: { normal: ['image1.jpg'] } }],
          vin: 'TESTVIN123456789'
        },
        {
          id: 3,
          title: '2019 Nissan Altima',
          manufacturer: { name: 'Nissan' },
          model: { name: 'Altima' },
          year: 2019,
          lots: [{ buy_now: 22000, images: { normal: ['image1.jpg'] } }],
          vin: '1N4AL3AP5KC123456'
        }
      ];

      const filtered = filterOutTestCars(cars);
      
      expect(filtered).toHaveLength(2); // Should keep BMW and Nissan
      expect(filtered.map(car => car.id)).toEqual([1, 3]);
    });
  });
});