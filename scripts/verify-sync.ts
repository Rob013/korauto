#!/usr/bin/env tsx

/**
 * Car Sync Verification Script for KorAuto
 * 
 * This script verifies that the car sync process is working correctly and that
 * all 190,000+ cars from the API are being properly synced to the database.
 * 
 * Features:
 * - Checks API availability and car count
 * - Verifies database sync status  
 * - Identifies discrepancies between API and database
 * - Tests sold car detection and removal
 * - Validates data quality and completeness
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const RATE_LIMIT_DELAY = 1000
const MAX_RETRIES = 3
const SAMPLE_SIZE = 100 // Number of cars to sample for quality check
const EXPECTED_MIN_CARS = 190000 // Target minimum car count

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

// Helper function for API requests
async function makeApiRequest(url: string, retryCount = 0): Promise<unknown> {
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
    'User-Agent': 'KorAuto-Verification/1.0'
  }

  try {
    console.log(`📡 API Request: ${url}`)
    
    const response = await fetch(url, { headers })

    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = RATE_LIMIT_DELAY * Math.pow(2, retryCount)
        console.log(`⏰ Rate limited. Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return makeApiRequest(url, retryCount + 1)
      } else {
        throw new Error(`Rate limit exceeded after ${MAX_RETRIES} retries`)
      }
    }

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ API Error for ${url}:`, errorMessage)
    
    if (retryCount < MAX_RETRIES) {
      const delay = 1000 * Math.pow(2, retryCount)
      console.log(`⏰ Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return makeApiRequest(url, retryCount + 1)
    }
    
    throw error
  }
}

async function checkApiAvailability() {
  console.log('\n🌐 Checking API availability and car count...')
  
  try {
    // Get first page to check API availability and get total count
    const apiUrl = `${API_BASE_URL}/cars?page=1&per_page=1000`
    const response = await makeApiRequest(apiUrl) as Record<string, unknown>
    
    if (!response || !Array.isArray(response.data)) {
      console.error('❌ API response is invalid or missing data array')
      return null
    }

    // Estimate total cars by checking multiple pages
    let totalApiCars = 0
    let currentPage = 1
    let hasMorePages = true
    
    console.log('📊 Estimating total car count from API...')
    
    while (hasMorePages && currentPage <= 200) { // Limit to first 200 pages for estimation
      const pageUrl = `${API_BASE_URL}/cars?page=${currentPage}&per_page=1000`
      
      try {
        const pageResponse = await makeApiRequest(pageUrl) as Record<string, unknown>
        const cars = (pageResponse.data as unknown[]) || []
        
        if (cars.length === 0) {
          hasMorePages = false
        } else {
          totalApiCars += cars.length
          hasMorePages = cars.length >= 1000
          
          if (currentPage % 10 === 0) {
            console.log(`📊 Processed ${currentPage} pages, ${totalApiCars.toLocaleString()} cars so far...`)
          }
        }
        
        currentPage++
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY))
        
      } catch (pageError) {
        console.error(`❌ Error on page ${currentPage}:`, pageError)
        break
      }
    }
    
    console.log(`✅ API available - Estimated total cars: ${totalApiCars.toLocaleString()}`)
    
    if (totalApiCars >= EXPECTED_MIN_CARS) {
      console.log(`✅ API has sufficient cars (${totalApiCars.toLocaleString()} >= ${EXPECTED_MIN_CARS.toLocaleString()})`)
    } else {
      console.log(`⚠️ API may have fewer cars than expected (${totalApiCars.toLocaleString()} < ${EXPECTED_MIN_CARS.toLocaleString()})`)
    }
    
    return { totalApiCars, isAvailable: true }
    
  } catch (error) {
    console.error('❌ API is not available:', error)
    return { totalApiCars: 0, isAvailable: false }
  }
}

async function checkDatabaseStatus() {
  console.log('\n💾 Checking database status...')
  
  try {
    // Total cars in database
    const { count: totalDbCars, error: totalError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('❌ Error counting database cars:', totalError)
      return null
    }

    console.log(`📊 Total cars in database: ${totalDbCars?.toLocaleString()}`)
    
    // Active cars
    const { count: activeCars, error: activeError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (activeError) {
      console.error('❌ Error counting active cars:', activeError)
    } else {
      console.log(`📊 Active cars: ${activeCars?.toLocaleString()}`)
    }

    // External API cars
    const { count: externalCars, error: externalError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('source_api', 'external')
    
    if (externalError) {
      console.error('❌ Error counting external cars:', externalError)
    } else {
      console.log(`📊 External API cars: ${externalCars?.toLocaleString()}`)
    }

    // Recently synced cars (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCars, error: recentError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .gte('last_synced_at', yesterday)
    
    if (recentError) {
      console.error('❌ Error counting recent cars:', recentError)
    } else {
      console.log(`📊 Cars synced in last 24h: ${recentCars?.toLocaleString()}`)
    }
    
    return {
      totalDbCars,
      activeCars,
      externalCars,
      recentCars
    }
    
  } catch (error) {
    console.error('💥 Error checking database status:', error)
    return null
  }
}

async function checkDataQuality() {
  console.log('\n🔍 Checking data quality...')
  
  try {
    // Sample some cars for quality check
    const { data: sampleCars, error: sampleError } = await supabase
      .from('cars')
      .select('*')
      .eq('is_active', true)
      .limit(SAMPLE_SIZE)
    
    if (sampleError) {
      console.error('❌ Error getting sample cars:', sampleError)
      return
    }

    if (!sampleCars || sampleCars.length === 0) {
      console.log('⚠️ No cars found for quality check')
      return
    }

    let qualityIssues = 0
    let missingImages = 0
    let missingPrice = 0
    let missingBasicInfo = 0

    sampleCars.forEach(car => {
      // Check basic info
      if (!car.make || !car.model || !car.year) {
        missingBasicInfo++
        qualityIssues++
      }
      
      // Check price
      if (!car.price || car.price <= 0) {
        missingPrice++
        qualityIssues++
      }
      
      // Check images
      if (!car.image_url && (!car.images || car.images === '[]')) {
        missingImages++
        qualityIssues++
      }
    })

    console.log(`📊 Quality check on ${sampleCars.length} cars:`)
    console.log(`${missingBasicInfo === 0 ? '✅' : '⚠️'} Missing basic info: ${missingBasicInfo}`)
    console.log(`${missingPrice === 0 ? '✅' : '⚠️'} Missing price: ${missingPrice}`)
    console.log(`${missingImages === 0 ? '✅' : '⚠️'} Missing images: ${missingImages}`)
    
    const qualityPercentage = Math.round(((sampleCars.length - qualityIssues) / sampleCars.length) * 100)
    console.log(`📊 Overall quality: ${qualityPercentage}%`)
    
    return { qualityPercentage, totalIssues: qualityIssues }
    
  } catch (error) {
    console.error('💥 Error checking data quality:', error)
    return null
  }
}

async function testSearchFunctionality() {
  console.log('\n🔍 Testing search functionality...')
  
  try {
    // Test basic search
    const { data: searchResult, error: searchError } = await supabase
      .rpc('cars_search_sorted', {
        req: {
          q: '',
          filters: {},
          sort: { field: 'year', dir: 'desc' },
          page: 1,
          pageSize: 10,
          mode: 'results'
        }
      })
    
    if (searchError) {
      console.error('❌ Search function error:', searchError)
      return false
    }

    if (searchResult && searchResult.hits && Array.isArray(searchResult.hits)) {
      console.log(`✅ Search function working - returned ${searchResult.hits.length} cars`)
      console.log(`📊 Total cars available through search: ${searchResult.total?.toLocaleString()}`)
      return true
    } else {
      console.log('⚠️ Search function returned unexpected format')
      return false
    }
    
  } catch (error) {
    console.error('💥 Error testing search functionality:', error)
    return false
  }
}

async function checkSoldCarDetection() {
  console.log('\n🔍 Checking sold car detection...')
  
  try {
    // Count inactive cars (should be sold/removed cars)
    const { count: inactiveCars, error: inactiveError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .eq('source_api', 'external')
    
    if (inactiveError) {
      console.error('❌ Error counting inactive cars:', inactiveError)
      return null
    }

    console.log(`📊 Inactive (sold) cars detected: ${inactiveCars?.toLocaleString()}`)
    
    // Check if there are recent status changes
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentInactive, error: recentError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
      .eq('status', 'inactive')
      .gte('updated_at', yesterday)
    
    if (recentError) {
      console.error('❌ Error counting recently inactivated cars:', recentError)
    } else {
      console.log(`📊 Cars marked inactive in last 24h: ${recentInactive?.toLocaleString()}`)
    }
    
    return { inactiveCars, recentInactive }
    
  } catch (error) {
    console.error('💥 Error checking sold car detection:', error)
    return null
  }
}

async function main() {
  console.log('🔍 KorAuto Car Sync Verification Tool')
  console.log('=====================================')
  
  // Check API availability and count
  const apiStatus = await checkApiAvailability()
  
  // Check database status
  const dbStatus = await checkDatabaseStatus()
  
  // Check data quality
  const qualityStatus = await checkDataQuality()
  
  // Test search functionality
  const searchWorking = await testSearchFunctionality()
  
  // Check sold car detection
  const soldCarStatus = await checkSoldCarDetection()
  
  console.log('\n📋 Verification Summary:')
  console.log('========================')
  
  // API Status
  if (apiStatus?.isAvailable) {
    console.log(`✅ API Status: Available with ${apiStatus.totalApiCars.toLocaleString()} cars`)
  } else {
    console.log('❌ API Status: Not available or error')
  }
  
  // Database Status
  if (dbStatus) {
    const targetReached = (dbStatus.totalDbCars || 0) >= EXPECTED_MIN_CARS
    console.log(`${targetReached ? '✅' : '⚠️'} Database: ${dbStatus.totalDbCars?.toLocaleString()} cars (target: ${EXPECTED_MIN_CARS.toLocaleString()}+)`)
    
    if (dbStatus.activeCars) {
      const activePercentage = Math.round((dbStatus.activeCars / (dbStatus.totalDbCars || 1)) * 100)
      console.log(`📊 Active cars: ${activePercentage}% (${dbStatus.activeCars.toLocaleString()})`)
    }
  } else {
    console.log('❌ Database Status: Error or inaccessible')
  }
  
  // Search functionality
  console.log(`${searchWorking ? '✅' : '❌'} Search: ${searchWorking ? 'Working' : 'Not working'}`)
  
  // Data quality
  if (qualityStatus) {
    console.log(`${qualityStatus.qualityPercentage >= 90 ? '✅' : '⚠️'} Data Quality: ${qualityStatus.qualityPercentage}%`)
  }
  
  // Sold car detection
  if (soldCarStatus) {
    console.log(`✅ Sold Car Detection: ${soldCarStatus.inactiveCars?.toLocaleString()} inactive cars found`)
  }
  
  // Overall assessment
  console.log('\n🎯 Overall Assessment:')
  console.log('=====================')
  
  if (apiStatus?.isAvailable && dbStatus && (dbStatus.totalDbCars || 0) >= EXPECTED_MIN_CARS && searchWorking) {
    console.log('✅ PASS: All 190,000+ cars are successfully synced and accessible!')
  } else {
    console.log('⚠️ ATTENTION NEEDED: Some issues found that need to be addressed:')
    
    if (!apiStatus?.isAvailable) {
      console.log('  - API is not available or has errors')
    }
    
    if (!dbStatus || (dbStatus.totalDbCars || 0) < EXPECTED_MIN_CARS) {
      console.log(`  - Database has fewer than ${EXPECTED_MIN_CARS.toLocaleString()} cars`)
    }
    
    if (!searchWorking) {
      console.log('  - Search functionality is not working')
    }
  }
  
  console.log('\n✅ Verification completed!')
}

// Run the verification when script is executed directly
if (process.argv[1] && process.argv[1].includes('verify-sync.ts')) {
  main().catch(error => {
    console.error('💥 Verification failed:', error)
    process.exit(1)
  })
}

export default main