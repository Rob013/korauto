import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrencyAPI } from './useCurrencyAPI';
import { calculateFinalPriceEUR } from '@/utils/carPricing';

export interface UnifiedCarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  vin?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  images?: string[];
  odometer?: {
    km: number;
    mi: number;
    status: {
      name: string;
    };
  };
  engine?: {
    name: string;
  };
  cylinders?: number;
  drive_wheel?: {
    name: string;
  };
  body_type?: {
    name: string;
  };
  damage?: {
    main: string | null;
    second: string | null;
  };
  keys_available?: boolean;
  airbags?: string;
  grade_iaai?: string;
  seller?: string;
  seller_type?: string;
  sale_date?: string;
  bid?: number;
  buy_now?: number;
  final_bid?: number;
  features?: string[];
  safety_features?: string[];
  comfort_features?: string[];
  performance_rating?: number;
  popularity_score?: number;
  // Enhanced API data
  insurance?: any;
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
  lots?: any[];
  // Source information
  source_api?: string;
  domain_name?: string;
  is_live?: boolean;
  status?: string;
}

export const useUnifiedCarDetails = (carId: string) => {
  const [car, setCar] = useState<UnifiedCarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { convertUSDtoEUR, processFloodDamageText, exchangeRate } = useCurrencyAPI();

  const fetchCarDetails = useCallback(async () => {
    if (!carId) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Fetching car details for ID: ${carId}`);

      // First, try to get car from the main cars table
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .eq('is_archived', false)
        .eq('is_active', true)
        .single();

      if (carError) {
        console.error('❌ Error fetching car from main table:', carError);
        throw carError;
      }

      if (!carData) {
        throw new Error('Car not found');
      }

      console.log(`✅ Found car in database: ${carData.make} ${carData.model} (${carData.source_api})`);

      // Transform car data based on source
      let transformedCar: UnifiedCarDetails;

      if (carData.source_api === 'auctions_api') {
        // Handle Auctions API cars
        transformedCar = await transformAuctionsApiCar(carData);
      } else if (carData.source_api === 'auctionapis') {
        // Handle existing Auction APIs cars
        transformedCar = await transformAuctionApisCar(carData);
      } else if (carData.source_api === 'encar') {
        // Handle Encar cars
        transformedCar = await transformEncarCar(carData);
      } else {
        // Default transformation
        transformedCar = await transformDefaultCar(carData);
      }

      setCar(transformedCar);

    } catch (err: any) {
      console.error('❌ Error fetching car details:', err);
      setError(err.message || 'Failed to fetch car details');
    } finally {
      setLoading(false);
    }
  }, [carId, exchangeRate]);

  // Transform Auctions API car
  const transformAuctionsApiCar = async (carData: any): Promise<UnifiedCarDetails> => {
    const basePrice = carData.price || 0;
    const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);

    return {
      id: carData.id,
      make: carData.make,
      model: carData.model,
      year: carData.year,
      price,
      image: carData.image_url,
      images: carData.images ? (typeof carData.images === 'string' ? JSON.parse(carData.images) : carData.images) : [],
      vin: carData.vin,
      mileage: carData.mileage,
      transmission: carData.transmission,
      fuel: carData.fuel,
      color: carData.color,
      condition: carData.condition,
      lot: carData.lot_number,
      title: carData.title,
      keys_available: carData.keys_available,
      is_live: carData.is_live,
      status: carData.status,
      source_api: carData.source_api,
      domain_name: carData.domain_name,
      // Default values for missing fields
      features: [],
      safety_features: [],
      comfort_features: [],
      performance_rating: 4.0,
      popularity_score: 75
    };
  };

  // Transform Auction APIs car
  const transformAuctionApisCar = async (carData: any): Promise<UnifiedCarDetails> => {
    // This would handle the existing auction APIs format
    // For now, use default transformation
    return transformDefaultCar(carData);
  };

  // Transform Encar car
  const transformEncarCar = async (carData: any): Promise<UnifiedCarDetails> => {
    // This would handle the Encar format
    // For now, use default transformation
    return transformDefaultCar(carData);
  };

  // Default transformation
  const transformDefaultCar = async (carData: any): Promise<UnifiedCarDetails> => {
    const basePrice = carData.price || 0;
    const price = calculateFinalPriceEUR(basePrice, exchangeRate.rate);

    return {
      id: carData.id,
      make: carData.make,
      model: carData.model,
      year: carData.year,
      price,
      image: carData.image_url,
      images: carData.images ? (typeof carData.images === 'string' ? JSON.parse(carData.images) : carData.images) : [],
      vin: carData.vin,
      mileage: carData.mileage,
      transmission: carData.transmission,
      fuel: carData.fuel,
      color: carData.color,
      condition: carData.condition,
      lot: carData.lot_number,
      title: carData.title,
      keys_available: carData.keys_available,
      is_live: carData.is_live,
      status: carData.status,
      source_api: carData.source_api,
      domain_name: carData.domain_name,
      // Default values for missing fields
      features: [],
      safety_features: [],
      comfort_features: [],
      performance_rating: 4.0,
      popularity_score: 75
    };
  };

  // Load car details on mount
  useEffect(() => {
    fetchCarDetails();
  }, [fetchCarDetails]);

  return {
    car,
    loading,
    error,
    refetch: fetchCarDetails
  };
};

export default useUnifiedCarDetails;
