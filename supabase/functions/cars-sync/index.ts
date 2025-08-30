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
    // Validate required environment variables
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const API_KEY = Deno.env.get('AUCTIONS_API_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_KEY) {
      console.error('❌ Missing required environment variables');
      return Response.json({
        success: false,
        error: 'Configuration error: Missing required environment variables'
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const API_BASE_URL = 'https://auctionsapi.com/api';

    // Parse request body for sync parameters
    let syncParams = {};
    try {
      if (req.body) {
        syncParams = await req.json();
      }
    } catch (e) {
      console.log('No body parameters provided, using defaults');
    }
    
    console.log('🚀 Starting smart car sync with params:', syncParams);

    // Memory-efficient configuration
    const PAGE_SIZE = 30;
    const BATCH_SIZE = 25;
    const MAX_PAGES_PER_RUN = 10000; // Allow full sync to completion without artificial limits

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
    const startTime = Date.now();

    // Process pages sequentially to minimize memory usage
    for (let i = 0; i < MAX_PAGES_PER_RUN && consecutiveEmptyPages < 10; i++) {
      try {
        console.log(`📄 Processing page ${currentPage}...`);

        const response = await fetch(
          `${API_BASE_URL}/cars?per_page=${PAGE_SIZE}&page=${currentPage}`,
          { 
            headers: { 
              'accept': 'application/json',
              'x-api-key': API_KEY,
              'User-Agent': 'KorAuto-EdgeSync/1.0'
            },
            signal: AbortSignal.timeout(30000) // 30s timeout for edge functions
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            console.log('⏰ Rate limited, waiting...');
            await new Promise(resolve => setTimeout(resolve, 8000)); // Longer wait for rate limits
            continue; // Retry same page
          }
          
          // Handle specific HTTP errors
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          if (response.status === 401) {
            errorMessage = 'Authentication failed - API key may be invalid';
          } else if (response.status === 403) {
            errorMessage = 'Access forbidden - check API permissions';
          } else if (response.status >= 500) {
            errorMessage = `Server error ${response.status} - retrying next page`;
            // For server errors, continue to next page instead of failing
            console.error(`⚠️ ${errorMessage}`);
            currentPage++;
            errors++;
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          
          throw new Error(errorMessage);
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

        // Log progress every 10 pages to track sync rate
        if (currentPage % 10 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = totalProcessed / elapsed * 60; // cars per minute
          console.log(`📈 Progress: Page ${currentPage}, ${totalProcessed} cars processed, Rate: ${rate.toFixed(0)} cars/min`);
        }

        currentPage++;
        
        // Small delay between pages to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Page ${currentPage} failed:`, error);
        
        // Classify errors for better handling
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isNetworkError = errorMessage.includes('timeout') || 
                              errorMessage.includes('AbortError') ||
                              errorMessage.includes('network') ||
                              errorMessage.includes('ENOTFOUND');
        
        const isApiError = errorMessage.includes('HTTP') || 
                          errorMessage.includes('Authentication') ||
                          errorMessage.includes('forbidden');
        
        errors++;
        
        if (isNetworkError) {
          console.log(`🌐 Network error on page ${currentPage}, waiting longer before retry...`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Longer wait for network issues
        } else if (isApiError) {
          console.log(`🔐 API error on page ${currentPage}, continuing to next page...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.log(`⚠️ Unknown error on page ${currentPage}, continuing...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        currentPage++;
        
        // Stop only if too many consecutive errors
        if (errors > 20) {
          console.error('❌ Too many errors, stopping sync');
          break;
        }
      }
    }

    // Determine final status - only complete when we've truly reached the end
    const finalStatus = consecutiveEmptyPages >= 10 ? 'completed' : 'paused';
    const isNaturalCompletion = consecutiveEmptyPages >= 10;
    
    console.log(`📊 Sync finishing: ${totalProcessed} cars processed, ${consecutiveEmptyPages} consecutive empty pages`);
    
    await supabase
      .from('sync_status')
      .update({
        status: finalStatus,
        current_page: currentPage,
        records_processed: (existingCars || 0) + totalProcessed,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        last_activity_at: new Date().toISOString(),
        error_message: isNaturalCompletion ? 
          `Sync completed naturally - processed ${totalProcessed} new cars, ${errors} errors` :
          `Processed ${totalProcessed} new cars, ${errors} errors - will auto-resume to continue`
      })
      .eq('id', 'cars-sync-main');

    console.log(`✅ Sync ${finalStatus}: ${totalProcessed} cars processed${isNaturalCompletion ? ' - COMPLETED!' : ' - will auto-resume'}`);

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
    
    // Classify and provide helpful error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    let userFriendlyMessage = errorMessage;
    let errorType = 'unknown';
    
    if (errorMessage.includes('environment variables')) {
      userFriendlyMessage = 'Configuration error: Missing API credentials. Please contact administrator.';
      errorType = 'configuration';
    } else if (errorMessage.includes('Authentication') || errorMessage.includes('API key')) {
      userFriendlyMessage = 'Authentication failed: Invalid API credentials. Please contact administrator.';
      errorType = 'authentication';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      userFriendlyMessage = 'Request timeout: The sync process took too long. Please try again.';
      errorType = 'timeout';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      userFriendlyMessage = 'Network error: Unable to connect to external API. Please try again later.';
      errorType = 'network';
    } else if (errorMessage.includes('HTTP 5')) {
      userFriendlyMessage = 'Server error: External API is experiencing issues. Please try again later.';
      errorType = 'server_error';
    } else if (errorMessage.includes('Database') || errorMessage.includes('SQL')) {
      userFriendlyMessage = 'Database error: Failed to save sync data. Please try again.';
      errorType = 'database';
    }
    
    // Update sync status to failed with detailed error info
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          error_message: `${errorType.toUpperCase()}: ${userFriendlyMessage}`,
          completed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', 'cars-sync-main');
    } catch (dbError) {
      console.error('Failed to update sync status:', dbError);
    }
    
    return Response.json({
      success: false,
      error: userFriendlyMessage,
      errorType,
      details: errorMessage
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});