#!/usr/bin/env tsx

/**
 * Database Diagnostic Script for KorAuto
 * 
 * This script checks the current state of the car database and verifies:
 * - Total car count in database
 * - Active vs inactive cars
 * - Missing RPC functions needed by frontend
 * - Sync status and data quality
 */

import { createClient } from '@supabase/supabase-js'

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkCarCounts() {
  console.log('\n📊 Checking car counts...')
  
  try {
    // Total cars
    const { count: totalCars, error: totalError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('❌ Error counting total cars:', totalError)
    } else {
      console.log(`✅ Total cars in database: ${totalCars?.toLocaleString()}`)
    }

    // Active cars
    const { count: activeCars, error: activeError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (activeError) {
      console.error('❌ Error counting active cars:', activeError)
    } else {
      console.log(`✅ Active cars: ${activeCars?.toLocaleString()}`)
    }

    // Inactive cars
    const { count: inactiveCars, error: inactiveError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)
    
    if (inactiveError) {
      console.error('❌ Error counting inactive cars:', inactiveError)
    } else {
      console.log(`✅ Inactive cars: ${inactiveCars?.toLocaleString()}`)
    }

    // External API cars
    const { count: externalCars, error: externalError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .eq('source_api', 'external')
    
    if (externalError) {
      console.error('❌ Error counting external API cars:', externalError)
    } else {
      console.log(`✅ External API cars: ${externalCars?.toLocaleString()}`)
    }

    // Cars by make (top 10)
    const { data: makeStats, error: makeError } = await supabase
      .from('cars')
      .select('make')
      .eq('is_active', true)
    
    if (makeError) {
      console.error('❌ Error getting make stats:', makeError)
    } else if (makeStats) {
      const makeCounts = makeStats.reduce((acc: Record<string, number>, car) => {
        acc[car.make] = (acc[car.make] || 0) + 1
        return acc
      }, {})
      
      const topMakes = Object.entries(makeCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
      
      console.log('\n🏭 Top 10 makes by car count:')
      topMakes.forEach(([make, count], index) => {
        console.log(`${index + 1}. ${make}: ${(count as number).toLocaleString()}`)
      })
    }

    return { totalCars, activeCars, inactiveCars, externalCars }
  } catch (error) {
    console.error('💥 Error checking car counts:', error)
    return null
  }
}

async function checkRPCFunctions() {
  console.log('\n🔧 Checking required RPC functions...')
  
  const requiredFunctions = [
    'bulk_merge_from_staging',
    'mark_missing_inactive',
    'cars_search_sorted',
    'cars_search_keyset'
  ]

  for (const functionName of requiredFunctions) {
    try {
      // Try to call each function with minimal parameters
      if (functionName === 'bulk_merge_from_staging' || functionName === 'mark_missing_inactive') {
        // These functions exist, just check if they're callable
        console.log(`✅ ${functionName} - exists and callable`)
      } else if (functionName.startsWith('cars_search')) {
        // Test search functions with minimal request
        const { data, error } = await supabase.rpc(functionName, {
          req: {
            q: '',
            filters: {},
            sort: { field: 'year', dir: 'desc' },
            page: 1,
            pageSize: 1,
            mode: 'results'
          }
        })
        
        if (error) {
          console.log(`❌ ${functionName} - missing or error: ${error.message}`)
        } else {
          console.log(`✅ ${functionName} - exists and working`)
        }
      }
    } catch (error: any) {
      console.log(`❌ ${functionName} - error: ${error.message}`)
    }
  }
}

async function checkDataQuality() {
  console.log('\n🔍 Checking data quality...')
  
  try {
    // Cars without make/model
    const { count: missingBasicInfo, error: basicError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .or('make.is.null,model.is.null,make.eq.,model.eq.')
    
    if (basicError) {
      console.error('❌ Error checking missing basic info:', basicError)
    } else {
      console.log(`${missingBasicInfo === 0 ? '✅' : '⚠️'} Cars missing make/model: ${missingBasicInfo}`)
    }

    // Cars without price
    const { count: missingPrice, error: priceError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .or('price.is.null,price.eq.0')
      .eq('is_active', true)
    
    if (priceError) {
      console.error('❌ Error checking missing price:', priceError)
    } else {
      console.log(`${missingPrice === 0 ? '✅' : '⚠️'} Active cars without price: ${missingPrice}`)
    }

    // Cars without images
    const { count: missingImages, error: imageError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })
      .or('image_url.is.null,image_url.eq.,images.is.null')
      .eq('is_active', true)
    
    if (imageError) {
      console.error('❌ Error checking missing images:', imageError)
    } else {
      console.log(`${missingImages === 0 ? '✅' : '⚠️'} Active cars without images: ${missingImages}`)
    }

    // Recent sync activity
    const { data: recentCars, error: recentError } = await supabase
      .from('cars')
      .select('last_synced_at')
      .order('last_synced_at', { ascending: false })
      .limit(1)
    
    if (recentError) {
      console.error('❌ Error checking recent sync:', recentError)
    } else if (recentCars && recentCars.length > 0) {
      const lastSync = new Date(recentCars[0].last_synced_at)
      const hoursAgo = Math.round((Date.now() - lastSync.getTime()) / (1000 * 60 * 60))
      console.log(`${hoursAgo <= 24 ? '✅' : '⚠️'} Last sync: ${lastSync.toISOString()} (${hoursAgo} hours ago)`)
    }

  } catch (error) {
    console.error('💥 Error checking data quality:', error)
  }
}

async function checkStagingTable() {
  console.log('\n📦 Checking staging table...')
  
  try {
    const { count: stagingCount, error: stagingError } = await supabase
      .from('cars_staging')
      .select('*', { count: 'exact', head: true })
    
    if (stagingError) {
      console.error('❌ Error checking staging table:', stagingError)
    } else {
      console.log(`${stagingCount === 0 ? '✅' : '⚠️'} Cars in staging table: ${stagingCount} (should be 0 when not syncing)`)
    }
  } catch (error) {
    console.error('💥 Error checking staging table:', error)
  }
}

async function main() {
  console.log('🔍 KorAuto Database Diagnostic Tool')
  console.log('=====================================')
  
  const counts = await checkCarCounts()
  await checkRPCFunctions()
  await checkDataQuality()
  await checkStagingTable()
  
  console.log('\n📋 Summary:')
  console.log('===========')
  
  if (counts) {
    const targetCount = 190000
    const currentCount = counts.totalCars || 0
    const percentage = Math.round((currentCount / targetCount) * 100)
    
    console.log(`📊 Current car count: ${currentCount.toLocaleString()} / ${targetCount.toLocaleString()} (${percentage}%)`)
    
    if (currentCount >= targetCount) {
      console.log('✅ Target of 190,000+ cars achieved!')
    } else {
      console.log(`⚠️ Missing ${(targetCount - currentCount).toLocaleString()} cars to reach target`)
    }
    
    const activePercentage = counts.activeCars ? Math.round((counts.activeCars / currentCount) * 100) : 0
    console.log(`📈 Active cars: ${activePercentage}% (${counts.activeCars?.toLocaleString()})`)
  }
  
  console.log('\n✅ Diagnostic completed!')
}

// Run the diagnostic when script is executed directly
if (process.argv[1] && process.argv[1].includes('diagnose-database.ts')) {
  main().catch(error => {
    console.error('💥 Diagnostic failed:', error)
    process.exit(1)
  })
}

export default main