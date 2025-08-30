import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Car {
  id: string;
  manufacturer?: { name: string };
  model?: { name: string };
  year: number;
  vin?: string;
  fuel?: { name: string };
  transmission?: { name: string };
  color?: { name: string };
  lots?: {
    lot?: string;
    buy_now?: number;
    bid?: number;
    keys_available?: boolean;
    odometer?: { km?: number };
    images?: { normal?: string[] };
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const API_KEY = Deno.env.get('AUCTIONS_API_KEY') ?? '';
    const API_BASE_URL = 'https://auctionsapi.com/api';

    // Memory-efficient configuration
    const PAGE_SIZE = 30;
    const BATCH_SIZE = 25;
    const MAX_PAGES_PER_RUN = 50; // Process in small chunks to avoid memory limits

    console.log('🚀 Starting memory-efficient car sync...');

    // Update sync status to running
    await supabase
      .from('sync_status')
      .upsert({
        id: 'cars-sync-main',
        status: 'running',
        current_page: 1,
        records_processed: 0,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      });

    // Get current car count to determine start page
    const { count: existingCars } = await supabase
      .from('cars_cache')
      .select('*', { count: 'exact', head: true });

    const startPage = Math.floor((existingCars || 0) / 100) + 1;
    console.log(`📍 Starting from page ${startPage} (${existingCars} existing cars)`);

    let totalProcessed = 0;
    let currentPage = startPage;
    let consecutiveEmptyPages = 0;
    let errors = 0;

    // Process pages sequentially to minimize memory usage
    for (let i = 0; i < MAX_PAGES_PER_RUN && consecutiveEmptyPages < 10; i++) {
      try {
        console.log(`📄 Processing page ${currentPage}...`);

        const response = await fetch(
          `${API_BASE_URL}/cars?per_page=${PAGE_SIZE}&page=${currentPage}`,
          { 
            headers: { 
              'accept': 'application/json',
              'x-api-key': API_KEY 
            },
            signal: AbortSignal.timeout(15000) // 15s timeout
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            console.log('⏰ Rate limited, waiting...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue; // Retry same page
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const cars: Car[] = data.data || [];

        if (cars.length === 0) {
          consecutiveEmptyPages++;
          console.log(`📄 Page ${currentPage} empty (${consecutiveEmptyPages}/10)`);
          currentPage++;
          continue;
        }

        consecutiveEmptyPages = 0;
        console.log(`⚡ Processing ${cars.length} cars from page ${currentPage}...`);

        // Transform cars with minimal memory usage
        const carCacheItems = [];
        for (const car of cars) {
          const lot = car.lots?.[0];
          const price = lot?.buy_now ? Math.round(lot.buy_now + 2300) : null;
          
          carCacheItems.push({
            id: car.id.toString(),
            api_id: car.id.toString(),
            make: car.manufacturer?.name || 'Unknown',
            model: car.model?.name || 'Unknown',
            year: car.year || 2020,
            price: price,
            price_cents: price ? price * 100 : null,
            mileage: lot?.odometer?.km?.toString() || null,
            rank_score: price ? (1 / price) * 1000000 : 0,
            vin: car.vin,
            fuel: car.fuel?.name,
            transmission: car.transmission?.name,
            color: car.color?.name,
            lot_number: lot?.lot,
            condition: 'good',
            images: JSON.stringify(lot?.images?.normal || []),
            car_data: {
              buy_now: lot?.buy_now,
              current_bid: lot?.bid,
              keys_available: lot?.keys_available !== false
            },
            lot_data: lot,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_api_sync: new Date().toISOString()
          });
        }

        // Write to cache in small batches
        for (let j = 0; j < carCacheItems.length; j += BATCH_SIZE) {
          const batch = carCacheItems.slice(j, j + BATCH_SIZE);
          
          const { error } = await supabase
            .from('cars_cache')
            .upsert(batch, { onConflict: 'id' });

          if (error) {
            console.error('❌ Database error:', error);
            errors++;
          } else {
            totalProcessed += batch.length;
          }
          
          // Brief pause between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Update progress every page
        await supabase
          .from('sync_status')
          .update({
            current_page: currentPage,
            records_processed: (existingCars || 0) + totalProcessed,
            last_activity_at: new Date().toISOString(),
            error_message: errors > 0 ? `${errors} errors encountered` : null
          })
          .eq('id', 'cars-sync-main');

        currentPage++;
        
        // Small delay between pages to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Page ${currentPage} failed:`, error);
        errors++;
        currentPage++;
        
        if (errors > 10) {
          console.error('❌ Too many errors, stopping');
          break;
        }
        
        // Wait longer after errors
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Determine final status
    const finalStatus = consecutiveEmptyPages >= 10 ? 'completed' : 'paused';
    
    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        current_page: currentPage,
        records_processed: (existingCars || 0) + totalProcessed,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
        error_message: `Processed ${totalProcessed} new cars, ${errors} errors`
      })
      .eq('id', 'cars-sync-main');

    console.log(`✅ Sync ${finalStatus}: ${totalProcessed} cars processed`);

    return Response.json({
      success: true,
      status: finalStatus,
      totalProcessed,
      currentPage,
      errors,
      message: `Sync ${finalStatus}. Processed ${totalProcessed} cars with ${errors} errors.`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('💥 Sync failed:', error);
    
    return Response.json({
      success: false,
      error: error.message
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});