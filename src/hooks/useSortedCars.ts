//@ts-nocheck
import { useMemo } from 'react';
import { filterCarsWithRealPricing } from '@/utils/carPricing';

export type SortOption = 'recently_added' | 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'mileage_low' | 'mileage_high' | 'make_az' | 'make_za' | 'popular';

// Use a generic type that works with both secure API cars and other car types
interface FlexibleCar {
  id: string;
  manufacturer?: { name: string };
  model?: { name: string };
  year: number;
  vin?: string;
  transmission?: { name: string };
  fuel?: { name: string };
  color?: { name: string };
  condition?: string;
  lot_number?: string;
  title?: string;
  status?: number | string; // Allow both to handle different API types
  sale_status?: string;
  final_price?: number;
  generation?: { name: string };
  body_type?: { name: string };
  engine?: { name: string };
  drive_wheel?: string;
  vehicle_type?: { name: string };
  cylinders?: number;
  lots?: Array<{
    buy_now?: number;
    odometer?: { km?: number };
    popularity_score?: number;
    images?: { 
      normal?: string[];
      big?: string[];
    };
    bid?: number;
    lot?: string;
    status?: string | number;
    sale_status?: string;
    final_price?: number;
    estimate_repair_price?: number;
    pre_accident_price?: number;
    clean_wholesale_price?: number;
    actual_cash_value?: number;
    sale_date?: string;
    seller?: string;
    seller_type?: string;
    detailed_title?: string;
    damage?: {
      main?: string;
      second?: string;
    };
    keys_available?: boolean;
    airbags?: string;
    grade_iaai?: string;
    domain?: { name: string };
    external_id?: string;
  }>;
  popularity_score?: number;
}

export const useSortedCars = (cars: FlexibleCar[], sortBy: SortOption) => {
  return useMemo(() => {
    if (!cars || cars.length === 0) return [];

    // Filter out cars without real pricing data first
    const carsWithRealPricing = filterCarsWithRealPricing(cars);

    const sorted = [...carsWithRealPricing].sort((a, b) => {
      const aLot = a.lots?.[0];
      const bLot = b.lots?.[0];
      // Since we've filtered for cars with real pricing, we can use actual prices or fallback safely
      const aPrice = aLot?.buy_now || aLot?.final_bid || aLot?.price || 0;
      const bPrice = bLot?.buy_now || bLot?.final_bid || bLot?.price || 0;

      switch (sortBy) {
        case 'recently_added': {
          // Sort by sale_date if available, otherwise by ID (assuming newer IDs = more recent)
          const aDate = aLot?.sale_date ? new Date(aLot.sale_date).getTime() : parseInt(a.id) || 0;
          const bDate = bLot?.sale_date ? new Date(bLot.sale_date).getTime() : parseInt(b.id) || 0;
          return bDate - aDate; // Most recent first
        }
        
        case 'price_low':
          return aPrice - bPrice;
        
        case 'price_high':
          return bPrice - aPrice;
        
        case 'year_new':
          return b.year - a.year;
        
        case 'year_old':
          return a.year - b.year;
        
        case 'mileage_low': {
          const aMileage = aLot?.odometer?.km || 999999;
          const bMileage = bLot?.odometer?.km || 999999;
          return aMileage - bMileage;
        }
        
        case 'mileage_high': {
          const aMileageHigh = aLot?.odometer?.km || 0;
          const bMileageHigh = bLot?.odometer?.km || 0;
          return bMileageHigh - aMileageHigh;
        }
        
        case 'make_az': {
          const aMake = a.manufacturer?.name || '';
          const bMake = b.manufacturer?.name || '';
          return aMake.localeCompare(bMake);
        }
        
        case 'make_za': {
          const aMakeZ = a.manufacturer?.name || '';
          const bMakeZ = b.manufacturer?.name || '';
          return bMakeZ.localeCompare(aMakeZ);
        }
        
        case 'popular': {
          const aPopularity = a.popularity_score || aLot?.popularity_score || 0;
          const bPopularity = b.popularity_score || bLot?.popularity_score || 0;
          return bPopularity - aPopularity;
        }
        
        default:
          return 0;
      }
    });

    return sorted;
  }, [cars, sortBy]);
};

export const getSortOptions = () => [
  { value: 'recently_added', label: 'Më të fundit të shtuar' },
  { value: 'price_low', label: 'Çmimi: Nga më i ulet' },
  { value: 'price_high', label: 'Çmimi: Nga më i larti' },
  { value: 'year_new', label: 'Viti: Nga më i ri' },
  { value: 'year_old', label: 'Viti: Nga më i vjetri' },
  { value: 'mileage_low', label: 'Kilometrazhi: Nga më i ulet' },
  { value: 'mileage_high', label: 'Kilometrazhi: Nga më i larti' },
  { value: 'make_az', label: 'Marka: A-Z' },
  { value: 'make_za', label: 'Marka: Z-A' },
  { value: 'popular', label: 'Më të popullurit' }
];