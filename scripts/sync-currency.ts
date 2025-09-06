#!/usr/bin/env tsx

/**
 * Currency Exchange Rate Sync Script for KorAuto
 * 
 * This script fetches the latest USD to EUR exchange rate from currencyapi.com
 * and stores it in a way that can be accessed by the application for consistent
 * daily rate updates.
 * 
 * Features:
 * - Fetches latest USD to EUR exchange rate
 * - Stores the rate with timestamp
 * - Handles API errors with retries
 * - Logs the process for monitoring
 * 
 * Environment Variables Required:
 * - CURRENCY_API_KEY: API key for currencyapi.com (optional, has fallback)
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 2000
const REQUEST_TIMEOUT = 10000

// Currency API configuration
const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY || 'cur_live_SqgABFxnWHPaJjbRVJQdOLJpYkgCiJgQkIdvVFN6'
const CURRENCY_API_URL = `https://api.currencyapi.com/v3/latest?apikey=${CURRENCY_API_KEY}&currencies=EUR&base_currency=USD`

// Supabase configuration (for storing rates in database if needed)
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// File path for storing exchange rate
const EXCHANGE_RATE_FILE = join(process.cwd(), 'public', 'current-exchange-rate.json')

interface ExchangeRate {
  rate: number;
  lastUpdated: string;
  source: string;
}

interface CurrencyAPIResponse {
  data: {
    EUR: number;
  };
}

// Initialize Supabase client if credentials are available
let supabase: ReturnType<typeof createClient> | null = null
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

// Helper function to make API requests with retry logic
async function fetchWithRetry(url: string, retryCount = 0): Promise<CurrencyAPIResponse> {
  try {
    console.log(`💱 Fetching exchange rate from API (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'KorAuto-Currency-Sync/1.0'
      }
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json() as CurrencyAPIResponse

    if (!data.data?.EUR) {
      throw new Error('Invalid API response format - missing EUR data')
    }

    console.log(`✅ Successfully fetched exchange rate: 1 USD = ${data.data.EUR} EUR`)
    return data

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error fetching exchange rate (attempt ${retryCount + 1}):`, errorMessage)
    
    if (retryCount < MAX_RETRIES) {
      console.log(`⏰ Retrying in ${RETRY_DELAY}ms...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return fetchWithRetry(url, retryCount + 1)
    }
    
    throw new Error(`Failed to fetch exchange rate after ${MAX_RETRIES + 1} attempts: ${errorMessage}`)
  }
}

// Save exchange rate to local file
async function saveRateToFile(exchangeRate: ExchangeRate): Promise<void> {
  try {
    const data = JSON.stringify(exchangeRate, null, 2)
    writeFileSync(EXCHANGE_RATE_FILE, data, 'utf8')
    console.log(`✅ Exchange rate saved to ${EXCHANGE_RATE_FILE}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error saving exchange rate to file:`, errorMessage)
    throw error
  }
}

// Save exchange rate to database (if Supabase is configured)
async function saveRateToDatabase(exchangeRate: ExchangeRate): Promise<void> {
  if (!supabase) {
    console.log('ℹ️ Supabase not configured, skipping database storage')
    return
  }

  try {
    // Store in a simple key-value table or create a dedicated exchange_rates table
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'usd_eur_exchange_rate',
        value: exchangeRate,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('❌ Error saving to database:', error.message)
      // Don't throw here, file storage is primary method
    } else {
      console.log('✅ Exchange rate saved to database')
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Database save error:`, errorMessage)
    // Don't throw here, file storage is primary method
  }
}

// Get current rate from file (for comparison)
function getCurrentRate(): ExchangeRate | null {
  try {
    if (!existsSync(EXCHANGE_RATE_FILE)) {
      return null
    }
    
    const data = readFileSync(EXCHANGE_RATE_FILE, 'utf8')
    return JSON.parse(data) as ExchangeRate
  } catch (error: unknown) {
    console.log('ℹ️ No existing exchange rate file found or invalid format')
    return null
  }
}

// Main sync function
async function syncExchangeRate(): Promise<void> {
  console.log('🚀 Starting daily exchange rate sync')
  console.log(`⏰ Sync time: ${new Date().toISOString()}`)
  
  try {
    // Get current rate for comparison
    const currentRate = getCurrentRate()
    if (currentRate) {
      console.log(`📊 Current rate: 1 USD = ${currentRate.rate} EUR (last updated: ${currentRate.lastUpdated})`)
    }

    // Fetch new rate from API
    const apiResponse = await fetchWithRetry(CURRENCY_API_URL)
    
    const newExchangeRate: ExchangeRate = {
      rate: apiResponse.data.EUR,
      lastUpdated: new Date().toISOString(),
      source: 'currencyapi.com'
    }

    // Check if rate has changed significantly
    if (currentRate) {
      const rateDifference = Math.abs(newExchangeRate.rate - currentRate.rate)
      const percentageChange = (rateDifference / currentRate.rate) * 100
      
      console.log(`📈 Rate change: ${rateDifference.toFixed(4)} (${percentageChange.toFixed(2)}%)`)
      
      if (percentageChange > 5) {
        console.log('⚠️ Significant rate change detected (>5%)')
      }
    }

    // Save the new rate
    await saveRateToFile(newExchangeRate)
    await saveRateToDatabase(newExchangeRate)
    
    console.log('✅ Exchange rate sync completed successfully!')
    console.log(`💰 New rate: 1 USD = ${newExchangeRate.rate} EUR`)
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('💥 Exchange rate sync failed:', errorMessage)
    
    // Try to use fallback rate if all else fails
    const fallbackRate: ExchangeRate = {
      rate: 0.85, // Current market rate as fallback
      lastUpdated: new Date().toISOString(),
      source: 'fallback'
    }
    
    console.log('🔄 Using fallback exchange rate...')
    await saveRateToFile(fallbackRate)
    
    console.log('⚠️ Sync completed with fallback rate')
    // Exit with error code so monitoring can detect the issue
    process.exit(1)
  }
}

// Run the sync when script is executed directly
if (process.argv[1] && process.argv[1].includes('sync-currency.ts')) {
  syncExchangeRate().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export default syncExchangeRate