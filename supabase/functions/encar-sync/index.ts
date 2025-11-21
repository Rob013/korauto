import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API rate limiting - Following integration guide best practices
const RATE_LIMIT_DELAY = 15000 // 15 seconds between requests to avoid 429 errors
const MAX_RETRIES = 2 // Reduced retries since we have longer delays
const BACKOFF_MULTIPLIER = 3 // More aggressive backoff
const PAGE_SIZE = 250 // Optimal page size per API docs
const REQUEST_TIMEOUT = 45000 // Longer timeout for large pages
const MAX_PAGES = 500 // Safety limit for full syncs
const UPSERT_BATCH_SIZE = 50 // Number of cars to upsert per batch
const ARCHIVE_BATCH_SIZE = 50 // Number of archived cars to process per batch

type SupabaseClient = ReturnType<typeof createClient>

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) return [items]
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function upsertCarsBatch(
  supabase: SupabaseClient<any>,
  records: Record<string, unknown>[],
  errors: string[],
): Promise<number> {
  let processed = 0

  for (const chunk of chunkArray(records, UPSERT_BATCH_SIZE)) {
    if (chunk.length === 0) continue

    const { error: upsertError } = await supabase
      .from('cars')
      .upsert(chunk, {
        onConflict: 'id',
        ignoreDuplicates: false,
        returning: 'minimal',
      })

    if (upsertError) {
      console.error(`❌ Batch upsert failed for ${chunk.length} cars:`, upsertError)
      errors.push(`Cars batch upsert: ${upsertError.message}`)

      for (const record of chunk) {
        const carId = (record as { id?: string | number }).id
        const { error: singleError } = await supabase
          .from('cars')
          .upsert(record, {
            onConflict: 'id',
            ignoreDuplicates: false,
            returning: 'minimal',
          })

        if (singleError) {
          console.error(`❌ Failed to upsert car ${carId}:`, singleError)
          errors.push(`Car ${carId}: ${singleError.message}`)
        } else {
          processed += 1
        }
      }
    } else {
      processed += chunk.length
    }
  }

  return processed
}

async function applyArchivedUpdates(
  supabase: SupabaseClient<any>,
  records: Record<string, unknown>[],
  errors: string[],
): Promise<number> {
  let processed = 0

  for (const chunk of chunkArray(records, ARCHIVE_BATCH_SIZE)) {
    if (chunk.length === 0) continue

    const { error: archiveError } = await supabase
      .from('cars')
      .upsert(chunk, {
        onConflict: 'id',
        ignoreDuplicates: false,
        returning: 'minimal',
      })

    if (archiveError) {
      console.error(`❌ Batch archive update failed for ${chunk.length} cars:`, archiveError)
      errors.push(`Archive batch: ${archiveError.message}`)

      for (const record of chunk) {
        const carId = (record as { id?: string | number }).id
        const { error: singleError } = await supabase
          .from('cars')
          .upsert(record, {
            onConflict: 'id',
            ignoreDuplicates: false,
            returning: 'minimal',
          })

        if (singleError) {
          console.error(`❌ Failed to archive car ${carId}:`, singleError)
          errors.push(`Archive ${carId}: ${singleError.message}`)
        } else {
          processed += 1
        }
      }
    } else {
      processed += chunk.length
    }
  }

  return processed
}

// Helper function for API requests with retry logic
async function makeApiRequest(url: string, retryCount = 0): Promise<any> {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Encar-Sync/2.0'
  }

    try {
      console.log(`📡 API Request: ${url} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.status === 429) {
        const delay = RATE_LIMIT_DELAY * Math.pow(BACKOFF_MULTIPLIER, retryCount)
        console.log(`⏰ Rate limited. Waiting ${delay}ms before retry...`)
        
        if (retryCount < MAX_RETRIES) {
          await wait(delay)
          return makeApiRequest(url, retryCount + 1)
        }

        throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`)
      }

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ API Success: ${url} - Got ${Array.isArray(data?.data) ? data.data.length : 'unknown'} items`)
      return data

    } catch (error) {
      console.error(`❌ API Error for ${url}:`, error instanceof Error ? error.message : String(error))
      
      if (retryCount < MAX_RETRIES && !(error instanceof Error && error.message.includes('Rate limit exceeded'))) {
        const delay = 1000 * Math.pow(BACKOFF_MULTIPLIER, retryCount)
        console.log(`⏰ Retrying in ${delay}ms...`)
        await wait(delay)
        return makeApiRequest(url, retryCount + 1)
      }
      
      throw error
    }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting sync with improved API integration and pagination')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request parameters
    const url = new URL(req.url)
    const syncType = url.searchParams.get('type') || 'incremental'
    
    // Handle different sync types with appropriate time windows
    let minutes: number
    if (syncType === 'daily') {
      minutes = 24 * 60 // 24 hours for daily sync
    } else if (syncType === 'full') {
      minutes = 0 // Full sync ignores time window
    } else {
      minutes = parseInt(url.searchParams.get('minutes') || '60') // Default hourly
    }

    console.log(`📋 Sync Details: ${syncType} sync for last ${minutes} minutes`)

    // Check for force parameter to override stuck syncs
    const forceSync = url.searchParams.get('force') === 'true'

    // Clean up stuck syncs older than 3 minutes (aggressive cleanup)
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const { error: cleanupError } = await supabase
      .from('sync_status')
      .update({ 
        status: 'failed', 
        error_message: 'Sync timeout - cleaned up automatically after 3 minutes',
        completed_at: new Date().toISOString()
      })
      .eq('status', 'running')
      .lt('started_at', threeMinutesAgo)

    if (cleanupError) {
      console.warn('⚠️ Error cleaning up stuck syncs:', cleanupError)
    } else {
      console.log('✅ Cleaned up any stuck syncs older than 3 minutes')
    }

    // Check for existing running sync (unless force flag is set)
    if (!forceSync) {
      const { data: existingSync } = await supabase
        .from('sync_status')
        .select('id, started_at')
        .eq('status', 'running')
        .single()

      if (existingSync) {
        const syncAge = Date.now() - new Date(existingSync.started_at).getTime()
        const syncAgeMinutes = Math.floor(syncAge / 60000)
        
        console.log(`⚠️ Sync already running: ${existingSync.id} (running for ${syncAgeMinutes} minutes)`)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Sync already in progress (running for ${syncAgeMinutes} minutes). Add ?force=true to override.`,
            existing_sync_id: existingSync.id,
            sync_age_minutes: syncAgeMinutes
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      // Force mode: Mark any existing running syncs as failed
      console.log('🔄 Force mode enabled - terminating any existing syncs...')
      await supabase
        .from('sync_status')
        .update({ 
          status: 'failed', 
          error_message: 'Terminated by forced sync',
          completed_at: new Date().toISOString()
        })
        .eq('status', 'running')
    }

    // Create new sync record
    const { data: syncRecord, error: syncError } = await supabase
      .from('sync_status')
      .insert({
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString(),
        current_page: 1,
        total_pages: 1,
        records_processed: 0,
        cars_processed: 0,
        archived_lots_processed: 0,
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single()

    if (syncError) {
      throw new Error(`Failed to create sync record: ${syncError.message}`)
    }

    console.log(`✅ Created sync record: ${syncRecord.id}`)

    // Use environment variable for API key or fallback to default
    const API_KEY = Deno.env.get('AUCTIONS_API_KEY') || 'd00985c77981fe8d26be16735f932ed1'
    const BASE_URL = 'https://auctionsapi.com/api'
    
    let totalCarsProcessed = 0
    let totalArchivedProcessed = 0
    const errors: string[] = []
    let syncSuccess = false

    try {
      // ✅ Step 1: Process active cars from /api/cars endpoint
      // Following API Integration Guide: Use ?minutes=X for incremental updates
      console.log(`📡 Fetching active cars (${syncType === 'full' ? 'full sync' : `last ${minutes} minutes`})`)
      
      let currentPage = 1
      let hasMorePages = true
      let consecutiveErrors = 0
      const MAX_CONSECUTIVE_ERRORS = 3
      
      while (hasMorePages && currentPage <= MAX_PAGES && consecutiveErrors < MAX_CONSECUTIVE_ERRORS) {
        // Build URL per page following API guide: /api/cars?minutes=60&page=X&per_page=250
        let pageUrl = `${BASE_URL}/cars?page=${currentPage}&per_page=${PAGE_SIZE}`
        if (syncType !== 'full' && minutes > 0) {
          pageUrl += `&minutes=${minutes}`
        }
        
          try {
            console.log(`📄 Fetching page ${currentPage}...`)
            const carsData = await makeApiRequest(pageUrl)
            
            // Validate response structure
            if (!carsData || typeof carsData !== 'object') {
              console.error(`❌ Invalid API response structure for page ${currentPage}`)
              break
            }
            
            // The API returns data in carsData.data array
            const carsArray = Array.isArray(carsData.data) ? carsData.data : []
            
            if (carsArray.length === 0) {
              console.log(`⚠️ No cars data in response for page ${currentPage}`)
              break
            }

            console.log(`📊 Processing ${carsArray.length} cars from page ${currentPage}`)

            const carsForUpsert: Record<string, unknown>[] = []

            for (const apiCar of carsArray) {
              try {
                const primaryLot = apiCar.lots?.[0]
                const images = primaryLot?.images?.normal || primaryLot?.images?.big || []
                
                const carId = apiCar.id?.toString()
                const make = apiCar.manufacturer?.name?.trim()
                const model = apiCar.model?.name?.trim()
                
                if (!carId || !make || !model) {
                  console.warn(`⚠️ Skipping car with missing data: ID=${carId}, Make=${make}, Model=${model}`)
                  continue
                }

                carsForUpsert.push({
                  id: carId,
                  external_id: carId,
                  make,
                  model,
                  year: apiCar.year && apiCar.year > 1900 ? apiCar.year : 2020,
                  price: Math.max(primaryLot?.buy_now || 0, 0),
                  mileage: Math.max(primaryLot?.odometer?.km || 0, 0),
                  title: apiCar.title?.trim() || `${make} ${model} ${apiCar.year || ''}`,
                  vin: apiCar.vin?.trim() || null,
                  color: apiCar.color?.name?.trim() || null,
                  fuel: apiCar.fuel?.name?.trim() || null,
                  transmission: apiCar.transmission?.name?.trim() || null,
                  lot_number: primaryLot?.lot?.toString() || null,
                  image_url: images[0] || null,
                  images: JSON.stringify(images),
                  current_bid: parseFloat(primaryLot?.bid) || 0,
                  buy_now_price: parseFloat(primaryLot?.buy_now) || 0,
                  is_live: primaryLot?.status?.name === 'sale',
                  keys_available: primaryLot?.keys_available !== false,
                  status: 'active',
                  is_archived: false,
                  condition: primaryLot?.condition?.name || 'good',
                  location: 'South Korea',
                  domain_name: 'encar_com',
                  source_api: 'auctionapis',
                  last_synced_at: new Date().toISOString()
                })
              } catch (carError) {
                console.error(`❌ Error processing car:`, carError)
                errors.push(`Car processing error: ${carError instanceof Error ? carError.message : String(carError)}`)
              }
            }

            const processedThisPage = await upsertCarsBatch(supabase, carsForUpsert, errors)
            totalCarsProcessed += processedThisPage

            if (processedThisPage > 0) {
              console.log(`✅ Upserted ${processedThisPage} cars from page ${currentPage} (total: ${totalCarsProcessed})`)
            }

            // Check if there are more pages using API metadata
            hasMorePages = carsData.meta?.current_page < carsData.meta?.last_page
            consecutiveErrors = 0 // Reset error counter on success
            
            // Update progress in database
            await supabase
              .from('sync_status')
              .update({
                current_page: currentPage,
                total_pages: carsData.meta?.last_page || currentPage,
                cars_processed: totalCarsProcessed,
                last_activity_at: new Date().toISOString(),
                last_cars_sync_at: new Date().toISOString()
              })
              .eq('id', syncRecord.id)

            currentPage++
            
            // Important: Wait between requests to avoid rate limiting
            if (hasMorePages) {
              const delay =
                syncType === 'full'
                  ? RATE_LIMIT_DELAY
                  : Math.min(5000, RATE_LIMIT_DELAY)
              console.log(`⏸️ Waiting ${delay}ms before next page...`)
              await wait(delay)
            }

        } catch (pageError) {
          console.error(`❌ Error processing page ${currentPage}:`, pageError)
          errors.push(`Page ${currentPage}: ${pageError instanceof Error ? pageError.message : String(pageError)}`)
          consecutiveErrors++
          
          // If rate limited, wait longer before next attempt
            if (pageError instanceof Error && pageError.message.includes('Rate limit')) {
              console.log(`⏸️ Rate limit detected, waiting 30 seconds...`)
              await wait(30000)
          }
          
          currentPage++
        }
      }

      if (currentPage > MAX_PAGES) {
        console.log(`⚠️ Reached maximum page limit (${MAX_PAGES}), stopping pagination`)
      }

      // 🔄 Step 2: Process archived/sold cars from /api/archived-lots endpoint
      // Following API Integration Guide: Use ?minutes=X to get recently sold cars
      console.log(`🗄️ Fetching archived lots (${syncType === 'full' ? 'full sync' : `last ${minutes} minutes`})`)
      
      // Build archived lots URL with pagination support
      let archivedPage = 1
      let hasMoreArchived = true
      
      while (hasMoreArchived && archivedPage <= 50) { // Limit archived pages
        let archivedUrl = `${BASE_URL}/archived-lots?page=${archivedPage}&per_page=${PAGE_SIZE}`
        if (syncType !== 'full' && minutes > 0) {
          archivedUrl += `&minutes=${minutes}`
        }

        try {
          console.log(`📄 Fetching archived lots page ${archivedPage}...`)
          const archivedData = await makeApiRequest(archivedUrl)
        
          // Handle both possible response formats
          const archivedLots = archivedData?.archived_lots || archivedData?.data || []
          
          if (!Array.isArray(archivedLots) || archivedLots.length === 0) {
            console.log(`⚠️ No archived lots in page ${archivedPage}`)
            break
          }

            console.log(`📊 Processing ${archivedLots.length} archived lots from page ${archivedPage}`)

            const archivedUpdates: Record<string, unknown>[] = []

            for (const archivedLot of archivedLots) {
              try {
                // Try multiple ID fields as API format may vary
                const carId = (archivedLot.car_id || archivedLot.id || archivedLot.external_id)?.toString()
                if (!carId) {
                  console.warn(`⚠️ Skipping archived lot with no ID`)
                  continue
                }

                archivedUpdates.push({
                  id: carId,
                  is_archived: true,
                  is_active: false,
                  status: 'sold',
                  final_bid: parseFloat(archivedLot.final_price || archivedLot.sold_price) || null,
                  sale_date: archivedLot.sale_date || new Date().toISOString(),
                  last_synced_at: new Date().toISOString()
                })
              } catch (archiveError) {
                console.error(`❌ Error processing archived lot:`, archiveError)
                errors.push(`Archive processing error: ${archiveError instanceof Error ? archiveError.message : String(archiveError)}`)
              }
            }

            const archivedProcessedThisPage = await applyArchivedUpdates(supabase, archivedUpdates, errors)
            totalArchivedProcessed += archivedProcessedThisPage

            if (archivedProcessedThisPage > 0) {
              console.log(`✅ Archived ${archivedProcessedThisPage} cars from page ${archivedPage} (total: ${totalArchivedProcessed})`)
            }

          // Check if there are more archived pages
          hasMoreArchived = archivedData.meta?.current_page < archivedData.meta?.last_page
          archivedPage++

          // Update sync progress
          await supabase
            .from('sync_status')
            .update({
              archived_lots_processed: totalArchivedProcessed,
              last_activity_at: new Date().toISOString(),
              last_archived_sync_at: new Date().toISOString()
            })
            .eq('id', syncRecord.id)

          // Rate limiting between archived pages
            if (hasMoreArchived) {
              const delay =
                syncType === 'full'
                  ? RATE_LIMIT_DELAY
                  : Math.min(5000, RATE_LIMIT_DELAY)
              console.log(`⏸️ Waiting ${delay}ms before next archived page...`)
              await wait(delay)
            }

        } catch (archivedError) {
          console.error(`❌ Error processing archived lots page ${archivedPage}:`, archivedError)
          errors.push(`Archived lots page ${archivedPage}: ${archivedError instanceof Error ? archivedError.message : String(archivedError)}`)
          break
        }
      }

      // 🧹 Step 3: For daily sync, cleanup old sold cars (>30 days)
      let cleanupResult = null
      if (syncType === 'daily') {
        try {
          console.log(`🧹 Running daily cleanup (removing cars sold >30 days ago)...`)
          const { error: cleanupError } = await supabase.rpc('remove_old_sold_cars')
          
          if (cleanupError) {
            console.error(`❌ Error during daily cleanup:`, cleanupError)
            errors.push(`Cleanup error: ${cleanupError.message}`)
          } else {
            cleanupResult = { message: 'Old sold cars cleaned up successfully' }
            console.log(`✅ Daily cleanup completed`)
          }
        } catch (cleanupError) {
          console.error(`❌ Error calling cleanup function:`, cleanupError)
          errors.push(`Cleanup function error: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`)
        }
      }

      // Complete sync
      syncSuccess = true
      const completedAt = new Date().toISOString()
      await supabase
        .from('sync_status')
        .update({
          status: 'completed',
          completed_at: completedAt,
          records_processed: totalCarsProcessed + totalArchivedProcessed,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed,
          error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
        })
        .eq('id', syncRecord.id)

      console.log(`✅ Sync completed successfully!`)
      console.log(`📊 Active cars processed: ${totalCarsProcessed}`)
      console.log(`🗄️ Archived cars processed: ${totalArchivedProcessed}`)
      console.log(`⚠️ Errors encountered: ${errors.length}`)

      return new Response(
        JSON.stringify({
          success: true,
          sync_id: syncRecord.id,
          sync_type: syncType,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed,
          total_processed: totalCarsProcessed + totalArchivedProcessed,
          cleanup_result: cleanupResult,
          errors_count: errors.length,
          errors: errors.slice(0, 5),
          completed_at: completedAt
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error(`💥 Sync error:`, error)
      
      // Mark sync as failed
      await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : String(error),
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed
        })
        .eq('id', syncRecord.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          sync_id: syncRecord.id,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } finally {
      // Ensure sync is never left in running state
      if (!syncSuccess) {
        console.log('🔄 Finally block: Ensuring sync is not stuck in running state...')
        await supabase
          .from('sync_status')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Sync did not complete successfully - cleaned up in finally block',
            cars_processed: totalCarsProcessed,
            archived_lots_processed: totalArchivedProcessed
          })
          .eq('id', syncRecord.id)
          .eq('status', 'running') // Only update if still running
      }
    }

  } catch (error) {
    console.error(`💥 Critical sync error:`, error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})