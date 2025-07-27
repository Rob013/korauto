import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = 'https://api.auctionsapi.com';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

export interface LiveCarData {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  vin?: string;
  title?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot_number?: string;
  current_bid?: number;
  buy_now_price?: number;
  final_bid?: number;
  is_live?: boolean;
  watchers?: number;
  end_time?: string;
  location?: string;
  image_url?: string;
  images?: string[];
  exterior_images?: string[];
  interior_images?: string[];
  video_urls?: string[];
  
  // Technical specifications
  cylinders?: number;
  displacement?: number;
  horsepower?: number;
  torque?: number;
  top_speed?: number;
  acceleration?: number;
  
  // Fuel consumption
  fuel_consumption_city?: number;
  fuel_consumption_highway?: number;
  fuel_consumption_combined?: number;
  
  // Emissions
  co2_emissions?: number;
  euro_standard?: string;
  
  // Dimensions
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  wheelbase_mm?: number;
  weight_kg?: number;
  
  // Additional details
  body_type?: string;
  drive_wheel?: string;
  vehicle_type?: string;
  damage_main?: string;
  damage_second?: string;
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  seller?: string;
  seller_type?: string;
  sale_date?: string;
  
  // API metadata
  domain_name?: string;
  external_id?: string;
  api_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface Manufacturer {
  id: number;
  name: string;
  country?: string;
  logo_url?: string;
  models_count?: number;
  popular_models?: string[];
}

export interface CarModel {
  id: number;
  name: string;
  manufacturer_id: number;
  manufacturer_name?: string;
  body_types?: string[];
  year_from?: number;
  year_to?: number;
  fuel_types?: string[];
  engine_types?: string[];
}

export const useLiveAuctionAPI = () => {
  const [cars, setCars] = useState<LiveCarData[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [totalCars, setTotalCars] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Helper function to safely extract values
  const safeExtractValue = useCallback((value: any, fallback: string = ''): string => {
    if (!value || value === null) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    return fallback;
  }, []);

  // Fetch all manufacturers (397 brands)
  const fetchManufacturers = useCallback(async (): Promise<Manufacturer[]> => {
    console.log('Fetching all manufacturers...');
    
    const response = await fetch(`${API_BASE_URL}/api/manufacturers`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-LiveApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch manufacturers: ${response.statusText}`);
    }

    const data = await response.json();
    const manufacturers = data.data || data.manufacturers || [];
    
    console.log(`Fetched ${manufacturers.length} manufacturers`);
    return manufacturers;
  }, []);

  // Fetch all models
  const fetchModels = useCallback(async (): Promise<CarModel[]> => {
    console.log('Fetching all car models...');
    
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-LiveApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.data || data.models || [];
    
    console.log(`Fetched ${models.length} car models`);
    return models;
  }, []);

  // Fetch cars with comprehensive pagination (up to 110,000 cars)
  const fetchCars = useCallback(async (
    page: number = 1, 
    limit: number = 1000,
    realTimeUpdate: boolean = false
  ): Promise<{ cars: LiveCarData[], hasMore: boolean, total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    // For real-time updates, only fetch cars updated in the last minute
    if (realTimeUpdate) {
      params.append('minutes', '1');
    }

    console.log(`Fetching cars - Page ${page}, Limit ${limit}, Real-time: ${realTimeUpdate}`);

    const response = await fetch(`${API_BASE_URL}/api/cars?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-LiveApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cars: ${response.statusText}`);
    }

    const data = await response.json();
    const apiCars = data.data || [];
    const total = data.total || apiCars.length;
    const hasMore = apiCars.length === limit;

    // Transform API data to our format
    const transformedCars: LiveCarData[] = apiCars.map((car: any) => {
      const lot = car.lots?.[0];
      const images = lot?.images;
      
      const manufacturerName = safeExtractValue(car.manufacturer, 'Unknown');
      const modelName = safeExtractValue(car.model, 'Unknown');
      
      return {
        id: car.id?.toString() || `car-${Date.now()}-${Math.random()}`,
        make: manufacturerName,
        model: modelName,
        year: car.year || 2020,
        price: car.price || lot?.buy_now || lot?.final_bid || 0,
        vin: car.vin,
        title: car.title || `${car.year} ${manufacturerName} ${modelName}`,
        
        // Basic car data
        mileage: lot?.odometer?.km,
        transmission: safeExtractValue(car.transmission),
        fuel: safeExtractValue(car.fuel),
        color: safeExtractValue(car.color),
        condition: safeExtractValue(lot?.condition),
        lot_number: lot?.lot,
        
        // Auction data
        current_bid: lot?.bid,
        buy_now_price: lot?.buy_now,
        final_bid: lot?.final_bid,
        is_live: lot?.status?.name === 'live' || lot?.status?.name === 'sale',
        watchers: Math.floor(Math.random() * 150) + 10, // Simulate watchers
        end_time: lot?.auction_info?.end_time || '2-3 days',
        location: lot?.location ? `${lot.location.city}, ${lot.location.state}` : 'Germany',
        
        // Images
        image_url: images?.normal?.[0] || images?.big?.[0],
        images: [...(images?.normal || []), ...(images?.big || [])],
        exterior_images: images?.exterior || [],
        interior_images: images?.interior || [],
        video_urls: images?.video || [],
        
        // Technical specs
        cylinders: car.cylinders,
        displacement: car.displacement,
        horsepower: car.horsepower,
        torque: car.torque,
        top_speed: car.top_speed,
        acceleration: car.acceleration,
        
        // Fuel consumption
        fuel_consumption_city: car.fuel_consumption?.city,
        fuel_consumption_highway: car.fuel_consumption?.highway,
        fuel_consumption_combined: car.fuel_consumption?.combined,
        
        // Emissions
        co2_emissions: car.emissions?.co2,
        euro_standard: car.emissions?.euro_standard,
        
        // Dimensions
        length_mm: car.dimensions?.length,
        width_mm: car.dimensions?.width,
        height_mm: car.dimensions?.height,
        wheelbase_mm: car.dimensions?.wheelbase,
        weight_kg: car.dimensions?.weight,
        
        // Additional details
        body_type: safeExtractValue(car.body_type),
        drive_wheel: safeExtractValue(car.drive_wheel),
        vehicle_type: safeExtractValue(car.vehicle_type),
        damage_main: lot?.damage?.main,
        damage_second: lot?.damage?.second,
        keys_available: lot?.keys_available,
        airbags: lot?.airbags,
        grade_iaai: lot?.grade_iaai,
        seller: lot?.seller,
        seller_type: lot?.seller_type,
        sale_date: lot?.sale_date,
        
        // API metadata
        domain_name: lot?.domain?.name,
        external_id: lot?.external_id,
        api_data: car // Store complete raw data
      };
    });

    console.log(`Transformed ${transformedCars.length} cars from API`);
    return { cars: transformedCars, hasMore, total };
  }, [safeExtractValue]);

  // Fetch archived/sold cars
  const fetchArchivedLots = useCallback(async (): Promise<any[]> => {
    console.log('Fetching archived lots...');
    
    const params = new URLSearchParams({
      minutes: '1' // Cars archived in the last minute
    });

    const response = await fetch(`${API_BASE_URL}/api/archived-lots?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-LiveApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch archived lots: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }, []);

  // Store data in local database
  const syncToDatabase = useCallback(async (
    manufacturersData?: Manufacturer[], 
    modelsData?: CarModel[], 
    carsData?: LiveCarData[]
  ) => {
    console.log('Syncing data to database...');
    
    try {
      // Sync manufacturers
      if (manufacturersData && manufacturersData.length > 0) {
        const { error: manufacturersError } = await supabase
          .from('manufacturers')
          .upsert(manufacturersData.map(m => ({
            id: m.id,
            name: m.name,
            country: m.country,
            logo_url: m.logo_url,
            models_count: m.models_count || 0,
            popular_models: m.popular_models || []
          })), { onConflict: 'id' });

        if (manufacturersError) throw manufacturersError;
        console.log(`Synced ${manufacturersData.length} manufacturers to database`);
      }

      // Sync models
      if (modelsData && modelsData.length > 0) {
        // Batch upsert in chunks
        const chunkSize = 500;
        for (let i = 0; i < modelsData.length; i += chunkSize) {
          const chunk = modelsData.slice(i, i + chunkSize);
          const { error: modelsError } = await supabase
            .from('car_models')
            .upsert(chunk.map(m => ({
              id: m.id,
              name: m.name,
              manufacturer_id: m.manufacturer_id,
              manufacturer_name: m.manufacturer_name,
              body_types: m.body_types || [],
              year_from: m.year_from,
              year_to: m.year_to,
              fuel_types: m.fuel_types || [],
              engine_types: m.engine_types || []
            })), { onConflict: 'id' });

          if (modelsError) throw modelsError;
        }
        console.log(`Synced ${modelsData.length} models to database`);
      }

      // Sync cars
      if (carsData && carsData.length > 0) {
        // Batch upsert in smaller chunks for performance
        const chunkSize = 100;
        for (let i = 0; i < carsData.length; i += chunkSize) {
          const chunk = carsData.slice(i, i + chunkSize);
          const { error: carsError } = await supabase
            .from('api_cars')
            .upsert(chunk, { onConflict: 'id' });

          if (carsError) throw carsError;
        }
        console.log(`Synced ${carsData.length} cars to database`);
      }

    } catch (error) {
      console.error('Database sync error:', error);
      throw error;
    }
  }, []);

  // Load all 110,000+ cars with pagination
  const loadAllCars = useCallback(async () => {
    setSyncStatus('syncing');
    setLoading(true);
    setError(null);

    try {
      console.log('Starting full car data sync...');
      
      // First, sync manufacturers and models
      const [manufacturersData, modelsData] = await Promise.all([
        fetchManufacturers(),
        fetchModels()
      ]);

      // Store manufacturers and models in database
      await syncToDatabase(manufacturersData, modelsData);
      setManufacturers(manufacturersData);
      setModels(modelsData);

      // Now fetch all cars with pagination
      let page = 1;
      let allCars: LiveCarData[] = [];
      let hasMore = true;

      while (hasMore && allCars.length < 110000) { // Safety limit
        const { cars: pageCars, hasMore: pageHasMore, total } = await fetchCars(page, 1000);
        
        if (pageCars.length === 0) break;

        allCars.push(...pageCars);
        setTotalCars(total);
        
        // Sync this batch to database
        await syncToDatabase(undefined, undefined, pageCars);
        
        console.log(`Loaded ${allCars.length} / ${total} cars`);
        
        hasMore = pageHasMore && pageCars.length === 1000;
        page++;
        
        // Add small delay to respect rate limits
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setCars(allCars);
      setLastSync(new Date());
      setSyncStatus('completed');
      
      console.log(`✅ Full sync completed: ${allCars.length} cars loaded`);

    } catch (error) {
      console.error('Error loading all cars:', error);
      setError(error instanceof Error ? error.message : 'Failed to load cars');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [fetchManufacturers, fetchModels, fetchCars, syncToDatabase]);

  // Real-time update function
  const performRealTimeUpdate = useCallback(async () => {
    if (syncStatus === 'syncing') return; // Don't update while syncing

    try {
      console.log('Performing real-time update...');
      
      // Fetch recent car updates
      const { cars: updatedCars } = await fetchCars(1, 1000, true);
      
      // Fetch archived lots
      const archivedLots = await fetchArchivedLots();
      
      if (updatedCars.length > 0) {
        // Update database with new/updated cars
        await syncToDatabase(undefined, undefined, updatedCars);
        
        // Update local state - merge with existing cars
        setCars(prevCars => {
          const existingIds = new Set(prevCars.map(car => car.id));
          const newCars = updatedCars.filter(car => !existingIds.has(car.id));
          const updatedExisting = prevCars.map(existingCar => {
            const update = updatedCars.find(updated => updated.id === existingCar.id);
            return update || existingCar;
          });
          
          return [...updatedExisting, ...newCars];
        });
        
        console.log(`✅ Real-time update: ${updatedCars.length} cars updated`);
      }

      // Handle archived cars
      if (archivedLots.length > 0) {
        // Remove archived cars from local state
        const archivedIds = new Set(archivedLots.map((lot: any) => lot.id));
        setCars(prevCars => prevCars.filter(car => !archivedIds.has(car.id)));
        
        console.log(`🗂️ Archived ${archivedLots.length} cars`);
      }

      setLastSync(new Date());

    } catch (error) {
      console.error('Real-time update error:', error);
    }
  }, [syncStatus, fetchCars, fetchArchivedLots, syncToDatabase]);

  // Load data from database (cached data)
  const loadFromDatabase = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load manufacturers
      const { data: manufacturersData } = await supabase
        .from('manufacturers')
        .select('*')
        .order('name');

      // Load models
      const { data: modelsData } = await supabase
        .from('car_models')
        .select('*')
        .order('name');

      // Load cars with pagination
      const { data: carsData, count } = await supabase
        .from('api_cars')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(1000); // Initial load

      if (manufacturersData) setManufacturers(manufacturersData);
      if (modelsData) setModels(modelsData);
      if (carsData) {
        setCars(carsData);
        setTotalCars(count || 0);
      }

      console.log(`Loaded from database: ${manufacturersData?.length || 0} manufacturers, ${modelsData?.length || 0} models, ${carsData?.length || 0} cars`);

    } catch (error) {
      console.error('Error loading from database:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start real-time updates every minute
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (cars.length > 0 && syncStatus !== 'syncing') {
      intervalId = setInterval(performRealTimeUpdate, 60000); // Every minute
      console.log('🔄 Real-time updates started (every 60 seconds)');
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('🔄 Real-time updates stopped');
      }
    };
  }, [cars.length, syncStatus, performRealTimeUpdate]);

  // Load cached data on mount
  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  return {
    cars,
    manufacturers,
    models,
    loading,
    syncStatus,
    totalCars,
    currentPage,
    error,
    lastSync,
    loadAllCars,
    performRealTimeUpdate,
    loadFromDatabase,
    fetchCars
  };
};