import { describe, it, expect } from 'vitest';
import { fallbackCars } from '@/data/fallbackData';

describe('Car Details Fallback Mechanism', () => {
  it('should have fallback cars available', () => {
    expect(fallbackCars).toBeDefined();
    expect(fallbackCars.length).toBeGreaterThan(0);
  });

  it('should have properly structured fallback car data', () => {
    const firstCar = fallbackCars[0];
    
    expect(firstCar).toHaveProperty('id');
    expect(firstCar).toHaveProperty('title');
    expect(firstCar).toHaveProperty('manufacturer');
    expect(firstCar).toHaveProperty('model');
    expect(firstCar).toHaveProperty('year');
    expect(firstCar).toHaveProperty('price');
    expect(firstCar).toHaveProperty('lot_number');
    expect(firstCar).toHaveProperty('lots');
    
    expect(firstCar.lots).toBeInstanceOf(Array);
    expect(firstCar.lots.length).toBeGreaterThan(0);
  });

  it('should be able to find fallback cars by id', () => {
    const carById = fallbackCars.find(car => car.id === 'fb-car-1');
    expect(carById).toBeDefined();
    expect(carById?.title).toBe('2022 Toyota Camry Hybrid');
  });

  it('should be able to find fallback cars by lot_number', () => {
    const carByLot = fallbackCars.find(car => car.lot_number === 'FB001');
    expect(carByLot).toBeDefined();
    expect(carByLot?.id).toBe('fb-car-1');
  });

  it('should return undefined for non-existent car', () => {
    const nonExistentCar = fallbackCars.find(car => 
      car.id === 'non-existent' || car.lot_number === 'non-existent'
    );
    expect(nonExistentCar).toBeUndefined();
  });
});