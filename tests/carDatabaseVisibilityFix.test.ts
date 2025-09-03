import { describe, it, expect } from 'vitest';
import { isTestCar, filterOutTestCars } from '../src/utils/testCarFilter';

describe('Car Database Visibility Fix', () => {
  describe('isTestCar function', () => {
    it('should allow database cars without images', () => {
      const databaseCar = {
        id: "1",
        title: "2020 BMW 3 Series",
        year: 2020,
        manufacturer: { name: "BMW" },
        model: { name: "3 Series" },
        vin: "",
        lot_number: "LOT123456",
        lots: [{
          buy_now: 25000,
          images: { normal: [] }, // No images but should pass for database cars
          odometer: { km: 50000 }
        }],
        fuel: { name: "Petrol" },
        transmission: { name: "Automatic" },
        color: { name: "Black" },
        location: "Seoul"
      };

      expect(isTestCar(databaseCar, true)).toBe(false); // Database car should pass
      expect(isTestCar(databaseCar, false)).toBe(true); // External API car should fail
    });

    it('should allow Nissan Altima cars without test indicators', () => {
      const altimaCar = {
        id: "2", 
        title: "2019 Nissan Altima",
        year: 2019,
        manufacturer: { name: "Nissan" },
        model: { name: "Altima" },
        vin: "1N4AL3AP1KC123456",
        lot_number: "LOT789012",
        lots: [{
          buy_now: 18000,
          images: { normal: ["image1.jpg"] },
          odometer: { km: 75000 }
        }],
        fuel: { name: "Petrol" },
        transmission: { name: "CVT" },
        color: { name: "White" },
        location: "Busan"
      };

      expect(isTestCar(altimaCar, true)).toBe(false); // Should pass - legitimate Altima
      expect(isTestCar(altimaCar, false)).toBe(false); // Should pass - has images
    });

    it('should still filter Altima cars with test indicators', () => {
      const testAltimaCar = {
        id: "3",
        title: "2019 Nissan Altima Test Vehicle",
        year: 2019,
        manufacturer: { name: "Nissan" },
        model: { name: "Altima" },
        vin: "1N4AL3AP1KC123456",
        lot_number: "LOT789012",
        lots: [{
          buy_now: 18000,
          images: { normal: ["image1.jpg"] },
          odometer: { km: 75000 }
        }],
        fuel: { name: "Petrol" },
        transmission: { name: "CVT" },
        color: { name: "White" },
        location: "Busan"
      };

      expect(isTestCar(testAltimaCar, true)).toBe(true); // Should be filtered - has "test"
      expect(isTestCar(testAltimaCar, false)).toBe(true); // Should be filtered - has "test"
    });

    it('should allow database cars with empty VIN', () => {
      const carWithoutVin = {
        id: "4",
        title: "2021 Toyota Camry",
        year: 2021,
        manufacturer: { name: "Toyota" },
        model: { name: "Camry" },
        vin: "", // Empty VIN should be OK for database cars
        lot_number: "LOT345678",
        lots: [{
          buy_now: 22000,
          images: { normal: ["image1.jpg"] },
          odometer: { km: 30000 }
        }],
        fuel: { name: "Petrol" },
        transmission: { name: "Automatic" },
        color: { name: "Silver" },
        location: "Seoul"
      };

      expect(isTestCar(carWithoutVin, true)).toBe(false); // Database car should pass
      expect(isTestCar(carWithoutVin, false)).toBe(true); // External API car should fail (VIN too short)
    });
  });

  describe('filterOutTestCars function', () => {
    it('should auto-detect database cars and use appropriate filtering', () => {
      const mixedCars = [
        {
          id: "1",
          title: "2020 BMW 3 Series",
          year: 2020,
          manufacturer: { name: "BMW" },
          model: { name: "3 Series" },
          isFromDatabase: true, // Database flag
          lots: [{ buy_now: 25000, images: { normal: [] } }]
        },
        {
          id: "2",
          title: "2019 Nissan Altima",
          year: 2019,
          manufacturer: { name: "Nissan" },
          model: { name: "Altima" },
          isFromDatabase: true, // Database flag
          lots: [{ buy_now: 18000, images: { normal: ["img.jpg"] } }]
        }
      ];

      const filtered = filterOutTestCars(mixedCars);
      expect(filtered).toHaveLength(2); // Both should pass as database cars
    });

    it('should filter more strictly for external API cars', () => {
      const externalApiCars = [
        {
          id: "1",
          title: "2020 BMW 3 Series",
          year: 2020,
          manufacturer: { name: "BMW" },
          model: { name: "3 Series" },
          vin: "short", // VIN too short
          // No isFromDatabase flag = external API car
          lots: [{ buy_now: 25000, images: { normal: [] } }] // No images
        },
        {
          id: "2",
          title: "2019 Nissan Altima",
          year: 2019,
          manufacturer: { name: "Nissan" },
          model: { name: "Altima" },
          vin: "1N4AL3AP1KC123456", // Valid VIN
          // No isFromDatabase flag = external API car  
          lots: [{ buy_now: 18000, images: { normal: ["img.jpg"] } }] // Has images
        }
      ];

      const filtered = filterOutTestCars(externalApiCars);
      expect(filtered).toHaveLength(1); // Only the Altima with valid data should pass
      expect(filtered[0].title).toContain("Altima"); // Should be the Altima
    });
  });
});