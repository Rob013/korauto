import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Car {
  id: string;
  manufacturer?: { id: number; name: string };
  model?: { id: number; name: string };
  generation?: { id: number; name: string; manufacturer_id: number; model_id: number };
  year: number;
  vin?: string;
  fuel?: { id: number; name: string };
  transmission?: { id: number; name: string };
  color?: { id: number; name: string };
  body_type?: { id: number; name: string };
  engine?: { id: number; name: string };
  drive_wheel?: string;
  vehicle_type?: { id: number; name: string };
  cylinders?: string;
  lots?: {
    id: number;
    lot?: string;
    buy_now?: number;
    status?: number;
    sale_status?: string;
    final_price?: number;
    bid?: number;
    damage?: {
      main?: string;
      second?: string;
    };
    keys_available?: boolean;
    airbags?: string;
    grade_iaai?: string;
    seller?: string;
    seller_type?: string;
    sale_date?: string;
    odometer?: {
      km?: number;
      mi?: number;
    };
    images?: {
      normal?: string[];
      big?: string[];
    };
  }[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const safeNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[,\\s]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const selectPrimaryLot = (car: any): any | null => {
  if (!car || !Array.isArray(car?.lots)) {
    return null;
  }

  const activeLot = car.lots.find((lot: any) => {
    if (!lot) return false;

    const status = typeof lot.status === 'number' ? lot.status : safeNumber(lot.status);
    const saleStatus = String(lot.sale_status || '').toLowerCase();

    if (saleStatus.includes('archived')) return false;
    if (saleStatus.includes('sold')) return false;
    if (status === 3) return false;

    return true;
  });

  return activeLot || car.lots[0] || null;
};

const buildMileageInfo = (primaryLot: any, fallbackLot: any) => {
  const lotCandidates = [primaryLot, fallbackLot].filter(Boolean);

  for (const lot of lotCandidates) {
    const km = safeNumber(lot?.odometer?.km ?? lot?.odometer_km ?? lot?.mileage_km);
    if (km !== null) {
      return {
        valueKm: km,
        label: `${Math.round(km).toLocaleString()} km`,
      };
    }

    const miles = safeNumber(lot?.odometer?.mi ?? lot?.odometer_mi ?? lot?.mileage_mi);
    if (miles !== null) {
      return {
        valueKm: Math.round(miles * 1.60934),
        label: `${Math.round(miles).toLocaleString()} mi`,
      };
    }

    const genericMileage = safeNumber(lot?.mileage ?? lot?.odometer);
    if (genericMileage !== null) {
      return {
        valueKm: genericMileage,
        label: `${Math.round(genericMileage).toLocaleString()} km`,
      };
    }
  }

  return {
    valueKm: null,
    label: null,
  };
};

const gatherImages = (primaryLot: any, fallbackLot: any, car: any) => {
  const imagesNormal = Array.isArray(primaryLot?.images?.normal) ? primaryLot.images.normal : [];
  const imagesBig = Array.isArray(primaryLot?.images?.big) ? primaryLot.images.big : [];
  const fallbackNormal = Array.isArray(fallbackLot?.images?.normal) ? fallbackLot.images.normal : [];
  const fallbackBig = Array.isArray(fallbackLot?.images?.big) ? fallbackLot.images.big : [];
  const carImages = Array.isArray(car?.images?.normal)
    ? car.images.normal
    : Array.isArray(car?.images)
      ? car.images
      : [];

  const combined = [...imagesNormal, ...imagesBig, ...fallbackNormal, ...fallbackBig, ...carImages]
    .filter((value) => typeof value === 'string' && value.trim().length > 0);

  const unique = Array.from(new Set(combined));
  const imageUrl = unique.length > 0 ? unique[0] : null;
  const thumbnailUrl = imagesNormal.length > 0 ? imagesNormal[0] : imageUrl;

  return {
    images: imagesNormal.length > 0 ? imagesNormal : fallbackNormal,
    highResImages: imagesBig.length > 0 ? imagesBig : (fallbackBig.length > 0 ? fallbackBig : null),
    allImages: unique,
    imageCount: unique.length,
    imageUrl,
    thumbnailUrl,
  };
};

const extractLocation = (primaryLot: any, fallbackLot: any, car: any) => {
  const location = primaryLot?.location || fallbackLot?.location || car?.location;

  if (!location) {
    return {
      city: null,
      state: null,
      country: 'South Korea',
      latitude: null,
      longitude: null,
    };
  }

  const city = typeof location.city === 'object' ? location.city?.name : location.city;
  const state = location.state ?? location.region ?? location.province ?? null;
  const country = typeof location.country === 'object' ? location.country?.name : location.country ?? 'South Korea';
  const latitude = safeNumber(location.latitude ?? location.lat ?? location.coords?.lat);
  const longitude = safeNumber(location.longitude ?? location.lng ?? location.coords?.lng);

  return {
    city: city || null,
    state: state || null,
    country,
    latitude,
    longitude,
  };
};

const computeRankScore = (year: number | null, price: number | null, mileageKm: number | null, imageCount: number) => {
  let score = 0;

  if (typeof year === 'number' && year > 1900) {
    score += (year - 2000) * 1.5;
  }

  if (typeof price === 'number' && price > 0) {
    score += Math.max(0, 200000 - price) / 10000;
  }

  if (typeof mileageKm === 'number' && mileageKm >= 0) {
    score += Math.max(0, 250000 - mileageKm) / 20000;
  }

  if (Number.isFinite(imageCount) && imageCount > 0) {
    score += Math.min(10, imageCount / 2);
  }

  return Number(score.toFixed(2));
};

const computeCompletenessScore = (checks: Array<boolean | null | undefined>) => {
  const validChecks = checks.filter((value) => value !== null && value !== undefined);
  if (validChecks.length === 0) {
    return null;
  }

  const positives = validChecks.filter(Boolean).length;
  return Math.round((positives / validChecks.length) * 100);
};

const stringifyOrNull = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const fetchCarDetail = async (baseUrl: string, apiKey: string, carId: string): Promise<{ car: any | null; raw: any | null }> => {
  const detailUrl = `${baseUrl}/cars/${encodeURIComponent(carId)}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(detailUrl, {
        headers: {
          accept: 'application/json',
          'x-api-key': apiKey,
        },
      });

      if (response.status === 429) {
        const backoff = 750 * Math.pow(2, attempt);
        console.warn(`⚠️ Detail request rate limited for car ${carId}. Retrying in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }

      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch detail for car ${carId}: ${response.status}`);
        return { car: null, raw: null };
      }

      const payload = await response.json();
      return {
        car: payload?.data || payload || null,
        raw: payload || null,
      };
    } catch (error) {
      console.warn(`⚠️ Detail fetch error for car ${carId} (attempt ${attempt + 1}):`, error);
      await sleep(500 * (attempt + 1));
    }
  }

  return { car: null, raw: null };
};

interface BuildCacheOptions {
  listCar: any | null;
  detailedCar: any | null;
  detailPayload?: any | null;
  syncBatchId: string;
  syncType: string;
}

const buildCarCacheRecord = ({ listCar, detailedCar, detailPayload, syncBatchId, syncType }: BuildCacheOptions) => {
  const baseCar = detailedCar || listCar || {};
  const fallbackCar = listCar || detailedCar || {};

  const carId = String(baseCar?.id ?? fallbackCar?.id ?? crypto.randomUUID());
  const make = baseCar?.manufacturer?.name
    || baseCar?.make
    || fallbackCar?.manufacturer?.name
    || fallbackCar?.make
    || 'Unknown';
  const model = baseCar?.model?.name
    || baseCar?.model
    || fallbackCar?.model?.name
    || fallbackCar?.model
    || 'Unknown';

  const primaryLot = selectPrimaryLot(detailedCar);
  const fallbackLot = selectPrimaryLot(listCar);
  const lot = primaryLot || fallbackLot || {};

  const buyNowRaw = lot?.buy_now
    ?? lot?.price?.price
    ?? lot?.buy_now_price
    ?? fallbackCar?.buy_now
    ?? fallbackCar?.price
    ?? fallbackCar?.buy_now_price;
  const normalizedPrice = safeNumber(buyNowRaw) ?? null;
  const adjustedPrice = normalizedPrice !== null ? Math.round(normalizedPrice + 2550) : null;

  const mileageInfo = buildMileageInfo(lot, fallbackLot);
  const imageInfo = gatherImages(lot, fallbackLot, baseCar);
  const locationInfo = extractLocation(lot, fallbackLot, baseCar);

  const accidentPayload = lot?.insurance
    ?? baseCar?.insurance
    ?? baseCar?.insurance_v2
    ?? baseCar?.details?.insurance
    ?? null;

  const inspectionReport = lot?.inspect
    ?? baseCar?.inspect
    ?? baseCar?.details?.inspect
    ?? null;

  const sellerNotes = lot?.details?.comment
    ?? lot?.details?.description_en
    ?? lot?.details?.description_ko
    ?? baseCar?.details?.description_en
    ?? baseCar?.details?.description_ko
    ?? baseCar?.description
    ?? null;

  const features = lot?.details?.options
    ?? lot?.details?.equipment
    ?? baseCar?.details?.options
    ?? baseCar?.details?.equipment
    ?? null;

  const lotStatusNumeric = typeof lot?.status === 'number' ? lot.status : safeNumber(lot?.status);
  const lotSaleStatus = String(lot?.sale_status || '').toLowerCase();
  const resolvedSaleStatus = lotSaleStatus.includes('sold')
    ? 'sold'
    : lotSaleStatus.includes('pending')
      ? 'pending'
      : lotSaleStatus.includes('archived')
        ? 'archived'
        : lotSaleStatus.includes('live')
          ? 'live'
          : lotStatusNumeric === 3
            ? 'sold'
            : lotStatusNumeric === 2
              ? 'pending'
              : 'active';

  const damagePrimary = lot?.damage?.main ?? fallbackLot?.damage?.main ?? null;
  const damageSecondary = lot?.damage?.second ?? fallbackLot?.damage?.second ?? null;

  const manufacturerName = make?.toString().trim() || 'Unknown';
  const modelName = model?.toString().trim() || 'Unknown';
  const yearValue = safeNumber(baseCar?.year ?? fallbackCar?.year) ?? 2020;

  const rankScore = computeRankScore(yearValue, adjustedPrice, mileageInfo.valueKm, imageInfo.imageCount);
  const completenessScore = computeCompletenessScore([
    adjustedPrice !== null,
    mileageInfo.label !== null,
    Boolean(locationInfo.city || locationInfo.country),
    Boolean(accidentPayload),
    Boolean(inspectionReport),
    Boolean(features),
    imageInfo.imageCount >= 6,
    Boolean(sellerNotes),
  ]);

  const nowIso = new Date().toISOString();

  return {
    id: carId,
    api_id: carId,
    make: manufacturerName,
    model: modelName,
    year: yearValue,
    vin: baseCar?.vin ?? fallbackCar?.vin ?? null,
    fuel: baseCar?.fuel?.name ?? baseCar?.fuel ?? fallbackCar?.fuel?.name ?? fallbackCar?.fuel ?? null,
    transmission: baseCar?.transmission?.name ?? baseCar?.transmission ?? fallbackCar?.transmission?.name ?? fallbackCar?.transmission ?? null,
    color: baseCar?.color?.name ?? baseCar?.color ?? fallbackCar?.color?.name ?? fallbackCar?.color ?? null,
    body_style: baseCar?.body_type?.name ?? fallbackCar?.body_type?.name ?? null,
    drive_type: baseCar?.drive_wheel ?? fallbackCar?.drive_wheel ?? null,
    engine_displacement: baseCar?.engine?.name ?? fallbackCar?.engine?.name ?? null,
    engine_size: stringifyOrNull(baseCar?.details?.engine_volume ?? fallbackCar?.details?.engine_volume),
    cylinders: safeNumber(baseCar?.cylinders ?? fallbackCar?.cylinders),
    torque: stringifyOrNull(baseCar?.engine?.torque ?? fallbackCar?.engine?.torque),
    max_power: stringifyOrNull(baseCar?.engine?.max_power ?? fallbackCar?.engine?.max_power),
    fuel_consumption: stringifyOrNull(baseCar?.details?.fuel_consumption ?? fallbackCar?.details?.fuel_consumption),
    modifications: stringifyOrNull(baseCar?.details?.tuning ?? fallbackCar?.details?.tuning),
    acceleration: stringifyOrNull(baseCar?.details?.acceleration ?? fallbackCar?.details?.acceleration),
    top_speed: stringifyOrNull(baseCar?.details?.top_speed ?? fallbackCar?.details?.top_speed),
    doors: safeNumber(baseCar?.details?.doors ?? fallbackCar?.details?.doors),
    seats: safeNumber(baseCar?.details?.seats_count ?? fallbackCar?.details?.seats_count),
    estimated_value: safeNumber(lot?.details?.pre_accident_price ?? lot?.details?.actual_cash_value ?? lot?.final_price ?? fallbackLot?.details?.pre_accident_price),
    price: adjustedPrice,
    price_cents: adjustedPrice !== null ? adjustedPrice * 100 : null,
    price_usd: adjustedPrice,
    price_eur: safeNumber(lot?.price_eur ?? fallbackLot?.price_eur ?? null),
    mileage: mileageInfo.label,
    rank_score: rankScore,
    data_completeness_score: completenessScore,
    lot_number: lot?.lot ?? fallbackLot?.lot ?? fallbackCar?.lot_number ?? null,
    lot_seller: lot?.seller ?? lot?.seller_name ?? fallbackLot?.seller ?? null,
    seller_type: lot?.seller_type ?? fallbackLot?.seller_type ?? null,
    sale_status: resolvedSaleStatus,
    sale_title: baseCar?.title ?? fallbackCar?.title ?? `${manufacturerName} ${modelName}`.trim(),
    auction_date: lot?.sale_date ?? fallbackLot?.sale_date ?? null,
    bid_count: safeNumber(lot?.bid_count ?? lot?.bid ?? fallbackLot?.bid_count),
    damage_primary: damagePrimary,
    damage_secondary: damageSecondary,
    keys_count: safeNumber(lot?.keys_count ?? fallbackLot?.keys_count),
    keys_count_detailed: safeNumber(lot?.keys_count_detailed ?? fallbackLot?.keys_count_detailed),
    spare_key_available: typeof lot?.keys_available === 'boolean' ? lot.keys_available : (typeof fallbackLot?.keys_available === 'boolean' ? fallbackLot.keys_available : null),
    service_book_available: typeof lot?.details?.service_book_available === 'boolean'
      ? lot.details.service_book_available
      : (typeof fallbackLot?.details?.service_book_available === 'boolean'
        ? fallbackLot.details.service_book_available
        : null),
    service_history: stringifyOrNull(lot?.details?.service_history ?? baseCar?.details?.service_history ?? fallbackCar?.details?.service_history),
    seller_notes: sellerNotes ? String(sellerNotes) : null,
    features: features ?? null,
    inspection_report: inspectionReport ?? null,
    accident_history: stringifyOrNull(accidentPayload),
    source_site: lot?.domain?.name ?? fallbackLot?.domain?.name ?? baseCar?.provider ?? fallbackCar?.provider ?? 'external',
    external_url: baseCar?.url ?? lot?.external_url ?? fallbackLot?.external_url ?? null,
    location_city: locationInfo.city,
    location_state: locationInfo.state,
    location_country: locationInfo.country,
    views_count: safeNumber(lot?.views_count ?? lot?.views ?? fallbackLot?.views_count),
    watchers_count: safeNumber(lot?.watchers_count ?? fallbackLot?.watchers_count),
    thumbnail_url: imageInfo.thumbnailUrl,
    image_url: imageInfo.imageUrl,
    images: imageInfo.images ?? [],
    high_res_images: imageInfo.highResImages,
    all_images_urls: imageInfo.allImages,
    image_count: imageInfo.imageCount,
    time_left: lot?.time_left ?? fallbackLot?.time_left ?? null,
    reserve_met: typeof lot?.reserve_met === 'boolean' ? lot.reserve_met : (typeof fallbackLot?.reserve_met === 'boolean' ? fallbackLot.reserve_met : null),
    title_status: lot?.details?.title_status ?? fallbackLot?.details?.title_status ?? null,
    warranty_info: stringifyOrNull(baseCar?.details?.warranty ?? fallbackCar?.details?.warranty),
    previous_owners: safeNumber(baseCar?.details?.insurance?.owner_change_cnt ?? fallbackCar?.details?.insurance?.owner_change_cnt)
      ?? (Array.isArray(baseCar?.details?.insurance?.owner_changes)
        ? baseCar.details.insurance.owner_changes.length
        : null),
    registration_date: baseCar?.details?.insurance?.general_info?.insurance_start_date
      ?? fallbackCar?.details?.insurance?.general_info?.insurance_start_date
      ?? baseCar?.registration_date
      ?? fallbackCar?.registration_date
      ?? null,
    first_registration: (() => {
      const firstReg = baseCar?.details?.first_registration ?? fallbackCar?.details?.first_registration;
      if (!firstReg) return null;
      if (typeof firstReg === 'string') return firstReg;
      if (typeof firstReg === 'object') {
        const year = safeNumber(firstReg.year);
        const month = safeNumber(firstReg.month);
        const day = safeNumber(firstReg.day);
        if (year && month) {
          const paddedMonth = month.toString().padStart(2, '0');
          const paddedDay = day ? day.toString().padStart(2, '0') : '01';
          return `${year}-${paddedMonth}-${paddedDay}`;
        }
        return stringifyOrNull(firstReg);
      }
      return null;
    })(),
    mot_expiry: baseCar?.details?.mot ?? fallbackCar?.details?.mot ?? null,
    road_tax: safeNumber(baseCar?.details?.road_tax ?? fallbackCar?.details?.road_tax),
    insurance_group: baseCar?.details?.insurance?.general_info?.insurance_group
      ?? fallbackCar?.details?.insurance?.general_info?.insurance_group
      ?? null,
    car_data: detailedCar || listCar || {},
    lot_data: lot || {},
    original_api_data: detailPayload || detailedCar || listCar || {},
    last_api_response: detailPayload || detailedCar || listCar || {},
    last_api_sync: nowIso,
    last_updated_source: nowIso,
    sync_batch_id: syncBatchId,
    sync_metadata: {
      sync_type: syncType,
      sync_batch_id: syncBatchId,
      fetched_at: nowIso,
      source: lot?.domain?.name ?? fallbackLot?.domain?.name ?? 'external',
    },
    sync_retry_count: 0,
    created_at: fallbackCar?.created_at ?? nowIso,
    updated_at: nowIso,
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      'https://qtyyiqimkysmjnaocswe.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🚀 Starting cars sync...');

    const API_KEY = 'd00985c77981fe8d26be16735f932ed1';
    const API_BASE_URL = 'https://auctionsapi.com/api';

    // Parse request body for action type
    const requestBody = await req.json().catch(() => ({ action: 'status_refresh' }));
    const syncAction = requestBody.action || 'status_refresh';
    const syncType = requestBody.type || 'incremental'; // 'incremental' or 'full'
    const isScheduled = requestBody.scheduled === true;

    console.log(`📋 Sync action: ${syncAction}, type: ${syncType}, scheduled: ${isScheduled}`);

    // Create a sync log entry
    let syncLogId: string | null = null;
    if (syncAction === 'status_refresh' || syncAction === 'prefetch_cars') {
      const { data: logData, error: logError } = await supabaseClient
        .from('cars_sync_log')
        .insert({
          sync_type: syncType,
          status: 'running',
          metadata: {
            action: syncAction,
            scheduled: isScheduled,
            timestamp: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (!logError && logData) {
        syncLogId = logData.id;
        console.log(`📝 Created sync log entry: ${syncLogId}`);
      }
    }


    // Utility: fetch with graceful fallback
    const fetchWithCors = async (url: string): Promise<Response> => {
      return await fetch(url, { method: 'GET' });
    };

    // If asked to import from an example/demo HTML link, parse and import all pages
    if (syncAction === 'grid_link') {
      try {
        const link: string | undefined = requestBody.link;
        if (!link) {
          return new Response(JSON.stringify({ success: false, error: 'Missing link' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 1) Resolve start API URL from the HTML demo page
        const htmlRes = await fetchWithCors(link);
        if (!htmlRes.ok) throw new Error(`Failed to fetch link HTML: ${htmlRes.status}`);
        const html = await htmlRes.text();
        let startUrl: string | null = null;
        const m = html.match(/const\s+target\s*=\s*"([^"]+)"/);
        if (m && m[1]) {
          startUrl = m[1];
        } else {
          const m2 = html.match(/https:\/\/api\.auctionsapi\.com\/cars\?[^"']+/);
          if (m2 && m2[0]) startUrl = m2[0];
        }
        if (!startUrl) throw new Error('Could not resolve API URL from provided link');

        // Respect a reasonable limit from request body or default
        const limit = Number(requestBody.limit || 100);
        const pagesLimit = Number(requestBody.pages || 50); // safeguard
        const urlObj = new URL(startUrl);
        urlObj.searchParams.set('limit', String(limit));
        let nextUrl: string | null = urlObj.toString();

        let imported = 0;
        let kbchachaCount = 0;
        let encarCount = 0;

        // cache existing IDs to count new additions only
        const existingIds = new Set<string>();
        {
          const { data: existing, error: exErr } = await supabaseClient
            .from('cars_cache')
            .select('id');
          if (!exErr && Array.isArray(existing)) {
            for (const row of existing) {
              if (row?.id) existingIds.add(String(row.id));
            }
          }
        }

        let page = 0;
        const seen = new Set<string>();
        while (nextUrl && page < pagesLimit) {
          page++;
          const res = await fetchWithCors(nextUrl);
          if (!res.ok) break;
          const payload = await res.json();
          const items = Array.isArray(payload) ? payload : (payload?.data || []);
          for (const raw of items) {
            try {
              // normalize grid car → cache record
              const listing = (raw?.listings?.find((l: any) => !l?.archived) || raw?.listings?.[0]) || {};
              const id = String(raw?.id ?? `${raw?.year || ''}-${raw?.badge || ''}-${listing?.price?.price || Math.random()}`);
              if (seen.has(id)) continue;
              seen.add(id);

              const preview = listing?.images?.[0]?.preview || '';
              const priceAmount = typeof listing?.price?.price === 'number' ? Math.round(listing.price.price + 2550) : null;
              const lotNumber = raw?.lot_number || undefined;
              const lotStatus = 1; // grid cars treated as active
              const lotData = listing || {};

              const domainName: string = (raw?.domain_name || 'kbchachacha').toString();
              const isKBC = domainName.includes('kbchachacha') || domainName.includes('kb_chachacha');
              if (isKBC) kbchachaCount++; else encarCount++;

              const carCache = {
                id: id,
                api_id: id,
                make: raw?.brand || 'Unknown',
                model: raw?.model || 'Unknown',
                year: raw?.year || 2020,
                price: priceAmount,
                price_cents: priceAmount ? priceAmount * 100 : null,
                vin: raw?.vin,
                fuel: raw?.fuel || (lotData?.fuel?.name || lotData?.fuel) || null,
                transmission: raw?.transmission || (raw?.gearbox || null),
                color: raw?.color || null,
                condition: lotData?.condition?.name || null,
                lot_number: lotNumber,
                mileage: typeof lotData?.odometer === 'number' ? `${lotData.odometer.toLocaleString()} km` : null,
                images: preview ? [preview] : [],
                source_site: domainName,
                location_country: (lotData?.location?.country || raw?.location) || 'South Korea',
                car_data: raw,
                lot_data: lotData,
                last_api_sync: new Date().toISOString(),
                sale_status: Number(lotStatus) === 3 ? 'sold' : (Number(lotStatus) === 2 ? 'pending' : 'active')
              } as any;

              const { error } = await supabaseClient
                .from('cars_cache')
                .upsert(carCache, { onConflict: 'id', ignoreDuplicates: false });
              if (!error) {
                if (!existingIds.has(id)) imported++;
              }
            } catch (e) {
              // continue on errors
            }
          }
          nextUrl = payload?.next_url || null;
        }

        return new Response(JSON.stringify({
          success: true,
          message: `Imported ${imported} grid cars`,
          imported,
          encarCount,
          kbchachaCount
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message || String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else if (syncAction === 'prefetch_cars') {
      const rawCarIds = Array.isArray(requestBody.car_ids) ? requestBody.car_ids : [];
      const carIds = rawCarIds
        .map((id: any) => {
          if (typeof id === 'number' || typeof id === 'string') {
            const cleaned = String(id).trim();
            return cleaned.length > 0 ? cleaned : null;
          }
          return null;
        })
        .filter((id: unknown): id is string => Boolean(id) && typeof id === 'string');

      if (carIds.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'No car IDs provided for prefetch' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const uniqueIds = Array.from(new Set(carIds));
      const errors: Array<{ id: string; error: string }> = [];
      let cachedCount = 0;
      let encarCount = 0;
      let kbchachaCount = 0;
      const syncBatchId = `prefetch-${Date.now()}`;

      for (const carId of uniqueIds) {
        try {
          const { car: detailedCar, raw } = await fetchCarDetail(API_BASE_URL, API_KEY, String(carId));

          if (!detailedCar) {
            throw new Error('No data returned from detail endpoint');
          }

          const cacheRecord = buildCarCacheRecord({
            listCar: null,
            detailedCar,
            detailPayload: raw,
            syncBatchId,
            syncType: 'prefetch',
          });

          const sourceSite = String(cacheRecord.source_site || '').toLowerCase();
          if (sourceSite.includes('kbchacha')) {
            kbchachaCount++;
          } else {
            encarCount++;
          }

          const { error: upsertError } = await supabaseClient
            .from('cars_cache')
            .upsert(cacheRecord, { onConflict: 'id', ignoreDuplicates: false });

          if (upsertError) {
            throw new Error(upsertError.message);
          }

          cachedCount++;
          await sleep(150);
        } catch (error: any) {
          errors.push({ id: String(carId), error: error instanceof Error ? error.message : String(error) });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: uniqueIds.length,
          cached: cachedCount,
          encarCount,
          kbchachaCount,
          errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For status refresh, do a quick incremental sync
    const pagesLimit = syncType === 'full' ? 500 : 1; // Full sync: 500 pages, Incremental: 1 page
    const perPage = 50;

    let page = 1;
    let totalSynced = 0;
    let encarCount = 0;
    let kbchachaCount = 0;
    let hasMorePages = true;
    const syncBatchId = crypto.randomUUID();

    while (hasMorePages && page <= pagesLimit) {
      console.log(`📄 Fetching page ${page}...`);

      // Fetch all cars without domain filter to get both Encar and KB Chachacha
      const response = await fetch(`${API_BASE_URL}/cars?per_page=${perPage}&page=${page}&simple_paginate=0`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': API_KEY
        }
      });

      if (!response.ok) {
        console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json();
      const cars: Car[] = data.data || [];

      if (cars.length === 0) {
        console.log('✅ No more cars to sync');
        hasMorePages = false;
        break;
      }

      console.log(`🔄 Processing ${cars.length} cars from page ${page}...`);

      // Process cars in batches
      const batchSize = syncType === 'full' ? 5 : 10;
      for (let i = 0; i < cars.length; i += batchSize) {
        const batch = cars.slice(i, i + batchSize);

        for (const car of batch) {
          try {
            const { car: detailedCar, raw } = await fetchCarDetail(API_BASE_URL, API_KEY, car.id.toString());
            if (!detailedCar) {
              console.warn(`⚠️ Detail data unavailable for car ${car.id}, using list data only.`);
            }

            const cacheRecord = buildCarCacheRecord({
              listCar: car,
              detailedCar,
              detailPayload: raw,
              syncBatchId,
              syncType,
            });

            const sourceSite = String(cacheRecord.source_site || '').toLowerCase();
            if (sourceSite.includes('kbchacha')) {
              kbchachaCount++;
            } else {
              encarCount++;
            }

            const { error } = await supabaseClient
              .from('cars_cache')
              .upsert(cacheRecord, {
                onConflict: 'id',
                ignoreDuplicates: false
              });

            if (error) {
              console.error(`❌ Error upserting car ${car.id}:`, error);
            } else {
              totalSynced++;
            }

            await sleep(syncType === 'full' ? 200 : 75);
          } catch (err) {
            console.error(`❌ Error processing car ${car.id}:`, err);
          }
        }
      }

      // Check if there are more pages
      const hasNext = data.meta?.current_page < data.meta?.last_page;
      hasMorePages = hasNext;
      page++;

      // Wait 2 seconds between page requests to avoid rate limiting
      if (hasMorePages && page <= pagesLimit) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Get total counts from database
    const { count: totalCarsInDb } = await supabaseClient
      .from('cars_cache')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Sync complete! Synced: ${totalSynced} (Encar: ${encarCount}, KB Chachacha: ${kbchachaCount})`);
    console.log(`📊 Total cars in database: ${totalCarsInDb}`);

    // Update sync log with completion
    if (syncLogId) {
      await supabaseClient
        .from('cars_sync_log')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          cars_synced: totalSynced,
          metadata: {
            action: syncAction,
            scheduled: isScheduled,
            encar_count: encarCount,
            kbchacha_count: kbchachaCount,
            total_in_db: totalCarsInDb
          }
        })
        .eq('id', syncLogId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} cars`,
        totalSynced,
        encarCount,
        kbchachaCount,
        totalInDatabase: totalCarsInDb,
        syncType,
        syncLogId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Cars sync failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});