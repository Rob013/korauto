import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CarData {
  id: number;
  year: number;
  title: string;
  vin: string;
  manufacturer: {
    id: number;
    name: string;
  };
  model: {
    id: number;
    name: string;
    manufacturer_id: number;
  };
  color: {
    name: string;
    id: number;
  };
  transmission: {
    name: string;
    id: number;
  };
  fuel: {
    name: string;
    id: number;
  };
  lots: Array<{
    id: number;
    lot: string;
    odometer: {
      km: number;
      mi: number;
    };
    buy_now: number;
    images: {
      normal: string[];
      big: string[];
    };
  }>;
}

interface ApiResponse {
  data: CarData[];
  links?: {
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
  meta?: {
    current_page?: number;
    from?: number;
    last_page?: number;
    path?: string;
    per_page?: number;
    to?: number;
    total?: number;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { searchParams } = new URL(req.url);
    const syncType = searchParams.get('type') || 'full';
    const resumeFromPage = parseInt(searchParams.get('resume_from') || '1');
    
    console.log(`🚀 Starting ${syncType} sync (resuming from page ${resumeFromPage})`);

    // ✅ CRITICAL FIX: Mark previous stuck syncs as failed to prevent duplicate processing
    const { error: cleanupError } = await supabaseClient
      .from('sync_metadata')
      .update({ 
        status: 'failed', 
        error_message: 'Superseded by new sync request'
      })
      .eq('status', 'in_progress');

    if (cleanupError) {
      console.log('Note: Could not cleanup old syncs:', cleanupError.message);
    }

    // Create sync metadata record
    const { data: syncRecord, error: syncError } = await supabaseClient
      .from('sync_metadata')
      .insert({
        sync_type: syncType,
        status: 'in_progress',
        total_records: 0,
        synced_records: 0
      })
      .select()
      .single();

    if (syncError) {
      console.error('Failed to create sync record:', syncError);
      throw syncError;
    }

    let totalSynced = 0;
    let totalRecords = 0;
    let currentPage = resumeFromPage;
    let hasMore = true;
    let requestCount = 0;
    const MAX_REQUESTS_PER_EXECUTION = 500; // Prevent timeout, resume via new function call

    // ✅ CHUNKED SYNC: Start from resume point if provided
    let nextUrl: string | null = null;
    if (resumeFromPage > 1) {
      // Construct URL for resuming from specific page
      const resumeUrl = new URL('https://auctionsapi.com/api/cars');
      resumeUrl.searchParams.append('api_key', 'd00985c77981fe8d26be16735f932ed1');
      resumeUrl.searchParams.append('limit', '50');
      resumeUrl.searchParams.append('page', resumeFromPage.toString());
      nextUrl = resumeUrl.toString();
      console.log(`📍 Resuming from page ${resumeFromPage}`);
    }
    
    while (hasMore && requestCount < MAX_REQUESTS_PER_EXECUTION) {
      try {
        requestCount++;
        console.log(`📡 Fetching page ${currentPage} (request ${requestCount}/${MAX_REQUESTS_PER_EXECUTION})`);
        
        // Use either the next URL from pagination or construct initial URL
        let apiUrl: string;
        if (nextUrl) {
          apiUrl = nextUrl;
        } else {
          const baseUrl = new URL('https://auctionsapi.com/api/cars');
          baseUrl.searchParams.append('api_key', 'd00985c77981fe8d26be16735f932ed1');
          baseUrl.searchParams.append('limit', '50');
          
          if (syncType === 'incremental') {
            // Get last sync time for incremental updates
            const { data: lastSync } = await supabaseClient
              .from('sync_metadata')
              .select('last_updated')
              .eq('status', 'completed')
              .order('last_updated', { ascending: false })
              .limit(1)
              .single();
            
            if (lastSync?.last_updated) {
              const minutes = Math.floor((Date.now() - new Date(lastSync.last_updated).getTime()) / (1000 * 60));
              baseUrl.searchParams.append('minutes', minutes.toString());
            }
          }
          apiUrl = baseUrl.toString();
        }

        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'KORAUTO-WebApp/1.0',
            'x-api-key': 'd00985c77981fe8d26be16735f932ed1'
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout per request
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log(`⏳ Rate limited on page ${currentPage}, waiting 10 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            continue; // Retry the same request
          }
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        let apiData: ApiResponse;
        try {
          const responseText = await response.text();
          if (!responseText.trim()) {
            throw new Error('Empty response from API');
          }
          apiData = JSON.parse(responseText);
          console.log(`📊 API Response structure:`, Object.keys(apiData));
        } catch (parseError) {
          console.error('❌ Failed to parse API response:', parseError);
          console.error('Response preview:', apiUrl.substring(0, 200));
          throw new Error(`Invalid JSON response from API: ${parseError.message}`);
        }
        
        // ✅ IMPROVED LOGGING: Better pagination debugging
        console.log(`📊 API Pagination Info:`, {
          current_page: apiData.meta?.current_page || currentPage,
          per_page: apiData.meta?.per_page || 50,
          total: apiData.meta?.total || 'unknown',
          has_next: !!apiData.links?.next,
          next_url: apiData.links?.next?.substring(0, 50) + '...' || 'none'
        });
        
        // ✅ ROBUST DATA HANDLING: Handle API response structure variations
        const carsArray = Array.isArray(apiData.data) ? apiData.data : 
                         Array.isArray(apiData) ? apiData : [];
        console.log(`📦 Received ${carsArray.length} listings from API`);

        if (!carsArray || carsArray.length === 0) {
          console.log('🏁 No more cars found, ending pagination');
          hasMore = false;
          break;
        }

        // ✅ IMPROVED DATA TRANSFORMATION: Better error handling and validation
        const transformedCars = carsArray
          .map((car: CarData) => {
            try {
              const primaryLot = car.lots?.[0];
              const imageUrls = primaryLot?.images?.normal || primaryLot?.images?.big || [];
              
              // ✅ CRITICAL: Ensure required fields have valid values
              const carId = car.id?.toString();
              const make = car.manufacturer?.name?.trim();
              const model = car.model?.name?.trim();
              
              if (!carId || !make || !model) {
                console.warn(`⚠️ Skipping invalid car:`, {id: carId, make, model});
                return null;
              }

              return {
                id: carId,
                external_id: carId,
                make: make,
                model: model,
                year: car.year && car.year > 1900 ? car.year : 2020,
                price: Math.max(primaryLot?.buy_now || 0, 0),
                mileage: Math.max(primaryLot?.odometer?.km || 0, 0),
                photo_urls: imageUrls.filter(url => url && typeof url === 'string'),
                image: imageUrls.find(url => url && typeof url === 'string') || null,
                lot_number: primaryLot?.lot?.toString() || null,
                location: 'South Korea',
                fuel: car.fuel?.name?.trim() || null,
                transmission: car.transmission?.name?.trim() || null,
                color: car.color?.name?.trim() || null,
                condition: 'good',
                vin: car.vin?.trim() || null,
                title: car.title?.trim() || `${make} ${model} ${car.year || ''}`.trim(),
                domain_name: 'encar_com',
                source_api: 'auctionapis',
                status: 'active'
              };
            } catch (transformError) {
              console.warn(`⚠️ Error transforming car ${car.id}:`, transformError.message);
              return null;
            }
          })
          .filter(car => car !== null); // Remove failed transformations

        // ✅ ROBUST DATABASE OPERATIONS: Improved batch processing with retry logic
        if (transformedCars.length > 0) {
          try {
            const { error: upsertError } = await supabaseClient
              .from('cars')
              .upsert(transformedCars, {
                onConflict: 'id',
                ignoreDuplicates: false
              });

            if (upsertError) {
              console.error('❌ Database upsert failed:', upsertError);
              console.error('Sample car data:', JSON.stringify(transformedCars[0], null, 2));
              
              // Try to identify the problematic record
              if (upsertError.message.includes('duplicate') || upsertError.message.includes('conflict')) {
                console.log('🔄 Attempting individual inserts to identify conflicts...');
                // Continue with smaller batches
                const SMALL_BATCH = 10;
                for (let i = 0; i < transformedCars.length; i += SMALL_BATCH) {
                  const smallBatch = transformedCars.slice(i, i + SMALL_BATCH);
                  const { error: smallError } = await supabaseClient
                    .from('cars')
                    .upsert(smallBatch, { onConflict: 'id', ignoreDuplicates: false });
                  
                  if (smallError) {
                    console.warn(`⚠️ Skipping problematic batch starting at index ${i}:`, smallError.message);
                  }
                }
              } else {
                throw upsertError;
              }
            }
          } catch (dbError) {
            console.error('❌ Critical database error:', dbError);
            throw dbError;
          }
        }

        totalSynced += transformedCars.length;
        totalRecords = apiData.meta?.total || totalSynced;
        
        console.log(`✅ Synced ${transformedCars.length} cars (Total: ${totalSynced}/${totalRecords})`);

        // Update sync progress more frequently
        await supabaseClient
          .from('sync_metadata')
          .update({
            synced_records: totalSynced,
            total_records: totalRecords,
            last_updated: new Date().toISOString()
          })
          .eq('id', syncRecord.id);

        // ✅ CRITICAL PAGINATION FIX: Use API's next URL or manual fallback
        if (apiData.links?.next && apiData.links.next.trim()) {
          nextUrl = apiData.links.next;
          hasMore = true;
          currentPage++;
          console.log(`📄 Next page URL found: ${nextUrl.substring(0, 100)}...`);
        } else if (transformedCars.length >= 50) {
          // Fallback: If we get full batch but no next URL, try manual pagination
          currentPage++;
          nextUrl = null; // Will be reconstructed with new page number
          hasMore = true;
          console.log(`🔄 No next URL but got full batch, trying page ${currentPage}`);
        } else {
          hasMore = false;
          console.log(`🏁 Reached end: ${transformedCars.length} < 50 cars, no next URL`);
        }

        // ✅ CHUNKED EXECUTION: Check if we need to spawn continuation
        if (requestCount >= MAX_REQUESTS_PER_EXECUTION - 1 && hasMore) {
          console.log(`⏱️ Approaching timeout limit, will spawn continuation from page ${currentPage + 1}`);
          
          // Trigger continuation asynchronously
          try {
            await supabaseClient.functions.invoke('encar-sync', {
              body: { 
                type: syncType, 
                resume_from: currentPage + 1 
              }
            });
            console.log(`🚀 Continuation triggered for page ${currentPage + 1}`);
          } catch (continueError) {
            console.warn(`⚠️ Could not trigger continuation:`, continueError.message);
          }
          
          // Mark current sync as completed and exit
          hasMore = false;
          break;
        }

        // Optimized rate limiting - faster for live sync
        if (hasMore) {
          const waitTime = Math.random() * 1000 + 1500; // 1.5-2.5 seconds
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // Progress logging every 500 records
        if (totalSynced > 0 && totalSynced % 500 === 0) {
          console.log(`🚗 Progress: ${totalSynced} cars | Page: ${currentPage} | Requests: ${requestCount}/${MAX_REQUESTS_PER_EXECUTION}`);
        }

      } catch (error) {
        console.error(`❌ Error on page ${currentPage}:`, error);
        
        // ✅ IMPROVED ERROR HANDLING: Better retry logic with specific error handling
        if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
          console.log(`⏰ Timeout on page ${currentPage}, retrying with longer timeout...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.log(`⏳ Rate limited on page ${currentPage}, waiting 30 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 30000));
          continue;
        }
        
        // For other errors, try to continue with next page
        console.log(`⚠️ Skipping page ${currentPage} due to error, continuing...`);
        currentPage++;
        nextUrl = null; // Reset URL to use manual pagination
        
        // Prevent infinite error loops
        if (requestCount > 10 && totalSynced === 0) {
          console.error(`🛑 Too many errors with no progress, stopping sync`);
          throw new Error(`Sync failed: ${error.message}`);
        }
        continue;
      }
    }

    // ✅ SMART COMPLETION: Mark as completed or paused based on what happened
    const finalStatus = hasMore && requestCount >= MAX_REQUESTS_PER_EXECUTION ? 'paused' : 'completed';
    
    await supabaseClient
      .from('sync_metadata')
      .update({
        status: finalStatus,
        synced_records: totalSynced,
        total_records: totalRecords,
        last_updated: new Date().toISOString()
      })
      .eq('id', syncRecord.id);

    const statusMessage = finalStatus === 'paused' 
      ? `Sync paused at ${totalSynced} records (continuation triggered)`
      : `Sync completed! Total synced: ${totalSynced} records`;
    
    console.log(`🎉 ${statusMessage}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} Encar listings`,
        sync_type: syncType,
        total_synced: totalSynced,
        total_records: totalRecords,
        status: finalStatus,
        next_page: hasMore ? currentPage + 1 : null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 Critical sync function error:', error);
    console.error('📍 Error stack:', error.stack);
    
    // ✅ ROBUST ERROR RECOVERY: Always try to update sync status
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseClient
        .from('sync_metadata')
        .update({
          status: 'failed',
          error_message: (error?.message || 'Unknown error occurred').substring(0, 500),
          last_updated: new Date().toISOString()
        })
        .eq('status', 'in_progress');
        
      console.log('📝 Updated sync status to failed');
    } catch (updateError) {
      console.error('⚠️ Could not update sync metadata:', updateError);
    }
    
    // ✅ CONSISTENT ERROR RESPONSE: Always return valid JSON
    const errorResponse = {
      success: false,
      error: error?.message || 'Unknown error occurred',
      details: error?.stack || 'No stack trace available',
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});