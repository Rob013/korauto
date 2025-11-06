import { supabase } from "@/integrations/supabase/client";
import { transformCachedCarRecord } from "@/services/carCache";

export const CAR_PREFETCH_STORAGE_PREFIX = "car_prefetch_";
export const CAR_PREFETCH_TTL = 5 * 60 * 1000; // 5 minutes

const inflightPrefetches = new Map<string, Promise<void>>();
let carDetailsModulePromise: Promise<unknown> | null = null;

const isBrowser = () => typeof window !== "undefined" && typeof sessionStorage !== "undefined";

export const preloadCarDetailsPage = () => {
  if (!isBrowser()) {
    return;
  }

  if (!carDetailsModulePromise) {
    carDetailsModulePromise = import("@/pages/CarDetails").catch((error) => {
      console.warn("Failed to preload car details page", error);
      carDetailsModulePromise = null;
    });
  }

  return carDetailsModulePromise;
};

export const prefetchCarDetails = (lotId?: string | number | null) => {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  const identifier = lotId != null ? String(lotId).trim() : "";
  if (!identifier) {
    return Promise.resolve();
  }

  // If full details already cached, skip prefetch
  try {
    if (sessionStorage.getItem(`car_${identifier}`)) {
      return Promise.resolve();
    }
  } catch (error) {
    console.warn("Unable to access sessionStorage for cached car", error);
  }

  const storageKey = `${CAR_PREFETCH_STORAGE_PREFIX}${identifier}`;

  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed?.timestamp && Date.now() - parsed.timestamp < CAR_PREFETCH_TTL) {
        return Promise.resolve();
      }
    }
  } catch (error) {
    console.warn("Failed to read prefetched car data", error);
    try {
      sessionStorage.removeItem(storageKey);
    } catch (removeError) {
      console.warn("Failed to clear invalid prefetched car data", removeError);
    }
  }

  if (inflightPrefetches.has(identifier)) {
    return inflightPrefetches.get(identifier)!;
  }

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from("cars_cache")
        .select("*")
        .or(`lot_number.eq.${identifier},api_id.eq.${identifier}`)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          console.warn("Prefetch cars_cache lookup failed", error);
        }
        return;
      }

      const transformed = transformCachedCarRecord(data);
      if (!transformed) {
        return;
      }

      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          timestamp: Date.now(),
          data: transformed
        })
      );
    } catch (error) {
      console.warn("Car prefetch failed", error);
    } finally {
      inflightPrefetches.delete(identifier);
    }
  })();

  inflightPrefetches.set(identifier, promise);
  return promise;
};
