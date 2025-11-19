import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_BASE_URL = 'https://auctionsapi.com/api';
const RATE_LIMIT_DELAY = 15000;
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 3;

interface CacheSyncOptions {
  fullSync?: boolean;
  startPage?: number;
  maxPages?: number;
}

// Helper to validate and sanitize timestamp values
const safeTimestamp = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  
  // Check if it's a valid ISO timestamp
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('AUCTIONS_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json() as CacheSyncOptions;
    // Reduce max pages to 3 to avoid timeouts (750 cars max per request)
    const { fullSync = false, startPage = 1, maxPages = 3 } = body;

    console.log(`🔄 Starting API cache sync - Full: ${fullSync}, Pages: ${startPage}-${startPage + maxPages}`);

    let currentPage = startPage;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore && currentPage < (startPage + maxPages)) {
      try {
        // Fetch from API
        const url = `${API_BASE_URL}/cars?page=${currentPage}&per_page=250`;
        console.log(`📡 Fetching page ${currentPage}`);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-CacheSync/1.0',
            'X-API-Key': apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const apiData = await response.json();
        const cars = apiData.data || [];

        if (cars.length === 0) {
          hasMore = false;
          break;
        }

        // Batch upsert to avoid timeouts - process in chunks of 50
        const BATCH_SIZE = 50;
        for (let i = 0; i < cars.length; i += BATCH_SIZE) {
          const batch = cars.slice(i, i + BATCH_SIZE);
          const cacheRecords = [];

          for (const car of batch) {
            const lot = car.lots?.[0] || {};
            const insurance = lot.insurance || car.insurance || {};
            const insurance_v2 = lot.insurance_v2 || car.insurance_v2 || {};
            
            const cacheRecord = {
            id: String(car.id),
            api_id: String(car.id),
            make: car.manufacturer?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year || lot.year || new Date().getFullYear(),
            vin: car.vin || lot.vin || null,
            
              // Pricing - applying +2500 EUR markup
              price: lot.buy_now || lot.final_bid || lot.price || null,
              price_usd: lot.buy_now || lot.final_bid || lot.price || null,
              price_eur: lot.buy_now ? Math.round(lot.buy_now * 0.92 + 2500) : null,
              price_cents: lot.buy_now ? Math.round((lot.buy_now * 0.92 + 2500) * 100) : null,
            
            // Basic specs
            mileage: String(lot.odometer?.km || car.mileage || 0),
            fuel: lot.fuel || car.fuel || null,
            transmission: lot.transmission || car.transmission || null,
            color: lot.color || car.color || null,
            condition: car.condition || lot.condition || null,
            grade: car.grade || lot.grade_iaai || null,
            
              // Lot info
              lot_number: lot.lot || null,
              lot_seller: lot.seller || null,
              sale_status: lot.sale_status || car.sale_status || 'active',
              sale_title: lot.detailed_title || null,
              auction_date: safeTimestamp(lot.sale_date || car.sale_date),
            
            // Images - all sources with comprehensive extraction
            images: [
              ...(lot.images?.normal || []),
              ...(lot.images?.big || []),
              ...(lot.images?.hd || []),
              ...(car.images || []),
              ...(car.photos || []),
              ...(car.gallery || [])
            ].filter((url, index, self) => url && self.indexOf(url) === index),
            high_res_images: [
              ...(lot.images?.big || []),
              ...(lot.images?.hd || []),
              ...(car.high_res_images || []),
              ...(car.hd_images || [])
            ].filter((url, index, self) => url && self.indexOf(url) === index),
            image_url: (
              lot.images?.big?.[0] || 
              lot.images?.hd?.[0] || 
              lot.images?.normal?.[0] || 
              car.images?.[0] || 
              car.photos?.[0] || 
              null
            ),
            all_images_urls: [
              ...(lot.images?.normal || []),
              ...(lot.images?.big || []),
              ...(lot.images?.hd || []),
              ...(car.images || []),
              ...(car.photos || []),
              ...(car.gallery || []),
              ...(car.high_res_images || []),
              ...(car.hd_images || [])
            ].filter((url, index, self) => url && self.indexOf(url) === index),
            thumbnail_url: lot.images?.thumbnail?.[0] || lot.images?.normal?.[0] || null,
            image_count: (lot.images?.normal?.length || 0) + (lot.images?.big?.length || 0) + (lot.images?.hd?.length || 0) + (car.images?.length || 0),
            
            // Damage info
            damage_primary: lot.damage?.main || null,
            damage_secondary: lot.damage?.second || null,
            accident_history: insurance?.accident_history || insurance_v2?.accidentHistory || null,
            
            // Engine specs
            engine_size: car.engine_size || car.displacement || null,
            engine_displacement: car.displacement || null,
            cylinders: car.cylinders || null,
            max_power: car.power || car.max_power || null,
            torque: car.torque || null,
            
            // Performance
            acceleration: car.acceleration || null,
            top_speed: car.top_speed || null,
            co2_emissions: car.co2_emissions || null,
            fuel_consumption: car.fuel_consumption || null,
            
            // Vehicle details
            doors: car.doors || null,
            seats: car.seats || null,
            body_style: car.body_style || null,
            drive_type: car.drive_type || null,
            
            // Location
            location_country: 'South Korea',
            location_state: lot.location || null,
            location_city: car.city || null,
            
            // Seller info
            seller_type: lot.seller_type || null,
            seller_notes: car.description || lot.notes || null,
            
            // History
            previous_owners: car.previous_owners || null,
            service_history: car.service_history || null,
            warranty_info: car.warranty || null,
            modifications: car.modifications || null,
            
            // Features
            features: car.features || lot.features || [],
            inspection_report: car.inspection || lot.inspection || {},
            
            // Keys & docs
            keys_count: lot.keys_available ? 1 : 0,
            spare_key_available: lot.keys_available || false,
            
            // Store complete data
            car_data: car,
            lot_data: lot,
            original_api_data: car,
            
              // Metadata
              last_api_sync: new Date().toISOString(),
              last_updated_source: 'api-cache-sync',
              api_version: '2.0',
              rank_score: lot.popularity_score || 0,
              registration_date: safeTimestamp(car.registration_date || lot.registration_date),
              first_registration: safeTimestamp(car.first_registration || lot.first_registration),
              mot_expiry: safeTimestamp(car.mot_expiry || lot.mot_expiry),
              created_at: safeTimestamp(car.created_at) || new Date().toISOString(),
              sync_metadata: {
                synced_at: new Date().toISOString(),
                source: 'api-cache-sync',
                page: currentPage,
                has_insurance_data: !!insurance?.accident_history,
                has_insurance_v2_data: !!insurance_v2?.accidentHistory,
                image_count: (lot.images?.normal?.length || 0) + (lot.images?.big?.length || 0),
              }
            };
            
            cacheRecords.push(cacheRecord);
          }

          // Batch upsert for better performance
          if (cacheRecords.length > 0) {
            const { error } = await supabase
              .from('cars_cache')
              .upsert(cacheRecords, { 
                onConflict: 'api_id',
                ignoreDuplicates: false 
              });

            if (error) {
              console.error(`❌ Error upserting batch:`, error.message);
              // Log individual car IDs for debugging
              console.error(`Failed car IDs: ${cacheRecords.map(r => r.id).join(', ')}`);
            } else {
              totalSynced += cacheRecords.length;
              console.log(`✅ Synced batch of ${cacheRecords.length} cars`);
            }
          }
        }

        console.log(`✅ Synced page ${currentPage} - ${cars.length} cars`);

        // Check pagination
        hasMore = apiData.meta?.current_page < apiData.meta?.last_page;
        currentPage++;

        // Rate limiting
        if (hasMore && currentPage < (startPage + maxPages)) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }

      } catch (pageError: any) {
        console.error(`❌ Error on page ${currentPage}:`, pageError.message);
        
        // Continue to next page on error
        currentPage++;
        if (currentPage < (startPage + maxPages)) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * 2));
        }
      }
    }

    console.log(`🎉 Sync completed - ${totalSynced} cars synced`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalSynced,
        pagesProcessed: currentPage - startPage,
        startPage,
        endPage: currentPage - 1
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('❌ Cache sync error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Cache sync failed',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
