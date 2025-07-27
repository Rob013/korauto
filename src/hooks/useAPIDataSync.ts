import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const API_BASE_URL = 'https://api.auctionsapi.com';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

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

export interface APICarData {
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
  api_data?: any;
  [key: string]: any;
}

export const useAPIDataSync = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Fetch all manufacturers from API (397 brands)
  const fetchAllManufacturers = useCallback(async (): Promise<Manufacturer[]> => {
    const response = await fetch(`${API_BASE_URL}/api/manufacturers`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/3.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch manufacturers: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data.manufacturers || [];
  }, []);

  // Fetch all models from API
  const fetchAllModels = useCallback(async (): Promise<CarModel[]> => {
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/3.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data.models || [];
  }, []);

  // Fetch all cars from API with pagination
  const fetchAllCars = useCallback(async (
    page: number = 1, 
    limit: number = 1000
  ): Promise<{ cars: APICarData[], hasMore: boolean, total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`${API_BASE_URL}/api/cars?${params}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'KORAUTO-WebApp/3.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cars: ${response.statusText}`);
    }

    const data = await response.json();
    const cars = data.data || [];
    const hasMore = cars.length === limit;
    const total = data.total || cars.length;

    return { cars, hasMore, total };
  }, []);

  // Transform and store manufacturers in database
  const syncManufacturers = useCallback(async () => {
    console.log('Syncing manufacturers...');
    const manufacturers = await fetchAllManufacturers();
    
    // Prepare data for batch insert
    const manufacturersData = manufacturers.map(m => ({
      id: m.id,
      name: m.name,
      country: m.country,
      logo_url: m.logo_url,
      models_count: m.models_count || 0,
      popular_models: m.popular_models || []
    }));

    // Batch upsert manufacturers
    const { error } = await supabase
      .from('manufacturers')
      .upsert(manufacturersData, { onConflict: 'id' });

    if (error) throw error;

    // Update sync status
    await supabase
      .from('api_sync_status')
      .insert({
        sync_type: 'manufacturers',
        records_synced: manufacturers.length,
        total_records: manufacturers.length,
        status: 'completed'
      });

    console.log(`Synced ${manufacturers.length} manufacturers`);
    return manufacturers.length;
  }, [fetchAllManufacturers]);

  // Transform and store models in database
  const syncModels = useCallback(async () => {
    console.log('Syncing models...');
    const models = await fetchAllModels();
    
    // Prepare data for batch insert
    const modelsData = models.map(m => ({
      id: m.id,
      name: m.name,
      manufacturer_id: m.manufacturer_id,
      manufacturer_name: m.manufacturer_name,
      body_types: m.body_types || [],
      year_from: m.year_from,
      year_to: m.year_to,
      fuel_types: m.fuel_types || [],
      engine_types: m.engine_types || []
    }));

    // Batch upsert models in chunks to avoid payload limits
    const chunkSize = 500;
    let totalSynced = 0;

    for (let i = 0; i < modelsData.length; i += chunkSize) {
      const chunk = modelsData.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('car_models')
        .upsert(chunk, { onConflict: 'id' });

      if (error) throw error;
      totalSynced += chunk.length;
    }

    // Update sync status
    await supabase
      .from('api_sync_status')
      .insert({
        sync_type: 'models',
        records_synced: totalSynced,
        total_records: models.length,
        status: 'completed'
      });

    console.log(`Synced ${totalSynced} models`);
    return totalSynced;
  }, [fetchAllModels]);

  // Helper function to safely extract values that can be objects or strings
  const safeExtractValue = (value: any, fallback: string = ''): string => {
    if (!value || value === null) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value.name) return value.name;
    return fallback;
  };

  // Transform and store cars in database with comprehensive data
  const syncCars = useCallback(async () => {
    console.log('Starting comprehensive car sync...');
    setSyncStatus('syncing');
    
    let page = 1;
    let allCars: APICarData[] = [];
    let totalSynced = 0;

    try {
      // Fetch all cars with pagination
      while (true) {
        const { cars, hasMore, total } = await fetchAllCars(page, 1000);
        
        if (cars.length === 0) break;

        // Transform cars data for database
        const carsData = cars.map(car => {
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
            is_live: lot?.status?.name === 'live',
            watchers: Math.floor(Math.random() * 100),
            end_time: lot?.auction_info?.end_time,
            location: lot?.location ? `${lot.location.city}, ${lot.location.state}` : null,
            
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
            
            // Safety
            safety_rating_overall: car.safety_rating?.overall,
            safety_rating_frontal: car.safety_rating?.frontal,
            safety_rating_side: car.safety_rating?.side,
            safety_rating_rollover: car.safety_rating?.rollover,
            
            // Additional details
            body_type: car.body_type?.name,
            drive_wheel: car.drive_wheel?.name,
            vehicle_type: car.vehicle_type?.name,
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

        // Batch upsert cars in smaller chunks
        const chunkSize = 100;
        for (let i = 0; i < carsData.length; i += chunkSize) {
          const chunk = carsData.slice(i, i + chunkSize);
          const { error } = await supabase
            .from('api_cars')
            .upsert(chunk, { onConflict: 'id' });

          if (error) {
            console.error('Error upserting cars chunk:', error);
            throw error;
          }

          totalSynced += chunk.length;
          setSyncProgress({ current: totalSynced, total: total || cars.length });
        }

        allCars.push(...cars);
        console.log(`Synced page ${page}, total cars: ${totalSynced}`);
        
        if (!hasMore) break;
        page++;
      }

      // Update sync status
      await supabase
        .from('api_sync_status')
        .insert({
          sync_type: 'cars',
          records_synced: totalSynced,
          total_records: allCars.length,
          status: 'completed'
        });

      setSyncStatus('completed');
      console.log(`Successfully synced ${totalSynced} cars total`);
      return totalSynced;

    } catch (error) {
      console.error('Car sync error:', error);
      setSyncStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Log failed sync
      await supabase
        .from('api_sync_status')
        .insert({
          sync_type: 'cars',
          records_synced: totalSynced,
          total_records: 0,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

      throw error;
    }
  }, [fetchAllCars]);

  // Full sync process
  const performFullSync = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      setError(null);

      console.log('Starting full API data sync...');
      
      // Sync in sequence for better reliability
      const manufacturersCount = await syncManufacturers();
      const modelsCount = await syncModels();
      const carsCount = await syncCars();

      setSyncStatus('completed');
      console.log(`Full sync completed: ${manufacturersCount} manufacturers, ${modelsCount} models, ${carsCount} cars`);
      
      return {
        manufacturers: manufacturersCount,
        models: modelsCount,
        cars: carsCount
      };
    } catch (error) {
      console.error('Full sync error:', error);
      setSyncStatus('error');
      setError(error instanceof Error ? error.message : 'Sync failed');
      throw error;
    }
  }, [syncManufacturers, syncModels, syncCars]);

  return {
    syncStatus,
    syncProgress,
    error,
    performFullSync,
    syncManufacturers,
    syncModels,
    syncCars,
    fetchAllManufacturers,
    fetchAllModels,
    fetchAllCars
  };
};