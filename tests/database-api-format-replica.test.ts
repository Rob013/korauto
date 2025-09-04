import { describe, it, expect, beforeEach } from 'vitest';

// Mock database car data
const mockDatabaseCar = {
  id: 'db_car_123',
  api_id: 'ext_api_456',
  make: 'BMW',
  model: '3 Series',
  year: 2020,
  price: 25000,
  vin: '1BMW3SERIES2020123',
  fuel: 'Petrol',
  transmission: 'Automatic',
  color: 'Black',
  condition: 'Good',
  lot_number: 'LOT123',
  mileage: '50000',
  images: ['image1.jpg', 'image2.jpg'],
  car_data: {
    title: '2020 BMW 3 Series M340i',
    status: 'available',
    sale_status: 'active',
    final_price: 26500,
    estimate_repair_price: 1500,
    pre_accident_price: 28000,
    clean_wholesale_price: 24000,
    actual_cash_value: 25000,
    sale_date: '2024-01-15',
    seller: 'BMW Dealer',
    seller_type: 'dealer',
    detailed_title: 'Clean Title',
    damage: { main: 'Front', second: 'Minor' },
    keys_available: true,
    airbags: 'All deployed',
    grade_iaai: 'B',
    domain: { name: 'copart' },
    engine_volume: 3000,
    original_price: 45000,
    badge: 'M340i',
    description_ko: '2020 BMW 3시리즈',
    description_en: '2020 BMW 3 Series',
    is_leasing: false,
    sell_type: 'auction',
    equipment: { navigation: true, sunroof: true },
    options: {
      type: 'luxury',
      standard: ['leather seats', 'automatic climate'],
      etc: ['sport package'],
      choice: ['heated seats'],
      tuning: []
    },
    seats_count: 5,
    body_type: 'Sedan',
    engine: 'B58',
    drive_wheel: 'RWD',
    vehicle_type: 'Passenger',
    cylinders: 6
  },
  lot_data: {
    insurance: {
      accident_history: 'Minor accidents',
      repair_count: '2',
      total_loss: 'No',
      repair_cost: '3000',
      flood_damage: 'No',
      own_damage: '1000',
      other_damage: '2000'
    },
    insurance_v2: {
      regDate: '2020-01-01',
      year: 2020,
      maker: 'BMW',
      displacement: 3000,
      firstDate: '2020-01-01',
      model: '3 Series',
      myAccidentCnt: 1,
      otherAccidentCnt: 1,
      ownerChangeCnt: 2,
      robberCnt: 0,
      totalLossCnt: 0,
      floodTotalLossCnt: 0,
      government: 0,
      business: 1,
      loan: 0,
      carNoChangeCnt: 0,
      myAccidentCost: 1000,
      otherAccidentCost: 2000,
      accidentCnt: 2,
      accidents: []
    },
    inspect: {
      accident_summary: {
        main_framework: 'Good',
        exterior1rank: 'B',
        exterior2rank: 'B',
        simple_repair: 'Yes',
        accident: 'Minor'
      },
      outer: {
        front: ['scratch', 'dent'],
        rear: ['good']
      },
      inner: {
        dashboard: 'good',
        seats: 'excellent'
      }
    },
    details: {
      first_registration: {
        year: 2020,
        month: 1,
        day: 15
      },
      comment: 'Well maintained vehicle',
      inspect_outer: [
        {
          type: { code: 'FR', title: 'Front' },
          statusTypes: [{ code: 'SCR', title: 'Scratch' }],
          attributes: ['minor']
        }
      ]
    }
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  last_api_sync: '2024-01-01T00:00:00Z'
};

// Enhanced conversion function to convert database car to external API format
const convertDatabaseCarToApiFormat = (dbCar: any) => {
  const carData = dbCar.car_data || {};
  const lotData = dbCar.lot_data || {};
  
  let normalImages = [];
  let bigImages = [];
  
  if (dbCar.images && Array.isArray(dbCar.images)) {
    normalImages = dbCar.images;
    bigImages = dbCar.images;
  } else if (dbCar.image_url) {
    normalImages = [dbCar.image_url];
    bigImages = [dbCar.image_url];
  } else if (carData.images) {
    if (Array.isArray(carData.images)) {
      normalImages = carData.images;
      bigImages = carData.images;
    } else if (carData.images.normal) {
      normalImages = carData.images.normal || [];
      bigImages = carData.images.big || carData.images.normal || [];
    }
  }
  
  const mileageKm = dbCar.mileage ? (typeof dbCar.mileage === 'string' ? parseInt(dbCar.mileage.replace(/[^\d]/g, '')) || 0 : dbCar.mileage) : 0;
  
  const enhancedLot = {
    buy_now: dbCar.price || carData.price || 0,
    lot: dbCar.lot_number || carData.lot_number || '',
    odometer: { km: mileageKm },
    images: { 
      normal: normalImages,
      big: bigImages
    },
    status: carData.status || 'available',
    sale_status: carData.sale_status || 'active',
    final_price: carData.final_price,
    estimate_repair_price: carData.estimate_repair_price,
    pre_accident_price: carData.pre_accident_price,
    clean_wholesale_price: carData.clean_wholesale_price,
    actual_cash_value: carData.actual_cash_value,
    sale_date: carData.sale_date,
    seller: carData.seller,
    seller_type: carData.seller_type,
    detailed_title: carData.detailed_title,
    damage: carData.damage,
    keys_available: carData.keys_available,
    airbags: carData.airbags,
    grade_iaai: carData.grade_iaai || lotData.grade_iaai,
    domain: carData.domain || { name: 'database' },
    external_id: dbCar.api_id,
    insurance: lotData.insurance || carData.insurance,
    insurance_v2: lotData.insurance_v2 || carData.insurance_v2,
    location: carData.location || {
      location: dbCar.location,
      raw: dbCar.location
    },
    inspect: carData.inspect || lotData.inspect,
    details: {
      engine_volume: carData.engine_volume,
      original_price: carData.original_price,
      year: dbCar.year,
      badge: carData.badge || lotData.badge,
      comment: carData.comment,
      description_ko: carData.description_ko,
      description_en: carData.description_en,
      is_leasing: carData.is_leasing,
      sell_type: carData.sell_type,
      equipment: carData.equipment,
      options: carData.options,
      inspect_outer: carData.inspect_outer,
      seats_count: carData.seats_count,
      ...lotData.details
    }
  };

  return {
    id: dbCar.id,
    manufacturer: { id: 0, name: dbCar.make },
    model: { id: 0, name: dbCar.model },
    year: dbCar.year,
    title: dbCar.title || carData.title || `${dbCar.year} ${dbCar.make} ${dbCar.model}`,
    vin: dbCar.vin || carData.vin || '',
    fuel: dbCar.fuel ? { id: 0, name: dbCar.fuel } : (carData.fuel ? { id: 0, name: carData.fuel } : undefined),
    transmission: dbCar.transmission ? { id: 0, name: dbCar.transmission } : (carData.transmission ? { id: 0, name: carData.transmission } : undefined),
    color: dbCar.color ? { id: 0, name: dbCar.color } : (carData.color ? { id: 0, name: carData.color } : undefined),
    location: dbCar.location || carData.location || '',
    lot_number: dbCar.lot_number || carData.lot_number || '',
    image_url: normalImages[0] || '',
    condition: dbCar.condition || carData.condition,
    status: carData.status,
    sale_status: carData.sale_status,
    final_price: carData.final_price,
    body_type: carData.body_type ? { id: 0, name: carData.body_type } : undefined,
    engine: carData.engine ? { id: 0, name: carData.engine } : undefined,
    drive_wheel: carData.drive_wheel,
    vehicle_type: carData.vehicle_type ? { id: 0, name: carData.vehicle_type } : undefined,
    cylinders: carData.cylinders,
    lots: [enhancedLot],
    isFromDatabase: true
  };
};

describe('Database to External API Format Conversion', () => {
  describe('convertDatabaseCarToApiFormat', () => {
    it('should convert database car to match external API format exactly', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);

      // Test basic car fields
      expect(convertedCar.id).toBe('db_car_123');
      expect(convertedCar.manufacturer).toEqual({ id: 0, name: 'BMW' });
      expect(convertedCar.model).toEqual({ id: 0, name: '3 Series' });
      expect(convertedCar.year).toBe(2020);
      expect(convertedCar.title).toBe('2020 BMW 3 Series M340i');
      expect(convertedCar.vin).toBe('1BMW3SERIES2020123');
      expect(convertedCar.fuel).toEqual({ id: 0, name: 'Petrol' });
      expect(convertedCar.transmission).toEqual({ id: 0, name: 'Automatic' });
      expect(convertedCar.color).toEqual({ id: 0, name: 'Black' });
      expect(convertedCar.condition).toBe('Good');
      expect(convertedCar.lot_number).toBe('LOT123');
      expect(convertedCar.image_url).toBe('image1.jpg');
      expect(convertedCar.isFromDatabase).toBe(true);
    });

    it('should create enhanced lots array with all external API fields', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);
      const lot = convertedCar.lots[0];

      // Test basic lot fields
      expect(lot.buy_now).toBe(25000);
      expect(lot.lot).toBe('LOT123');
      expect(lot.odometer).toEqual({ km: 50000 });
      expect(lot.images).toEqual({
        normal: ['image1.jpg', 'image2.jpg'],
        big: ['image1.jpg', 'image2.jpg']
      });

      // Test enhanced lot fields from car_data
      expect(lot.status).toBe('available');
      expect(lot.sale_status).toBe('active');
      expect(lot.final_price).toBe(26500);
      expect(lot.estimate_repair_price).toBe(1500);
      expect(lot.pre_accident_price).toBe(28000);
      expect(lot.clean_wholesale_price).toBe(24000);
      expect(lot.actual_cash_value).toBe(25000);
      expect(lot.sale_date).toBe('2024-01-15');
      expect(lot.seller).toBe('BMW Dealer');
      expect(lot.seller_type).toBe('dealer');
      expect(lot.detailed_title).toBe('Clean Title');
      expect(lot.damage).toEqual({ main: 'Front', second: 'Minor' });
      expect(lot.keys_available).toBe(true);
      expect(lot.airbags).toBe('All deployed');
      expect(lot.grade_iaai).toBe('B');
      expect(lot.domain).toEqual({ name: 'copart' });
      expect(lot.external_id).toBe('ext_api_456');
    });

    it('should include complete insurance data from lot_data', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);
      const lot = convertedCar.lots[0];

      expect(lot.insurance).toEqual({
        accident_history: 'Minor accidents',
        repair_count: '2',
        total_loss: 'No',
        repair_cost: '3000',
        flood_damage: 'No',
        own_damage: '1000',
        other_damage: '2000'
      });

      expect(lot.insurance_v2).toEqual({
        regDate: '2020-01-01',
        year: 2020,
        maker: 'BMW',
        displacement: 3000,
        firstDate: '2020-01-01',
        model: '3 Series',
        myAccidentCnt: 1,
        otherAccidentCnt: 1,
        ownerChangeCnt: 2,
        robberCnt: 0,
        totalLossCnt: 0,
        floodTotalLossCnt: 0,
        government: 0,
        business: 1,
        loan: 0,
        carNoChangeCnt: 0,
        myAccidentCost: 1000,
        otherAccidentCost: 2000,
        accidentCnt: 2,
        accidents: []
      });
    });

    it('should include complete inspection data', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);
      const lot = convertedCar.lots[0];

      expect(lot.inspect).toEqual({
        accident_summary: {
          main_framework: 'Good',
          exterior1rank: 'B',
          exterior2rank: 'B',
          simple_repair: 'Yes',
          accident: 'Minor'
        },
        outer: {
          front: ['scratch', 'dent'],
          rear: ['good']
        },
        inner: {
          dashboard: 'good',
          seats: 'excellent'
        }
      });
    });

    it('should include complete details from car_data and lot_data', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);
      const lot = convertedCar.lots[0];

      expect(lot.details.engine_volume).toBe(3000);
      expect(lot.details.original_price).toBe(45000);
      expect(lot.details.year).toBe(2020);
      expect(lot.details.badge).toBe('M340i');
      expect(lot.details.description_ko).toBe('2020 BMW 3시리즈');
      expect(lot.details.description_en).toBe('2020 BMW 3 Series');
      expect(lot.details.is_leasing).toBe(false);
      expect(lot.details.sell_type).toBe('auction');
      expect(lot.details.equipment).toEqual({ navigation: true, sunroof: true });
      expect(lot.details.options).toEqual({
        type: 'luxury',
        standard: ['leather seats', 'automatic climate'],
        etc: ['sport package'],
        choice: ['heated seats'],
        tuning: []
      });
      expect(lot.details.seats_count).toBe(5);
      expect(lot.details.first_registration).toEqual({
        year: 2020,
        month: 1,
        day: 15
      });
      expect(lot.details.comment).toBe('Well maintained vehicle');
    });

    it('should include all car-level external API fields', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);

      expect(convertedCar.status).toBe('available');
      expect(convertedCar.sale_status).toBe('active');
      expect(convertedCar.final_price).toBe(26500);
      expect(convertedCar.body_type).toEqual({ id: 0, name: 'Sedan' });
      expect(convertedCar.engine).toEqual({ id: 0, name: 'B58' });
      expect(convertedCar.drive_wheel).toBe('RWD');
      expect(convertedCar.vehicle_type).toEqual({ id: 0, name: 'Passenger' });
      expect(convertedCar.cylinders).toBe(6);
    });

    it('should handle cars with minimal data gracefully', () => {
      const minimalCar = {
        id: 'minimal_car',
        api_id: 'minimal_api',
        make: 'Toyota',
        model: 'Camry',
        year: 2018,
        price: 15000,
        car_data: {},
        lot_data: {}
      };

      const convertedCar = convertDatabaseCarToApiFormat(minimalCar);

      expect(convertedCar.id).toBe('minimal_car');
      expect(convertedCar.manufacturer).toEqual({ id: 0, name: 'Toyota' });
      expect(convertedCar.model).toEqual({ id: 0, name: 'Camry' });
      expect(convertedCar.year).toBe(2018);
      expect(convertedCar.title).toBe('2018 Toyota Camry');
      expect(convertedCar.lots).toHaveLength(1);
      expect(convertedCar.lots[0].buy_now).toBe(15000);
      expect(convertedCar.lots[0].status).toBe('available');
      expect(convertedCar.lots[0].sale_status).toBe('active');
      expect(convertedCar.isFromDatabase).toBe(true);
    });

    it('should handle image data from different sources', () => {
      const carWithImageUrl = {
        ...mockDatabaseCar,
        images: null,
        image_url: 'single_image.jpg'
      };

      const convertedCar = convertDatabaseCarToApiFormat(carWithImageUrl);
      expect(convertedCar.lots[0].images).toEqual({
        normal: ['single_image.jpg'],
        big: ['single_image.jpg']
      });
      expect(convertedCar.image_url).toBe('single_image.jpg');
    });

    it('should convert mileage from string to number properly', () => {
      const carWithStringMileage = {
        ...mockDatabaseCar,
        mileage: '75,000 km'
      };

      const convertedCar = convertDatabaseCarToApiFormat(carWithStringMileage);
      expect(convertedCar.lots[0].odometer.km).toBe(75000);
    });
  });

  describe('External API Compatibility', () => {
    it('should produce data structure identical to external API', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);

      // Verify all required external API fields exist
      expect(convertedCar).toHaveProperty('id');
      expect(convertedCar).toHaveProperty('manufacturer');
      expect(convertedCar).toHaveProperty('model');
      expect(convertedCar).toHaveProperty('year');
      expect(convertedCar).toHaveProperty('title');
      expect(convertedCar).toHaveProperty('vin');
      expect(convertedCar).toHaveProperty('fuel');
      expect(convertedCar).toHaveProperty('transmission');
      expect(convertedCar).toHaveProperty('color');
      expect(convertedCar).toHaveProperty('lots');

      // Verify lots array structure
      expect(convertedCar.lots).toBeInstanceOf(Array);
      expect(convertedCar.lots).toHaveLength(1);
      
      const lot = convertedCar.lots[0];
      expect(lot).toHaveProperty('buy_now');
      expect(lot).toHaveProperty('lot');
      expect(lot).toHaveProperty('odometer');
      expect(lot).toHaveProperty('images');
      expect(lot.images).toHaveProperty('normal');
      expect(lot.images).toHaveProperty('big');
      expect(lot.images.normal).toBeInstanceOf(Array);
      expect(lot.images.big).toBeInstanceOf(Array);
    });

    it('should ensure filtering compatibility with external API format', () => {
      const convertedCar = convertDatabaseCarToApiFormat(mockDatabaseCar);

      // Test fields used by catalog filters
      expect(convertedCar.manufacturer.name).toBe('BMW');
      expect(convertedCar.model.name).toBe('3 Series');
      expect(convertedCar.year).toBe(2020);
      expect(convertedCar.fuel?.name).toBe('Petrol');
      expect(convertedCar.transmission?.name).toBe('Automatic');
      expect(convertedCar.color?.name).toBe('Black');
      expect(convertedCar.lots[0].buy_now).toBe(25000);
      expect(convertedCar.lots[0].odometer.km).toBe(50000);
      expect(convertedCar.isFromDatabase).toBe(true);
    });
  });
});