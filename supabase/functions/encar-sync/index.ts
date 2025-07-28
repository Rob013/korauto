import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API rate limiting and retry configuration
const RATE_LIMIT_DELAY = 30000 // Start with 30 seconds
const MAX_RETRIES = 3
const BACKOFF_MULTIPLIER = 2
const PAGE_SIZE = 1000
const REQUEST_TIMEOUT = 30000
const MAX_PAGES = 100 // Safety limit

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
        await new Promise(resolve => setTimeout(resolve, delay))
        return makeApiRequest(url, retryCount + 1)
      } else {
        throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`)
      }
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ API Success: ${url} - Got ${Array.isArray(data?.data) ? data.data.length : 'unknown'} items`)
    return data

  } catch (error) {
    console.error(`❌ API Error for ${url}:`, error.message)
    
    if (retryCount < MAX_RETRIES && !error.message.includes('Rate limit exceeded')) {
      const delay = 1000 * Math.pow(BACKOFF_MULTIPLIER, retryCount)
      console.log(`⏰ Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
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
    const minutes = parseInt(url.searchParams.get('minutes') || '60')

    console.log(`📋 Sync Details: ${syncType} sync for last ${minutes} minutes`)

    // Clean up stuck syncs older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { error: cleanupError } = await supabase
      .from('sync_status')
      .update({ 
        status: 'failed', 
        error_message: 'Sync timeout - cleaned up automatically',
        completed_at: new Date().toISOString()
      })
      .eq('status', 'running')
      .lt('started_at', oneHourAgo)

    if (cleanupError) {
      console.warn('⚠️ Error cleaning up stuck syncs:', cleanupError)
    }

    // Check for existing running sync
    const { data: existingSync } = await supabase
      .from('sync_status')
      .select('id')
      .eq('status', 'running')
      .single()

    if (existingSync) {
      console.log(`⚠️ Sync already running: ${existingSync.id}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Sync already in progress',
          existing_sync_id: existingSync.id 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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

    const API_KEY = 'd00985c77981fe8d26be16735f932ed1'
    const BASE_URL = 'https://auctionsapi.com/api'
    
    let totalCarsProcessed = 0
    let totalArchivedProcessed = 0
    let errors: string[] = []

    try {
      // Step 1: Process active cars from /api/cars endpoint
      console.log(`📡 Processing active cars (${syncType === 'full' ? 'full sync' : `last ${minutes} minutes`})`)
      
      let baseUrl = `${BASE_URL}/cars?api_key=${API_KEY}&per-page=${PAGE_SIZE}`
      if (syncType !== 'full') {
        baseUrl += `&minutes=${minutes}`
      }

      // Handle pagination for cars
      let currentPage = 1
      let hasMorePages = true
      
      while (hasMorePages && currentPage <= MAX_PAGES) {
        const pageUrl = `${baseUrl}&page=${currentPage}`
        
        try {
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

          // Process each car
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

              const transformedCar = {
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
              }

              const { error: upsertError } = await supabase
                .from('cars')
                .upsert(transformedCar, { 
                  onConflict: 'id',
                  ignoreDuplicates: false 
                })

              if (upsertError) {
                console.error(`❌ Error upserting car ${transformedCar.id}:`, upsertError)
                errors.push(`Car ${transformedCar.id}: ${upsertError.message}`)
              } else {
                totalCarsProcessed++
                if (totalCarsProcessed % 100 === 0) {
                  console.log(`✅ Processed ${totalCarsProcessed} cars so far...`)
                }
              }
            } catch (carError) {
              console.error(`❌ Error processing car:`, carError)
              errors.push(`Car processing error: ${carError.message}`)
            }
          }

          // Update pagination logic
          hasMorePages = carsArray.length >= PAGE_SIZE
          
          // Update progress in database
          await supabase
            .from('sync_status')
            .update({
              current_page: currentPage,
              total_pages: hasMorePages ? currentPage + 1 : currentPage,
              cars_processed: totalCarsProcessed,
              last_activity_at: new Date().toISOString(),
              last_cars_sync_at: new Date().toISOString()
            })
            .eq('id', syncRecord.id)

          currentPage++
          
          // Small delay between pages to be nice to the API
          await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (pageError) {
          console.error(`❌ Error processing page ${currentPage}:`, pageError)
          errors.push(`Page ${currentPage}: ${pageError.message}`)
          
          // If we get consistent errors, break out
          if (errors.length > 10) {
            console.error(`❌ Too many errors, stopping sync`)
            break
          }
          
          currentPage++
        }
      }

      if (currentPage > MAX_PAGES) {
        console.log(`⚠️ Reached maximum page limit (${MAX_PAGES}), stopping pagination`)
      }

      // Step 2: Process archived lots from /api/archived-lots endpoint
      console.log(`🗂️ Processing archived lots (${syncType === 'full' ? 'full sync' : `last ${minutes} minutes`})`)
      
      let archivedUrl = `${BASE_URL}/archived-lots?api_key=${API_KEY}`
      if (syncType !== 'full') {
        archivedUrl += `&minutes=${minutes}`
      }

      try {
        const archivedData = await makeApiRequest(archivedUrl)
        
        if (archivedData?.archived_lots && Array.isArray(archivedData.archived_lots)) {
          console.log(`📊 Processing ${archivedData.archived_lots.length} archived lots`)

          for (const archivedLot of archivedData.archived_lots) {
            try {
              const carId = archivedLot.id?.toString()
              if (!carId) continue

              // Archive the car in our database
              const { error: archiveError } = await supabase
                .from('cars')
                .update({
                  is_archived: true,
                  archived_at: new Date().toISOString(),
                  sold_price: parseFloat(archivedLot.final_price) || null,
                  final_bid: parseFloat(archivedLot.final_price) || null,
                  sale_date: archivedLot.sale_date || new Date().toISOString(),
                  archive_reason: 'sold',
                  status: 'sold',
                  last_synced_at: new Date().toISOString()
                })
                .eq('external_id', carId)

              if (archiveError) {
                console.error(`❌ Error archiving car ${carId}:`, archiveError)
                errors.push(`Archive ${carId}: ${archiveError.message}`)
              } else {
                totalArchivedProcessed++
                if (totalArchivedProcessed % 50 === 0) {
                  console.log(`✅ Archived ${totalArchivedProcessed} cars so far...`)
                }
              }
            } catch (archiveError) {
              console.error(`❌ Error processing archived lot:`, archiveError)
              errors.push(`Archive processing error: ${archiveError.message}`)
            }
          }

          // Update sync progress
          await supabase
            .from('sync_status')
            .update({
              archived_lots_processed: totalArchivedProcessed,
              last_activity_at: new Date().toISOString(),
              last_archived_sync_at: new Date().toISOString()
            })
            .eq('id', syncRecord.id)
        }
      } catch (archivedError) {
        console.error(`❌ Error processing archived lots:`, archivedError)
        errors.push(`Archived lots error: ${archivedError.message}`)
      }

      // Complete sync
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

      console.log(`✅ Sync completed: ${totalCarsProcessed} cars processed, ${totalArchivedProcessed} archived`)

      return new Response(
        JSON.stringify({
          success: true,
          sync_id: syncRecord.id,
          sync_type: syncType,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed,
          total_processed: totalCarsProcessed + totalArchivedProcessed,
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
          error_message: error.message,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed
        })
        .eq('id', syncRecord.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          sync_id: syncRecord.id,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error(`💥 Critical sync error:`, error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})