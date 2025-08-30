#!/usr/bin/env tsx

/**
 * Sync Recovery Script for KorAuto
 * 
 * This script helps recover from sync issues, specifically when sync stops
 * around page 109,000 or any other page. It provides utilities to:
 * - Check current sync status
 * - Create recovery checkpoints
 * - Resume from specific pages
 * - Validate sync integrity
 * 
 * Usage:
 * - Check status: tsx scripts/sync-recovery.ts status
 * - Create checkpoint: tsx scripts/sync-recovery.ts checkpoint --page 109000
 * - Resume from page: tsx scripts/sync-recovery.ts resume --page 109000
 * - Clear checkpoint: tsx scripts/sync-recovery.ts clear
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs'

// Configuration
const CHECKPOINT_FILE = '/tmp/sync-checkpoint.json'

// Try multiple environment variable names for compatibility
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

let supabase: any = null

function initializeSupabase(): boolean {
  if (!SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL environment variable')
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    return false
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase service key environment variable')
    console.error('Tried: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, VITE_SUPABASE_PUBLISHABLE_KEY')
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    return false
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return true
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error)
    return false
  }
}

interface Checkpoint {
  runId: string
  lastPage: number
  totalProcessed: number
  startTime: number
  lastUpdateTime: number
}

interface SyncStatus {
  hasCheckpoint: boolean
  checkpoint?: Checkpoint
  syncRunning: boolean
  lastSyncStatus?: any
  carCount: number
  stagingCount: number
  issues: string[]
}

async function checkSyncStatus(): Promise<SyncStatus> {
  console.log('🔍 Checking sync status...\n')
  
  if (!initializeSupabase()) {
    console.log('⚠️ Cannot connect to database, checking local state only...\n')
  }
  
  const status: SyncStatus = {
    hasCheckpoint: false,
    syncRunning: false,
    carCount: 0,
    stagingCount: 0,
    issues: []
  }

  // Check for existing checkpoint
  if (existsSync(CHECKPOINT_FILE)) {
    try {
      const data = readFileSync(CHECKPOINT_FILE, 'utf8')
      status.checkpoint = JSON.parse(data)
      status.hasCheckpoint = true
      
      const checkpointAge = Date.now() - status.checkpoint.lastUpdateTime
      const hoursOld = checkpointAge / (1000 * 60 * 60)
      
      console.log(`✅ Found checkpoint:`)
      console.log(`   - Run ID: ${status.checkpoint.runId}`)
      console.log(`   - Last Page: ${status.checkpoint.lastPage.toLocaleString()}`)
      console.log(`   - Total Processed: ${status.checkpoint.totalProcessed.toLocaleString()}`)
      console.log(`   - Age: ${hoursOld.toFixed(1)} hours`)
      console.log(`   - Valid for resume: ${hoursOld < 24 ? '✅ Yes' : '❌ No (too old)'}`)
    } catch (error) {
      status.issues.push(`Failed to read checkpoint: ${error}`)
      console.error('❌ Failed to read checkpoint:', error)
    }
  } else {
    console.log('❌ No checkpoint file found')
  }

  // Check sync status in database
  if (supabase) {
    try {
      const { data: syncData, error: syncError } = await supabase
        .from('sync_status')
        .select('*')
        .eq('id', 'cars-sync-main')
        .single()

      if (syncError) {
        status.issues.push(`Failed to get sync status: ${syncError.message}`)
      } else if (syncData) {
        status.lastSyncStatus = syncData
        status.syncRunning = syncData.status === 'running'
        
        console.log(`\n📊 Database sync status:`)
        console.log(`   - Status: ${syncData.status}`)
        console.log(`   - Current Page: ${syncData.current_page?.toLocaleString() || 'N/A'}`)
        console.log(`   - Records Processed: ${syncData.records_processed?.toLocaleString() || 'N/A'}`)
        console.log(`   - Last Activity: ${syncData.last_activity_at || 'N/A'}`)
        console.log(`   - Error Message: ${syncData.error_message || 'None'}`)
      }
    } catch (error) {
      status.issues.push(`Database sync status check failed: ${error}`)
    }

    // Check car counts
    try {
      const { count: carCount, error: carError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })

      if (carError) {
        status.issues.push(`Failed to count cars: ${carError.message}`)
      } else {
        status.carCount = carCount || 0
        console.log(`\n📈 Database counts:`)
        console.log(`   - Cars table: ${status.carCount.toLocaleString()} records`)
      }

      const { count: stagingCount, error: stagingError } = await supabase
        .from('cars_staging')
        .select('*', { count: 'exact', head: true })

      if (stagingError) {
        status.issues.push(`Failed to count staging: ${stagingError.message}`)
      } else {
        status.stagingCount = stagingCount || 0
        console.log(`   - Staging table: ${status.stagingCount.toLocaleString()} records`)
      }
    } catch (error) {
      status.issues.push(`Count check failed: ${error}`)
    }
  }

  // Report issues
  if (status.issues.length > 0) {
    console.log('\n⚠️ Issues detected:')
    status.issues.forEach(issue => console.log(`   - ${issue}`))
  }

  console.log('\n' + '='.repeat(60))
  return status
}

async function createCheckpoint(page: number): Promise<void> {
  console.log(`🔧 Creating checkpoint for page ${page.toLocaleString()}...`)
  
  const checkpoint: Checkpoint = {
    runId: `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lastPage: page - 1, // Set to one page before target so sync starts at the target page
    totalProcessed: Math.max(0, page * 200), // Estimate based on page size
    startTime: Date.now(),
    lastUpdateTime: Date.now()
  }

  try {
    writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
    console.log(`✅ Checkpoint created successfully`)
    console.log(`   - Target resume page: ${page.toLocaleString()}`)
    console.log(`   - Estimated processed: ${checkpoint.totalProcessed.toLocaleString()}`)
    console.log(`   - File: ${CHECKPOINT_FILE}`)
  } catch (error) {
    console.error(`❌ Failed to create checkpoint:`, error)
    process.exit(1)
  }
}

async function clearCheckpoint(): Promise<void> {
  console.log('🧹 Clearing checkpoint...')
  
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      unlinkSync(CHECKPOINT_FILE)
      console.log('✅ Checkpoint cleared successfully')
    } else {
      console.log('❌ No checkpoint file found to clear')
    }
  } catch (error) {
    console.error('❌ Failed to clear checkpoint:', error)
    process.exit(1)
  }
}

async function resumeSync(page?: number): Promise<void> {
  console.log('🚀 Attempting to resume sync...')
  
  if (page) {
    await createCheckpoint(page)
  }
  
  console.log('📞 Calling sync script...')
  
  // Import and run the sync function
  try {
    const syncModule = await import('./sync-cars.js')
    const syncCars = syncModule.default
    
    if (typeof syncCars === 'function') {
      await syncCars()
    } else {
      console.error('❌ Invalid sync function')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Failed to resume sync:', error)
    process.exit(1)
  }
}

// CLI handling
async function main() {
  const command = process.argv[2]
  const pageFlag = process.argv.indexOf('--page')
  const pageValue = pageFlag !== -1 ? parseInt(process.argv[pageFlag + 1]) : undefined

  console.log('🔧 KorAuto Sync Recovery Tool\n')

  switch (command) {
    case 'status':
      await checkSyncStatus()
      break
      
    case 'checkpoint':
      if (!pageValue || isNaN(pageValue)) {
        console.error('❌ Page number required: --page <number>')
        process.exit(1)
      }
      await createCheckpoint(pageValue)
      break
      
    case 'resume':
      await resumeSync(pageValue)
      break
      
    case 'clear':
      await clearCheckpoint()
      break
      
    default:
      console.log('Usage:')
      console.log('  tsx scripts/sync-recovery.ts status          - Check sync status')
      console.log('  tsx scripts/sync-recovery.ts checkpoint --page 109000  - Create checkpoint')
      console.log('  tsx scripts/sync-recovery.ts resume [--page 109000]    - Resume sync')
      console.log('  tsx scripts/sync-recovery.ts clear           - Clear checkpoint')
      console.log('\nExamples:')
      console.log('  tsx scripts/sync-recovery.ts status')
      console.log('  tsx scripts/sync-recovery.ts checkpoint --page 109000')
      console.log('  tsx scripts/sync-recovery.ts resume --page 109000')
      process.exit(0)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
}

export { checkSyncStatus, createCheckpoint, clearCheckpoint, resumeSync }