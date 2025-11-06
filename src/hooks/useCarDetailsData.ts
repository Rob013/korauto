import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCurrencyAPI } from '@/hooks/useCurrencyAPI';
import { calculateFinalPriceEUR } from '@/utils/carPricing';
import { transformCachedCarRecord } from '@/services/carCache';
import { fallbackCars } from '@/data/fallbackData';
import { trackCarView } from '@/utils/analytics';

interface CarDetails {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  source_label?: string;
  vin?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  color?: string;
  condition?: string;
  lot?: string;
  title?: string;
  images?: string[];
  odometer?: any;
  engine?: any;
  cylinders?: number;
  drive_wheel?: any;
  body_type?: any;
  damage?: any;
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

const API_BASE_URL = "https://auctionsapi.com/api";
const API_KEY = "d00985c77981fe8d26be16735f932ed1";
const KBC_DOMAINS = ['kbchachacha', 'kbchacha', 'kb_chachacha', 'kbc', 'kbcchachacha'];

export const useCarDetailsData = () => {
  const { id: lot } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exchangeRate } = useCurrencyAPI();
  const [car, setCar] = useState<CarDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCarFeatures = (carData: any, lot: any): string[] => {
    const features = [];
    if (carData.transmission?.name) features.push(`Transmisioni: ${carData.transmission.name}`);
    if (carData.fuel?.name) features.push(`Karburanti: ${carData.fuel.name}`);
    if (carData.color?.name) features.push(`Ngjyra: ${carData.color.name}`);
    if (carData.engine?.name) features.push(`Motori: ${carData.engine.name}`);
    if (carData.cylinders) features.push(`${carData.cylinders} Cilindra`);
    if (carData.drive_wheel?.name) features.push(`Tërheqje: ${carData.drive_wheel.name}`);
    if (lot?.keys_available) features.push("Çelësat të Disponueshëm");

    if (features.length === 0) {
      return ["Klimatizimi", "Dritaret Elektrike", "Mbyllja Qendrore", "Frena ABS"];
    }
    return features;
  };

  const getSafetyFeatures = (carData: any, lot: any): string[] => {
    const safety = [];
    if (lot?.airbags) safety.push(`Sistemi i Airbag-ëve: ${lot.airbags}`);
    if (carData.transmission?.name === "automatic") safety.push("ABS Sistemi i Frënimit");
    safety.push("Sistemi i Stabilitetit Elektronik");
    if (lot?.keys_available) safety.push("Sistemi i Sigurisë");

    return safety.length > 0 ? safety : ["ABS Sistemi i Frënimit", "Airbag Sistemi", "Mbyllja Qendrore"];
  };

  const getComfortFeatures = (carData: any, lot: any): string[] => {
    const comfort = [];
    if (carData.transmission?.name === "automatic") comfort.push("Transmisioni Automatik");
    comfort.push("Klimatizimi");
    comfort.push("Dritaret Elektrike");
    comfort.push("Pasqyrat Elektrike");
    return comfort;
  };

  const buildCarDetails = useCallback((carData: any, lotData: any): CarDetails | null => {
    if (!carData || !lotData) return null;

    const buyNow = Number(lotData?.buy_now || carData?.buy_now || carData?.price);
    if (!buyNow || Number.isNaN(buyNow) || buyNow <= 0) return null;

    const price = calculateFinalPriceEUR(buyNow, exchangeRate.rate);
    const domainRaw = String(lotData?.domain?.name || carData?.domain_name || carData?.provider || carData?.source_api || "").toLowerCase();
    const isKbc = domainRaw ? KBC_DOMAINS.some(k => domainRaw.includes(k)) : false;
    const sourceLabel = domainRaw ? (isKbc ? 'KB Chachacha' : 'Encar') : undefined;

    const manufacturerName = carData?.manufacturer?.name || carData?.make || "Unknown";
    const modelName = carData?.model?.name || carData?.model || "Unknown";

    const year = carData?.year 
      || lotData?.year 
      || carData?.model_year 
      || lotData?.model_year 
      || carData?.production_year 
      || lotData?.production_year
      || (carData?.registration_date ? new Date(carData.registration_date).getFullYear() : null)
      || (lotData?.registration_date ? new Date(lotData.registration_date).getFullYear() : null)
      || 2020;

    const odometer = lotData?.odometer 
      || carData?.odometer 
      || (lotData?.odometer_km ? { km: lotData.odometer_km, mi: Math.round(Number(lotData.odometer_km) * 0.621371) } : null)
      || (carData?.odometer_km ? { km: carData.odometer_km, mi: Math.round(Number(carData.odometer_km) * 0.621371) } : null)
      || (lotData?.mileage ? { km: lotData.mileage, mi: Math.round(Number(lotData.mileage) * 0.621371) } : null)
      || (carData?.mileage ? { km: carData.mileage, mi: Math.round(Number(carData.mileage) * 0.621371) } : null);

    const images = lotData?.images?.normal 
      || lotData?.images?.big 
      || carData?.images?.normal 
      || carData?.images?.big
      || lotData?.images 
      || carData?.images 
      || [];

    return {
      id: carData?.id?.toString() || lotData?.lot,
      make: manufacturerName,
      model: modelName,
      year,
      price,
      image: images?.[0],
      images,
      source_label: sourceLabel,
      vin: carData?.vin,
      mileage: odometer?.km,
      transmission: carData?.transmission?.name || carData?.transmission || lotData?.transmission?.name || lotData?.transmission,
      fuel: carData?.fuel?.name || carData?.fuel || lotData?.fuel?.name || lotData?.fuel,
      color: carData?.color?.name || carData?.color || lotData?.color?.name || lotData?.color,
      condition: lotData?.condition?.name?.replace("run_and_drives", "Good Condition") || carData?.condition,
      lot: lotData?.lot || carData?.lot_number,
      title: carData?.title || lotData?.title,
      odometer: odometer ? {
        km: odometer.km,
        mi: odometer.mi || Math.round(Number(odometer.km || 0) * 0.621371),
        status: lotData?.odometer?.status || carData?.odometer?.status || { name: "Verified" },
      } : undefined,
      engine: carData?.engine || lotData?.engine,
      cylinders: carData?.cylinders || lotData?.cylinders,
      drive_wheel: carData?.drive_wheel || lotData?.drive_wheel,
      body_type: carData?.body_type || lotData?.body_type,
      damage: lotData?.damage || carData?.damage,
      keys_available: lotData?.keys_available ?? carData?.keys_available,
      airbags: lotData?.airbags || carData?.airbags,
      grade_iaai: lotData?.grade_iaai || carData?.grade?.name || carData?.grade || lotData?.grade?.name || lotData?.grade,
      seller: lotData?.seller || carData?.seller,
      seller_type: lotData?.seller_type || carData?.seller_type,
      sale_date: lotData?.sale_date || carData?.sale_date,
      bid: lotData?.bid || carData?.bid,
      buy_now: lotData?.buy_now || carData?.buy_now,
      final_bid: lotData?.final_bid || carData?.final_bid,
      features: getCarFeatures(carData, lotData),
      safety_features: getSafetyFeatures(carData, lotData),
      comfort_features: getComfortFeatures(carData, lotData),
      performance_rating: 4.5,
      popularity_score: 85,
      insurance: lotData?.insurance,
      insurance_v2: lotData?.insurance_v2 || carData?.insurance_v2,
      location: lotData?.location,
      inspect: lotData?.inspect || carData?.inspect,
      details: {
        ...(carData?.details || {}),
        ...(lotData?.details || {}),
        grade: carData?.grade || lotData?.grade || carData?.details?.grade || lotData?.details?.grade,
        variant: carData?.variant || lotData?.variant || carData?.details?.variant || lotData?.details?.variant,
        trim: carData?.trim || lotData?.trim || carData?.details?.trim || lotData?.details?.trim,
        inspect: lotData?.inspect || lotData?.details?.inspect || {
          accident_summary: lotData?.inspect?.accident_summary || lotData?.details?.inspect?.accident_summary,
          outer: lotData?.inspect?.outer || lotData?.details?.inspect?.outer || lotData?.inspect_outer,
          inner: lotData?.inspect?.inner || lotData?.details?.inspect?.inner,
        },
        inspect_outer: lotData?.inspect?.outer || lotData?.details?.inspect_outer || lotData?.inspect_outer,
        options: lotData?.details?.options || carData?.details?.options,
        options_extra: lotData?.details?.options_extra || carData?.details?.options_extra,
      },
    };
  }, [exchangeRate.rate]);

  const hydrateFromCache = useCallback(async () => {
    if (!lot) return null;

    try {
      console.log('🔍 Loading from cache for lot:', lot);
      
      // Try sessionStorage first (fastest)
      const sessionData = sessionStorage.getItem(`car_${lot}`);
      if (sessionData) {
        console.log('✅ Restored from sessionStorage');
        const restoredCar = JSON.parse(sessionData);
        setCar(restoredCar);
        setLoading(false);
        return restoredCar;
      }

      // Then try Supabase cache
      const { data, error } = await supabase
        .from('cars_cache')
        .select('*')
        .or(`lot_number.eq.${lot},api_id.eq.${lot}`)
        .maybeSingle();

      if (error) {
        console.warn('Failed to load cached car', error);
        return null;
      }

      if (data) {
        console.log('✅ Found cached car data');
        const cachedCar = transformCachedCarRecord(data);
        const lotData = cachedCar?.lots?.[0];
        const details = buildCarDetails(cachedCar, lotData);
        if (details) {
          setCar(details);
          setLoading(false);
          try {
            sessionStorage.setItem(`car_${lot}`, JSON.stringify(details));
          } catch (e) {}
          return details;
        }
      }
    } catch (err) {
      console.warn('Cache hydration failed', err);
    }

    return null;
  }, [buildCarDetails, lot]);

  useEffect(() => {
    let isMounted = true;

    const fetchFromApi = async () => {
      if (!lot || car) return;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let response: Response;
        try {
          response = await fetch(`${API_BASE_URL}/search-lot/${lot}/iaai`, {
            headers: { accept: "*/*", "x-api-key": API_KEY },
            signal: controller.signal
          });
        } catch (firstAttemptError) {
          response = await fetch(`${API_BASE_URL}/search?lot_number=${lot}`, {
            headers: { accept: "*/*", "x-api-key": API_KEY },
            signal: controller.signal
          });
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (!isMounted) return;

        const carData = data.data;
        const lotData = carData?.lots?.[0];
        const details = buildCarDetails(carData, lotData);

        if (!details) {
          console.log("Car doesn't have buy_now pricing, redirecting to catalog");
          navigate('/catalog');
          return;
        }

        setCar(details);
        setLoading(false);
        try {
          sessionStorage.setItem(`car_${lot}`, JSON.stringify(details));
        } catch (e) {}
        trackCarView(lot, details);
      } catch (apiError) {
        console.error("Failed to fetch car data:", apiError);
        if (!isMounted) return;

        const fallbackCar = fallbackCars.find(car => car.id === lot || car.lot_number === lot);
        if (fallbackCar && fallbackCar.lots?.[0]) {
          const details = buildCarDetails(fallbackCar, fallbackCar.lots[0]);
          if (details) {
            console.log("Using fallback car data");
            setCar(details);
            setLoading(false);
            return;
          }
        }

        const errorMessage = apiError instanceof Error
          ? apiError.message.includes("Failed to fetch")
            ? "Unable to connect to the server. Please check your internet connection and try again."
            : apiError.message.includes("404")
              ? `Car with ID ${lot} is not available. This car may have been sold or removed.`
              : "Car not found"
          : "Car not found";
        setError(errorMessage);
        setLoading(false);
      }
    };

    const loadCar = async () => {
      const cachedData = await hydrateFromCache();
      if (!cachedData) {
        await fetchFromApi();
      }
    };

    loadCar();

    return () => {
      isMounted = false;
    };
  }, [buildCarDetails, hydrateFromCache, lot, navigate, car]);

  return { car, loading, error, lot };
};
