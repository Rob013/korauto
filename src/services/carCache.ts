import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client";

interface CacheFetchOptions {
  limit?: number;
}

const parseJson = <T>(value: any): T | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value as T;
  }

  try {
    return JSON.parse(String(value)) as T;
  } catch (error) {
    console.warn("Failed to parse cached JSON value", error);
    return null;
  }
};

export const isCarSold = (car: any): boolean => {
  const statusLabels = [
    String(car?.sale_status || "").toLowerCase(),
    String(car?.status || "").toLowerCase(),
    String(car?.lots?.[0]?.status || "").toLowerCase(),
  ];

  if (statusLabels.some((label) => label.includes("sold") || label.includes("archived") || label.includes("inactive"))) {
    return true;
  }

  const numericStatus = Number(car?.status ?? car?.lots?.[0]?.status);
  return Number.isFinite(numericStatus) && [3, 4, 5].includes(numericStatus);
};

export const transformCachedCarRecord = (record: any) => {
  const carData = parseJson<any>(record?.car_data) || {};
  const lotFromCar = Array.isArray(carData?.lots) ? carData.lots[0] : null;
  const lotData = parseJson<any>(record?.lot_data) || lotFromCar || {};
  
  // Extract year from multiple sources
  const year = record?.year 
    || carData?.year 
    || lotData?.year 
    || carData?.model_year 
    || lotData?.model_year 
    || carData?.production_year 
    || lotData?.production_year;
  
  const images = Array.isArray(record?.images)
    ? record.images
    : Array.isArray(lotData?.images?.normal)
      ? lotData.images.normal
      : Array.isArray(lotData?.images?.big)
        ? lotData.images.big
        : Array.isArray(carData?.images?.normal)
          ? carData.images.normal
          : Array.isArray(carData?.images?.big)
            ? carData.images.big
            : [];

  const manufacturerName = carData?.manufacturer?.name || record?.make;
  const modelName = carData?.model?.name || record?.model;

  const normalizedLot = {
    ...lotData,
    lot: lotData?.lot || record?.lot_number || lotFromCar?.lot,
    buy_now: Number(lotData?.buy_now ?? record?.price ?? lotFromCar?.buy_now ?? 0) || null,
    year: year, // Include extracted year
    images: lotData?.images || {
      normal: images,
      big: images,
    },
  };

  const transformed = {
    ...carData,
    id: carData?.id || record?.api_id || record?.id,
    year: year, // Include extracted year at top level
    manufacturer: carData?.manufacturer || (manufacturerName
      ? {
          id: carData?.manufacturer?.id || record?.manufacturer_id || 0,
          name: manufacturerName,
        }
      : undefined),
    model: carData?.model || (modelName
      ? {
          id: carData?.model?.id || record?.model_id || 0,
          name: modelName,
        }
      : undefined),
    lots: carData?.lots && carData.lots.length > 0 ? carData.lots : [normalizedLot],
    sale_status: carData?.sale_status || normalizedLot?.sale_status || record?.sale_status,
    status: carData?.status || normalizedLot?.status || record?.status,
  };

  return transformed;
};

export const fetchCachedCars = async (options: CacheFetchOptions = {}) => {
  const { limit = 200 } = options;

  const { data, error } = await supabase
    .from("cars_cache")
    .select("api_id, id, make, model, price, price_usd, lot_number, sale_status, status, car_data, lot_data, images, accident_history")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch cached cars:", error);
    return [];
  }

  const transformed = (data || []).map(transformCachedCarRecord).filter((car) => !isCarSold(car));

  return transformed;
};

export const triggerInventoryRefresh = async (minutes = 60) => {
  try {
    const now = Date.now();
    const cacheKey = "encar-last-inventory-refresh";
    const lastRun = Number(localStorage.getItem(cacheKey) || 0);

    if (now - lastRun < 30 * 60 * 1000) {
      return { skipped: true };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/encar-sync?type=incremental&minutes=${minutes}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ triggeredBy: "web" }),
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger inventory refresh: ${response.status}`);
    }

    localStorage.setItem(cacheKey, String(now));
    return { success: true };
  } catch (error) {
    console.error("Inventory refresh failed", error);
    return { success: false, error };
  }
};

export const shouldUseCachedPrime = (filters: any) => {
  if (!filters) {
    return true;
  }

  const meaningfulFilters = [
    "manufacturer_id",
    "model_id",
    "generation_id",
    "search",
    "grade_iaai",
    "trim_level",
    "engine_spec",
  ];

  return !meaningfulFilters.some((key) => {
    const value = filters[key];
    return value !== undefined && value !== null && value !== "" && value !== "all";
  });
};

