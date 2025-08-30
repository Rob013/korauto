#!/usr/bin/env tsx

/**
 * Performance Monitor for Car Sync Operations
 * 
 * This script monitors sync performance in real-time and identifies bottlenecks
 * to help achieve the 20-30 minute sync target.
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface SyncMetrics {
  timestamp: string;
  status: string;
  startTime: string | null;
  recordsProcessed: number;
  currentPage: number;
  totalPages: number;
  runningTimeMinutes: number;
  estimatedRemainingMinutes: number;
  pagesPerMinute: number;
  recordsPerMinute: number;
  isOnTrackFor30Min: boolean;
}

async function getSyncMetrics(): Promise<SyncMetrics | null> {
  try {
    const { data: syncStatus, error } = await supabase
      .from('sync_status')
      .select('*')
      .eq('id', 'cars-sync-main')
      .single();

    if (error || !syncStatus) {
      return null;
    }

    const now = new Date();
    const startTime = syncStatus.started_at ? new Date(syncStatus.started_at) : null;
    const runningTimeMinutes = startTime ? (now.getTime() - startTime.getTime()) / (1000 * 60) : 0;
    
    const recordsProcessed = syncStatus.records_processed || 0;
    const currentPage = syncStatus.current_page || 0;
    const totalPages = syncStatus.total_pages || 1;
    
    const pagesPerMinute = runningTimeMinutes > 0 ? currentPage / runningTimeMinutes : 0;
    const recordsPerMinute = runningTimeMinutes > 0 ? recordsProcessed / runningTimeMinutes : 0;
    
    const remainingPages = Math.max(0, totalPages - currentPage);
    const estimatedRemainingMinutes = pagesPerMinute > 0 ? remainingPages / pagesPerMinute : 0;
    const estimatedTotalMinutes = runningTimeMinutes + estimatedRemainingMinutes;
    
    const isOnTrackFor30Min = estimatedTotalMinutes <= 30;

    return {
      timestamp: now.toISOString(),
      status: syncStatus.status,
      startTime: syncStatus.started_at,
      recordsProcessed,
      currentPage,
      totalPages,
      runningTimeMinutes,
      estimatedRemainingMinutes,
      pagesPerMinute,
      recordsPerMinute,
      isOnTrackFor30Min
    };
  } catch (error) {
    console.error('Failed to get sync metrics:', error);
    return null;
  }
}

async function analyzeBottlenecks(metrics: SyncMetrics): Promise<string[]> {
  const bottlenecks: string[] = [];
  
  // Check if sync is too slow
  if (metrics.pagesPerMinute < 60 && metrics.runningTimeMinutes > 5) {
    bottlenecks.push(`🐌 Pages/min too slow: ${metrics.pagesPerMinute.toFixed(1)} (target: ≥60 for 30min completion)`);
  }
  
  // Check if stuck
  if (metrics.status === 'running' && metrics.runningTimeMinutes > 35) {
    bottlenecks.push(`⏰ Sync exceeding timeout: ${metrics.runningTimeMinutes.toFixed(1)} minutes (limit: 35min)`);
  }
  
  // Check if estimated time is too long
  if (!metrics.isOnTrackFor30Min && metrics.runningTimeMinutes > 5) {
    const estimatedTotal = metrics.runningTimeMinutes + metrics.estimatedRemainingMinutes;
    bottlenecks.push(`📈 Estimated total time: ${estimatedTotal.toFixed(1)} minutes (target: 20-30min)`);
  }
  
  // Check record processing rate
  if (metrics.recordsPerMinute < 2000 && metrics.runningTimeMinutes > 5) {
    bottlenecks.push(`📊 Records/min too slow: ${metrics.recordsPerMinute.toFixed(0)} (target: ≥2000)`);
  }

  return bottlenecks;
}

async function suggestOptimizations(metrics: SyncMetrics): Promise<string[]> {
  const suggestions: string[] = [];
  
  if (metrics.pagesPerMinute < 60) {
    suggestions.push('💡 Increase CONCURRENCY (current: check env) - try CONCURRENCY=25');
    suggestions.push('💡 Increase RPS (current: check env) - try RPS=40 if API allows');
    suggestions.push('💡 Increase PAGE_SIZE for fewer requests - try PAGE_SIZE=250');
  }
  
  if (metrics.recordsPerMinute < 2000) {
    suggestions.push('💡 Increase BATCH_SIZE for faster DB writes - try BATCH_SIZE=750');
    suggestions.push('💡 Increase PARALLEL_BATCHES - try PARALLEL_BATCHES=10');
  }
  
  // Check staging table size (if too many records, might slow down)
  try {
    const { count: stagingCount } = await supabase
      .from('cars_staging')
      .select('*', { count: 'exact', head: true });
    
    if (stagingCount && stagingCount > 50000) {
      suggestions.push('💡 Large staging table detected - consider more frequent batch processing');
    }
  } catch (error) {
    // Ignore staging table check errors
  }
  
  return suggestions;
}

async function monitorSync() {
  console.log('🔍 Starting Sync Performance Monitor...');
  console.log('📊 Target: Complete sync in 20-30 minutes');
  console.log('⏱️  Monitoring interval: 30 seconds\n');
  
  let monitoringCount = 0;
  
  const monitor = setInterval(async () => {
    monitoringCount++;
    
    const metrics = await getSyncMetrics();
    
    if (!metrics) {
      console.log(`[${new Date().toTimeString().slice(0, 8)}] ⚫ No active sync detected`);
      return;
    }
    
    const statusEmoji = metrics.status === 'running' ? '🟢' : 
                       metrics.status === 'completed' ? '✅' : 
                       metrics.status === 'failed' ? '❌' : '🟡';
    
    const trackingEmoji = metrics.isOnTrackFor30Min ? '🎯' : '⚠️';
    
    console.log(`\n[${new Date().toTimeString().slice(0, 8)}] ${statusEmoji} Sync Status: ${metrics.status.toUpperCase()}`);
    console.log(`${trackingEmoji} Progress: ${metrics.currentPage}/${metrics.totalPages} pages (${((metrics.currentPage/metrics.totalPages)*100).toFixed(1)}%)`);
    console.log(`⏱️  Runtime: ${metrics.runningTimeMinutes.toFixed(1)} min, ETA: ${metrics.estimatedRemainingMinutes.toFixed(1)} min (Total: ${(metrics.runningTimeMinutes + metrics.estimatedRemainingMinutes).toFixed(1)} min)`);
    console.log(`📈 Performance: ${metrics.pagesPerMinute.toFixed(1)} pages/min, ${metrics.recordsPerMinute.toFixed(0)} records/min`);
    console.log(`📊 Records: ${metrics.recordsProcessed.toLocaleString()} processed`);
    
    // Analyze bottlenecks
    const bottlenecks = await analyzeBottlenecks(metrics);
    if (bottlenecks.length > 0) {
      console.log('⚠️  BOTTLENECKS DETECTED:');
      bottlenecks.forEach(bottleneck => console.log(`   ${bottleneck}`));
      
      // Show optimization suggestions
      const suggestions = await suggestOptimizations(metrics);
      if (suggestions.length > 0) {
        console.log('💡 OPTIMIZATION SUGGESTIONS:');
        suggestions.forEach(suggestion => console.log(`   ${suggestion}`));
      }
    }
    
    // Stop monitoring if sync is complete or failed
    if (metrics.status !== 'running') {
      console.log(`\n🏁 Sync ${metrics.status}. Stopping monitor.`);
      clearInterval(monitor);
      
      if (metrics.status === 'completed') {
        const totalTime = metrics.runningTimeMinutes;
        if (totalTime <= 30) {
          console.log(`🎉 SUCCESS: Sync completed in ${totalTime.toFixed(1)} minutes (within 20-30 min target)!`);
        } else {
          console.log(`⚠️  SLOW: Sync took ${totalTime.toFixed(1)} minutes (target: 20-30 min)`);
        }
      }
    }
    
    // Auto-stop after 60 monitoring cycles (30 minutes)
    if (monitoringCount >= 60) {
      console.log('\n⏰ Monitoring time limit reached (30 minutes). Stopping monitor.');
      clearInterval(monitor);
    }
    
  }, 30000); // Monitor every 30 seconds
}

// Handle ctrl+c gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Monitoring stopped by user');
  process.exit(0);
});

// Start monitoring
monitorSync().catch(error => {
  console.error('💥 Monitor failed:', error);
  process.exit(1);
});