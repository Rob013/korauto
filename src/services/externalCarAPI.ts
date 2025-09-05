// Enhanced External Car API Service for real car data integration
// Integrates with auctionsapi.com and provides comprehensive filtering similar to Encar.com

interface ExternalAPIConfig {
  baseUrl: string;
  apiKey: string;
  endpoints: {
    cars: string;
    manufacturers: string;
    models: string;
    generations: string;
    trims: string;
    grades: string;
  };
}

interface ExternalCar {
  id: string;
  manufacturer?: { name: string; id?: number };
  model?: { name: string; id?: number };
  year?: number;
  title?: string;
  vin?: string;
  lots?: Array<{
    buy_now?: number;
    bid?: number;
    final_price?: number;
    lot?: string;
    odometer?: { km?: number; miles?: number };
    images?: { normal?: string[]; big?: string[] };
    condition?: { name?: string };
    keys_available?: boolean;
    status?: { name?: string };
  }>;
  fuel?: { name: string };
  transmission?: { name: string };
  color?: { name: string };
  body_type?: { name: string };
  engine?: { 
    displacement?: number;
    type?: string;
    power?: number;
    torque?: number;
  };
  features?: string[];
  location?: string;
  grade?: string;
  trim?: string;
  generation?: string;
}

interface FilterOptions {
  manufacturers: Array<{ id: string; name: string; count?: number }>;
  models: Array<{ id: string; name: string; manufacturer_id: string; count?: number }>;
  generations: Array<{ id: string; name: string; model_id: string; from_year: number; to_year: number; count?: number }>;
  trims: Array<{ id: string; name: string; model_id: string; count?: number }>;
  grades: Array<{ id: string; name: string; category?: string; count?: number }>;
  bodyTypes: Array<{ id: string; name: string; count?: number }>;
  fuelTypes: Array<{ id: string; name: string; count?: number }>;
  transmissions: Array<{ id: string; name: string; count?: number }>;
  colors: Array<{ id: string; name: string; count?: number }>;
  locations: Array<{ id: string; name: string; count?: number }>;
}

interface CarFilters {
  manufacturer_id?: string;
  model_id?: string;
  generation_id?: string;
  trim?: string;
  grade?: string;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  color?: string;
  location?: string;
  year_from?: number;
  year_to?: number;
  price_from?: number;
  price_to?: number;
  mileage_from?: number;
  mileage_to?: number;
  condition?: string;
  features?: string[];
  search?: string;
}

class ExternalCarAPIService {
  private config: ExternalAPIConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.config = {
      baseUrl: 'https://auctionsapi.com/api',
      apiKey: 'd00985c77981fe8d26be16735f932ed1',
      endpoints: {
        cars: '/cars',
        manufacturers: '/manufacturers',
        models: '/models',
        generations: '/generations',
        trims: '/trims',
        grades: '/grades'
      }
    };
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const url = new URL(this.config.baseUrl + endpoint);
    url.searchParams.append('api_key', this.config.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'KorAuto/2.0'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error(`External API error for ${endpoint}:`, error);
      return this.getFallbackData(endpoint, params);
    }
  }

  private getFallbackData(endpoint: string, params: any): any {
    console.log(`🔄 Using fallback data for ${endpoint}`);
    
    switch (endpoint) {
      case '/cars':
        return this.generateFallbackCars(params);
      case '/manufacturers':
        return this.generateFallbackManufacturers();
      case '/models':
        return this.generateFallbackModels(params.manufacturer_id);
      case '/generations':
        return this.generateFallbackGenerations(params.model_id);
      case '/trims':
        return this.generateFallbackTrims(params.model_id);
      case '/grades':
        return this.generateFallbackGrades(params.model_id);
      default:
        return { data: [], total: 0 };
    }
  }

  async fetchCars(filters: CarFilters = {}, page: number = 1, perPage: number = 24): Promise<{
    cars: ExternalCar[];
    total: number;
    hasMore: boolean;
  }> {
    const params = {
      page: page.toString(),
      per_page: perPage.toString(),
      ...filters,
      ...(filters.year_from && { year_from: filters.year_from.toString() }),
      ...(filters.year_to && { year_to: filters.year_to.toString() }),
      ...(filters.price_from && { price_from: filters.price_from.toString() }),
      ...(filters.price_to && { price_to: filters.price_to.toString() }),
      ...(filters.mileage_from && { mileage_from: filters.mileage_from.toString() }),
      ...(filters.mileage_to && { mileage_to: filters.mileage_to.toString() })
    };

    const response = await this.makeRequest('/cars', params);
    const cars = Array.isArray(response.data) ? response.data : [];
    const total = response.total || cars.length;
    
    return {
      cars,
      total,
      hasMore: cars.length === perPage && total > page * perPage
    };
  }

  async fetchFilterOptions(): Promise<FilterOptions> {
    try {
      const [
        manufacturersData,
        bodyTypesData,
        fuelTypesData,
        transmissionsData,
        colorsData,
        locationsData
      ] = await Promise.all([
        this.makeRequest('/manufacturers'),
        this.makeRequest('/body-types'),
        this.makeRequest('/fuel-types'),
        this.makeRequest('/transmissions'),
        this.makeRequest('/colors'),
        this.makeRequest('/locations')
      ]);

      return {
        manufacturers: this.processFilterData(manufacturersData.data || []),
        models: [], // Will be fetched when manufacturer is selected
        generations: [], // Will be fetched when model is selected
        trims: [], // Will be fetched when model is selected
        grades: [], // Will be fetched when model is selected
        bodyTypes: this.processFilterData(bodyTypesData.data || []),
        fuelTypes: this.processFilterData(fuelTypesData.data || []),
        transmissions: this.processFilterData(transmissionsData.data || []),
        colors: this.processFilterData(colorsData.data || []),
        locations: this.processFilterData(locationsData.data || [])
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return this.getFallbackFilterOptions();
    }
  }

  async fetchModels(manufacturerId: string): Promise<Array<{ id: string; name: string; count?: number }>> {
    const response = await this.makeRequest('/models', { manufacturer_id: manufacturerId });
    return this.processFilterData(response.data || []);
  }

  async fetchGenerations(modelId: string): Promise<Array<{ id: string; name: string; from_year: number; to_year: number; count?: number }>> {
    const response = await this.makeRequest('/generations', { model_id: modelId });
    return (response.data || []).map((gen: any) => ({
      id: gen.id?.toString() || '',
      name: gen.name || '',
      from_year: gen.from_year || 2000,
      to_year: gen.to_year || 2024,
      count: gen.cars_qty || 0
    }));
  }

  async fetchTrims(modelId: string, generationId?: string): Promise<Array<{ id: string; name: string; count?: number }>> {
    const params: any = { model_id: modelId };
    if (generationId) params.generation_id = generationId;
    
    const response = await this.makeRequest('/trims', params);
    return this.processFilterData(response.data || []);
  }

  async fetchGrades(modelId: string, generationId?: string): Promise<Array<{ id: string; name: string; category?: string; count?: number }>> {
    const params: any = { model_id: modelId };
    if (generationId) params.generation_id = generationId;
    
    const response = await this.makeRequest('/grades', params);
    return (response.data || []).map((grade: any) => ({
      id: grade.id?.toString() || '',
      name: grade.name || grade.grade || '',
      category: this.categorizeGrade(grade.name || grade.grade || ''),
      count: grade.count || 0
    }));
  }

  private processFilterData(data: any[]): Array<{ id: string; name: string; count?: number }> {
    return data.map(item => ({
      id: item.id?.toString() || item.value?.toString() || '',
      name: item.name || item.label || '',
      count: item.count || item.cars_qty || 0
    }));
  }

  private categorizeGrade(gradeName: string): string {
    const normalized = gradeName.toLowerCase();
    
    if (/\b(turbo|tdi|tfsi|tsi|fsi|cdi|cgi|vtec|vvt|dohc)\b/.test(normalized)) {
      return 'Engine Technology';
    }
    if (/\b(luxury|premium|prestige|executive|business|signature|platinum|diamond)\b/.test(normalized)) {
      return 'Luxury Trims';
    }
    if (/\b(sport|dynamic|s-line|m-sport|amg|rs|performance)\b/.test(normalized)) {
      return 'Sport Trims';
    }
    if (/\b(comfort|elegance|advance|progressive|design|style)\b/.test(normalized)) {
      return 'Style Trims';
    }
    if (/\b(base|standard|limited|special|edition)\b/.test(normalized)) {
      return 'Standard Trims';
    }
    
    return 'Other';
  }

  private generateFallbackCars(filters: any): any {
    // Enhanced fallback cars with comprehensive data
    const brands = ['BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Hyundai', 'Kia'];
    const models = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Wagon'];
    const fuelTypes = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
    const transmissions = ['Automatic', 'Manual', 'CVT'];
    const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray'];
    
    const cars = Array.from({ length: 100 }, (_, i) => ({
      id: `fallback-${i + 1}`,
      manufacturer: { name: brands[i % brands.length], id: i % brands.length + 1 },
      model: { name: models[i % models.length], id: i % models.length + 1 },
      year: 2015 + (i % 9),
      title: `${2015 + (i % 9)} ${brands[i % brands.length]} ${models[i % models.length]}`,
      vin: `TEST${i.toString().padStart(13, '0')}`,
      lots: [{
        buy_now: 15000 + (i * 500),
        bid: 12000 + (i * 400),
        lot: `L${i + 1000}`,
        odometer: { km: 50000 + (i * 1000) },
        images: { normal: [`/placeholder-car-${(i % 6) + 1}.jpg`] },
        condition: { name: ['Excellent', 'Good', 'Fair'][i % 3] },
        keys_available: i % 2 === 0,
        status: { name: 'active' }
      }],
      fuel: { name: fuelTypes[i % fuelTypes.length] },
      transmission: { name: transmissions[i % transmissions.length] },
      color: { name: colors[i % colors.length] },
      body_type: { name: models[i % models.length] },
      location: 'Seoul',
      grade: ['Base', 'Sport', 'Luxury', 'Premium'][i % 4],
      trim: ['Standard', 'Deluxe', 'Ultimate'][i % 3]
    }));

    return {
      data: cars,
      total: cars.length
    };
  }

  private generateFallbackManufacturers(): any {
    return {
      data: [
        { id: 1, name: 'BMW', cars_qty: 150 },
        { id: 2, name: 'Mercedes-Benz', cars_qty: 120 },
        { id: 3, name: 'Audi', cars_qty: 100 },
        { id: 4, name: 'Toyota', cars_qty: 200 },
        { id: 5, name: 'Honda', cars_qty: 180 },
        { id: 6, name: 'Hyundai', cars_qty: 250 },
        { id: 7, name: 'Kia', cars_qty: 220 },
        { id: 8, name: 'Volkswagen', cars_qty: 90 },
        { id: 9, name: 'Nissan', cars_qty: 110 },
        { id: 10, name: 'Ford', cars_qty: 80 }
      ]
    };
  }

  private generateFallbackModels(manufacturerId?: string): any {
    const modelsByBrand: { [key: string]: string[] } = {
      '1': ['3 Series', '5 Series', 'X3', 'X5', 'Z4'],
      '2': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class'],
      '3': ['A3', 'A4', 'A6', 'Q5', 'Q7'],
      '4': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
      '5': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'],
      '6': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Genesis'],
      '7': ['Optima', 'Sportage', 'Sorento', 'Rio', 'Soul']
    };

    const models = modelsByBrand[manufacturerId || '1'] || ['Model 1', 'Model 2', 'Model 3'];
    
    return {
      data: models.map((model, i) => ({
        id: i + 1,
        name: model,
        manufacturer_id: manufacturerId,
        cars_qty: 20 + (i * 5)
      }))
    };
  }

  private generateFallbackGenerations(modelId?: string): any {
    return {
      data: [
        { id: 1, name: 'Generation 1', model_id: modelId, from_year: 2010, to_year: 2015, cars_qty: 30 },
        { id: 2, name: 'Generation 2', model_id: modelId, from_year: 2015, to_year: 2020, cars_qty: 45 },
        { id: 3, name: 'Generation 3', model_id: modelId, from_year: 2020, to_year: 2024, cars_qty: 25 }
      ]
    };
  }

  private generateFallbackTrims(modelId?: string): any {
    return {
      data: [
        { id: 1, name: 'Base', model_id: modelId, count: 15 },
        { id: 2, name: 'Sport', model_id: modelId, count: 25 },
        { id: 3, name: 'Luxury', model_id: modelId, count: 20 },
        { id: 4, name: 'Premium', model_id: modelId, count: 10 }
      ]
    };
  }

  private generateFallbackGrades(modelId?: string): any {
    return {
      data: [
        { id: 1, name: '2.0 TDI', model_id: modelId, count: 20 },
        { id: 2, name: '2.5 Sport', model_id: modelId, count: 15 },
        { id: 3, name: '3.0 Premium', model_id: modelId, count: 12 },
        { id: 4, name: 'Hybrid', model_id: modelId, count: 8 }
      ]
    };
  }

  private getFallbackFilterOptions(): FilterOptions {
    return {
      manufacturers: [
        { id: '1', name: 'BMW', count: 150 },
        { id: '2', name: 'Mercedes-Benz', count: 120 },
        { id: '3', name: 'Audi', count: 100 },
        { id: '4', name: 'Toyota', count: 200 },
        { id: '5', name: 'Honda', count: 180 },
        { id: '6', name: 'Hyundai', count: 250 },
        { id: '7', name: 'Kia', count: 220 }
      ],
      models: [],
      generations: [],
      trims: [],
      grades: [],
      bodyTypes: [
        { id: '1', name: 'Sedan', count: 400 },
        { id: '2', name: 'SUV', count: 350 },
        { id: '3', name: 'Hatchback', count: 200 },
        { id: '4', name: 'Coupe', count: 100 },
        { id: '5', name: 'Wagon', count: 80 }
      ],
      fuelTypes: [
        { id: '1', name: 'Gasoline', count: 600 },
        { id: '2', name: 'Diesel', count: 300 },
        { id: '3', name: 'Hybrid', count: 150 },
        { id: '4', name: 'Electric', count: 80 }
      ],
      transmissions: [
        { id: '1', name: 'Automatic', count: 800 },
        { id: '2', name: 'Manual', count: 250 },
        { id: '3', name: 'CVT', count: 80 }
      ],
      colors: [
        { id: '1', name: 'Black', count: 200 },
        { id: '2', name: 'White', count: 180 },
        { id: '3', name: 'Silver', count: 150 },
        { id: '4', name: 'Blue', count: 100 },
        { id: '5', name: 'Red', count: 80 }
      ],
      locations: [
        { id: '1', name: 'Seoul', count: 400 },
        { id: '2', name: 'Busan', count: 200 },
        { id: '3', name: 'Incheon', count: 150 },
        { id: '4', name: 'Daegu', count: 100 }
      ]
    };
  }
}

export const externalCarAPI = new ExternalCarAPIService();
export type { ExternalCar, CarFilters, FilterOptions };