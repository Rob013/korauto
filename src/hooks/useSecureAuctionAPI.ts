//@ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { findGenerationYears } from "@/data/generationYears";
import { categorizeAndOrganizeGrades, flattenCategorizedGrades } from '../utils/grade-categorization';

// Simple cache to prevent redundant API calls
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds

// Helper function to get cached data or make API call
const getCachedApiCall = async (endpoint: string, filters: any, apiCall: () => Promise<any>) => {
  const cacheKey = `${endpoint}-${JSON.stringify(filters)}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📋 Using cached data for ${endpoint}`);
    return cached.data;
  }
  
  const data = await apiCall();
  apiCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

// Create fallback car data for testing when API is not available
export const createFallbackCars = (filters: any = {}): any[] => {
  console.log(`🔄 Creating fallback cars for development/testing`);
  
  // Generate mock cars for pagination testing
  const mockCars = [];
  const brands = ['BMW', 'Audi', 'Mercedes-Benz', 'Toyota', 'Honda', 'Hyundai', 'Kia'];
  const models = {
    'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
    'Audi': ['A3', 'A4', 'A6', 'Q5'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC'],
    'Toyota': ['Camry', 'RAV4', 'Corolla'],
    'Honda': ['Civic', 'Accord', 'CR-V'],
    'Hyundai': ['Elantra', 'Tucson', 'Santa Fe'],
    'Kia': ['Optima', 'Sportage', 'Sorento']
  };
  
  // Generate 500 cars to support multiple pages of pagination
  for (let i = 1; i <= 500; i++) {
    const brand = brands[i % brands.length];
    const brandModels = models[brand] || ['Model'];
    const model = brandModels[(i + 1) % brandModels.length];
    
    // Add some test cars with different statuses for badge testing
    let status = 1; // default active
    let sale_status = 'active'; // default active
    
    // Make specific cars have different statuses for testing
    if (i === 1) {
      status = 3;
      sale_status = 'sold';
    } else if (i === 2) {
      status = 1;
      sale_status = 'reserved';
    } else if (i === 3) {
      status = 2;
      sale_status = 'pending';
    } else if (i === 4) {
      status = 2; // pending status without sale_status
    } else if (i === 5) {
      status = 3; // sold status without sale_status
    }
    
    mockCars.push({
      id: i,
      title: `${2015 + (i % 10)} ${brand} ${model}`,
      year: 2015 + (i % 10),
      manufacturer: { name: brand },
      model: { name: model },
      vin: `KMHJ381${String(i).padStart(7, '0')}ABC`, // Valid VIN format (17 characters)
      lot_number: `LOT${String(i).padStart(6, '0')}`, // Valid lot number
      status: status,
      sale_status: sale_status,
      lots: [{
        buy_now: 20000 + (i * 100),
        images: {
          normal: [`https://picsum.photos/400/300?random=${i}`]
        },
        odometer: { km: 50000 + (i * 1000) },
        status: status
      }],
      fuel: { name: i % 3 === 0 ? 'Petrol' : i % 3 === 1 ? 'Diesel' : 'Hybrid' },
      transmission: { name: i % 2 === 0 ? 'Automatic' : 'Manual' },
      color: { name: ['Black', 'White', 'Silver', 'Blue', 'Red'][i % 5] },
      location: 'Seoul'
    });
  }
  
  console.log(`✅ Generated ${mockCars.length} mock cars for fallback`);
  return mockCars;
};

// Create fallback generation data for testing when API is not available
export const createFallbackGenerations = (manufacturerName: string): Generation[] => {
  const generationData: { [key: string]: Generation[] } = {
    'BMW': [
      { id: 1001, name: 'E90/E91/E92/E93', from_year: 2005, to_year: 2013, cars_qty: 45, manufacturer_id: 9, model_id: 101 },
      { id: 1002, name: 'F30/F31/F34/F35', from_year: 2012, to_year: 2019, cars_qty: 67, manufacturer_id: 9, model_id: 101 },
      { id: 1003, name: 'G20/G21', from_year: 2019, to_year: 2024, cars_qty: 89, manufacturer_id: 9, model_id: 101 },
      { id: 1004, name: 'E60/E61', from_year: 2003, to_year: 2010, cars_qty: 23, manufacturer_id: 9, model_id: 102 },
      { id: 1005, name: 'F10/F11/F07/F18', from_year: 2010, to_year: 2017, cars_qty: 56, manufacturer_id: 9, model_id: 102 },
      { id: 1006, name: 'G30/G31/G38', from_year: 2017, to_year: 2024, cars_qty: 78, manufacturer_id: 9, model_id: 102 }
    ],
    'Audi': [
      { id: 2001, name: 'C7', from_year: 2011, to_year: 2018, cars_qty: 45, manufacturer_id: 1, model_id: 201 },
      { id: 2002, name: 'C8', from_year: 2018, to_year: 2024, cars_qty: 67, manufacturer_id: 1, model_id: 201 },
      { id: 2003, name: 'B8', from_year: 2007, to_year: 2015, cars_qty: 34, manufacturer_id: 1, model_id: 202 },
      { id: 2004, name: 'B9', from_year: 2015, to_year: 2024, cars_qty: 56, manufacturer_id: 1, model_id: 202 }
    ],
    'Mercedes-Benz': [
      { id: 3001, name: 'W204', from_year: 2007, to_year: 2014, cars_qty: 45, manufacturer_id: 16, model_id: 301 },
      { id: 3002, name: 'W205', from_year: 2014, to_year: 2021, cars_qty: 67, manufacturer_id: 16, model_id: 301 },
      { id: 3003, name: 'W206', from_year: 2021, to_year: 2024, cars_qty: 23, manufacturer_id: 16, model_id: 301 }
    ],
    'Toyota': [
      { id: 4001, name: 'XV70', from_year: 2018, to_year: 2024, cars_qty: 45, manufacturer_id: 3, model_id: 401 },
      { id: 4002, name: 'XV60', from_year: 2012, to_year: 2017, cars_qty: 34, manufacturer_id: 3, model_id: 401 },
      { id: 4003, name: 'E210', from_year: 2019, to_year: 2024, cars_qty: 67, manufacturer_id: 3, model_id: 402 },
      { id: 4004, name: 'E170', from_year: 2013, to_year: 2019, cars_qty: 56, manufacturer_id: 3, model_id: 402 },
      { id: 4005, name: 'XA50', from_year: 2019, to_year: 2024, cars_qty: 45, manufacturer_id: 3, model_id: 403 },
      { id: 4006, name: 'XA40', from_year: 2013, to_year: 2018, cars_qty: 34, manufacturer_id: 3, model_id: 403 }
    ],
    'Honda': [
      { id: 5001, name: '11th Gen', from_year: 2022, to_year: 2024, cars_qty: 34, manufacturer_id: 2, model_id: 501 },
      { id: 5002, name: '10th Gen', from_year: 2016, to_year: 2021, cars_qty: 45, manufacturer_id: 2, model_id: 501 },
      { id: 5003, name: '11th Gen', from_year: 2018, to_year: 2024, cars_qty: 34, manufacturer_id: 2, model_id: 502 },
      { id: 5004, name: '10th Gen', from_year: 2013, to_year: 2017, cars_qty: 23, manufacturer_id: 2, model_id: 502 },
      { id: 5005, name: '6th Gen', from_year: 2023, to_year: 2024, cars_qty: 45, manufacturer_id: 2, model_id: 503 },
      { id: 5006, name: '5th Gen', from_year: 2017, to_year: 2022, cars_qty: 34, manufacturer_id: 2, model_id: 503 }
    ],
    'Hyundai': [
      { id: 6001, name: '7th Gen', from_year: 2021, to_year: 2024, cars_qty: 34, manufacturer_id: 7, model_id: 601 },
      { id: 6002, name: '6th Gen', from_year: 2017, to_year: 2020, cars_qty: 23, manufacturer_id: 7, model_id: 601 },
      { id: 6003, name: '8th Gen', from_year: 2020, to_year: 2024, cars_qty: 34, manufacturer_id: 7, model_id: 602 },
      { id: 6004, name: '7th Gen', from_year: 2015, to_year: 2019, cars_qty: 23, manufacturer_id: 7, model_id: 602 },
      { id: 6005, name: '4th Gen', from_year: 2021, to_year: 2024, cars_qty: 45, manufacturer_id: 7, model_id: 603 },
      { id: 6006, name: '3rd Gen', from_year: 2016, to_year: 2020, cars_qty: 34, manufacturer_id: 7, model_id: 603 }
    ],
    'Kia': [
      { id: 7001, name: '4th Gen', from_year: 2021, to_year: 2024, cars_qty: 34, manufacturer_id: 8, model_id: 701 },
      { id: 7002, name: '3rd Gen', from_year: 2016, to_year: 2020, cars_qty: 23, manufacturer_id: 8, model_id: 701 },
      { id: 7003, name: '3rd Gen', from_year: 2019, to_year: 2024, cars_qty: 23, manufacturer_id: 8, model_id: 702 },
      { id: 7004, name: '2nd Gen', from_year: 2014, to_year: 2018, cars_qty: 18, manufacturer_id: 8, model_id: 702 },
      { id: 7005, name: '5th Gen', from_year: 2022, to_year: 2024, cars_qty: 34, manufacturer_id: 8, model_id: 703 },
      { id: 7006, name: '4th Gen', from_year: 2016, to_year: 2021, cars_qty: 23, manufacturer_id: 8, model_id: 703 }
    ],
    'Nissan': [
      { id: 8001, name: '6th Gen', from_year: 2019, to_year: 2024, cars_qty: 23, manufacturer_id: 4, model_id: 801 },
      { id: 8002, name: '5th Gen', from_year: 2013, to_year: 2018, cars_qty: 18, manufacturer_id: 4, model_id: 801 },
      { id: 8003, name: '8th Gen', from_year: 2020, to_year: 2024, cars_qty: 18, manufacturer_id: 4, model_id: 802 },
      { id: 8004, name: '7th Gen', from_year: 2013, to_year: 2019, cars_qty: 12, manufacturer_id: 4, model_id: 802 },
      { id: 8005, name: '3rd Gen', from_year: 2021, to_year: 2024, cars_qty: 34, manufacturer_id: 4, model_id: 803 },
      { id: 8006, name: '2nd Gen', from_year: 2014, to_year: 2020, cars_qty: 23, manufacturer_id: 4, model_id: 803 }
    ],
    'Ford': [
      { id: 9001, name: '4th Gen', from_year: 2019, to_year: 2024, cars_qty: 23, manufacturer_id: 5, model_id: 901 },
      { id: 9002, name: '3rd Gen', from_year: 2012, to_year: 2018, cars_qty: 18, manufacturer_id: 5, model_id: 901 },
      { id: 9003, name: '2nd Gen', from_year: 2013, to_year: 2020, cars_qty: 18, manufacturer_id: 5, model_id: 902 },
      { id: 9004, name: '1st Gen', from_year: 2006, to_year: 2012, cars_qty: 12, manufacturer_id: 5, model_id: 902 },
      { id: 9005, name: '4th Gen', from_year: 2020, to_year: 2024, cars_qty: 34, manufacturer_id: 5, model_id: 903 },
      { id: 9006, name: '3rd Gen', from_year: 2013, to_year: 2019, cars_qty: 23, manufacturer_id: 5, model_id: 903 }
    ],
    'Chevrolet': [
      { id: 10001, name: '2nd Gen', from_year: 2016, to_year: 2024, cars_qty: 18, manufacturer_id: 6, model_id: 1001 },
      { id: 10002, name: '1st Gen', from_year: 2011, to_year: 2015, cars_qty: 12, manufacturer_id: 6, model_id: 1001 },
      { id: 10003, name: '9th Gen', from_year: 2016, to_year: 2024, cars_qty: 12, manufacturer_id: 6, model_id: 1002 },
      { id: 10004, name: '8th Gen', from_year: 2013, to_year: 2015, cars_qty: 8, manufacturer_id: 6, model_id: 1002 },
      { id: 10005, name: '3rd Gen', from_year: 2018, to_year: 2024, cars_qty: 23, manufacturer_id: 6, model_id: 1003 },
      { id: 10006, name: '2nd Gen', from_year: 2010, to_year: 2017, cars_qty: 18, manufacturer_id: 6, model_id: 1003 }
    ],
    'Volkswagen': [
      // Golf (model_id: 1101)
      { id: 11001, name: 'Mk8', from_year: 2020, to_year: 2024, cars_qty: 34, manufacturer_id: 147, model_id: 1101 },
      { id: 11002, name: 'Mk7', from_year: 2013, to_year: 2019, cars_qty: 23, manufacturer_id: 147, model_id: 1101 },
      // Jetta (model_id: 1102)
      { id: 11003, name: '7th Gen', from_year: 2019, to_year: 2024, cars_qty: 23, manufacturer_id: 147, model_id: 1102 },
      { id: 11004, name: '6th Gen', from_year: 2011, to_year: 2018, cars_qty: 18, manufacturer_id: 147, model_id: 1102 },
      // Passat (model_id: 1103)
      { id: 11005, name: 'B8', from_year: 2015, to_year: 2024, cars_qty: 18, manufacturer_id: 147, model_id: 1103 },
      { id: 11006, name: 'B7', from_year: 2011, to_year: 2014, cars_qty: 12, manufacturer_id: 147, model_id: 1103 },
      // Tiguan (model_id: 1104) - FIX: Add Tiguan-specific generations
      { id: 11007, name: '2nd Gen', from_year: 2017, to_year: 2024, cars_qty: 15, manufacturer_id: 147, model_id: 1104 },
      { id: 11008, name: '1st Gen', from_year: 2008, to_year: 2016, cars_qty: 8, manufacturer_id: 147, model_id: 1104 },
      // Atlas (model_id: 1105)
      { id: 11009, name: '1st Gen', from_year: 2018, to_year: 2024, cars_qty: 12, manufacturer_id: 147, model_id: 1105 }
    ],
    'Mazda': [
      { id: 12001, name: '4th Gen', from_year: 2019, to_year: 2024, cars_qty: 18, manufacturer_id: 10, model_id: 1201 },
      { id: 12002, name: '3rd Gen', from_year: 2014, to_year: 2018, cars_qty: 12, manufacturer_id: 10, model_id: 1201 },
      { id: 12003, name: '3rd Gen', from_year: 2014, to_year: 2024, cars_qty: 12, manufacturer_id: 10, model_id: 1202 },
      { id: 12004, name: '2nd Gen', from_year: 2009, to_year: 2013, cars_qty: 8, manufacturer_id: 10, model_id: 1202 },
      { id: 12005, name: '2nd Gen', from_year: 2017, to_year: 2024, cars_qty: 23, manufacturer_id: 10, model_id: 1203 },
      { id: 12006, name: '1st Gen', from_year: 2013, to_year: 2016, cars_qty: 18, manufacturer_id: 10, model_id: 1203 }
    ]
  };

  return generationData[manufacturerName] || [];
};

// Create fallback model data for testing when API is not available
export const createFallbackModels = (manufacturerName: string): Model[] => {
  const modelData: { [key: string]: Model[] } = {
    'BMW': [
      { id: 101, name: '3 Series', cars_qty: 201 },
      { id: 102, name: '5 Series', cars_qty: 157 },
      { id: 103, name: '7 Series', cars_qty: 89 },
      { id: 104, name: 'X3', cars_qty: 145 },
      { id: 105, name: 'X5', cars_qty: 123 }
    ],
    'Audi': [
      { id: 201, name: 'A6', cars_qty: 112 },
      { id: 202, name: 'A4', cars_qty: 98 },
      { id: 203, name: 'A3', cars_qty: 76 },
      { id: 204, name: 'Q7', cars_qty: 45 }
    ],
    'Mercedes-Benz': [
      { id: 301, name: 'C-Class', cars_qty: 134 },
      { id: 302, name: 'E-Class', cars_qty: 98 },
      { id: 303, name: 'S-Class', cars_qty: 67 }
    ],
    'Toyota': [
      { id: 401, name: 'Camry', cars_qty: 89 },
      { id: 402, name: 'Corolla', cars_qty: 134 },
      { id: 403, name: 'RAV4', cars_qty: 95 },
      { id: 404, name: 'Prius', cars_qty: 67 },
      { id: 405, name: 'Highlander', cars_qty: 45 }
    ],
    'Honda': [
      { id: 501, name: 'Civic', cars_qty: 78 },
      { id: 502, name: 'Accord', cars_qty: 65 },
      { id: 503, name: 'CR-V', cars_qty: 89 },
      { id: 504, name: 'Pilot', cars_qty: 34 },
      { id: 505, name: 'Fit', cars_qty: 23 }
    ],
    'Hyundai': [
      { id: 601, name: 'Elantra', cars_qty: 67 },
      { id: 602, name: 'Sonata', cars_qty: 56 },
      { id: 603, name: 'Tucson', cars_qty: 78 },
      { id: 604, name: 'Santa Fe', cars_qty: 45 },
      { id: 605, name: 'Genesis G90', cars_qty: 23 }
    ],
    'Kia': [
      { id: 701, name: 'Optima', cars_qty: 56 },
      { id: 702, name: 'Forte', cars_qty: 45 },
      { id: 703, name: 'Sportage', cars_qty: 67 },
      { id: 704, name: 'Sorento', cars_qty: 34 },
      { id: 705, name: 'Stinger', cars_qty: 23 }
    ],
    'Nissan': [
      { id: 801, name: 'Altima', cars_qty: 45 },
      { id: 802, name: 'Sentra', cars_qty: 34 },
      { id: 803, name: 'Rogue', cars_qty: 67 },
      { id: 804, name: 'Murano', cars_qty: 23 },
      { id: 805, name: '370Z', cars_qty: 12 }
    ],
    'Ford': [
      { id: 901, name: 'Focus', cars_qty: 45 },
      { id: 902, name: 'Fusion', cars_qty: 34 },
      { id: 903, name: 'Escape', cars_qty: 56 },
      { id: 904, name: 'Explorer', cars_qty: 23 },
      { id: 905, name: 'Mustang', cars_qty: 18 }
    ],
    'Chevrolet': [
      { id: 1001, name: 'Cruze', cars_qty: 34 },
      { id: 1002, name: 'Malibu', cars_qty: 23 },
      { id: 1003, name: 'Equinox', cars_qty: 45 },
      { id: 1004, name: 'Tahoe', cars_qty: 12 },
      { id: 1005, name: 'Camaro', cars_qty: 8 }
    ],
    'Volkswagen': [
      { id: 1101, name: 'Golf', cars_qty: 67 },
      { id: 1102, name: 'Jetta', cars_qty: 45 },
      { id: 1103, name: 'Passat', cars_qty: 34 },
      { id: 1104, name: 'Tiguan', cars_qty: 23 },
      { id: 1105, name: 'Atlas', cars_qty: 12 }
    ],
    'Mazda': [
      { id: 1201, name: 'Mazda3', cars_qty: 34 },
      { id: 1202, name: 'Mazda6', cars_qty: 23 },
      { id: 1203, name: 'CX-5', cars_qty: 45 },
      { id: 1204, name: 'CX-9', cars_qty: 12 },
      { id: 1205, name: 'MX-5', cars_qty: 8 }
    ]
  };

  return modelData[manufacturerName] || [];
};

// Create fallback manufacturer data without logos
export const createFallbackManufacturers = () => {
  const fallbackData = [
    // German brands (priority)
    { id: 9, name: 'BMW', cars_qty: 245 },
    { id: 16, name: 'Mercedes-Benz', cars_qty: 189 },
    { id: 1, name: 'Audi', cars_qty: 167 },
    { id: 147, name: 'Volkswagen', cars_qty: 134 },
    { id: 13, name: 'Porsche', cars_qty: 27 },
    { id: 22, name: 'Opel', cars_qty: 45 },
    
    // Korean brands
    { id: 7, name: 'Hyundai', cars_qty: 112 },
    { id: 8, name: 'Kia', cars_qty: 95 },
    { id: 19, name: 'Genesis', cars_qty: 12 },
    
    // Japanese brands
    { id: 3, name: 'Toyota', cars_qty: 156 },
    { id: 2, name: 'Honda', cars_qty: 98 },
    { id: 4, name: 'Nissan', cars_qty: 87 },
    { id: 10, name: 'Mazda', cars_qty: 43 },
    { id: 11, name: 'Subaru', cars_qty: 29 },
    { id: 12, name: 'Lexus', cars_qty: 38 },
    { id: 17, name: 'Infiniti', cars_qty: 18 },
    { id: 18, name: 'Acura', cars_qty: 15 },
    { id: 23, name: 'Mitsubishi', cars_qty: 25 },
    
    // American brands
    { id: 5, name: 'Ford', cars_qty: 76 },
    { id: 6, name: 'Chevrolet', cars_qty: 54 },
    { id: 24, name: 'Cadillac', cars_qty: 18 },
    { id: 25, name: 'GMC', cars_qty: 15 },
    { id: 20, name: 'Tesla', cars_qty: 8 },
    { id: 26, name: 'Chrysler', cars_qty: 12 },
    { id: 27, name: 'Jeep', cars_qty: 22 },
    { id: 28, name: 'Dodge', cars_qty: 16 },
    
    // Luxury/European brands
    { id: 14, name: 'Land Rover', cars_qty: 22 },
    { id: 21, name: 'Jaguar', cars_qty: 9 },
    { id: 15, name: 'Volvo', cars_qty: 31 },
    { id: 29, name: 'Ferrari', cars_qty: 3 },
    { id: 30, name: 'Lamborghini', cars_qty: 2 },
    { id: 31, name: 'Maserati', cars_qty: 4 },
    { id: 32, name: 'Bentley', cars_qty: 2 },
    { id: 33, name: 'Rolls-Royce', cars_qty: 1 },
    { id: 34, name: 'Aston Martin', cars_qty: 2 },
    { id: 35, name: 'McLaren', cars_qty: 1 },
    { id: 43, name: 'Mini', cars_qty: 14 },
    
    // French brands
    { id: 36, name: 'Peugeot', cars_qty: 28 },
    { id: 37, name: 'Renault', cars_qty: 35 },
    { id: 38, name: 'Citroën', cars_qty: 18 },
    
    // Italian brands
    { id: 39, name: 'Fiat', cars_qty: 22 },
    { id: 40, name: 'Alfa Romeo', cars_qty: 11 },
    
    // Other European brands
    { id: 41, name: 'Skoda', cars_qty: 24 },
    { id: 42, name: 'Seat', cars_qty: 16 }
  ];
  
  return fallbackData.map(manufacturer => ({
    id: manufacturer.id,
    name: manufacturer.name,
    cars_qty: manufacturer.cars_qty,
    car_count: manufacturer.cars_qty
  }));
};


interface Lot {
  buy_now?: number;
  odometer?: { km?: number };
  popularity_score?: number;
  images?: { normal?: string[]; big?: string[] };
  bid?: number;
  lot?: string;
  status?: string;
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
  damage?: { main?: string; second?: string };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  domain?: { name: string };
  external_id?: string;
  // Enhanced data from your API response
  insurance?: {
    accident_history?: string;
    repair_count?: string;
    total_loss?: string;
    repair_cost?: string;
    flood_damage?: string;
    own_damage?: string;
    other_damage?: string;
    car_info?: {
      make?: string;
      accident_history?: string;
      repair_count?: string;
      total_loss?: string;
      repair_cost?: string;
      flood_damage?: string;
    };
    general_info?: {
      model?: string;
      year?: string;
      usage_type?: string;
      insurance_start_date?: string;
    };
    usage_history?: Array<{
      description: string;
      value: string;
    }>;
    owner_changes?: Array<{
      date: string;
      change_type: string;
      previous_number?: string;
      usage_type: string;
    }>;
    special_accident_history?: Array<{
      type: string;
      value: string;
    }>;
  };
  insurance_v2?: {
    regDate?: string;
    year?: number;
    maker?: string;
    displacement?: number;
    firstDate?: string;
    model?: string;
    myAccidentCnt?: number;
    otherAccidentCnt?: number;
    ownerChangeCnt?: number;
    robberCnt?: number;
    totalLossCnt?: number;
    floodTotalLossCnt?: number;
    government?: number;
    business?: number;
    loan?: number;
    carNoChangeCnt?: number;
    myAccidentCost?: number;
    otherAccidentCost?: number;
    carInfoChanges?: Array<{
      date: string;
      carNo: string;
    }>;
    carInfoUse1s?: string[];
    carInfoUse2s?: string[];
    ownerChanges?: any[];
    accidentCnt?: number;
    accidents?: any[];
  };
  location?: {
    country?: { name: string; iso: string };
    city?: { name: string };
    state?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    postal_code?: string;
    is_offsite?: boolean;
    raw?: string;
    offsite?: string;
  };
  inspect?: {
    accident_summary?: {
      main_framework?: string;
      exterior1rank?: string;
      exterior2rank?: string;
      simple_repair?: string;
      accident?: string;
    };
    outer?: Record<string, string[]>;
    inner?: Record<string, string>;
  };
  details?: {
    engine_volume?: number;
    original_price?: number;
    year?: number;
    month?: number;
    first_registration?: {
      year: number;
      month: number;
      day: number;
    };
    badge?: string;
    comment?: string;
    description_ko?: string;
    description_en?: string;
    is_leasing?: boolean;
    sell_type?: string;
    equipment?: any;
    options?: {
      type?: string;
      standard?: string[];
      etc?: string[];
      choice?: string[];
      tuning?: string[];
    };
    inspect_outer?: Array<{
      type: { code: string; title: string };
      statusTypes: Array<{ code: string; title: string }>;
      attributes: string[];
    }>;
    seats_count?: number;
  };
}

interface Car {
  id: string;
  manufacturer: { id: number; name: string };
  model: { id: number; name: string };
  generation?: {
    id: number;
    name: string;
    manufacturer_id: number;
    model_id: number;
  };
  year: number;
  price?: string;
  mileage?: string;
  title?: string;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  condition?: string;
  lot_number?: string;
  image_url?: string;
  color?: { id: number; name: string };
  status?: number;
  sale_status?: string;
  final_price?: number;
  body_type?: { id: number; name: string };
  engine?: { id: number; name: string };
  drive_wheel?: string;
  vehicle_type?: { id: number; name: string };
  cylinders?: number;
  lots?: Lot[];
}

interface Manufacturer {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  image?: string;
}

interface Model {
  id: number;
  name: string;
  car_count?: number;
}

interface Generation {
  id: number;
  name: string;
  car_count?: number;
  cars_qty?: number;
  from_year?: number;
  to_year?: number;
  manufacturer_id?: number;
  model_id?: number;
}

interface APIFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  grade_iaai?: string;
  trim_level?: string;
  color?: string;
  fuel_type?: string;
  transmission?: string;
  body_type?: string;
  odometer_from_km?: string;
  odometer_to_km?: string;
  from_year?: string;
  to_year?: string;
  buy_now_price_from?: string;
  buy_now_price_to?: string;
  seats_count?: string;
  search?: string;
  per_page?: string;
  sort_by?: string;
  sort_direction?: string;
}

interface APIResponse {
  data: Car[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
  error?: string;
  retryAfter?: number;
}

export const useSecureAuctionAPI = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [filters, setFilters] = useState<APIFilters>({});
  const [gradesCache, setGradesCache] = useState<{ [key: string]: { value: string; label: string; count?: number }[] }>({});
  const [trimLevelsCache, setTrimLevelsCache] = useState<{ [key: string]: { value: string; label: string; count?: number }[] }>({});

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const makeSecureAPICall = async (
    endpoint: string,
    filters: any = {},
    carId?: string
  ): Promise<any> => {
    try {
      console.log("🔐 Making secure API call:", { endpoint, filters, carId });

      // Add a minimal delay to prevent rapid successive calls
      const now = Date.now();
      if (now - lastFetchTime < 50) {
        // 50ms minimum between calls (optimized for faster loading)
        await delay(50 - (now - lastFetchTime));
      }
      setLastFetchTime(Date.now());

      console.log("🔐 Calling Supabase function with body:", { endpoint, filters, carId });
      const { data, error: functionError } = await supabase.functions.invoke(
        "secure-cars-api",
        {
          body: { endpoint, filters, carId },
        }
      );
      
      console.log("🔐 Supabase function response:", { data, error: functionError });

      if (functionError) {
        console.error("❌ Edge function error:", functionError);
        console.error("❌ Function error details:", {
          message: functionError.message,
          name: functionError.name,
          stack: functionError.stack,
          endpoint,
          filters,
          carId
        });
        
        // Provide more user-friendly error messages
        let userMessage = "Failed to send request to the server.";
        if (functionError.message?.includes('timeout')) {
          userMessage = "Request timed out. Please try again.";
        } else if (functionError.message?.includes('network')) {
          userMessage = "Network error. Please check your connection.";
        } else if (functionError.message?.includes('401') || functionError.message?.includes('unauthorized')) {
          userMessage = "Authentication error. Please refresh the page.";
        } else if (functionError.message?.includes('404')) {
          userMessage = "No data found for your search criteria.";
        } else if (functionError.message?.includes('429') || functionError.message?.includes('rate limit')) {
          userMessage = "Too many requests. Please wait a moment and try again.";
        }
        
        throw new Error(userMessage);
      }

      if (data?.error) {
        console.error("❌ API returned error:", data.error);
        console.error("❌ Error details:", {
          error: data.error,
          details: data.details,
          endpoint,
          filters,
          carId,
          data
        });
        
        if (data.retryAfter) {
          console.log("⏳ Rate limited, waiting...");
          await delay(data.retryAfter);
          throw new Error("RATE_LIMITED");
        }
        
        // Use the improved error message from the edge function if available
        const errorMessage = data.error || "An error occurred while fetching data";
        throw new Error(errorMessage);
      }

      return data;
    } catch (err) {
      console.error("❌ Secure API call error:", err);
      
      // If it's already a processed error with a user-friendly message, re-throw it
      if (err instanceof Error && err.message && !err.message.includes('Error:')) {
        throw err;
      }
      
      // Otherwise, provide a generic user-friendly message
      throw new Error("Unable to connect to the server. Please check your internet connection and try again.");
    }
  };

  // Helper function to map frontend sort options to API parameters
  const mapSortToAPI = (sortBy: string): { sort_by?: string; sort_direction?: string } => {
    // Note: Many external APIs don't support these exact sorting parameters
    // We'll try to send them but fall back to client-side sorting if needed
    switch (sortBy) {
      case 'price_low':
        return { sort_by: 'price', sort_direction: 'asc' };
      case 'price_high':
        return { sort_by: 'price', sort_direction: 'desc' };
      case 'year_new':
        return { sort_by: 'year', sort_direction: 'desc' };
      case 'year_old':
        return { sort_by: 'year', sort_direction: 'asc' };
      case 'mileage_low':
        return { sort_by: 'mileage', sort_direction: 'asc' };
      case 'mileage_high':
        return { sort_by: 'mileage', sort_direction: 'desc' };
      case 'make_az':
        return { sort_by: 'manufacturer', sort_direction: 'asc' };
      case 'make_za':
        return { sort_by: 'manufacturer', sort_direction: 'desc' };
      case 'popular':
        return { sort_by: 'popularity', sort_direction: 'desc' };
      default:
        return {};
    }
  };

  const fetchCars = async (
    page: number = 1,
    newFilters: APIFilters = filters,
    resetList: boolean = true
  ): Promise<void> => {
    if (resetList) {
      setFilters(newFilters);
      setLoading(true);
      // Don't reset page to 1 if we're explicitly requesting a different page
      if (page === 1) {
        setCurrentPage(1);
      }
    }
    setError(null);

    try {
      // Pass filters to the API - DO NOT send grade_iaai to server for filtering
      const apiFilters = {
        ...newFilters,
        page: page.toString(),
        per_page: newFilters.per_page || "200", // Show 200 cars per page
        simple_paginate: "0",
      };
      
      // IMPORTANT: Remove grade_iaai and trim_level from server request - we'll do client-side filtering
      // This prevents backend errors and ensures we get all cars for client-side filtering
      const selectedVariant = newFilters.grade_iaai;
      const selectedTrimLevel = newFilters.trim_level;
      delete apiFilters.grade_iaai;
      delete apiFilters.trim_level;

      console.log(`🔄 Fetching cars - Page ${page} with filters:`, apiFilters);
      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);

      // Apply client-side variant filtering if a variant is selected
      let filteredCars = data.data || [];
      if (selectedVariant && selectedVariant !== 'all') {
        console.log(`🔍 Applying client-side variant filter: "${selectedVariant}"`);
        
        filteredCars = filteredCars.filter(car => {
          // Check if car has the selected variant in any of its lots
          if (car.lots && Array.isArray(car.lots)) {
            return car.lots.some(lot => {
              // Check grade_iaai field
              if (lot.grade_iaai && lot.grade_iaai.trim() === selectedVariant) {
                return true;
              }
              
              // Check badge field
              if (lot.details && lot.details.badge && lot.details.badge.trim() === selectedVariant) {
                return true;
              }
              
              // Check engine name
              if (car.engine && car.engine.name && car.engine.name.trim() === selectedVariant) {
                return true;
              }
              
              // Check title for variant
              if (car.title && car.title.toLowerCase().includes(selectedVariant.toLowerCase())) {
                return true;
              }
              
              return false;
            });
          }
          return false;
        });
        
        console.log(`✅ Variant filter "${selectedVariant}": ${filteredCars.length} cars match out of ${data.data?.length || 0} total`);
      }

      // Apply client-side trim level filtering if a trim level is selected
      if (selectedTrimLevel && selectedTrimLevel !== 'all') {
        console.log(`🔍 Applying client-side trim level filter: "${selectedTrimLevel}"`);
        
        filteredCars = filteredCars.filter(car => {
          // Check if car has the selected trim level in any of its lots or title
          if (car.lots && Array.isArray(car.lots)) {
            // Check lots for trim level in badge or grade_iaai
            const hasMatchInLots = car.lots.some(lot => {
              // Check badge field for trim level
              if (lot.details && lot.details.badge && 
                  lot.details.badge.toLowerCase().includes(selectedTrimLevel.toLowerCase())) {
                return true;
              }
              
              // Check grade_iaai field for trim level
              if (lot.grade_iaai && 
                  lot.grade_iaai.toLowerCase().includes(selectedTrimLevel.toLowerCase())) {
                return true;
              }
              
              return false;
            });
            
            if (hasMatchInLots) return true;
          }
          
          // Check title for trim level
          if (car.title && car.title.toLowerCase().includes(selectedTrimLevel.toLowerCase())) {
            return true;
          }
          
          return false;
        });
        
        console.log(`✅ Trim level filter "${selectedTrimLevel}": ${filteredCars.length} cars match out of ${data.data?.length || 0} total`);
      }

      // Always use server-side total count regardless of client-side filtering
      // Client-side filtering should not affect the total count or pagination logic
      setTotalCount(data.meta?.total || 0);
      setHasMorePages(page < (data.meta?.last_page || 1));

      console.log(
        `✅ API Success - Fetched ${filteredCars.length} cars from page ${page}, server total: ${data.meta?.total || 0}, filtered displayed: ${filteredCars.length}`
      );

      if (resetList || page === 1) {
        setCars(filteredCars);
        setCurrentPage(page); // Set the actual requested page, not always 1
      } else {
        setCars((prev) => [...prev, ...filteredCars]);
        setCurrentPage(page);
      }
    } catch (err: any) {
      console.error("❌ API Error:", err);
      
      if (err.message === "RATE_LIMITED") {
        // Retry once after rate limit
        try {
          await delay(2000);
          return fetchCars(page, newFilters, resetList);
        } catch (retryErr) {
          console.error("❌ Retry failed:", retryErr);
          // Fall through to use fallback data
        }
      }
      
      // Use fallback car data when API fails - but only if no specific brand filter is applied
      if (newFilters.manufacturer_id && 
          newFilters.manufacturer_id !== 'all' && 
          newFilters.manufacturer_id !== '' &&
          newFilters.manufacturer_id !== undefined &&
          newFilters.manufacturer_id !== null) {
        console.log("❌ API failed for brand-specific search, not showing fallback cars to avoid test car display");
        setError("Failed to load cars for the selected brand. Please try again.");
        setCars([]);
        setTotalCount(0);
        setHasMorePages(false);
        return;
      }
      
      // Use fallback cars when API fails
      console.log("❌ API failed, using fallback cars for pagination testing");
      const fallbackCars = createFallbackCars(newFilters);
      
      if (fallbackCars.length === 0) {
        console.log("❌ No fallback cars available, showing empty state");
        setError("Failed to load cars. Please try again.");
        setCars([]);
        setTotalCount(0);
        setHasMorePages(false);
        return;
      }
      
      // Simulate pagination with fallback data
      const pageSize = parseInt(newFilters.per_page || "200");
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCars = fallbackCars.slice(startIndex, endIndex);
      
      console.log(
        `✅ Fallback Success - Showing ${paginatedCars.length} cars from page ${page}, total: ${fallbackCars.length}`
      );
      
      setTotalCount(fallbackCars.length);
      setHasMorePages(endIndex < fallbackCars.length);
      
      if (resetList || page === 1) {
        setCars(paginatedCars);
        setCurrentPage(page);
      } else {
        setCars((prev) => [...prev, ...paginatedCars]);
        setCurrentPage(page);
      }
      
      // Clear error since we're showing fallback data
      setError(null);
      
      if (resetList || page === 1) {
        setCars(paginatedCars);
        setCurrentPage(1);
      } else {
        setCars((prev) => [...prev, ...paginatedCars]);
        setCurrentPage(page);
      }
      
      // Clear error since we're showing fallback data
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturers = async (): Promise<Manufacturer[]> => {
    try {
      console.log(`🔍 Fetching all manufacturers`);
      
      // Try to get manufacturers from cache or API
      const data = await getCachedApiCall("manufacturers/cars", { per_page: "1000", simple_paginate: "0" }, 
        () => makeSecureAPICall("manufacturers/cars", {
          per_page: "1000",
          simple_paginate: "0"
        })
      );
      
      let manufacturers = data.data || [];
      
      // If we got manufacturers from API, normalize them
      if (manufacturers.length > 0) {
        console.log(`✅ Found ${manufacturers.length} manufacturers from API`);
        manufacturers = manufacturers.map(manufacturer => ({
          id: manufacturer.id,
          name: manufacturer.name,
          cars_qty: manufacturer.cars_qty || manufacturer.car_count || 0,
          car_count: manufacturer.car_count || manufacturer.cars_qty || 0
        }));
      } else {
        // No manufacturers from API, use fallback data
        console.log(`⚠️ No manufacturers from API, using fallback data`);
        manufacturers = createFallbackManufacturers();
      }
      
      console.log(`🏷️ Retrieved manufacturers:`, 
        manufacturers.slice(0, 5).map(m => `${m.name} (${m.cars_qty || 0} cars)`));
      
      return manufacturers;
    } catch (err) {
      console.error("❌ Error fetching manufacturers:", err);
      console.log(`🔄 Using fallback manufacturer data`);
      
      // Return fallback data when API fails
      return createFallbackManufacturers();
    }
  };

  const fetchModels = async (manufacturerId: string): Promise<Model[]> => {
    try {
      // Use cached API call for models
      const fallbackData = await getCachedApiCall(`models/${manufacturerId}/cars`, { per_page: "1000", simple_paginate: "0" },
        () => makeSecureAPICall(`models/${manufacturerId}/cars`, {
          per_page: "1000",
          simple_paginate: "0"
        })
      );
      
      let fallbackModels = (fallbackData.data || []).filter((m: any) => m && m.id && m.name);

      // Filter models by manufacturer_id (in case API returns extra)
      fallbackModels = fallbackModels.filter((m: any) =>
        m.manufacturer_id?.toString() === manufacturerId ||
        m.manufacturer?.id?.toString() === manufacturerId
      );

      fallbackModels.sort((a: any, b: any) => a.name.localeCompare(b.name));
      return fallbackModels;
    } catch (err) {
      console.error("[fetchModels] Error:", err);
      console.log(`🔄 Using fallback model data for manufacturer ${manufacturerId}`);
      
      // Use fallback model data based on manufacturer name - more efficient approach
      try {
        const manufacturers = await fetchManufacturers();
        const manufacturer = manufacturers.find(m => m.id.toString() === manufacturerId);
        if (manufacturer) {
          return createFallbackModels(manufacturer.name);
        }
      } catch (fallbackErr) {
        console.error("Error creating fallback models:", fallbackErr);
      }
      
      return [];
    }
  };

  const fetchGenerations = async (modelId: string): Promise<Generation[]> => {
    try {
      console.log(`🔍 Fetching generations for model ID: ${modelId}`);
      
      // First try to fetch generations from a dedicated endpoint
      let generationsFromAPI: Generation[] = [];
      try {
        const generationResponse = await makeSecureAPICall(`generations/${modelId}`, {});
        if (generationResponse.data && Array.isArray(generationResponse.data)) {
          generationsFromAPI = generationResponse.data.filter(g => g && g.id && g.name);
          console.log(`🎯 Found ${generationsFromAPI.length} generations from dedicated API endpoint`);
        }
      } catch (err) {
        console.log('📍 No dedicated generations endpoint, using optimized fallback approach');
      }

      // If we have API generations with proper year data, use them
      if (generationsFromAPI.length > 0 && generationsFromAPI.some(g => g.from_year || g.to_year)) {
        console.log('✅ Using generations with real API year data');
        return generationsFromAPI.sort((a, b) => a.name.localeCompare(b.name));
      }

      // OPTIMIZED: Use model-specific fallback approach instead of calling all manufacturer APIs
      console.log('🚀 Using optimized model-specific fallback generation data');
      
      // Get model-specific generations by creating a lookup and filtering
      const modelIdNum = parseInt(modelId);
      let generations: Generation[] = [];
      
      // Create a comprehensive fallback generation list and filter by model_id
      const allManufacturerNames = ['BMW', 'Audi', 'Mercedes-Benz', 'Toyota', 'Honda', 'Hyundai', 'Kia', 'Nissan', 'Ford', 'Chevrolet', 'Volkswagen', 'Mazda'];
      
      for (const manufacturerName of allManufacturerNames) {
        const manufacturerGenerations = createFallbackGenerations(manufacturerName);
        const modelSpecificGenerations = manufacturerGenerations.filter(gen => 
          gen.model_id === modelIdNum
        );
        
        if (modelSpecificGenerations.length > 0) {
          console.log(`✅ Found ${modelSpecificGenerations.length} generations for model ${modelId} from ${manufacturerName}`);
          generations = modelSpecificGenerations;
          break;
        }
      }
      
      // If no model-specific generations found, return a minimal fallback
      if (generations.length === 0) {
        console.log(`⚠️ No specific generations found for model ${modelId}, using generic fallback`);
        generations = [
          { 
            id: parseInt(modelId) * 1000 + 1, 
            name: '1st Generation', 
            from_year: 2010, 
            to_year: 2018, 
            cars_qty: 10, 
            manufacturer_id: undefined, 
            model_id: modelIdNum 
          },
          { 
            id: parseInt(modelId) * 1000 + 2, 
            name: '2nd Generation', 
            from_year: 2018, 
            to_year: 2024, 
            cars_qty: 15, 
            manufacturer_id: undefined, 
            model_id: modelIdNum 
          }
        ];
      }
      
      const filteredGenerations = generations.filter(g => g && g.id && g.name);
      filteredGenerations.sort((a, b) => a.name.localeCompare(b.name));
      console.log(`📊 Returning ${filteredGenerations.length} filtered generations for model ${modelId}`);
      return filteredGenerations;
      
    } catch (err) {
      console.error('[fetchGenerations] Error:', err);
      console.log(`🔄 Using minimal fallback generation data for model ${modelId}`);
      
      // Return a minimal set of fallback generations to avoid empty state
      const modelIdNum = parseInt(modelId);
      return [
        { 
          id: modelIdNum * 1000 + 1, 
          name: '1st Generation', 
          from_year: 2010, 
          to_year: 2018, 
          cars_qty: 5, 
          manufacturer_id: undefined, 
          model_id: modelIdNum 
        },
        { 
          id: modelIdNum * 1000 + 2, 
          name: '2nd Generation', 
          from_year: 2018, 
          to_year: 2024, 
          cars_qty: 8, 
          manufacturer_id: undefined, 
          model_id: modelIdNum 
        }
      ];
    }
  };

  // Helper function to enhance API generations with car year data
  const enhanceGenerationsWithCarYears = (apiGenerations: Generation[], cars: Car[]): Generation[] => {
    const yearDataMap = new Map<number, { from_year?: number; to_year?: number; car_count: number }>();
    const currentYear = new Date().getFullYear();
    
    // Extract year data from cars for each generation
    cars.forEach(car => {
      if (car.generation && car.generation.id && car.year) {
        // Fixed: Validate that car year is reasonable (between 1980 and current year + 1)
        if (car.year >= 1980 && car.year <= currentYear + 1) {
          const genId = car.generation.id;
          const existing = yearDataMap.get(genId);
          
          if (existing) {
            existing.car_count++;
            if (!existing.from_year || car.year < existing.from_year) {
              existing.from_year = car.year;
            }
            if (!existing.to_year || car.year > existing.to_year) {
              existing.to_year = car.year;
            }
          } else {
            yearDataMap.set(genId, {
              from_year: car.year,
              to_year: car.year,
              car_count: 1
            });
          }
        }
      }
    });

    // Enhance API generations with extracted year data and real generation year data as fallback
    return apiGenerations.map(gen => {
      const yearData = yearDataMap.get(gen.id);
      
      // Try to get real generation year data from our comprehensive database
      let realYearData: { from_year?: number; to_year?: number } | null = null;
      if (gen.manufacturer_id && gen.model_id) {
        // Get manufacturer and model names from car data or API
        const manufacturerName = cars.find(car => 
          car.manufacturer && car.manufacturer.id === gen.manufacturer_id
        )?.manufacturer?.name;
        const modelName = cars.find(car => 
          car.model && car.model.id === gen.model_id
        )?.model?.name;
        
        if (manufacturerName && modelName && gen.name) {
          realYearData = findGenerationYears(manufacturerName, modelName, gen.name);
          if (realYearData) {
            console.log(`🎯 Found real generation year data for ${manufacturerName} ${modelName} ${gen.name}: ${realYearData.from_year}-${realYearData.to_year}`);
          }
        }
      }
      
      return {
        ...gen,
        // Priority: 1. Valid API data, 2. Real generation data, 3. Car year data
        from_year: (gen.from_year && gen.from_year >= 1980) ? gen.from_year : 
                   (realYearData?.from_year || yearData?.from_year),
        to_year: (gen.to_year && gen.to_year <= currentYear + 1) ? gen.to_year : 
                 (realYearData?.to_year || yearData?.to_year),
        cars_qty: gen.cars_qty || yearData?.car_count || 0
      };
    });
  };

  const fetchFilterCounts = async (
    currentFilters: APIFilters = {},
    manufacturersList: any[] = []
  ) => {
    // Mock implementation for backward compatibility
    console.log("📊 fetchFilterCounts called with filters:", currentFilters);
    return {
      manufacturers: {},
      models: {},
      generations: {},
      colors: {},
      fuelTypes: {},
      transmissions: {},
      years: {},
    };
  };

  const fetchCarCounts = async (
    filters: APIFilters = {}
  ): Promise<{ [key: string]: number }> => {
    try {
      const apiFilters = {
        ...filters,
        per_page: "1",
        simple_paginate: "1",
      };

      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);
      return { total: data.meta?.total || 0 };
    } catch (err) {
      console.error("❌ Error fetching car counts:", err);
      return { total: 0 };
    }
  };

  const fetchCarById = async (carId: string): Promise<Car | null> => {
    try {
      const data = await makeSecureAPICall("cars", {}, carId);
      return data.data || null;
    } catch (err) {
      console.error("❌ Error fetching car by ID:", err);
      return null;
    }
  };

  const fetchKoreaDuplicates = async (
    minutes: number = 10,
    perPage: number = 1000
  ): Promise<any[]> => {
    try {
      const filters = {
        minutes: minutes.toString(),
        per_page: perPage.toString(),
      };
      const data = await makeSecureAPICall("korea-duplicates", filters);
      return data.data || [];
    } catch (err) {
      console.error("❌ Error fetching Korea duplicates:", err);
      return [];
    }
  };

  const fetchTrimLevels = async (manufacturerId?: string, modelId?: string, generationId?: string): Promise<{ value: string; label: string; count?: number }[]> => {
    const cacheKey = `trim_${manufacturerId || ''}-${modelId || ''}-${generationId || ''}`;
    
    // Use cache if available
    if (trimLevelsCache[cacheKey]) {
      return trimLevelsCache[cacheKey];
    }

    try {
      // Build filters - only include valid values
      const filters: any = { per_page: '100' }; // Fetch more cars for better trim coverage
      if (manufacturerId) filters.manufacturer_id = manufacturerId;
      if (modelId) filters.model_id = modelId;
      if (generationId) filters.generation_id = generationId;

      console.log('🔍 Fetching trim levels with filters:', filters);
      const data = await makeSecureAPICall('cars', filters);
      
      const cars = data.data || [];
      console.log('🔍 Found', cars.length, 'cars for trim level extraction');
      
      if (cars.length === 0) {
        const fallback = getFallbackTrimLevels();
        setTrimLevelsCache(prev => ({ ...prev, [cacheKey]: fallback }));
        return fallback;
      }
      
      // Extract unique trim levels from multiple sources
      const trimLevelsMap = new Map<string, number>();
      
      // Define trim level patterns (focusing on actual trim levels, not engine variants)
      const trimLevelPatterns = [
        /\b(premium|luxury|sport|exclusive|elite|prestige|comfort|deluxe|base|standard|limited|special|edition)\b/gi,
        /\b(executive|business|design|style|elegance|dynamic|advance|progressive|sophisticated)\b/gi,
        /\b(ultimate|signature|platinum|diamond|titanium|carbon|black|white|red|blue)\b/gi
      ];
      
      cars.forEach((car: any) => {
        // Primary source: badge from lots details (most reliable for trim levels)
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.details && lot.details.badge && typeof lot.details.badge === 'string' && lot.details.badge.trim()) {
              const badge = lot.details.badge.trim();
              
              // Check if badge matches trim level patterns
              trimLevelPatterns.forEach(pattern => {
                const matches = badge.toLowerCase().match(pattern);
                if (matches) {
                  matches.forEach(match => {
                    const trimLevel = match.trim().toLowerCase();
                    if (trimLevel.length > 2) { // Exclude very short matches
                      const capitalizedTrim = trimLevel.charAt(0).toUpperCase() + trimLevel.slice(1);
                      trimLevelsMap.set(capitalizedTrim, (trimLevelsMap.get(capitalizedTrim) || 0) + 1);
                    }
                  });
                }
              });
            }
          });
        }
        
        // Secondary source: grade_iaai field (only if it contains trim-like terms)
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.grade_iaai && typeof lot.grade_iaai === 'string' && lot.grade_iaai.trim()) {
              const grade = lot.grade_iaai.trim();
              
              // Check if grade contains trim level terms (but exclude engine codes)
              trimLevelPatterns.forEach(pattern => {
                const matches = grade.toLowerCase().match(pattern);
                if (matches) {
                  matches.forEach(match => {
                    const trimLevel = match.trim().toLowerCase();
                    if (trimLevel.length > 2 && 
                        !/^[A-Z]{2,4}$/i.test(trimLevel) && // Not engine codes
                        !/^\d+\.?\d*$/.test(trimLevel)) { // Not just numbers
                      const capitalizedTrim = trimLevel.charAt(0).toUpperCase() + trimLevel.slice(1);
                      trimLevelsMap.set(capitalizedTrim, (trimLevelsMap.get(capitalizedTrim) || 0) + 1);
                    }
                  });
                }
              });
            }
          });
        }
        
        // Tertiary source: extract trim levels from car title
        if (car.title && typeof car.title === 'string') {
          const title = car.title.toLowerCase();
          
          trimLevelPatterns.forEach(pattern => {
            const matches = title.match(pattern);
            if (matches) {
              matches.forEach(match => {
                const trimLevel = match.trim().toLowerCase();
                if (trimLevel.length > 2) {
                  const capitalizedTrim = trimLevel.charAt(0).toUpperCase() + trimLevel.slice(1);
                  trimLevelsMap.set(capitalizedTrim, (trimLevelsMap.get(capitalizedTrim) || 0) + 1);
                }
              });
            }
          });
        }
      });

      console.log('🔍 Raw trim level values found:', Array.from(trimLevelsMap.keys()));

      const trimLevels = Array.from(trimLevelsMap.entries())
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }))
        .sort((a, b) => b.count - a.count); // Sort by popularity

      console.log('📊 Extracted trim levels:', trimLevels.length, 'unique trim levels:', trimLevels.slice(0, 10).map(t => `${t.value}(${t.count})`));
      
      // If no trim levels found from API, use fallback
      if (trimLevels.length === 0) {
        console.log('⚠️ No trim levels found from API, using fallback...');
        const fallback = getFallbackTrimLevels();
        setTrimLevelsCache(prev => ({ ...prev, [cacheKey]: fallback }));
        return fallback;
      }
      
      const result = trimLevels;
      setTrimLevelsCache(prev => ({ ...prev, [cacheKey]: result }));
      return result;
    } catch (err) {
      console.error("❌ Error fetching trim levels:", err);
      const fallback = getFallbackTrimLevels();
      setTrimLevelsCache(prev => ({ ...prev, [cacheKey]: fallback }));
      return fallback;
    }
  };

  const getFallbackTrimLevels = (): { value: string; label: string; count?: number }[] => {
    // Extract trim levels from current cars in memory
    const currentTrimLevels = new Set<string>();
    
    const trimLevelPatterns = [
      /\b(premium|luxury|sport|exclusive|elite|prestige|comfort|deluxe|base|standard|limited|special|edition)\b/gi,
      /\b(executive|business|design|style|elegance|dynamic|advance|progressive|sophisticated)\b/gi,
      /\b(ultimate|signature|platinum|diamond|titanium|carbon|black|white|red|blue)\b/gi
    ];
    
    cars.forEach(car => {
      // Check lots for trim levels
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach((lot: any) => {
          if (lot.details && lot.details.badge && typeof lot.details.badge === 'string') {
            const badge = lot.details.badge.toLowerCase();
            trimLevelPatterns.forEach(pattern => {
              const matches = badge.match(pattern);
              if (matches) {
                matches.forEach(match => {
                  const trimLevel = match.trim();
                  if (trimLevel.length > 2) {
                    currentTrimLevels.add(trimLevel.charAt(0).toUpperCase() + trimLevel.slice(1));
                  }
                });
              }
            });
          }
        });
      }
      
      // Check title for trim levels
      if (car.title && typeof car.title === 'string') {
        const title = car.title.toLowerCase();
        trimLevelPatterns.forEach(pattern => {
          const matches = title.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const trimLevel = match.trim();
              if (trimLevel.length > 2) {
                currentTrimLevels.add(trimLevel.charAt(0).toUpperCase() + trimLevel.slice(1));
              }
            });
          }
        });
      }
    });
    
    console.log('🔍 Actual trim levels found in current car data:', Array.from(currentTrimLevels).sort());
    
    if (currentTrimLevels.size > 0) {
      return Array.from(currentTrimLevels)
        .sort()
        .map(trim => ({ value: trim, label: trim }));
    }
    
    // If no current data, provide comprehensive trim level fallback
    console.log('⚠️ No trim levels found in current data, providing fallback');
    const fallbackTrimLevels = [
      { value: 'Premium', label: 'Premium' },
      { value: 'Prestige', label: 'Prestige' },
      { value: 'Comfort', label: 'Comfort' },
      { value: 'Luxury', label: 'Luxury' },
      { value: 'Sport', label: 'Sport' },
      { value: 'Executive', label: 'Executive' },
      { value: 'Business', label: 'Business' },
      { value: 'Exclusive', label: 'Exclusive' },
      { value: 'Elite', label: 'Elite' },
      { value: 'Deluxe', label: 'Deluxe' },
      { value: 'Standard', label: 'Standard' },
      { value: 'Base', label: 'Base' },
      { value: 'Limited', label: 'Limited' },
      { value: 'Special', label: 'Special Edition' },
      { value: 'Design', label: 'Design' },
      { value: 'Style', label: 'Style' },
      { value: 'Elegance', label: 'Elegance' },
      { value: 'Dynamic', label: 'Dynamic' },
      { value: 'Advance', label: 'Advance' },
      { value: 'Progressive', label: 'Progressive' }
    ];
    
    return fallbackTrimLevels;
  };

  const fetchGrades = async (manufacturerId?: string, modelId?: string, generationId?: string): Promise<{ value: string; label: string; count?: number }[]> => {
    const cacheKey = `${manufacturerId || ''}-${modelId || ''}-${generationId || ''}`;
    
    // Always return fallback instantly for manufacturer-only filtering for speed
    if (!modelId && !generationId && manufacturerId) {
      const fallback = getFallbackGrades(manufacturerId);
      // Apply categorization to fallback grades
      const categorizedFallback = categorizeAndOrganizeGrades(fallback);
      const organizedFallback = flattenCategorizedGrades(categorizedFallback);
      
      // Start async fetch to update cache but don't wait
      setTimeout(() => {
        if (!gradesCache[cacheKey]) {
          _fetchGradesAsync(manufacturerId, modelId, generationId, cacheKey);
        }
      }, 0);
      return organizedFallback;
    }
    
    // Use cache if available
    if (gradesCache[cacheKey]) {
      return gradesCache[cacheKey];
    }

    // For specific model/generation, fetch directly
    return _fetchGradesAsync(manufacturerId, modelId, generationId, cacheKey);
  };

  const _fetchGradesAsync = async (manufacturerId?: string, modelId?: string, generationId?: string, cacheKey?: string): Promise<{ value: string; label: string; count?: number }[]> => {
    try {
      const key = cacheKey || `${manufacturerId || ''}-${modelId || ''}-${generationId || ''}`;
      
      // Build filters - only include valid values
      const filters: any = { per_page: '200' }; // Increased for better grade coverage
      if (manufacturerId) filters.manufacturer_id = manufacturerId;
      if (modelId) filters.model_id = modelId;
      if (generationId) filters.generation_id = generationId;

      console.log('🔍 Fetching grades with filters:', filters);
      const data = await makeSecureAPICall('cars', filters);
      
      const cars = data.data || [];
      console.log('🔍 Found', cars.length, 'cars for grade extraction');
      
      if (cars.length === 0) {
        const fallback = getFallbackGrades(manufacturerId);
        setGradesCache(prev => ({ ...prev, [key]: fallback }));
        return fallback;
      }
      
      // Extract unique grades from multiple sources (like encar.com approach)
      const gradesMap = new Map<string, number>();
      
      cars.forEach((car: any) => {
        // Primary source: lots array grade_iaai from API
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.grade_iaai && typeof lot.grade_iaai === 'string' && lot.grade_iaai.trim()) {
              const cleanGrade = lot.grade_iaai.trim();
              gradesMap.set(cleanGrade, (gradesMap.get(cleanGrade) || 0) + 1);
            }
          });
        }
        
        // Secondary source: badge from lots details (like encar.com trim levels)
        if (car.lots && Array.isArray(car.lots)) {
          car.lots.forEach((lot: any) => {
            if (lot.details && lot.details.badge && typeof lot.details.badge === 'string' && lot.details.badge.trim()) {
              const badge = lot.details.badge.trim();
              gradesMap.set(badge, (gradesMap.get(badge) || 0) + 1);
            }
          });
        }
        
        // Tertiary source: engine name (only meaningful engine variants)
        if (car.engine && car.engine.name && typeof car.engine.name === 'string' && car.engine.name.trim()) {
          const engineName = car.engine.name.trim();
          // Only include meaningful engine variants (like 45 TDI, 35 TDI)
          // Exclude engine codes (like CSU, DBP) and pure numbers
          if (engineName.length > 2 && 
              !/^\d+\.?\d*$/.test(engineName) && // Not just numbers
              !/^[A-Z]{2,4}$/.test(engineName) && // Not engine codes like CSU, DBP
              /^(?:\d+\s*)?(?:TDI|TFSI|TSI|FSI|CDI|CGI|AMG|d|i|e|h|hybrid|electric|e-tron|phev)/i.test(engineName)) { // Must contain engine type
            gradesMap.set(engineName, (gradesMap.get(engineName) || 0) + 1);
          }
        }
        
        // Quaternary source: extract meaningful engine variants from title
        if (car.title && typeof car.title === 'string') {
          const title = car.title.toLowerCase();
          
          // Extract meaningful engine variants (like 45 TDI, 35 TDI)
          const engineVariantPatterns = [
            /\b(\d+\s*(?:tdi|tfsi|tsi|fsi|cdi|cgi))\b/gi, // 45 TDI, 35 TFSI, etc.
            /\b(amg|m|rs|s|gt|gts|gti|r|n|st)\b/gi, // Performance variants
            /\b(hybrid|electric|e-tron|phev|ev)\b/gi, // Electric/hybrid
            /\b(premium|luxury|sport|exclusive|elite|prestige|comfort|deluxe)\b/gi // Trim levels
          ];
          
          engineVariantPatterns.forEach(pattern => {
            const matches = title.match(pattern);
            if (matches) {
              matches.forEach(match => {
                const cleanMatch = match.trim();
                if (cleanMatch && cleanMatch.length > 0) {
                  gradesMap.set(cleanMatch, (gradesMap.get(cleanMatch) || 0) + 1);
                }
              });
            }
          });
        }
      });

      // Debug: Log what we found
      console.log('🔍 Raw variant values found:', Array.from(gradesMap.keys()));
      console.log('🔍 Total cars processed:', cars.length);
      console.log('🔍 Cars with lots:', cars.filter(car => car.lots && car.lots.length > 0).length);

      // Filter out engine codes and non-meaningful variants
      const invalidGrades = new Set(['unknown', 'n/a', 'none', '', 'null', 'undefined', 'basic', 'standard']);
      
      // Function to check if a variant is meaningful (not an engine code)
      const isMeaningfulVariant = (variant: string): boolean => {
        const lowerVariant = variant.toLowerCase();
        
        // Exclude if it's in invalid list
        if (invalidGrades.has(lowerVariant)) return false;
        
        // Exclude engine codes (2-4 letter codes like DLH, DPA, CSU, etc.)
        if (/^[A-Z]{2,4}$/i.test(variant)) return false;
        
        // Exclude combinations of engine codes (like "DLH DPA")
        if (/^[A-Z]{2,4}\s+[A-Z]{2,4}$/i.test(variant)) return false;
        
        // Exclude pure numbers
        if (/^\d+\.?\d*$/.test(variant)) return false;
        
        // Must contain meaningful content (engine types, trim levels, etc.)
        const meaningfulPatterns = [
          /tdi|tfsi|tsi|fsi|cdi|cgi/i, // Engine types
          /amg|m|rs|s|gt|gts|gti|r|n|st/i, // Performance variants
          /hybrid|electric|e-tron|phev|ev/i, // Electric/hybrid
          /premium|luxury|sport|exclusive|elite|prestige|comfort|deluxe/i, // Trim levels
          /\d+\s*(tdi|tfsi|tsi|fsi|cdi|cgi)/i // Number + engine type (like 45 TDI)
        ];
        
        return meaningfulPatterns.some(pattern => pattern.test(variant));
      };
      
      // Debug: Show what's being filtered out
      const allVariants = Array.from(gradesMap.keys());
      const filteredOut = allVariants.filter(variant => !isMeaningfulVariant(variant));
      if (filteredOut.length > 0) {
        console.log('🚫 Filtered out engine codes:', filteredOut);
      }
      
      const rawGrades = Array.from(gradesMap.entries())
        .filter(([value]) => isMeaningfulVariant(value))
        .map(([value, count]) => ({
          value,
          label: value,
          count
        }));

      console.log('📊 Raw extracted variants:', rawGrades.length, 'unique variants:', rawGrades.slice(0, 10).map(g => `${g.value}(${g.count})`));
      
      // Apply categorization and organization
      const categorizedGrades = categorizeAndOrganizeGrades(rawGrades);
      const organizedGrades = flattenCategorizedGrades(categorizedGrades);
      
      console.log('🗂️ Organized into', categorizedGrades.length, 'categories');
      
      // If no variants found from API, try fallback
      if (organizedGrades.length === 0) {
        console.log('⚠️ No variants found from API, trying fallback...');
        const fallback = getFallbackGrades(manufacturerId);
        // Apply categorization to fallback grades
        const categorizedFallback = categorizeAndOrganizeGrades(fallback);
        const organizedFallback = flattenCategorizedGrades(categorizedFallback);
        console.log('🔄 Fallback variants:', organizedFallback);
        return organizedFallback;
      }
      
      const result = organizedGrades;
      setGradesCache(prev => ({ ...prev, [key]: result }));
      return result;
    } catch (err) {
      console.error("❌ Error fetching grades:", err);
      const fallback = getFallbackGrades(manufacturerId);
      // Apply categorization to fallback grades in error case too
      const categorizedFallback = categorizeAndOrganizeGrades(fallback);
      const organizedFallback = flattenCategorizedGrades(categorizedFallback);
      const key = cacheKey || `${manufacturerId || ''}-${modelId || ''}-${generationId || ''}`;
      setGradesCache(prev => ({ ...prev, [key]: organizedFallback }));
      return organizedFallback;
    }
  };



  // Fallback grades based on manufacturer - but only show grades that actually exist in the data
  // Helper function to extract generations from car data
  const extractGenerationsFromCars = (cars: Car[]): Generation[] => {
    const generationsMap = new Map<string, { id: number; name: string; car_count: number; from_year?: number; to_year?: number; manufacturer_name?: string; model_name?: string }>();
    let carsWithGenerations = 0;
    let carsWithoutGenerations = 0;
    const currentYear = new Date().getFullYear();
    
    cars.forEach(car => {
      // Only use generation if it exists in car data
      if (car.generation && car.generation.name && car.generation.id) {
        const generationName = car.generation.name.trim();
        const generationId = car.generation.id;
        
        if (generationName) {
          carsWithGenerations++;
          const key = generationName.toLowerCase();
          const existing = generationsMap.get(key);
          
          if (existing) {
            existing.car_count++;
            // Fixed: Validate that car year is reasonable before using it
            if (car.year && car.year >= 1980 && car.year <= currentYear + 1) {
              if (!existing.from_year || car.year < existing.from_year) {
                existing.from_year = car.year;
              }
              if (!existing.to_year || car.year > existing.to_year) {
                existing.to_year = car.year;
              }
            }
          } else {
            generationsMap.set(key, {
              id: generationId,
              name: generationName,
              car_count: 1,
              // Store manufacturer and model names for real year data lookup
              manufacturer_name: car.manufacturer?.name,
              model_name: car.model?.name,
              // Fixed: Only set year if it's valid
              from_year: car.year && car.year >= 1980 && car.year <= currentYear + 1 ? car.year : undefined,
              to_year: car.year && car.year >= 1980 && car.year <= currentYear + 1 ? car.year : undefined
            });
          }
        }
      } else {
        carsWithoutGenerations++;
      }
    });
    
    const generations = Array.from(generationsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`📊 Cars with generations: ${carsWithGenerations}, Cars without generations: ${carsWithoutGenerations}`);
    
    return generations.map(g => {
      // Try to enhance with real generation year data
      let realYearData: { from_year?: number; to_year?: number } | null = null;
      if (g.manufacturer_name && g.model_name) {
        realYearData = findGenerationYears(g.manufacturer_name, g.model_name, g.name);
        if (realYearData) {
          console.log(`🎯 Found real generation year data for ${g.manufacturer_name} ${g.model_name} ${g.name}: ${realYearData.from_year}-${realYearData.to_year}`);
        }
      }
      
      return {
        ...g,
        // Priority: 1. Car-derived years, 2. Real generation data
        from_year: g.from_year || realYearData?.from_year,
        to_year: g.to_year || realYearData?.to_year,
        cars_qty: g.car_count
      };
    });
  };

  const getFallbackGrades = (manufacturerId?: string): { value: string; label: string; count?: number }[] => {
    // Extract variants from multiple sources (like encar.com approach)
    const currentGrades = new Set<string>();
    
    cars.forEach(car => {
      // Primary source: lots array grade_iaai from API
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach(lot => {
          if (lot.grade_iaai && typeof lot.grade_iaai === 'string' && lot.grade_iaai.trim()) {
            currentGrades.add(lot.grade_iaai.trim());
          }
        });
      }
      
      // Secondary source: badge from lots details
      if (car.lots && Array.isArray(car.lots)) {
        car.lots.forEach((lot: any) => {
          if (lot.details && lot.details.badge && typeof lot.details.badge === 'string' && lot.details.badge.trim()) {
            currentGrades.add(lot.details.badge.trim());
          }
        });
      }
      
      // Tertiary source: engine name (only meaningful engine variants)
      if (car.engine && car.engine.name && typeof car.engine.name === 'string' && car.engine.name.trim()) {
        const engineName = car.engine.name.trim();
        // Only include meaningful engine variants (like 45 TDI, 35 TDI)
        // Exclude engine codes (like CSU, DBP) and pure numbers
        if (engineName.length > 2 && 
            !/^\d+\.?\d*$/.test(engineName) && // Not just numbers
            !/^[A-Z]{2,4}$/.test(engineName) && // Not engine codes like CSU, DBP
            /^(?:\d+\s*)?(?:TDI|TFSI|TSI|FSI|CDI|CGI|AMG|d|i|e|h|hybrid|electric|e-tron|phev)/i.test(engineName)) { // Must contain engine type
          currentGrades.add(engineName);
        }
      }
    });
    
    console.log('🔍 Actual variants found in current car data:', Array.from(currentGrades).sort());
    
    if (currentGrades.size > 0) {
      // Use actual variants from API data
      return Array.from(currentGrades)
        .sort()
        .map(grade => ({ value: grade, label: grade }));
    }
    
    // If no API data, provide comprehensive Korean-style fallback variants
    console.log('⚠️ No API variants found, providing Korean-style fallback variants');
    const koreanVariants = [
      { value: 'premium', label: 'Premium' },
      { value: 'luxury', label: 'Luxury' },
      { value: 'sport', label: 'Sport' },
      { value: 'exclusive', label: 'Exclusive' },
      { value: 'elite', label: 'Elite' },
      { value: 'prestige', label: 'Prestige' },
      { value: 'comfort', label: 'Comfort' },
      { value: 'deluxe', label: 'Deluxe' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'electric', label: 'Electric' }
    ];
    
    return koreanVariants;
  };

  // Function to get accurate car counts for a generation
  const getAccurateGenerationCount = async (generationId: string): Promise<number> => {
    try {
      console.log(`🔍 Getting count for generation ${generationId}...`);
      const data = await makeSecureAPICall("cars", {
        generation_id: generationId,
        per_page: "1",
        simple_paginate: "1"
      });
      const count = data.meta?.total || 0;
      console.log(`✅ Generation ${generationId} count: ${count}`);
      return count;
    } catch (err) {
      console.error(`❌ Error getting count for generation ${generationId}:`, err);
      
      // Fallback: try to get cars and count them manually
      try {
        console.log(`🔄 Trying fallback for generation ${generationId}...`);
        const carData = await makeSecureAPICall("cars", {
          generation_id: generationId,
          per_page: "1000"
        });
        const manualCount = carData.data?.length || 0;
        console.log(`✅ Fallback count for generation ${generationId}: ${manualCount}`);
        return manualCount;
      } catch (fallbackErr) {
        console.error(`❌ Fallback also failed for generation ${generationId}:`, fallbackErr);
        return 0;
      }
    }
  };

  // Function to get real-time count for any category combination
  const getCategoryCount = async (filters: {
    manufacturer_id?: string;
    model_id?: string;
    generation_id?: string;
    grade_iaai?: string;
    [key: string]: any;
  }): Promise<number> => {
    try {
      const data = await makeSecureAPICall("cars", {
        ...filters,
        per_page: "1",
        simple_paginate: "1"
      });
      return data.meta?.total || 0;
    } catch (err) {
      console.error(`❌ Error getting category count:`, err);
      return 0;
    }
  };

  // Function to get all generations for a manufacturer
  const fetchAllGenerationsForManufacturer = async (manufacturerId: string): Promise<Generation[]> => {
    try {
      console.log(`🔍 Fetching all generations for manufacturer ${manufacturerId}`);
      
      // First get all models for the manufacturer
      const models = await fetchModels(manufacturerId);
      console.log(`📊 Found ${models.length} models, fetching generations for each...`);
      
      const allGenerations: Generation[] = [];
      const generationMap = new Map<number, Generation>();
      
      // Fetch generations for each model
      for (const model of models) {
        try {
          const modelGenerations = await fetchGenerations(model.id.toString());
          modelGenerations.forEach(gen => {
            if (!generationMap.has(gen.id)) {
              generationMap.set(gen.id, gen);
              allGenerations.push(gen);
            }
          });
        } catch (err) {
          // Silent fallback
        }
      }
      
      // Get real counts by fetching cars for each generation
      const generationsWithRealCounts = await Promise.all(
        allGenerations.map(async (g) => {
          try {
            // Get cars for this specific generation with manufacturer filter
            const carData = await makeSecureAPICall("cars", {
              manufacturer_id: manufacturerId,
              generation_id: g.id.toString(),
              per_page: "1",
              simple_paginate: "1"
            });
            
            const realCount = carData.meta?.total || 0;
            
            return {
              ...g,
              car_count: realCount,
              cars_qty: realCount
            };
          } catch (err) {
            // Fallback to original count
            return {
              ...g,
              cars_qty: g.car_count || 0
            };
          }
        })
      );
      
      return generationsWithRealCounts.sort((a, b) => a.name.localeCompare(b.name));
      
    } catch (err) {
      return [];
    }
  };

  const fetchAllCars = async (
    newFilters: APIFilters = filters
  ): Promise<any[]> => {
    try {
      // Create API filters without pagination to get all cars
      const apiFilters = {
        ...newFilters,
        // Remove pagination parameters to get all cars
        page: undefined,
        per_page: "1000", // Increase limit to ensure we get all cars
        simple_paginate: "0",
      };
      
      // Remove grade_iaai and trim_level from server request for client-side filtering
      const selectedVariant = newFilters.grade_iaai;
      const selectedTrimLevel = newFilters.trim_level;
      delete apiFilters.grade_iaai;
      delete apiFilters.trim_level;

      console.log(`🔄 Fetching ALL cars for global sorting with filters:`, apiFilters);
      const data: APIResponse = await makeSecureAPICall("cars", apiFilters);

      // Apply client-side variant filtering if a variant is selected
      let filteredCars = data.data || [];
      if (selectedVariant && selectedVariant !== 'all') {
        console.log(`🔍 Applying client-side variant filter: "${selectedVariant}"`);
        
        filteredCars = filteredCars.filter(car => {
          if (car.lots && Array.isArray(car.lots)) {
            return car.lots.some(lot => {
              if (lot.grade_iaai && lot.grade_iaai.trim() === selectedVariant) {
                return true;
              }
              if (lot.details && lot.details.badge && lot.details.badge.trim() === selectedVariant) {
                return true;
              }
              if (car.engine && car.engine.name && car.engine.name.trim() === selectedVariant) {
                return true;
              }
              if (car.title && car.title.toLowerCase().includes(selectedVariant.toLowerCase())) {
                return true;
              }
              return false;
            });
          }
          return false;
        });
      }

      // Apply client-side trim level filtering if a trim level is selected
      if (selectedTrimLevel && selectedTrimLevel !== 'all') {
        console.log(`🔍 Applying client-side trim level filter: "${selectedTrimLevel}"`);
        
        filteredCars = filteredCars.filter(car => {
          if (car.lots && Array.isArray(car.lots)) {
            const hasMatchInLots = car.lots.some(lot => {
              if (lot.details && lot.details.badge && 
                  lot.details.badge.toLowerCase().includes(selectedTrimLevel.toLowerCase())) {
                return true;
              }
              if (lot.grade_iaai && 
                  lot.grade_iaai.toLowerCase().includes(selectedTrimLevel.toLowerCase())) {
                return true;
              }
              return false;
            });
            if (hasMatchInLots) return true;
          }
          if (car.title && car.title.toLowerCase().includes(selectedTrimLevel.toLowerCase())) {
            return true;
          }
          return false;
        });
      }

      console.log(`✅ Fetched ${filteredCars.length} cars for global sorting`);
      return filteredCars;
      
    } catch (err: any) {
      console.error("❌ API Error fetching all cars:", err);
      
      if (err.message === "RATE_LIMITED") {
        // Retry once after rate limit
        try {
          await delay(2000);
          return fetchAllCars(newFilters);
        } catch (retryErr) {
          console.error("❌ Retry failed:", retryErr);
        }
      }
      
      // Use fallback car data when API fails - but only if no specific brand filter is applied
      if (newFilters.manufacturer_id && 
          newFilters.manufacturer_id !== 'all' && 
          newFilters.manufacturer_id !== '' &&
          newFilters.manufacturer_id !== undefined &&
          newFilters.manufacturer_id !== null) {
        console.log("❌ API failed for brand-specific global sorting, not using fallback cars");
        return [];
      }
      
      // Use fallback cars for global sorting when API fails
      console.log("❌ API failed for global sorting, using fallback cars");
      const fallbackCars = createFallbackCars(newFilters);
      console.log(`✅ Fallback Success - Created ${fallbackCars.length} fallback cars for global sorting`);
      return fallbackCars;
    }
  };

  const loadMore = async () => {
    if (!hasMorePages || loading) return;

    setLoading(true);
    try {
      await fetchCars(currentPage + 1, filters, false);
    } catch (err) {
      console.error("❌ Load more error:", err);
      setError(err instanceof Error ? err.message : "Failed to load more cars");
    } finally {
      setLoading(false);
    }
  };
  return {
    cars,
    setCars, // ✅ Export setCars so it can be used in components
    loading,
    error,
    currentPage,
    totalCount,
    setTotalCount, // ✅ Export setTotalCount for optimized filtering
    hasMorePages,
    fetchCars,
    fetchAllCars, // ✅ Export new function for global sorting
    filters,
    setFilters,
    fetchManufacturers,
    fetchModels,
    fetchGenerations,
    fetchAllGenerationsForManufacturer, // ✅ Export new function
    getCategoryCount, // ✅ Export new function for real-time counts
    fetchCarById,
    fetchCarCounts,
    fetchFilterCounts,
    fetchKoreaDuplicates,
    fetchGrades,
    fetchTrimLevels,
    loadMore,
  };
};
