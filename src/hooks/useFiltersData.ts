import { useQuery } from "@tanstack/react-query";

const API_BASE_URL = "https://auctionsapi.com/api";
const API_KEY = "d00985c77981fe8d26be16735f932ed1";

type QueryParams = Record<string, string | number | undefined | null>;

const fetchFromAuctionsApi = async (endpoint: string, params: QueryParams = {}) => {
  const url = new URL(endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}/${endpoint}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const normalized = String(value).trim();
    if (normalized.length === 0) return;
    url.searchParams.append(key, normalized);
  });

  const response = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      "x-api-key": API_KEY,
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`AuctionsAPI ${response.status}: ${message}`);
  }

  return response.json();
};

const normalizeList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const useManufacturers = () => {
  return useQuery({
    queryKey: ["manufacturers"],
    queryFn: async () => {
      const payload = await fetchFromAuctionsApi("manufacturers/cars", {
        per_page: "1000",
        simple_paginate: "0",
      });

      const manufacturers = normalizeList(payload)
        .filter((manufacturer: any) => manufacturer && manufacturer.id && manufacturer.name)
        .map((manufacturer: any) => {
          const parsedId = Number.parseInt(String(manufacturer.id), 10);
          const normalizedId = Number.isFinite(parsedId) ? parsedId : manufacturer.id;
          const carsCount = Number(manufacturer.car_count ?? manufacturer.cars_qty ?? 0);
          return {
            id: normalizedId,
            name: manufacturer.name,
            car_count: carsCount,
            cars_qty: carsCount,
            image: manufacturer.image ?? manufacturer.logo_url ?? null,
          };
        })
        .sort((a: any, b: any) => (b.car_count ?? 0) - (a.car_count ?? 0));

      return manufacturers;
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useModels = (manufacturerId?: string) => {
  return useQuery({
    queryKey: ["models", manufacturerId],
    queryFn: async () => {
      if (!manufacturerId) return [];

      const payload = await fetchFromAuctionsApi(`models/${manufacturerId}/cars`, {
        per_page: "1000",
        simple_paginate: "0",
      });

      const models = normalizeList(payload)
        .filter((model: any) => {
          if (!model || !model.id || !model.name) return false;
          const modelManufacturerId =
            model.manufacturer_id ?? model.manufacturer?.id ?? model.manufacturerId;
          return String(modelManufacturerId ?? "") === manufacturerId;
        })
        .map((model: any) => {
          const parsedId = Number.parseInt(String(model.id), 10);
          const normalizedId = Number.isFinite(parsedId) ? parsedId : model.id;
          const carsCount = Number(model.car_count ?? model.cars_qty ?? 0);
          return {
            id: normalizedId,
            name: model.name,
            car_count: carsCount,
            cars_qty: carsCount,
          };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      return models;
    },
    enabled: !!manufacturerId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useGenerations = (modelId?: string, manufacturerId?: string) => {
  return useQuery({
    queryKey: ["generations", modelId, manufacturerId],
    queryFn: async () => {
      if (!modelId) return [];

      const payload = await fetchFromAuctionsApi(`generations/${modelId}`);

      const generations = normalizeList(payload)
        .filter((generation: any) => generation && generation.id && generation.name)
        .map((generation: any) => {
          const parsedId = Number.parseInt(String(generation.id), 10);
          const normalizedId = Number.isFinite(parsedId) ? parsedId : generation.id;
          const parsedModelId =
            Number.parseInt(String(generation.model_id ?? modelId), 10) ||
            Number.parseInt(modelId, 10) ||
            modelId;
          const parsedManufacturerId = (() => {
            if (generation.manufacturer_id) {
              const parsed = Number.parseInt(String(generation.manufacturer_id), 10);
              if (Number.isFinite(parsed)) return parsed;
            }
            if (manufacturerId) {
              const parsed = Number.parseInt(manufacturerId, 10);
              if (Number.isFinite(parsed)) return parsed;
            }
            return undefined;
          })();
          const carsCount = Number(generation.car_count ?? generation.cars_qty ?? 0);
          return {
            id: normalizedId,
            name: generation.name,
            car_count: carsCount,
            cars_qty: carsCount,
            from_year: generation.from_year,
            to_year: generation.to_year,
            manufacturer_id: parsedManufacturerId,
            model_id: parsedModelId,
          };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      return generations;
    },
    enabled: !!modelId,
    staleTime: 1000 * 60 * 10,
  });
};

export const useTrims = (modelId?: string) => {
  return useQuery({
    queryKey: ["trims", modelId],
    queryFn: async () => {
      if (!modelId) return [];

      const payload = await fetchFromAuctionsApi("cars", {
        model_id: modelId,
        per_page: "200",
        simple_paginate: "0",
      });

      const cars = normalizeList(payload);
      const trims = new Map<string, { id: string; name: string; count: number }>();

      cars.forEach((car: any) => {
        const rawTrim =
          car?.details?.trim?.name ??
          car?.details?.trim ??
          car?.trim ??
          car?.details?.grade ??
          null;

        if (!rawTrim) return;
        const name = String(rawTrim).trim();
        if (!name) return;
        const key = name.toLowerCase();

        const existing = trims.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          trims.set(key, { id: key, name, count: 1 });
        }
      });

      return Array.from(trims.values())
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .map(({ id, name, count }) => ({ id, name, count }));
    },
    enabled: !!modelId,
    staleTime: 1000 * 60 * 10,
  });
};