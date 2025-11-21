import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const { fullSync = false, startPage = 1, maxPages = 10 } = body;

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

        // Upsert to cache
        for (const car of cars) {
          const lot = car.lots?.[0] || {};
          
          const cacheRecord = {
            api_id: String(car.id),
            make: car.manufacturer?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year || lot.year || new Date().getFullYear(),
            price: lot.buy_now || lot.final_bid || lot.price || null,
            price_usd: lot.buy_now || lot.final_bid || lot.price || null,
            price_eur: lot.buy_now ? Math.round(lot.buy_now * 0.92 + 2350) : null,
            price_cents: lot.buy_now ? Math.round((lot.buy_now * 0.92 + 2350) * 100) : null,
            mileage: String(lot.odometer?.km || 0),
            fuel: lot.fuel || car.fuel || null,
            transmission: lot.transmission || car.transmission || null,
            color: lot.color || car.color || null,
            lot_number: lot.lot || null,
            images: lot.images?.normal || lot.images?.big || [],
            car_data: car,
            lot_data: lot,
            sale_status: lot.sale_status || car.sale_status || 'active',
            last_api_sync: new Date().toISOString(),
            last_updated_source: 'api-cache-sync',
            api_version: '1.0',
            rank_score: lot.popularity_score || 0,
          };

          const { error } = await supabase
            .from('cars_cache')
            .upsert(cacheRecord, { 
              onConflict: 'api_id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`❌ Error upserting car ${car.id}:`, error);
          } else {
            totalSynced++;
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
