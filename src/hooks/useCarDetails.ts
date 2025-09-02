import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackCarView } from '@/utils/analytics';
import { fallbackCars } from '@/data/fallbackData';

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  vin?: string;
  mileage?: string;
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
  insurance?: any;
  insurance_v2?: any;
  location?: any;
  inspect?: any;
  details?: any;
  lots?: any[];
}

interface UseCarDetailsOptions {
  convertUSDtoEUR: (amount: number) => number;
  getCarFeatures: (carData: any, lotData: any) => string[];
  getSafetyFeatures: (carData: any, lotData: any) => string[];
  getComfortFeatures: (carData: any, lotData: any) => string[];
}

export const useCarDetails = (
  lot: string | undefined,
  options: UseCarDetailsOptions
) => {
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { convertUSDtoEUR, getCarFeatures, getSafetyFeatures, getComfortFeatures } = options;

  const fetchCarDetails = useCallback(async () => {
    if (!lot || typeof lot !== 'string' || lot.trim() === '') {
      console.error("Invalid lot parameter:", lot);
      setError("Invalid car identifier provided");
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    const startTime = performance.now();
    const abortController = new AbortController();

    try {
      // Optimized cache query - try exact matches first for better performance
      console.log("Searching for car with lot:", lot);
      const cachePromise = supabase
        .from("cars_cache")
        .select("*")
        .or(`id.eq."${lot}",api_id.eq."${lot}",lot_number.eq."${lot}"`)
        .maybeSingle();

      // Start cache lookup and prepare edge function call concurrently
      const edgeFunctionPromise = fetch(
        `https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/secure-cars-api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`,
          },
          body: JSON.stringify({
            endpoint: "search-lot",
            lotNumber: lot,
          }),
          signal: abortController.signal,
        }
      );

      // Try cache first with timeout
      const { data: cachedCar, error: cacheError } = await Promise.race([
        cachePromise,
        new Promise<{data: null, error: Error}>((_, reject) => 
          setTimeout(() => reject(new Error('Cache timeout')), 3000)
        )
      ]).catch(err => {
        console.warn("Cache query timeout or error:", err);
        return { data: null, error: err };
      });

      // If cache hit, process immediately
      if (!cacheError && cachedCar) {
        try {
          const carData = typeof cachedCar.car_data === "string"
            ? JSON.parse(cachedCar.car_data || "{}")
            : cachedCar.car_data || {};
          const lotData = typeof cachedCar.lot_data === "string"
            ? JSON.parse(cachedCar.lot_data || "{}")
            : cachedCar.lot_data || {};
          const images = typeof cachedCar.images === "string"
            ? JSON.parse(cachedCar.images || "[]")
            : cachedCar.images || [];

          const basePrice = cachedCar.price || lotData.buy_now || lotData.final_bid || 25000;
          const price = convertUSDtoEUR(Math.round(basePrice + 2200));

          const transformedCar: CarDetails = {
            id: cachedCar.id,
            make: cachedCar.make || "Unknown",
            model: cachedCar.model || "Unknown",
            year: cachedCar.year || 2020,
            price,
            image: images[0] || "/placeholder.svg",
            images: images || [],
            vin: cachedCar.vin || carData.vin,
            mileage: cachedCar.mileage || 
              (lotData.odometer?.km ? `${lotData.odometer.km.toLocaleString()} km` : undefined),
            transmission: cachedCar.transmission || carData.transmission?.name,
            fuel: cachedCar.fuel || carData.fuel?.name,
            color: cachedCar.color || carData.color?.name,
            condition: cachedCar.condition || 
              lotData.condition?.name?.replace("run_and_drives", "Good Condition"),
            lot: cachedCar.lot_number || lotData.lot,
            title: `${cachedCar.year} ${cachedCar.make} ${cachedCar.model}`,
            odometer: lotData.odometer,
            engine: carData.engine,
            cylinders: carData.cylinders,
            drive_wheel: carData.drive_wheel,
            body_type: carData.body_type,
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
            features: getCarFeatures(carData, lotData),
            safety_features: getSafetyFeatures(carData, lotData),
            comfort_features: getComfortFeatures(carData, lotData),
            performance_rating: 4.5,
            popularity_score: 85,
            insurance: lotData.insurance,
            insurance_v2: lotData.insurance_v2,
            location: lotData.location,
            inspect: lotData.inspect,
            details: lotData.details,
          };

          setCar(transformedCar);
          setLoading(false);

          const endTime = performance.now();
          const duration = endTime - startTime;
          console.log(`⚡ Cache hit - loaded in ${duration.toFixed(2)}ms`);

          trackCarView(cachedCar.id || cachedCar.api_id, transformedCar);
          return;
        } catch (parseError) {
          console.error("Error parsing cached car data:", parseError);
        }
      }

      // If cache miss, try edge function
      try {
        const secureResponse = await Promise.race([
          edgeFunctionPromise,
          new Promise<Response>((_, reject) => 
            setTimeout(() => reject(new Error('Edge function timeout')), 8000)
          )
        ]);

        if (secureResponse.ok) {
          const carData = await secureResponse.json();
          if (carData && carData.lots && carData.lots[0]) {
            const lotData = carData.lots[0];
            const basePrice = lotData.buy_now ?? lotData.final_bid ?? lotData.price ?? 25000;
            const price = convertUSDtoEUR(Math.round(basePrice + 2200));

            const transformedCar: CarDetails = {
              id: carData.id?.toString() || lotData.lot,
              make: carData.manufacturer?.name || "Unknown",
              model: carData.model?.name || "Unknown",
              year: carData.year || 2020,
              price,
              image: lotData.images?.normal?.[0] || lotData.images?.big?.[0],
              images: lotData.images?.normal || lotData.images?.big || [],
              vin: carData.vin,
              mileage: lotData.odometer?.km ? `${lotData.odometer.km.toLocaleString()} km` : undefined,
              transmission: carData.transmission?.name,
              fuel: carData.fuel?.name,
              color: carData.color?.name,
              condition: lotData.condition?.name?.replace("run_and_drives", "Good Condition"),
              lot: lotData.lot,
              title: lotData.title || carData.title,
              odometer: lotData.odometer,
              engine: carData.engine,
              cylinders: carData.cylinders,
              drive_wheel: carData.drive_wheel,
              body_type: carData.body_type,
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
              features: getCarFeatures(carData, lotData),
              safety_features: getSafetyFeatures(carData, lotData),
              comfort_features: getComfortFeatures(carData, lotData),
              performance_rating: 4.5,
              popularity_score: 85,
              insurance: lotData.insurance,
              insurance_v2: lotData.insurance_v2,
              location: lotData.location,
              inspect: lotData.inspect,
              details: lotData.details,
            };

            setCar(transformedCar);
            setLoading(false);

            const endTime = performance.now();
            const duration = endTime - startTime;
            console.log(`⚡ Edge function - loaded in ${duration.toFixed(2)}ms`);

            trackCarView(carData.id || lot, transformedCar);
            return;
          }
        }
      } catch (edgeFunctionError) {
        console.log("Edge function failed or timed out:", edgeFunctionError);
      }

      // Fallback to static data if available
      const fallbackCar = fallbackCars.find((car) => 
        car.id === lot || car.lot_number === lot
      );

      if (fallbackCar) {
        const basePrice = fallbackCar.price || 25000;
        const price = convertUSDtoEUR(Math.round(basePrice + 2200));
        
        const transformedCar: CarDetails = {
          id: fallbackCar.id,
          make: fallbackCar.manufacturer?.name || "Unknown",
          model: fallbackCar.model?.name || "Unknown",
          year: fallbackCar.year || 2020,
          price,
          image: "/placeholder.svg",
          images: [],
          vin: fallbackCar.vin,
          mileage: undefined,
          transmission: fallbackCar.transmission?.name,
          fuel: fallbackCar.fuel?.name,
          color: fallbackCar.color?.name,
          condition: "Good Condition",
          lot: fallbackCar.lot_number,
          title: fallbackCar.title,
          features: fallbackCar.features || [],
          safety_features: ["ABS", "Airbags", "Stability Control"],
          comfort_features: ["Air Conditioning", "Power Windows"],
          performance_rating: 4.5,
          popularity_score: 85,
        };

        setCar(transformedCar);
        setLoading(false);

        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`⚡ Fallback data - loaded in ${duration.toFixed(2)}ms`);

        return;
      }

      // If all methods fail
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.warn(`❌ Failed to load car details in ${duration.toFixed(2)}ms for lot ${lot}`);

      setError("Car not found. This car may have been sold or removed.");
      setLoading(false);

    } catch (error) {
      console.error("Error in fetchCarDetails:", error);
      setError("Failed to load car details. Please try again.");
      setLoading(false);
    }
  }, [lot, convertUSDtoEUR, getCarFeatures, getSafetyFeatures, getComfortFeatures]);

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