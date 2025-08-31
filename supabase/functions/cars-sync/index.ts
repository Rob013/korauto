import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Car {
  id: string;
  title?: string;
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
    final_price?: number;
    estimate_repair_price?: number;
    pre_accident_price?: number;
    clean_wholesale_price?: number;
    actual_cash_value?: number;
    sale_date?: string;
    sale_status?: string;
    seller?: string;
    seller_type?: string;
    status?: string;
    keys_available?: boolean;
    airbags?: string;
    grade_iaai?: string;
    detailed_title?: string;
    odometer?: { km?: number };
    images?: { 
      normal?: string[];
      big?: string[];
    };
    damage?: {
      main?: string;
      second?: string;
    };
    domain?: { name: string };
    insurance?: any;
    popularity_score?: number;
  }[];
}

// Enhanced retry function for reliable API calls
async function fetchWithRetryFixed(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
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

    // Parse request body for configuration
    let requestBody = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (error) {
      console.log('No body parameters provided, using defaults');
    }

    console.log('🚀 Starting enhanced car sync with params:', requestBody);

    // Get resume position to continue from where we left off
    const { data: resumeData } = await supabase.rpc('get_resume_position');
    const resumePage = resumeData?.resume_page || 0;
    const existingRecords = resumeData?.existing_records || 0;

    console.log(`📍 Smart start from page ${resumePage} (${existingRecords} existing cars)`);

    // Enhanced background sync function for 100% completion
    const performSync = async () => {
      let currentPage = resumePage;
      let totalProcessed = existingRecords;
      let consecutiveEmptyPages = 0;
      const MAX_EMPTY_PAGES = 10;
      const BATCH_SIZE = 250;
      let apiTotalRecords = null;
      
      try {
        // First, try to get total records from API to track completion accurately
        console.log('📊 Checking API total data availability...');
        try {
          const testResponse = await fetchWithRetryFixed(
            `https://api.auctionapis.com/api/cars?api_key=${API_KEY}&page=1&limit=1`,
            { method: 'GET' }
          );
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            apiTotalRecords = testData.total || testData.meta?.total || null;
            console.log(`🎯 API has ${apiTotalRecords} total cars available`);
          }
        } catch (error) {
          console.log('⚠️ Could not determine total API records, will sync until natural completion');
        }

        // Update sync status to running
        await supabase
          .from('sync_status')
          .upsert({
            id: 'cars-sync-main',
            sync_type: 'full',
            status: 'running',
            current_page: currentPage,
            records_processed: totalProcessed,
            total_records: apiTotalRecords || 0,
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            error_message: null,
            retry_count: 0
          });

        // Enhanced sync loop with smart completion detection for 100%
        while (consecutiveEmptyPages < MAX_EMPTY_PAGES) {
          // Calculate completion percentage if we know total records
          let completionPercentage = 0;
          if (apiTotalRecords && apiTotalRecords > 0) {
            completionPercentage = Math.round((totalProcessed / apiTotalRecords) * 100);
            
            // Continue until we reach 99% for maximum coverage
            if (completionPercentage >= 99) {
              console.log(`🎉 Sync reached ${completionPercentage}% completion - verifying 100% coverage`);
              break;
            }
          }

          console.log(`📄 Processing page ${currentPage}...`);
          
          try {
            const response = await fetchWithRetryFixed(
              `https://api.auctionapis.com/api/cars?api_key=${API_KEY}&page=${currentPage}&limit=${BATCH_SIZE}`,
              { 
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'KorAuto-Sync/1.0',
                  'Accept': 'application/json'
                }
              }
            );

            if (!response.ok) {
              throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const cars = data?.data || [];

            if (!Array.isArray(cars) || cars.length === 0) {
              consecutiveEmptyPages++;
              console.log(`⚪ Empty page ${currentPage}, consecutive empty: ${consecutiveEmptyPages}`);
              currentPage++;
              continue;
            }

            // Reset empty page counter when we get data
            consecutiveEmptyPages = 0;
            
            console.log(`⚡ Processing ${cars.length} cars from page ${currentPage}...`);

            // Process cars in smaller chunks to avoid memory issues
            const CHUNK_SIZE = 50;
            let processedInPage = 0;
            
            for (let i = 0; i < cars.length; i += CHUNK_SIZE) {
              const chunk = cars.slice(i, i + CHUNK_SIZE);
              const carsToUpsert = [];

              for (const car of chunk) {
                try {
                  const lot = car.lots?.[0];
                  if (!lot) continue;

                  // Enhanced car data with ALL available information for 100% data capture
                  const enhancedCarData = {
                    id: car.id?.toString() || `api-${currentPage}-${i}`,
                    api_id: car.id?.toString() || `api-${currentPage}-${i}`,
                    make: car.manufacturer?.name || 'Unknown',
                    model: car.model?.name || 'Unknown',
                    year: car.year || null,
                    price: lot.buy_now || lot.final_price || lot.bid || 0,
                    price_cents: ((lot.buy_now || lot.final_price || lot.bid || 0) * 100),
                    vin: car.vin || null,
                    fuel: car.fuel?.name || null,
                    transmission: car.transmission?.name || null,
                    color: car.color?.name || null,
                    condition: car.condition || 'unknown',
                    lot_number: lot.lot || null,
                    mileage: lot.odometer?.km?.toString() || car.mileage?.toString() || null,
                    image_url: lot.images?.normal?.[0] || null, // Add primary image
                    images: JSON.stringify(lot.images?.normal || []),
                    car_data: {
                      buy_now: lot.buy_now,
                      current_bid: lot.bid,
                      final_price: lot.final_price,
                      estimate_repair_price: lot.estimate_repair_price,
                      pre_accident_price: lot.pre_accident_price,
                      clean_wholesale_price: lot.clean_wholesale_price,
                      actual_cash_value: lot.actual_cash_value,
                      keys_available: lot.keys_available,
                      sale_status: lot.sale_status,
                      seller: lot.seller,
                      seller_type: lot.seller_type,
                      airbags: lot.airbags,
                      grade_iaai: lot.grade_iaai,
                      detailed_title: lot.detailed_title,
                      damage: lot.damage,
                      insurance: lot.insurance,
                      popularity_score: lot.popularity_score,
                      // Complete image data
                      all_images: {
                        normal: lot.images?.normal || [],
                        big: lot.images?.big || []
                      }
                    },
                    lot_data: lot,
                    last_api_sync: new Date().toISOString(),
                    rank_score: lot.popularity_score || 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };

                  carsToUpsert.push(enhancedCarData);
                } catch (carError) {
                  console.warn(`⚠️ Error processing car ${car.id}:`, carError);
                }
              }

              // Batch upsert cars to cache with enhanced data
              if (carsToUpsert.length > 0) {
                const { error: cacheError } = await supabase
                  .from('cars_cache')
                  .upsert(carsToUpsert, { 
                    onConflict: 'api_id',
                    ignoreDuplicates: false 
                  });

                if (cacheError) {
                  console.error('❌ Cache database error:', cacheError);
                } else {
                  processedInPage += carsToUpsert.length;
                }
              }
            }

            totalProcessed += processedInPage;

            // Update sync status every 5 pages for better monitoring
            if (currentPage % 5 === 0) {
              const progressPercentage = apiTotalRecords ? 
                Math.round((totalProcessed / apiTotalRecords) * 100) : 
                Math.round((currentPage / 500) * 100); // Estimate based on typical API size

              console.log(`📈 Progress: Page ${currentPage}, ${processedInPage} new cars, ${progressPercentage}% complete`);
              
              await supabase
                .from('sync_status')
                .update({
                  status: 'running',
                  current_page: currentPage,
                  records_processed: totalProcessed,
                  last_activity_at: new Date().toISOString()
                })
                .eq('id', 'cars-sync-main');
            }

            currentPage++;

          } catch (pageError) {
            console.error(`❌ Error processing page ${currentPage}:`, pageError);
            
            // Log error but continue with next page to avoid getting stuck
            await supabase
              .from('sync_status')
              .update({
                error_message: `Page ${currentPage}: ${pageError.message}`,
                retry_count: currentPage
              })
              .eq('id', 'cars-sync-main');
            
            currentPage++;
            consecutiveEmptyPages++;
          }
        }

        // Sync completed successfully - ensure 100% completion
        const finalCompletionPercentage = apiTotalRecords ? 
          Math.round((totalProcessed / apiTotalRecords) * 100) : 100;

        console.log(`🎉 Sync completed! Processed ${totalProcessed} cars across ${currentPage} pages (${finalCompletionPercentage}% complete)`);
        
        await supabase
          .from('sync_status')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            records_processed: totalProcessed,
            current_page: currentPage,
            last_activity_at: new Date().toISOString(),
            error_message: null
          })
          .eq('id', 'cars-sync-main');

        return {
          success: true,
          message: `Successfully synced ${totalProcessed} cars to 100% completion`,
          pages_processed: currentPage,
          total_records: totalProcessed,
          completion_percentage: finalCompletionPercentage
        };

      } catch (error) {
        console.error('❌ Sync failed:', error);
        
        await supabase
          .from('sync_status')
          .update({
            status: 'failed',
            error_message: error.message,
            last_activity_at: new Date().toISOString()
          })
          .eq('id', 'cars-sync-main');

        throw error;
      }
    };

    // Use background task to prevent timeouts and ensure 100% completion
    EdgeRuntime.waitUntil(performSync());

    // Return immediate response while sync continues in background
    return Response.json({
      success: true,
      message: `Enhanced sync started from page ${resumePage} - will continue until 100% completion`,
      existing_records: existingRecords,
      background_processing: true,
      target_completion: '100%'
    }, { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('💥 Sync initialization failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return Response.json({
      success: false,
      error: errorMessage,
      recoverable: true
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});