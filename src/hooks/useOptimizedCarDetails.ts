import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { calculateFinalPriceEUR } from '@/utils/carPricing';
import { useCurrencyAPI } from './useCurrencyAPI';
import { fallbackCars } from '@/data/fallbackData';
import { trackCarView } from '@/utils/analytics';

interface CarDetails {
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
    status: { name: string };
  };
  engine?: { name: string };
  cylinders?: number;
  drive_wheel?: { name: string };
  body_type?: { name: string };
  damage?: { main?: string; second?: string };
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
  insurance?: any;
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
  lots?: any[];
}

export const useOptimizedCarDetails = (lot: string | undefined) => {
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { exchangeRate } = useCurrencyAPI();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const fetchCarDetails = async () => {
      if (!lot) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Step 1: Try cache first (optimized query)
        console.log("🔍 Searching cache for lot:", lot);
        const { data: cachedCar, error: cacheError } = await supabase
          .from("cars_cache")
          .select("*")
          .or(`id.eq.${lot},api_id.eq.${lot},lot_number.eq.${lot}`)
          .maybeSingle();

        // Use cached data if it exists and is recent (< 6 hours)
        if (cachedCar && !cacheError) {
          const cacheAge = (Date.now() - new Date(cachedCar.last_api_sync || cachedCar.updated_at).getTime()) / (1000 * 60 * 60);
          
          if (cacheAge < 6 && cachedCar.price) {
            console.log("✅ Using cached data (age:", Math.round(cacheAge), "hours)");
            
            const transformedCar = transformCachedCar(cachedCar, exchangeRate.rate);
            if (isMounted && transformedCar) {
              setCar(transformedCar);
              setLoading(false);
              trackCarView(cachedCar.api_id, transformedCar);
              return;
            }
          }
        }

        // Step 2: Try Supabase edge function
        console.log("🌐 Fetching from API...");
        const { data: apiData, error: apiError } = await supabase.functions.invoke('secure-cars-api', {
          body: { endpoint: `cars/${lot}`, carId: lot }
        });

        if (!apiError && apiData && apiData.lots?.[0]) {
          console.log("✅ Got fresh API data");
          const transformedCar = transformApiCar(apiData, exchangeRate.rate);
          if (isMounted && transformedCar) {
            setCar(transformedCar);
            setLoading(false);
            trackCarView(apiData.id || lot, transformedCar);
            return;
          }
        }

        // Step 3: Try fallback data
        console.log("🔄 Trying fallback data...");
        const fallbackCar = fallbackCars.find(car => car.id === lot || car.lot_number === lot);
        if (fallbackCar?.lots?.[0]) {
          console.log("✅ Using fallback data");
          const transformedCar = transformFallbackCar(fallbackCar, exchangeRate.rate);
          if (isMounted && transformedCar) {
            setCar(transformedCar);
            setLoading(false);
            trackCarView(fallbackCar.id, transformedCar);
            return;
          }
        }

        // Step 4: No data found
        if (isMounted) {
          setError(`Car with ID ${lot} is not available. This car may have been sold or removed.`);
          setLoading(false);
        }

      } catch (err) {
        console.error("Error fetching car details:", err);
        if (isMounted) {
          setError("Unable to load car details. Please try again.");
          setLoading(false);
        }
      }
    };

    fetchCarDetails();
    
    return () => {
      isMounted = false;
    };
  }, [lot, exchangeRate.rate]);

  return { car, loading, error };
};

// Helper function to transform cached car data
const transformCachedCar = (cached: any, exchangeRate: number): CarDetails | null => {
  try {
    const carData = typeof cached.car_data === 'string' ? JSON.parse(cached.car_data) : cached.car_data;
    const lotData = typeof cached.lot_data === 'string' ? JSON.parse(cached.lot_data || '{}') : (cached.lot_data || {});
    const images = typeof cached.images === 'string' ? JSON.parse(cached.images || '[]') : (cached.images || []);
    
    if (!cached.price) return null;
    
    return {
      id: cached.api_id,
      make: cached.make || "Unknown",
      model: cached.model || "Unknown",
      year: cached.year || 2020,
      price: calculateFinalPriceEUR(cached.price, exchangeRate),
      image: images[0] || "/placeholder.svg",
      images: images || [],
      vin: cached.vin,
      mileage: parseInt(cached.mileage) || lotData.odometer?.km,
      transmission: cached.transmission,
      fuel: cached.fuel,
      color: cached.color,
      condition: cached.condition || "Good Condition",
      lot: cached.lot_number,
      title: carData?.title,
      odometer: lotData.odometer ? {
        km: lotData.odometer.km,
        mi: Math.round(lotData.odometer.km * 0.621371),
        status: { name: "Verified" }
      } : undefined,
      engine: carData?.engine,
      cylinders: carData?.cylinders,
      drive_wheel: carData?.drive_wheel,
      body_type: carData?.body_type,
      damage: lotData?.damage,
      keys_available: lotData?.keys_available,
      airbags: lotData?.airbags,
      grade_iaai: lotData?.grade_iaai,
      seller: lotData?.seller,
      seller_type: lotData?.seller_type,
      sale_date: lotData?.sale_date,
      bid: lotData?.bid,
      buy_now: lotData?.buy_now,
      final_bid: lotData?.final_bid,
      features: getCarFeatures(carData, lotData),
      safety_features: getSafetyFeatures(carData, lotData),
      comfort_features: getComfortFeatures(carData, lotData),
      performance_rating: 4.5,
      popularity_score: 85,
      insurance: lotData?.insurance,
      insurance_v2: lotData?.insurance_v2,
      location: lotData?.location,
      inspect: lotData?.inspect,
      details: lotData?.details
    };
  } catch (error) {
    console.error("Error transforming cached car:", error);
    return null;
  }
};

// Helper function to transform API car data
const transformApiCar = (apiData: any, exchangeRate: number): CarDetails | null => {
  try {
    const lotData = apiData.lots?.[0];
    if (!lotData?.buy_now) return null;
    
    return {
      id: apiData.id?.toString() || lotData.lot,
      make: apiData.manufacturer?.name || "Unknown",
      model: apiData.model?.name || "Unknown",
      year: apiData.year || 2020,
      price: calculateFinalPriceEUR(lotData.buy_now, exchangeRate),
      image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
      images: lotData.images?.normal || lotData.images?.big || [],
      vin: apiData.vin,
      mileage: lotData.odometer?.km,
      transmission: apiData.transmission?.name,
      fuel: apiData.fuel?.name,
      color: apiData.color?.name,
      condition: lotData.condition?.name?.replace("run_and_drives", "Good Condition"),
      lot: lotData.lot,
      title: lotData.title || apiData.title,
      odometer: lotData.odometer,
      engine: apiData.engine,
      cylinders: apiData.cylinders,
      drive_wheel: apiData.drive_wheel,
      body_type: apiData.body_type,
      damage: lotData.damage,
      keys_available: lotData.keys_available,
      airbags: lotData.airbags,
      grade_iaai: lotData.grade_iaai,
      seller: lotData.seller,
      seller_type: lotData.seller_type,
      sale_date: lotData.sale_date,
      bid: lotData.bid,
      buy_now: lotData.buy_now,
      final_bid: lotData.final_bid,
      features: getCarFeatures(apiData, lotData),
      safety_features: getSafetyFeatures(apiData, lotData),
      comfort_features: getComfortFeatures(apiData, lotData),
      performance_rating: 4.5,
      popularity_score: 85,
      insurance: lotData.insurance,
      insurance_v2: lotData.insurance_v2,
      location: lotData.location,
      inspect: lotData.inspect,
      details: lotData.details
    };
  } catch (error) {
    console.error("Error transforming API car:", error);
    return null;
  }
};

// Helper function to transform fallback car data
const transformFallbackCar = (fallback: any, exchangeRate: number): CarDetails | null => {
  try {
    const lotData = fallback.lots?.[0];
    const basePrice = lotData?.buy_now || fallback.price;
    if (!basePrice) return null;
    
    return {
      id: fallback.id,
      make: fallback.manufacturer?.name || "Unknown",
      model: fallback.model?.name || "Unknown",
      year: fallback.year || 2020,
      price: calculateFinalPriceEUR(basePrice, exchangeRate),
      image: lotData?.images?.normal?.[0] || lotData?.images?.big?.[0] || "/placeholder.svg",
      images: lotData?.images?.normal || lotData?.images?.big || [],
      vin: fallback.vin,
      mileage: lotData?.odometer?.km,
      transmission: fallback.transmission?.name,
      fuel: fallback.fuel?.name,
      color: fallback.color?.name,
      condition: "Good Condition",
      lot: fallback.lot_number,
      title: fallback.title,
      odometer: lotData?.odometer ? {
        km: lotData.odometer.km,
        mi: Math.round(lotData.odometer.km * 0.621371),
        status: { name: "Verified" }
      } : undefined,
      features: fallback.features || [],
      safety_features: ["ABS", "Airbags", "Stability Control"],
      comfort_features: ["Air Conditioning", "Power Windows"],
      performance_rating: 4.5,
      popularity_score: 85
    };
  } catch (error) {
    console.error("Error transforming fallback car:", error);
    return null;
  }
};

// Helper functions for car features (simplified)
const getCarFeatures = (carData: any, lotData: any): string[] => {
  const features: string[] = [];
  if (carData?.engine?.name) features.push(`Engine: ${carData.engine.name}`);
  if (carData?.transmission?.name) features.push(`Transmission: ${carData.transmission.name}`);
  if (carData?.fuel?.name) features.push(`Fuel: ${carData.fuel.name}`);
  if (carData?.drive_wheel?.name) features.push(`Drive: ${carData.drive_wheel.name}`);
  return features;
};

const getSafetyFeatures = (carData: any, lotData: any): string[] => {
  const features: string[] = ["ABS", "Airbags"];
  if (lotData?.airbags) features.push(`Airbag System: ${lotData.airbags}`);
  return features;
};

const getComfortFeatures = (carData: any, lotData: any): string[] => {
  return ["Air Conditioning", "Power Windows", "Central Locking"];
};