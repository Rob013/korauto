import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced configuration for better performance and reliability
const ENHANCED_CONFIG = {
  RATE_LIMIT_DELAY: 1500, // Faster but safer rate limiting
  MAX_RETRIES: 5,
  BACKOFF_MULTIPLIER: 1.3,
  PAGE_SIZE: 250, // Larger batch size for efficiency
  REQUEST_TIMEOUT: 60000, // Longer timeout for better reliability
  MAX_PAGES: 1000, // Higher limit for comprehensive syncs
  BATCH_SIZE: 50, // Process cars in batches for better memory management
  VALIDATION_THRESHOLD: 0.95 // At least 95% of cars must be valid
}

// Enhanced car validation with comprehensive checks
function validateCarData(apiCar: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Required fields
  if (!apiCar.id) errors.push('Missing car ID')
  if (!apiCar.manufacturer?.name) errors.push('Missing manufacturer name')
  if (!apiCar.model?.name) errors.push('Missing model name')
  
  // Data quality checks
  const year = apiCar.year
  if (year && (year < 1900 || year > new Date().getFullYear() + 2)) {
    errors.push(`Invalid year: ${year}`)
  }
  
  const primaryLot = apiCar.lots?.[0]
  if (primaryLot) {
    const buyNow = primaryLot.buy_now
    if (buyNow && (buyNow < 0 || buyNow > 10000000)) {
      errors.push(`Invalid buy_now price: ${buyNow}`)
    }
    
    const mileage = primaryLot.odometer?.km
    if (mileage && (mileage < 0 || mileage > 1000000)) {
      errors.push(`Invalid mileage: ${mileage}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Enhanced car transformation with better data enrichment
function transformCarData(apiCar: any): any {
  const primaryLot = apiCar.lots?.[0]
  const images = primaryLot?.images?.normal || primaryLot?.images?.big || []
  
  const carId = apiCar.id?.toString()
  const make = apiCar.manufacturer?.name?.trim()
  const model = apiCar.model?.name?.trim()
  
  // Enhanced price calculation with fallbacks
  const buyNowPrice = parseFloat(primaryLot?.buy_now) || 0
  const currentBid = parseFloat(primaryLot?.bid) || 0
  const price = Math.max(buyNowPrice, currentBid, 0)
  
  // Enhanced condition mapping
  const conditionMap: Record<string, string> = {
    'excellent': 'excellent',
    'good': 'good',
    'fair': 'fair',
    'poor': 'poor',
    'salvage': 'salvage'
  }
  const condition = conditionMap[primaryLot?.condition?.name?.toLowerCase()] || 'good'
  
  return {
    id: carId,
    external_id: carId,
    make,
    model,
    year: apiCar.year && apiCar.year > 1900 ? apiCar.year : 2020,
    price: Math.round(price),
    mileage: Math.max(primaryLot?.odometer?.km || 0, 0),
    title: apiCar.title?.trim() || `${make} ${model} ${apiCar.year || ''}`,
    vin: apiCar.vin?.trim() || null,
    color: apiCar.color?.name?.trim() || null,
    fuel: apiCar.fuel?.name?.trim() || null,
    transmission: apiCar.transmission?.name?.trim() || null,
    lot_number: primaryLot?.lot?.toString() || null,
    image_url: images[0] || null,
    images: JSON.stringify(images),
    current_bid: currentBid,
    buy_now_price: buyNowPrice,
    is_live: primaryLot?.status?.name === 'sale',
    keys_available: primaryLot?.keys_available !== false,
    status: 'active',
    is_archived: false,
    condition,
    location: 'South Korea',
    domain_name: 'encar_com',
    source_api: 'auctionapis',
    last_synced_at: new Date().toISOString(),
    // Enhanced metadata
    estimated_repair_cost: parseFloat(primaryLot?.estimate_repair_price) || null,
    airbags_status: primaryLot?.airbags || null,
    damage_primary: primaryLot?.damage?.main || null,
    damage_secondary: primaryLot?.damage?.second || null
  }
}

// Enhanced API request function with better error handling
async function makeEnhancedApiRequest(url: string, retryCount = 0): Promise<any> {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Enhanced-Encar-Sync/1.0'
  }

  try {
    console.log(`📡 Enhanced API Request: ${url} (attempt ${retryCount + 1}/${ENHANCED_CONFIG.MAX_RETRIES + 1})`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ENHANCED_CONFIG.REQUEST_TIMEOUT)
    
    const response = await fetch(url, {
      headers,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    if (response.status === 429) {
      const delay = ENHANCED_CONFIG.RATE_LIMIT_DELAY * Math.pow(ENHANCED_CONFIG.BACKOFF_MULTIPLIER, retryCount)
      console.log(`⏰ Rate limited. Enhanced backoff: ${delay}ms...`)
      
      if (retryCount < ENHANCED_CONFIG.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return makeEnhancedApiRequest(url, retryCount + 1)
      } else {
        throw new Error(`Rate limit exceeded after ${ENHANCED_CONFIG.MAX_RETRIES} retries`)
      }
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Enhanced response validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid API response structure')
    }
    
    return data
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${ENHANCED_CONFIG.REQUEST_TIMEOUT}ms`)
    }
    throw error
  }
}

// Enhanced batch processing for better performance
async function processCarsInBatches(supabase: any, cars: any[], syncRecord: any): Promise<{ processed: number; errors: string[] }> {
  let totalProcessed = 0
  const errors: string[] = []
  
  // Process cars in batches to avoid memory issues
  for (let i = 0; i < cars.length; i += ENHANCED_CONFIG.BATCH_SIZE) {
    const batch = cars.slice(i, i + ENHANCED_CONFIG.BATCH_SIZE)
    const validCars: any[] = []
    let batchErrors = 0
    
    // Validate batch
    for (const apiCar of batch) {
      const validation = validateCarData(apiCar)
      if (validation.isValid) {
        validCars.push(transformCarData(apiCar))
      } else {
        batchErrors++
        errors.push(`Car ${apiCar.id}: ${validation.errors.join(', ')}`)
      }
    }
    
    // Check validation threshold
    const validationRate = validCars.length / batch.length
    if (validationRate < ENHANCED_CONFIG.VALIDATION_THRESHOLD) {
      console.warn(`⚠️ Low validation rate in batch: ${(validationRate * 100).toFixed(1)}%`)
    }
    
    // Batch upsert for better performance
    if (validCars.length > 0) {
      try {
        const { error: batchError } = await supabase
          .from('cars')
          .upsert(validCars, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
        
        if (batchError) {
          console.error(`❌ Batch upsert error:`, batchError)
          errors.push(`Batch upsert: ${batchError.message}`)
        } else {
          totalProcessed += validCars.length
          console.log(`✅ Processed batch: ${validCars.length} cars (${totalProcessed} total)`)
        }
      } catch (error) {
        console.error(`❌ Batch processing error:`, error)
        errors.push(`Batch processing: ${error.message}`)
      }
    }
    
    // Update progress
    await supabase
      .from('sync_status')
      .update({
        cars_processed: totalProcessed,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', syncRecord.id)
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return { processed: totalProcessed, errors }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const syncType = url.searchParams.get('type') || 'incremental'
    const minutes = parseInt(url.searchParams.get('minutes') || '60')
    
    console.log(`🚀 Enhanced Encar Sync starting - Type: ${syncType}`)

    // Clean up stuck syncs
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    await supabase
      .from('sync_status')
      .update({ 
        status: 'failed', 
        error_message: 'Enhanced sync timeout - cleaned up automatically',
        completed_at: new Date().toISOString()
      })
      .eq('status', 'running')
      .lt('started_at', oneHourAgo)

    // Check for existing running sync
    const { data: existingSync } = await supabase
      .from('sync_status')
      .select('id')
      .eq('status', 'running')
      .single()

    if (existingSync) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Enhanced sync already in progress',
          existing_sync_id: existingSync.id 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create enhanced sync record
    const { data: syncRecord, error: syncError } = await supabase
      .from('sync_status')
      .insert({
        sync_type: `enhanced_${syncType}`,
        status: 'running',
        started_at: new Date().toISOString(),
        current_page: 1,
        total_pages: syncType === 'full' ? 1000 : 100,
        records_processed: 0,
        total_records: syncType === 'full' ? 200000 : 20000,
        cars_processed: 0,
        archived_lots_processed: 0,
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single()

    if (syncError) {
      throw new Error(`Failed to create enhanced sync record: ${syncError.message}`)
    }

    console.log(`✅ Created enhanced sync record: ${syncRecord.id}`)

    const API_KEY = 'd00985c77981fe8d26be16735f932ed1'
    const BASE_URL = 'https://auctionsapi.com/api'
    
    let totalCarsProcessed = 0
    let totalArchivedProcessed = 0
    const errors: string[] = []

    // Enhanced car processing
    console.log(`📡 Enhanced processing of active cars (${syncType})`)
    
    let baseUrl = `${BASE_URL}/cars?api_key=${API_KEY}&per_page=${ENHANCED_CONFIG.PAGE_SIZE}`
    if (syncType !== 'full') {
      baseUrl += `&minutes=${minutes}`
    }

    let currentPage = 1
    let hasMorePages = true
    
    while (hasMorePages && currentPage <= ENHANCED_CONFIG.MAX_PAGES) {
      const pageUrl = `${baseUrl}&page=${currentPage}`
      
      try {
        const carsData = await makeEnhancedApiRequest(pageUrl)
        const carsArray = Array.isArray(carsData.data) ? carsData.data : []
        
        if (carsArray.length === 0) {
          console.log(`⚠️ No more cars data, ending pagination at page ${currentPage}`)
          break
        }

        console.log(`📊 Enhanced processing ${carsArray.length} cars from page ${currentPage}`)

        // Process cars in batches
        const batchResult = await processCarsInBatches(supabase, carsArray, syncRecord)
        totalCarsProcessed += batchResult.processed
        errors.push(...batchResult.errors)

        // Update pagination
        hasMorePages = carsArray.length >= ENHANCED_CONFIG.PAGE_SIZE
        
        // Update progress with better estimates
        await supabase
          .from('sync_status')
          .update({
            current_page: currentPage,
            total_pages: hasMorePages ? Math.max(currentPage + 1, Math.ceil(totalCarsProcessed * 1.2 / ENHANCED_CONFIG.PAGE_SIZE)) : currentPage,
            cars_processed: totalCarsProcessed,
            records_processed: totalCarsProcessed + totalArchivedProcessed,
            last_activity_at: new Date().toISOString(),
            last_cars_sync_at: new Date().toISOString()
          })
          .eq('id', syncRecord.id)

        currentPage++
        await new Promise(resolve => setTimeout(resolve, ENHANCED_CONFIG.RATE_LIMIT_DELAY))

      } catch (pageError) {
        console.error(`❌ Enhanced sync error on page ${currentPage}:`, pageError)
        errors.push(`Page ${currentPage}: ${pageError.message}`)
        
        if (errors.length > 20) {
          console.error(`❌ Too many errors in enhanced sync, stopping`)
          break
        }
        
        currentPage++
      }
    }

    // Enhanced archived lots processing (keeping existing logic but with better error handling)
    console.log(`🗂️ Enhanced processing archived lots`)
    
    let archivedUrl = `${BASE_URL}/archived-lots?api_key=${API_KEY}`
    if (syncType !== 'full') {
      archivedUrl += `&minutes=${minutes}`
    }

    try {
      const archivedData = await makeEnhancedApiRequest(archivedUrl)
      
      if (archivedData?.archived_lots && Array.isArray(archivedData.archived_lots)) {
        console.log(`📊 Enhanced processing ${archivedData.archived_lots.length} archived lots`)

        // Process archived lots in batches
        for (let i = 0; i < archivedData.archived_lots.length; i += ENHANCED_CONFIG.BATCH_SIZE) {
          const batch = archivedData.archived_lots.slice(i, i + ENHANCED_CONFIG.BATCH_SIZE)
          
          for (const archivedLot of batch) {
            try {
              const carId = archivedLot.id?.toString()
              if (!carId) continue

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
                errors.push(`Archive ${carId}: ${archiveError.message}`)
              } else {
                totalArchivedProcessed++
              }
            } catch (archiveError) {
              errors.push(`Archive processing error: ${archiveError.message}`)
            }
          }
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } catch (archivedError) {
      console.error(`❌ Enhanced archived lots error:`, archivedError)
      errors.push(`Archived lots error: ${archivedError.message}`)
    }

    // Enhanced cleanup for daily syncs
    let cleanupResult = null
    if (syncType === 'daily') {
      try {
        console.log(`🧹 Running enhanced daily cleanup...`)
        const { data: cleanupData, error: cleanupError } = await supabase.rpc('remove_old_sold_cars')
        
        if (cleanupError) {
          errors.push(`Enhanced cleanup error: ${cleanupError.message}`)
        } else {
          cleanupResult = cleanupData
          console.log(`✅ Enhanced cleanup completed: ${cleanupData?.removed_cars_count || 0} cars removed`)
        }
      } catch (cleanupError) {
        errors.push(`Enhanced cleanup function error: ${cleanupError.message}`)
      }
    }

    // Complete enhanced sync
    const completedAt = new Date().toISOString()
    await supabase
      .from('sync_status')
      .update({
        status: errors.length > totalCarsProcessed * 0.1 ? 'completed_with_errors' : 'completed',
        completed_at: completedAt,
        records_processed: totalCarsProcessed + totalArchivedProcessed,
        cars_processed: totalCarsProcessed,
        archived_lots_processed: totalArchivedProcessed,
        error_message: errors.length > 0 ? `${errors.length} errors occurred` : null
      })
      .eq('id', syncRecord.id)

    const successRate = totalCarsProcessed / Math.max(totalCarsProcessed + errors.length, 1)
    console.log(`✅ Enhanced sync completed with ${(successRate * 100).toFixed(1)}% success rate`)

    return new Response(
      JSON.stringify({
        success: true,
        sync_id: syncRecord.id,
        sync_type: `enhanced_${syncType}`,
        cars_processed: totalCarsProcessed,
        archived_lots_processed: totalArchivedProcessed,
        total_processed: totalCarsProcessed + totalArchivedProcessed,
        errors_count: errors.length,
        success_rate: `${(successRate * 100).toFixed(1)}%`,
        cleanup_result: cleanupResult,
        completed_at: completedAt,
        errors: errors.slice(0, 10) // Only return first 10 errors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Enhanced sync failed:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})