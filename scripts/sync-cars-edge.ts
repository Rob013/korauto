#!/usr/bin/env tsx

/**
 * Ultra-Memory-Efficient Car Sync for Edge Function Environment
 * 
 * Optimized specifically for Deno edge functions with strict memory limits.
 * Uses minimal memory footprint while maintaining high throughput.
 * 
 * Memory Optimizations:
 * - Sequential processing to avoid memory buildup
 * - Aggressive garbage collection hints
 * - Immediate data cleanup after processing
 * - Small batch sizes to stay under memory limits
 * 
 * Performance Targets (Edge Function Optimized):
 * - ≥5 pages/sec sustained (lower due to memory constraints)
 * - ≥1k rows/sec sustained write phase
 * - Zero memory bloat (critical for edge functions)
 * - Zero unhandled promise rejections
 * 
 * Environment Variables:
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: Database connection
 * - API_BASE_URL, API_KEY: External API credentials
 * - CONCURRENCY: Parallel requests (default: 4 for memory efficiency)
 * - RPS: Requests per second limit (default: 10)  
 * - PAGE_SIZE: Items per page (default: 30)
 * - BATCH_SIZE: Database batch size (default: 50)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Ultra-conservative configuration for edge function memory limits
const CONCURRENCY = parseInt(Deno.env.get('CONCURRENCY') || '4') // Very low for memory efficiency  
const RPS = parseInt(Deno.env.get('RPS') || '10') // Conservative rate limiting
const PAGE_SIZE = parseInt(Deno.env.get('PAGE_SIZE') || '30') // Small pages for memory efficiency
const BATCH_SIZE = parseInt(Deno.env.get('BATCH_SIZE') || '50') // Small batches for memory efficiency
const MAX_RETRIES = 2 // Minimal retries to avoid memory buildup
const REQUEST_TIMEOUT = 15000 // Short timeout for fast recovery

// Environment variables validation
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  
const API_BASE_URL = Deno.env.get('API_BASE_URL')
const API_KEY = Deno.env.get('API_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !API_BASE_URL || !API_KEY) {
  console.error('❌ Missing required environment variables')
  throw new Error('Missing required environment variables')
}

// Initialize Supabase client with minimal configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }, // Don't persist sessions to save memory
  db: { schema: 'public' },
  global: { headers: { 'x-client-info': 'edge-sync/1.0' } }
})

// Lightweight metrics for edge function environment
interface EdgeSyncMetrics {
  startTime: number
  totalPages: number
  totalRows: number
  apiRequests: number
  apiErrors: number
  dbWrites: number
  dbErrors: number
  currentPage: number
}

let metrics: EdgeSyncMetrics = {
  startTime: Date.now(),
  totalPages: 0,
  totalRows: 0,
  apiRequests: 0,
  apiErrors: 0,
  dbWrites: 0,
  dbErrors: 0,
  currentPage: 1
}

// Ultra-lightweight rate limiter for edge functions
class EdgeRateLimiter {
  private lastRequest = 0
  private readonly interval: number

  constructor(rps: number) {
    this.interval = 1000 / rps
  }

  async throttle(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequest
    
    if (elapsed < this.interval) {
      await new Promise(resolve => setTimeout(resolve, this.interval - elapsed))
    }
    
    this.lastRequest = Date.now()
  }
}

const rateLimiter = new EdgeRateLimiter(RPS)

// Memory-efficient API request with minimal overhead
async function makeEdgeApiRequest(url: string, retryCount = 0): Promise<unknown> {
  // Apply rate limiting
  await rateLimiter.throttle()
  
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
    'User-Agent': 'KorAuto-Edge-Sync/1.0'
  }

  try {
    metrics.apiRequests++
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    
    const response = await fetch(url, {
      headers,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    // Handle rate limits with simple backoff
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const delay = 2000 * Math.pow(1.5, retryCount)
      console.log(`⏰ Rate limited. Waiting ${delay}ms`)
      metrics.apiErrors++
      await new Promise(resolve => setTimeout(resolve, delay))
      return makeEdgeApiRequest(url, retryCount + 1)
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data

  } catch (error: unknown) {
    metrics.apiErrors++
    console.error(`❌ API request failed: ${error}`)
    
    if (retryCount < MAX_RETRIES) {
      const delay = 1000 * Math.pow(1.5, retryCount)
      console.log(`🔄 Retrying in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return makeEdgeApiRequest(url, retryCount + 1)
    }
    
    throw error
  }
}

// Minimal car data transformation (memory efficient)
function transformCarDataEdge(apiCar: Record<string, unknown>): Record<string, unknown> {
  const primaryLot = (apiCar.lots as Record<string, unknown>[])?.[0]
  const images = (primaryLot?.images as Record<string, unknown>)?.normal || []
  
  const carId = apiCar.id?.toString()
  const make = (apiCar.manufacturer as Record<string, unknown>)?.name?.toString()?.trim()
  const model = (apiCar.model as Record<string, unknown>)?.name?.toString()?.trim()
  
  // Minimal object to reduce memory usage
  return {
    id: carId,
    external_id: carId,
    make,
    model,
    year: Number(apiCar.year) || 2020,
    price: Number(primaryLot?.buy_now) || 0,
    mileage: Number((primaryLot?.odometer as Record<string, unknown>)?.km) || 0,
    title: `${make} ${model} ${apiCar.year || ''}`,
    vin: apiCar.vin?.toString() || null,
    color: (apiCar.color as Record<string, unknown>)?.name?.toString() || null,
    fuel: (apiCar.fuel as Record<string, unknown>)?.name?.toString() || null,
    transmission: (apiCar.transmission as Record<string, unknown>)?.name?.toString() || null,
    lot_number: primaryLot?.lot?.toString() || null,
    image_url: Array.isArray(images) ? images[0] : null,
    images: JSON.stringify(images),
    current_bid: Number(primaryLot?.bid) || 0,
    buy_now_price: Number(primaryLot?.buy_now) || 0,
    is_live: (primaryLot?.status as Record<string, unknown>)?.name === 'sale',
    keys_available: primaryLot?.keys_available !== false,
    status: 'active',
    is_active: true,
    condition: (primaryLot?.condition as Record<string, unknown>)?.name?.toString() || 'good',
    location: 'South Korea',
    source_api: 'external',
    last_synced_at: new Date().toISOString()
  }
}

// Ultra-lightweight database write for edge functions
async function writeToStagingEdge(cars: Record<string, unknown>[]): Promise<number> {
  let successCount = 0
  
  // Process in very small chunks to avoid memory issues
  const MICRO_BATCH_SIZE = 20
  
  for (let i = 0; i < cars.length; i += MICRO_BATCH_SIZE) {
    const microBatch = cars.slice(i, i + MICRO_BATCH_SIZE)
    
    try {
      const { error, count } = await supabase
        .from('cars_staging')
        .upsert(microBatch, { 
          onConflict: 'id',
          count: 'exact'
        })

      if (error) {
        metrics.dbErrors++
        console.error(`❌ Micro-batch error:`, error)
        continue
      }

      metrics.dbWrites++
      successCount += count || microBatch.length
      
      // Brief pause between micro-batches
      await new Promise(resolve => setTimeout(resolve, 5))
      
    } catch (err) {
      metrics.dbErrors++
      console.error(`💥 Micro-batch write failed:`, err)
    }
  }
  
  return successCount
}

// Ultra-memory-efficient sync function for edge environments
export default async function syncCarsEdge() {
  console.log('🚀 Starting ultra-memory-efficient edge sync')
  console.log(`⚙️  Config: CONCURRENCY=${CONCURRENCY}, RPS=${RPS}, PAGE_SIZE=${PAGE_SIZE}, BATCH_SIZE=${BATCH_SIZE}`)
  
  const syncStart = Date.now()
  let currentPage = 1
  let consecutiveEmptyPages = 0
  const maxConsecutiveEmpty = 5
  const maxPages = 3000 // Conservative limit for edge functions
  
  try {
    // Clear staging table at start
    console.log('🧹 Preparing staging table')
    const { error: clearError } = await supabase
      .from('cars_staging')
      .delete()
      .neq('id', '')
    
    if (clearError) {
      console.warn('⚠️ Error clearing staging:', clearError)
    }

    // Sequential page processing with minimal memory footprint
    while (currentPage <= maxPages && consecutiveEmptyPages < maxConsecutiveEmpty) {
      console.log(`📄 Processing page ${currentPage}...`)
      
      try {
        const apiUrl = `${API_BASE_URL}/cars?page=${currentPage}&per_page=${PAGE_SIZE}`
        const apiResponse = await makeEdgeApiRequest(apiUrl)
        
        if (!apiResponse || !Array.isArray((apiResponse as Record<string, unknown>).data)) {
          consecutiveEmptyPages++
          currentPage++
          continue
        }

        const cars = (apiResponse as Record<string, unknown>).data as Record<string, unknown>[]
        
        if (cars.length === 0) {
          consecutiveEmptyPages++
          currentPage++
          continue
        }

        consecutiveEmptyPages = 0
        metrics.totalPages++
        metrics.totalRows += cars.length

        // Transform cars with immediate memory cleanup
        const stagingCars: Record<string, unknown>[] = []
        
        for (const apiCar of cars) {
          try {
            const carId = apiCar.id?.toString()
            const make = (apiCar.manufacturer as Record<string, unknown>)?.name?.toString()?.trim()
            const model = (apiCar.model as Record<string, unknown>)?.name?.toString()?.trim()
            
            if (carId && make && model) {
              stagingCars.push(transformCarDataEdge(apiCar))
            }
          } catch (carError) {
            console.warn(`⚠️ Car transform error:`, carError)
          }
        }

        // Immediate write and cleanup
        if (stagingCars.length > 0) {
          const insertedCount = await writeToStagingEdge(stagingCars)
          console.log(`✅ Page ${currentPage}: ${insertedCount}/${stagingCars.length} cars inserted`)
        }

        // Progress logging every 10 pages
        if (currentPage % 10 === 0) {
          const elapsed = (Date.now() - syncStart) / 1000
          const pagesPerSec = metrics.totalPages / elapsed
          const rowsPerSec = metrics.totalRows / elapsed
          
          console.log(`🚀 Progress: Page ${currentPage} | ${metrics.totalRows} rows | ` +
            `${pagesPerSec.toFixed(1)} p/s | ${rowsPerSec.toFixed(0)} r/s | ` +
            `Errors: ${metrics.apiErrors}/${metrics.dbErrors}`)
        }
        
        currentPage++
        
        // Memory cleanup hint after each page
        if (globalThis.gc) {
          globalThis.gc()
        }
        
      } catch (pageError) {
        console.error(`❌ Page ${currentPage} failed:`, pageError)
        currentPage++
        
        if (metrics.apiErrors > 20) {
          console.error('❌ Too many errors, stopping sync')
          break
        }
      }
    }

    console.log(`📊 Page fetching complete. Pages: ${metrics.totalPages}, Rows: ${metrics.totalRows}`)

    // Merge from staging with memory-efficient approach
    console.log('🔄 Starting merge operation...')
    const mergeStart = Date.now()
    
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('bulk_merge_from_staging')

    if (mergeError) {
      throw new Error(`Merge failed: ${mergeError.message}`)
    }

    console.log(`✅ Merge completed in ${Date.now() - mergeStart}ms:`, mergeResult)

    // Mark inactive cars
    console.log('🔄 Marking missing cars as inactive...')
    const { data: inactiveResult, error: inactiveError } = await supabase
      .rpc('mark_missing_inactive')

    if (inactiveError) {
      throw new Error(`Mark inactive failed: ${inactiveError.message}`)
    }

    console.log('✅ Mark inactive completed:', inactiveResult)

    // Cleanup staging table
    await supabase.from('cars_staging').delete().neq('id', '')

    // Final performance report
    const totalTime = Date.now() - syncStart
    const totalMinutes = totalTime / 60000
    const pagesPerSec = metrics.totalPages / (totalTime / 1000)
    const rowsPerSec = metrics.totalRows / (totalTime / 1000)
    
    console.log('\n🎯 EDGE SYNC COMPLETED:')
    console.log(`⏱️  Total time: ${totalMinutes.toFixed(1)} minutes`)
    console.log(`📊 Processed: ${metrics.totalRows} rows, ${metrics.totalPages} pages`) 
    console.log(`🚀 Rates: ${pagesPerSec.toFixed(1)} pages/sec, ${rowsPerSec.toFixed(0)} rows/sec`)
    console.log(`🔄 Errors: ${metrics.apiErrors} API, ${metrics.dbErrors} DB`)
    
    return {
      success: true,
      totalRows: metrics.totalRows,
      totalPages: metrics.totalPages,
      totalMinutes: totalMinutes.toFixed(1),
      pagesPerSec: pagesPerSec.toFixed(1),
      rowsPerSec: rowsPerSec.toFixed(0)
    }

  } catch (error: unknown) {
    console.error('💥 Edge sync failed:', error)
    throw error
  }
}

// For running directly in edge function or Node.js
if (import.meta.main) {
  syncCarsEdge().catch(error => {
    console.error('💥 Unhandled error:', error)
    Deno.exit(1)
  })
}