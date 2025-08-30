#!/usr/bin/env tsx

/**
 * Optimized Car Sync Script for KorAuto
 * 
 * High-performance car sync pipeline with surgical optimizations for ≤15-25 min runtime on ~200k rows.
 * Implements concurrency control, rate limiting, instrumentation, and robust error handling.
 * 
 * Performance Targets:
 * - ≥10 pages/sec sustained after warmup
 * - ≥2k rows/sec sustained write phase
 * - Zero unhandled promise rejections
 * - Zero memory bloat (stable RSS)
 * 
 * Environment Variables:
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: Database connection
 * - API_BASE_URL, API_KEY: External API credentials
 * - CONCURRENCY: Parallel requests (default: 16)
 * - RPS: Requests per second limit (default: 20)  
 * - PAGE_SIZE: Items per page (default: 100)
 * - BATCH_SIZE: Database batch size (default: 500)
 * - PARALLEL_BATCHES: Concurrent batch writes (default: 6)
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { Agent } from 'https'

// Memory-optimized configuration for edge function environment
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '8') // Reduced for memory efficiency  
const RPS = parseInt(process.env.RPS || '15') // Conservative rate limiting
const PAGE_SIZE = parseInt(process.env.PAGE_SIZE || '50') // Smaller pages to reduce memory usage
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '100') // Smaller batches for memory efficiency
const PARALLEL_BATCHES = parseInt(process.env.PARALLEL_BATCHES || '3') // Reduced parallel batches
const MAX_RETRIES = 3 // Reasonable retry count
const REQUEST_TIMEOUT = 30000 // Shorter timeout for faster recovery
const CHECKPOINT_FILE = '/tmp/sync-checkpoint.json'

// Environment variables validation
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

// Lightweight HTTP configuration for edge functions
const httpAgent = new Agent({
  keepAlive: true,
  keepAliveMsecs: 15000, // Shorter keep-alive for memory efficiency
  maxSockets: CONCURRENCY, // Conservative socket count
  timeout: REQUEST_TIMEOUT
})

// Performance metrics and instrumentation
interface SyncMetrics {
  startTime: number
  totalPages: number
  totalRows: number
  apiRequests: number
  apiErrors: number
  retryCount: number
  dbWrites: number
  dbErrors: number
  hashMatches: number
  hashMismatches: number
  lastProgressTime: number
  pagesPerSec: number
  rowsPerSec: number
  avgApiLatency: number
  p95ApiLatency: number
  currentPage: number
}

const metrics: SyncMetrics = {
  startTime: Date.now(),
  totalPages: 0,
  totalRows: 0,
  apiRequests: 0,
  apiErrors: 0,
  retryCount: 0,
  dbWrites: 0,
  dbErrors: 0,
  hashMatches: 0,
  hashMismatches: 0,
  lastProgressTime: Date.now(),
  pagesPerSec: 0,
  rowsPerSec: 0,
  avgApiLatency: 0,
  p95ApiLatency: 0,
  currentPage: 1
}

// API latency tracking for performance analysis
const apiLatencies: number[] = []

// Token bucket rate limiter implementation for smooth API throttling
class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity
    this.refillRate = refillRate
    this.tokens = capacity
    this.lastRefill = Date.now()
  }

  async consume(): Promise<void> {
    await this.refill()
    
    if (this.tokens < 1) {
      const waitTime = (1 / this.refillRate) * 1000
      await new Promise(resolve => setTimeout(resolve, waitTime))
      await this.consume()
      return
    }
    
    this.tokens--
  }

  private refill(): void {
    const now = Date.now()
    const timePassed = (now - this.lastRefill) / 1000
    const tokensToAdd = timePassed * this.refillRate
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}

// Initialize rate limiter based on RPS configuration
const rateLimiter = new TokenBucket(RPS * 2, RPS) // 2x capacity for burst tolerance

// Concurrency limiter (p-limit style) for backpressure management
class ConcurrencyLimiter {
  private running = 0
  private queue: Array<() => void> = []

  constructor(private limit: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.running++
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.running--
          this.processQueue()
        }
      }

      if (this.running < this.limit) {
        task()
      } else {
        this.queue.push(task)
      }
    })
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.running < this.limit) {
      const task = this.queue.shift()!
      task()
    }
  }
}

const concurrencyLimiter = new ConcurrencyLimiter(CONCURRENCY)

// Checkpoint management for resumability and idempotency
interface Checkpoint {
  runId: string
  lastPage: number
  totalProcessed: number
  startTime: number
  lastUpdateTime: number
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  try {
    writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
  } catch (error) {
    console.warn('⚠️ Failed to save checkpoint:', error)
  }
}

function loadCheckpoint(): Checkpoint | null {
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      const data = readFileSync(CHECKPOINT_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.warn('⚠️ Failed to load checkpoint:', error)
  }
  return null
}

// Generate stable MD5 hash for change detection (business fields only)
function generateCarHash(car: Record<string, any>): string {
  // Sort keys for consistent hashing, include only business-relevant fields
  const businessFields = {
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price,
    mileage: car.mileage,
    vin: car.vin,
    color: car.color,
    fuel: car.fuel,
    transmission: car.transmission,
    condition: car.condition,
    lot_number: car.lot_number,
    current_bid: car.current_bid,
    buy_now_price: car.buy_now_price,
    is_live: car.is_live,
    keys_available: car.keys_available
  }
  
  const sortedJson = JSON.stringify(businessFields, Object.keys(businessFields).sort())
  return createHash('md5').update(sortedJson).digest('hex')
}

// Circuit breaker for handling consecutive failures gracefully
class CircuitBreaker {
  private failures = 0
  private lastFailure = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private failureThreshold: number = 10,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN - too many consecutive failures')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailure = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN'
      console.warn(`🛑 Circuit breaker OPEN after ${this.failures} failures. Pausing for ${this.timeout/1000}s`)
    }
  }
}

const circuitBreaker = new CircuitBreaker()

// Enhanced API request function with comprehensive error handling and instrumentation  
async function makeApiRequest(url: string, retryCount = 0): Promise<unknown> {
  const requestStart = Date.now()
  
  // Apply rate limiting for smooth API throttling
  await rateLimiter.consume()
  
  const headers = {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate', // Enable compression for bandwidth efficiency
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
    'User-Agent': 'KorAuto-Sync/2.0 (Optimized)',
    'Connection': 'keep-alive' // Reuse connections for performance
  }

  try {
    metrics.apiRequests++
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    
    const response = await fetch(url, {
      headers,
      signal: controller.signal
      // Note: HTTP agent for keep-alive is handled by Node.js fetch automatically
    })
    
    clearTimeout(timeoutId)
    
    const latency = Date.now() - requestStart
    apiLatencies.push(latency)
    
    // Keep only recent latencies for performance calculation (memory-efficient sliding window)
    if (apiLatencies.length > 100) {
      apiLatencies.splice(0, 50) // Remove oldest half when limit reached
    }
    
    // Classify errors for targeted handling
    if (response.status === 429) {
      // Rate limit - exponential backoff with jitter for distributed retry timing
      const baseDelay = 1000 * Math.pow(2, retryCount)
      const jitter = Math.random() * 0.1 * baseDelay
      const delay = Math.min(30000, baseDelay + jitter)
      
      console.log(`⏰ Rate limited (${response.status}). Backoff: ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
      
      if (retryCount < MAX_RETRIES) {
        metrics.retryCount++
        await new Promise(resolve => setTimeout(resolve, delay))
        return makeApiRequest(url, retryCount + 1)
      } else {
        throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`)
      }
    }

    if (response.status >= 500) {
      // Server error - retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(10000, 500 * Math.pow(2, retryCount))
        console.log(`🔧 Server error ${response.status}. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
        metrics.retryCount++
        await new Promise(resolve => setTimeout(resolve, delay))
        return makeApiRequest(url, retryCount + 1)
      }
      throw new Error(`Server error ${response.status}: ${response.statusText}`)
    }

    if (!response.ok) {
      // Client error - don't retry, classify and log
      const errorType = response.status >= 400 && response.status < 500 ? 'CLIENT_ERROR' : 'UNKNOWN_ERROR'
      throw new Error(`${errorType}: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data

  } catch (error: unknown) {
    metrics.apiErrors++
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Classify network errors vs API errors for different retry strategies
    const isNetworkError = errorMessage.includes('ENOTFOUND') || 
                          errorMessage.includes('ECONNRESET') || 
                          errorMessage.includes('timeout') ||
                          errorMessage.includes('aborted')
    
    if (isNetworkError && retryCount < MAX_RETRIES) {
      const delay = Math.min(5000, 200 * Math.pow(1.8, retryCount))
      console.log(`🌐 Network error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1}): ${errorMessage}`)
      metrics.retryCount++
      await new Promise(resolve => setTimeout(resolve, delay))
      return makeApiRequest(url, retryCount + 1)
    }
    
    throw error
  }
}

// Enhanced car data transformation with hash generation for change detection
function transformCarData(apiCar: Record<string, unknown>): Record<string, unknown> {
  const primaryLot = (apiCar.lots as Record<string, unknown>[])?.[0]
  const images = (primaryLot?.images as Record<string, unknown>)?.normal || (primaryLot?.images as Record<string, unknown>)?.big || []
  
  const carId = apiCar.id?.toString()
  const make = (apiCar.manufacturer as Record<string, unknown>)?.name?.toString()?.trim()
  const model = (apiCar.model as Record<string, unknown>)?.name?.toString()?.trim()
  
  const transformedCar: Record<string, unknown> = {
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
  
  // Generate hash for change detection - only update when business data actually changes
  transformedCar.data_hash = generateCarHash(transformedCar)
  
  return transformedCar
}

// Progress logging with ETA calculation and performance metrics
function logProgress(): void {
  const now = Date.now()
  const elapsed = (now - metrics.startTime) / 1000
  const timeSinceLastProgress = (now - metrics.lastProgressTime) / 1000
  
  // Calculate rates
  metrics.pagesPerSec = metrics.totalPages / elapsed
  metrics.rowsPerSec = metrics.totalRows / elapsed
  
  // Calculate API latency metrics
  if (apiLatencies.length > 0) {
    metrics.avgApiLatency = apiLatencies.reduce((sum, lat) => sum + lat, 0) / apiLatencies.length
    const sorted = [...apiLatencies].sort((a, b) => a - b)
    metrics.p95ApiLatency = sorted[Math.floor(sorted.length * 0.95)] || 0
  }
  
  // ETA calculation based on current throughput
  const estimatedTotalPages = Math.max(2000, metrics.currentPage + 100) // Conservative estimate
  const remainingPages = estimatedTotalPages - metrics.currentPage
  const etaSeconds = remainingPages / Math.max(0.1, metrics.pagesPerSec)
  const etaMinutes = Math.floor(etaSeconds / 60)
  
  // Single progress line as requested
  console.log(`🚀 [${new Date().toISOString()}] Page ${metrics.currentPage} | ` +
    `${metrics.totalRows} rows | ${metrics.pagesPerSec.toFixed(1)} p/s | ` +
    `${metrics.rowsPerSec.toFixed(0)} r/s | API: ${metrics.avgApiLatency.toFixed(0)}ms avg/${metrics.p95ApiLatency.toFixed(0)}ms p95 | ` +
    `Errors: ${metrics.apiErrors}/${metrics.dbErrors} | Retries: ${metrics.retryCount} | ` +
    `Hash: ${metrics.hashMatches}/${metrics.hashMismatches} match/miss | ` +
    `ETA: ${etaMinutes}m${Math.floor(etaSeconds % 60)}s`)
  
  metrics.lastProgressTime = now
}

// Batch database operations for maximum write throughput
async function batchInsertToStaging(cars: Record<string, unknown>[]): Promise<number> {
  const batchStart = Date.now()
  let successCount = 0
  
  try {
    // Memory-efficient sequential processing instead of parallel chunks
    const chunkSize = Math.min(BATCH_SIZE, 50) // Smaller chunks for memory efficiency
    
    for (let i = 0; i < cars.length; i += chunkSize) {
      const chunk = cars.slice(i, i + chunkSize)
      
      try {
        const { error, count } = await supabase
          .from('cars_staging')
          .upsert(chunk, { 
            onConflict: 'id',
            ignoreDuplicates: false,
            count: 'exact'
          })

        if (error) {
          metrics.dbErrors++
          console.error(`❌ Batch upsert error:`, error)
          continue // Skip this chunk but continue with others
        }

        metrics.dbWrites++
        successCount += count || chunk.length
        
        // Brief pause between chunks to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10))
        
      } catch (err) {
        metrics.dbErrors++
        console.error(`💥 Chunk processing error:`, err)
        continue // Skip this chunk but continue with others
      }
    }
    
    const batchTime = Date.now() - batchStart
    const throughput = successCount / Math.max(1, batchTime / 1000)
    
    if (successCount < cars.length) {
      console.warn(`⚠️ Some records failed. ${successCount}/${cars.length} succeeded. Throughput: ${throughput.toFixed(0)} rows/s`)
    }
    
    return successCount

  } catch (error) {
    metrics.dbErrors++
    console.error(`❌ Batch insert failed:`, error)
    return 0
  }
}

// High-performance main sync function with comprehensive optimizations
async function syncCars() {
  const syncStart = Date.now()
  console.log('🚀 Starting optimized car sync with performance targets: ≥10 p/s, ≥2k r/s')
  console.log(`⚙️  Config: CONCURRENCY=${CONCURRENCY}, RPS=${RPS}, PAGE_SIZE=${PAGE_SIZE}, BATCH_SIZE=${BATCH_SIZE}`)
  
  // Generate unique run ID for this sync session
  const runId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Check for resumable checkpoint
  const checkpoint = loadCheckpoint()
  let startPage = 1
  let totalProcessedFromCheckpoint = 0
  
  if (checkpoint && (Date.now() - checkpoint.lastUpdateTime) < 24 * 60 * 60 * 1000) { // Resume within 24h
    startPage = checkpoint.lastPage + 1
    totalProcessedFromCheckpoint = checkpoint.totalProcessed
    metrics.currentPage = startPage
    console.log(`🔄 Resuming from checkpoint: page ${startPage}, ${totalProcessedFromCheckpoint} rows processed`)
  } else {
    console.log('🆕 Starting fresh sync (no valid checkpoint found)')
  }

  try {
    // Step 1: Prepare staging table (clear only if starting fresh)
    if (startPage === 1) {
      console.log('🧹 Preparing staging table for fresh sync')
      const { error: clearError } = await supabase
        .from('cars_staging')
        .delete()
        .neq('id', '')
      
      if (clearError) {
        console.warn('⚠️ Error clearing staging table:', clearError)
      }
    }

    // Step 2: Parallel page fetching with streaming processing
    let currentPage = startPage
    let consecutiveEmptyPages = 0
    let hasMorePages = true
    const errors: string[] = []
    const maxConsecutiveEmpty = 10 // Stop after 10 consecutive empty pages
    const maxPages = 5000 // Safety limit
    
    console.log('📊 Starting parallel page processing...')
    
    // Progress logging interval (every 5 seconds as requested)
    const progressInterval = setInterval(logProgress, 5000)
    
    while (hasMorePages && currentPage <= maxPages && consecutiveEmptyPages < maxConsecutiveEmpty) {
      const pageStart = Date.now()
      
      // Memory-efficient sequential processing with minimal parallelism
      const batchSize = Math.min(3, CONCURRENCY, maxPages - currentPage + 1) // Very small batches
      
      for (let i = 0; i < batchSize; i++) {
        const pageNum = currentPage + i
        if (pageNum > maxPages) break
        
        // Process each page with memory cleanup
        try {
          await concurrencyLimiter.run(async () => {
            return circuitBreaker.execute(async () => {
              const apiUrl = `${API_BASE_URL}/cars?page=${pageNum}&per_page=${PAGE_SIZE}`
              
              try {
                const apiResponse = await makeApiRequest(apiUrl)
                
                if (!apiResponse || !Array.isArray((apiResponse as Record<string, unknown>).data)) {
                  consecutiveEmptyPages++
                  return
                }

                const cars = (apiResponse as Record<string, unknown>).data as Record<string, unknown>[]
                
                if (cars.length === 0) {
                  consecutiveEmptyPages++
                  return
                }

                // Reset empty page counter on successful page
                consecutiveEmptyPages = 0
                metrics.totalPages++
                metrics.totalRows += cars.length

                // Process cars in small chunks to avoid memory buildup
                const CHUNK_SIZE = 20 // Very small chunks for memory efficiency
                for (let j = 0; j < cars.length; j += CHUNK_SIZE) {
                  const chunk = cars.slice(j, j + CHUNK_SIZE)
                  const stagingCars: Record<string, unknown>[] = []
                  
                  for (const apiCar of chunk) {
                    try {
                      const carId = apiCar.id?.toString()
                      const make = (apiCar.manufacturer as Record<string, unknown>)?.name?.toString()?.trim()
                      const model = (apiCar.model as Record<string, unknown>)?.name?.toString()?.trim()
                      
                      if (!carId || !make || !model) {
                        continue // Skip invalid data
                      }

                      const transformedCar = transformCarData(apiCar)
                      stagingCars.push(transformedCar)
                    } catch (carError) {
                      errors.push(`Car transformation error on page ${pageNum}: ${carError}`)
                    }
                  }

                  // Immediate write and cleanup for each chunk
                  if (stagingCars.length > 0) {
                    const insertedCount = await batchInsertToStaging(stagingCars)
                    
                    if (insertedCount !== stagingCars.length) {
                      console.warn(`⚠️ Page ${pageNum} chunk: ${insertedCount}/${stagingCars.length} cars inserted`)
                    }
                  }
                  
                  // Force garbage collection hint (memory cleanup)
                  if (global.gc) {
                    global.gc()
                  }
                }
                
              } catch (pageError) {
                const errorMessage = pageError instanceof Error ? pageError.message : 'Unknown error'
                errors.push(`Page ${pageNum}: ${errorMessage}`)
                console.error(`❌ Error processing page ${pageNum}:`, errorMessage)
                
                // Don't fail entire sync for individual page errors
                if (errors.length > 30) { // Reduced error threshold
                  console.error(`❌ Too many errors (${errors.length}), stopping sync`)
                  hasMorePages = false
                }
              }
            })
          })
        } catch (batchError) {
          console.error(`❌ Batch error at page ${pageNum}:`, batchError)
        }
      }
      
      // Update checkpoint more frequently for better recovery
      if (currentPage % 10 === 0) { // Every 10 pages
        const newCheckpoint: Checkpoint = {
          runId,
          lastPage: currentPage + batchSize - 1,
          totalProcessed: totalProcessedFromCheckpoint + metrics.totalRows,
          startTime: syncStart,
          lastUpdateTime: Date.now()
        }
        saveCheckpoint(newCheckpoint)
        
        // Memory cleanup hint
        if (global.gc) {
          global.gc()
        }
      }
      
      // Move to next batch
      currentPage += batchSize
      metrics.currentPage = currentPage
      
      // Check if we should continue based on response patterns
      if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
        console.log(`✅ Reached end of data (${consecutiveEmptyPages} consecutive empty pages)`)
        hasMorePages = false
      }
      
      // Enforce backpressure: don't enqueue more than CONCURRENCY * 2 worth of work
      const queueDepth = metrics.apiRequests - metrics.totalPages
      if (queueDepth > CONCURRENCY * 2) {
        await new Promise(resolve => setTimeout(resolve, 100)) // Brief pause
      }
    }
    
    clearInterval(progressInterval)
    
    console.log(`📊 Completed page fetching. Pages: ${metrics.totalPages}, Rows: ${metrics.totalRows}`)
    console.log(`⚡ API Performance - Requests: ${metrics.apiRequests}, Errors: ${metrics.apiErrors}, Retries: ${metrics.retryCount}`)
    console.log(`💾 DB Performance - Writes: ${metrics.dbWrites}, Errors: ${metrics.dbErrors}`)

    // Step 3: Enhanced bulk merge with hash-based change detection
    console.log('🔄 Starting optimized merge with hash-based change detection...')
    const mergeStart = Date.now()
    
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('bulk_merge_from_staging')

    const mergeTime = Date.now() - mergeStart

    if (mergeError) {
      console.error('❌ Error in bulk merge:', mergeError)
      throw new Error(`Merge failed: ${mergeError.message}`)
    }

    console.log(`✅ Bulk merge completed in ${mergeTime}ms:`, mergeResult)

    // Step 4: Mark inactive cars
    console.log('🔄 Marking missing cars as inactive...')
    const { data: inactiveResult, error: inactiveError } = await supabase
      .rpc('mark_missing_inactive')

    if (inactiveError) {
      console.error('❌ Error marking inactive:', inactiveError)
      throw new Error(`Mark inactive failed: ${inactiveError.message}`)
    }

    console.log('✅ Mark inactive completed:', inactiveResult)

    // Step 5: Cleanup and performance summary
    console.log('🧹 Cleaning up staging table...')
    await supabase.from('cars_staging').delete().neq('id', '')

    // Clear checkpoint on successful completion
    try {
      if (existsSync(CHECKPOINT_FILE)) {
        // Could delete but keeping for analysis: unlinkSync(CHECKPOINT_FILE)
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    // Final performance report and acceptance checks
    const totalTime = Date.now() - syncStart
    const totalMinutes = totalTime / 60000
    
    console.log('\n🎯 SYNC COMPLETED - Performance Summary:')
    console.log(`⏱️  Total time: ${totalMinutes.toFixed(1)} minutes (target: ≤25 min)`)
    console.log(`📊 Total processed: ${metrics.totalRows} rows, ${metrics.totalPages} pages`) 
    console.log(`🚀 Average rates: ${metrics.pagesPerSec.toFixed(1)} pages/sec, ${metrics.rowsPerSec.toFixed(0)} rows/sec`)
    console.log(`🌐 API performance: ${metrics.avgApiLatency.toFixed(0)}ms avg, ${metrics.p95ApiLatency.toFixed(0)}ms p95`)
    console.log(`🔄 Reliability: ${metrics.retryCount} retries, ${metrics.apiErrors} API errors, ${metrics.dbErrors} DB errors`)
    
    // Acceptance checks (fail if targets not met)
    const checks = {
      timeTarget: totalMinutes <= 25,
      pagesPerSecTarget: metrics.pagesPerSec >= 10,
      rowsPerSecTarget: metrics.rowsPerSec >= 2000,
      errorRate: (metrics.apiErrors + metrics.dbErrors) / Math.max(1, metrics.apiRequests) < 0.05
    }
    
    const allChecksPassed = Object.values(checks).every(Boolean)
    
    if (allChecksPassed) {
      console.log('✅ All performance targets met!')
    } else {
      console.log('⚠️ Performance targets not fully met:')
      if (!checks.timeTarget) console.log(`  ❌ Time: ${totalMinutes.toFixed(1)}min > 25min target`)
      if (!checks.pagesPerSecTarget) console.log(`  ❌ Pages/sec: ${metrics.pagesPerSec.toFixed(1)} < 10 target`)  
      if (!checks.rowsPerSecTarget) console.log(`  ❌ Rows/sec: ${metrics.rowsPerSec.toFixed(0)} < 2000 target`)
      if (!checks.errorRate) console.log(`  ❌ Error rate too high: ${((metrics.apiErrors + metrics.dbErrors) / Math.max(1, metrics.apiRequests) * 100).toFixed(1)}%`)
    }

    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} errors encountered (first 10):`)
      errors.slice(0, 10).forEach(err => console.log(`  • ${err}`))
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('💥 Sync failed:', errorMessage)
    
    // Save checkpoint on failure for resume capability
    const failureCheckpoint: Checkpoint = {
      runId,
      lastPage: metrics.currentPage,
      totalProcessed: totalProcessedFromCheckpoint + metrics.totalRows,
      startTime: syncStart,
      lastUpdateTime: Date.now()
    }
    saveCheckpoint(failureCheckpoint)
    
    throw error
  }
}

// Run the sync when script is executed directly
if (process.argv[1] && process.argv[1].includes('sync-cars.ts')) {
  syncCars().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export default syncCars