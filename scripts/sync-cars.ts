#!/usr/bin/env tsx

/**
 * Car Sync Script for KorAuto
 * 
 * This script syncs cars from an external API to Supabase database.
 * It reads from the API defined by API_BASE_URL and API_KEY environment variables.
 * 
 * Features:
 * - Fetches cars from external API
 * - Stores them in cars_staging table
 * - Uses bulk_merge_from_staging RPC function to merge data
 * - Uses mark_missing_inactive RPC function to mark missing cars as inactive
 * 
 * Environment Variables Required:
 * - SUPABASE_PROJECT_ID: Supabase project ID
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_ANON_KEY: Supabase anonymous key
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * - SUPABASE_DB_PASSWORD: Database password
 * - API_BASE_URL: Base URL for the car API
 * - API_KEY: API key for authentication
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const RATE_LIMIT_DELAY = 2000 // 2 seconds between requests
const MAX_RETRIES = 3
const BACKOFF_MULTIPLIER = 2
const PAGE_SIZE = 100
const REQUEST_TIMEOUT = 30000

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_BASE_URL = process.env.API_BASE_URL
const API_KEY = process.env.API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_BASE_URL || !API_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, API_BASE_URL, API_KEY')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Helper function for API requests with retry logic
async function makeApiRequest(url: string, retryCount = 0): Promise<unknown> {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
    'User-Agent': 'KorAuto-Sync/1.0'
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
    console.log(`✅ API Success: ${url} - Got ${Array.isArray((data as Record<string, unknown>)?.data) ? ((data as Record<string, unknown>).data as unknown[]).length : 'unknown'} items`)
    return data

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ API Error for ${url}:`, errorMessage)
    
    if (retryCount < MAX_RETRIES && !errorMessage.includes('Rate limit exceeded')) {
      const delay = 1000 * Math.pow(BACKOFF_MULTIPLIER, retryCount)
      console.log(`⏰ Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return makeApiRequest(url, retryCount + 1)
    }
    
    throw error
  }
}

// Transform API car data to our schema
function transformCarData(apiCar: Record<string, unknown>): Record<string, unknown> {
  const primaryLot = (apiCar.lots as Record<string, unknown>[])?.[0]
  const images = (primaryLot?.images as Record<string, unknown>)?.normal || (primaryLot?.images as Record<string, unknown>)?.big || []
  
  const carId = apiCar.id?.toString()
  const make = (apiCar.manufacturer as Record<string, unknown>)?.name?.toString()?.trim()
  const model = (apiCar.model as Record<string, unknown>)?.name?.toString()?.trim()
  
  return {
    id: carId,
    external_id: carId,
    make,
    model,
    year: apiCar.year && Number(apiCar.year) > 1900 ? Number(apiCar.year) : 2020,
    price: Math.max(Number(primaryLot?.buy_now) || 0, 0),
    mileage: Math.max(Number((primaryLot?.odometer as Record<string, unknown>)?.km) || 0, 0),
    title: apiCar.title?.toString()?.trim() || `${make} ${model} ${apiCar.year || ''}`,
    vin: apiCar.vin?.toString()?.trim() || null,
    color: (apiCar.color as Record<string, unknown>)?.name?.toString()?.trim() || null,
    fuel: (apiCar.fuel as Record<string, unknown>)?.name?.toString()?.trim() || null,
    transmission: (apiCar.transmission as Record<string, unknown>)?.name?.toString()?.trim() || null,
    lot_number: primaryLot?.lot?.toString() || null,
    image_url: Array.isArray(images) ? images[0] : null,
    images: JSON.stringify(images),
    current_bid: parseFloat(primaryLot?.bid?.toString() || '0') || 0,
    buy_now_price: parseFloat(primaryLot?.buy_now?.toString() || '0') || 0,
    is_live: (primaryLot?.status as Record<string, unknown>)?.name === 'sale',
    keys_available: primaryLot?.keys_available !== false,
    status: 'active',
    is_active: true,
    is_archived: false,
    condition: (primaryLot?.condition as Record<string, unknown>)?.name?.toString() || 'good',
    location: 'South Korea',
    domain_name: 'external_api',
    source_api: 'external',
    last_synced_at: new Date().toISOString()
  }
}

// Main sync function
async function syncCars() {
  console.log('🚀 Starting car sync from external API')
  
  try {
    // Step 1: Clear staging table
    console.log('🧹 Clearing cars_staging table')
    const { error: clearError } = await supabase
      .from('cars_staging')
      .delete()
      .neq('id', '')  // Delete all records
    
    if (clearError) {
      console.error('❌ Error clearing staging table:', clearError)
    }

    // Step 2: Fetch cars from API and insert into staging
    let currentPage = 1
    let hasMorePages = true
    let totalCarsProcessed = 0
    const errors: string[] = []

    while (hasMorePages) {
      const apiUrl = `${API_BASE_URL}/cars?page=${currentPage}&per_page=${PAGE_SIZE}`
      
      try {
        const apiResponse = await makeApiRequest(apiUrl)
        
        if (!apiResponse || !Array.isArray((apiResponse as Record<string, unknown>).data)) {
          console.log(`⚠️ No more data available at page ${currentPage}`)
          break
        }

        const cars = (apiResponse as Record<string, unknown>).data as Record<string, unknown>[]
        
        if (cars.length === 0) {
          console.log(`⚠️ No cars data in response for page ${currentPage}`)
          break
        }

        console.log(`📊 Processing ${cars.length} cars from page ${currentPage}`)

        // Transform and batch insert cars into staging
        const stagingCars: Record<string, unknown>[] = []
        
        for (const apiCar of cars) {
          try {
            const carId = apiCar.id?.toString()
            const make = (apiCar.manufacturer as Record<string, unknown>)?.name?.toString()?.trim()
            const model = (apiCar.model as Record<string, unknown>)?.name?.toString()?.trim()
            
            if (!carId || !make || !model) {
              console.warn(`⚠️ Skipping car with missing data: ID=${carId}, Make=${make}, Model=${model}`)
              continue
            }

            const transformedCar = transformCarData(apiCar)
            stagingCars.push(transformedCar)
          } catch (carError: unknown) {
            const errorMessage = carError instanceof Error ? carError.message : 'Unknown error'
            console.error(`❌ Error transforming car:`, carError)
            errors.push(`Car transformation error: ${errorMessage}`)
          }
        }

        // Batch insert into staging table
        if (stagingCars.length > 0) {
          const { error: insertError } = await supabase
            .from('cars_staging')
            .insert(stagingCars)

          if (insertError) {
            console.error(`❌ Error inserting cars into staging:`, insertError)
            errors.push(`Staging insert error: ${insertError.message}`)
          } else {
            totalCarsProcessed += stagingCars.length
            console.log(`✅ Inserted ${stagingCars.length} cars into staging. Total: ${totalCarsProcessed}`)
          }
        }

        // Check if we have more pages
        hasMorePages = cars.length >= PAGE_SIZE
        currentPage++
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))

      } catch (pageError: unknown) {
        const errorMessage = pageError instanceof Error ? pageError.message : 'Unknown error'
        console.error(`❌ Error processing page ${currentPage}:`, pageError)
        errors.push(`Page ${currentPage}: ${errorMessage}`)
        
        if (errors.length > 10) {
          console.error(`❌ Too many errors, stopping sync`)
          break
        }
        
        currentPage++
      }
    }

    console.log(`📊 Finished fetching. Total cars in staging: ${totalCarsProcessed}`)

    // Step 3: Call bulk_merge_from_staging RPC function
    console.log('🔄 Merging staging data to main cars table')
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('bulk_merge_from_staging')

    if (mergeError) {
      console.error('❌ Error calling bulk_merge_from_staging:', mergeError)
      throw new Error(`Merge error: ${mergeError.message}`)
    }

    console.log('✅ Bulk merge completed:', mergeResult)

    // Step 4: Call mark_missing_inactive RPC function
    console.log('🔄 Marking missing cars as inactive')
    const { data: inactiveResult, error: inactiveError } = await supabase
      .rpc('mark_missing_inactive')

    if (inactiveError) {
      console.error('❌ Error calling mark_missing_inactive:', inactiveError)
      throw new Error(`Mark inactive error: ${inactiveError.message}`)
    }

    console.log('✅ Mark missing inactive completed:', inactiveResult)

    // Step 5: Clean up staging table
    console.log('🧹 Cleaning up staging table')
    const { error: finalClearError } = await supabase
      .from('cars_staging')
      .delete()
      .neq('id', '')  // Delete all records

    if (finalClearError) {
      console.error('❌ Error cleaning up staging table:', finalClearError)
    }

    console.log(`✅ Sync completed successfully!`)
    console.log(`📊 Total cars processed: ${totalCarsProcessed}`)
    console.log(`📊 Errors encountered: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log('⚠️ Errors:', errors.slice(0, 5))
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('💥 Sync failed:', error)
    process.exit(1)
  }
}

// Run the sync
if (require.main === module) {
  syncCars().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export default syncCars