#!/usr/bin/env tsx

/**
 * Sync Performance Validation Script
 * 
 * This script validates that the sync system is configured optimally for 20-30 minute completion.
 * It checks configuration, recent performance, and identifies potential issues.
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Sync Performance Validation');
console.log('==============================\n');

// Check configuration
console.log('📋 Configuration Check:');

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '20');
const RPS = parseInt(process.env.RPS || '35');
const PAGE_SIZE = parseInt(process.env.PAGE_SIZE || '200');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500');
const PARALLEL_BATCHES = parseInt(process.env.PARALLEL_BATCHES || '8');

console.log(`   • CONCURRENCY: ${CONCURRENCY} ${CONCURRENCY >= 20 ? '✅' : '⚠️  (recommend ≥20)'}`);
console.log(`   • RPS: ${RPS} ${RPS >= 30 ? '✅' : '⚠️  (recommend ≥30)'}`);
console.log(`   • PAGE_SIZE: ${PAGE_SIZE} ${PAGE_SIZE >= 200 ? '✅' : '⚠️  (recommend ≥200)'}`);
console.log(`   • BATCH_SIZE: ${BATCH_SIZE} ${BATCH_SIZE >= 500 ? '✅' : '⚠️  (recommend ≥500)'}`);
console.log(`   • PARALLEL_BATCHES: ${PARALLEL_BATCHES} ${PARALLEL_BATCHES >= 6 ? '✅' : '⚠️  (recommend ≥6)'}`);

// Check environment variables
console.log('\n🔐 Environment Variables:');
console.log(`   • SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   • SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   • API_BASE_URL: ${process.env.API_BASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   • API_KEY: ${process.env.API_KEY ? '✅ Set' : '❌ Missing'}`);

// Performance targets
console.log('\n🎯 Performance Targets for 30-min completion (200k records):');
const targetPagesPerSec = 1.1; // ~2000 pages in 30 min = 1.1 pages/sec
const targetRecordsPerSec = targetPagesPerSec * PAGE_SIZE;

console.log(`   • Target: ≥${targetPagesPerSec.toFixed(1)} pages/sec`);
console.log(`   • Target: ≥${targetRecordsPerSec.toFixed(0)} records/sec`);
console.log(`   • Max sync time: 30 minutes`);
console.log(`   • Stuck sync threshold: 35 minutes ✅`);

// Calculate theoretical performance
const theoreticalPagesPerSec = Math.min(RPS, CONCURRENCY); // Limited by either RPS or concurrency
const theoreticalRecordsPerSec = theoreticalPagesPerSec * PAGE_SIZE;

console.log('\n📊 Theoretical Performance:');
console.log(`   • Pages/sec: ${theoreticalPagesPerSec.toFixed(1)} ${theoreticalPagesPerSec >= targetPagesPerSec ? '✅' : '❌'}`);
console.log(`   • Records/sec: ${theoreticalRecordsPerSec.toFixed(0)} ${theoreticalRecordsPerSec >= targetRecordsPerSec ? '✅' : '❌'}`);

// Check database connection if credentials available
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('\n🗄️  Database Status:');
  
  (async () => {
    try {
      // Check recent sync history
      const { data: recentSyncs, error } = await supabase
        .from('sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.log(`   ❌ Unable to check sync history: ${error.message}`);
      } else if (recentSyncs && recentSyncs.length > 0) {
        console.log(`   ✅ Found ${recentSyncs.length} recent sync records`);
        
        const completedSyncs = recentSyncs.filter(s => s.status === 'completed' && s.started_at && s.completed_at);
        
        if (completedSyncs.length > 0) {
          console.log('\n📈 Recent Sync Performance:');
          
          completedSyncs.slice(0, 3).forEach((sync, i) => {
            const startTime = new Date(sync.started_at);
            const endTime = new Date(sync.completed_at);
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            const status = durationMinutes <= 30 ? '✅' : '⚠️';
            
            console.log(`   ${status} Sync ${i + 1}: ${durationMinutes.toFixed(1)} minutes, ${sync.records_processed || 0} records`);
          });
        } else {
          console.log('   ⚠️  No completed syncs found in recent history');
        }
      } else {
        console.log('   ⚠️  No sync history found');
      }
      
      // Check current tables
      const [carsResult, stagingResult, cacheResult] = await Promise.all([
        supabase.from('cars').select('*', { count: 'exact', head: true }),
        supabase.from('cars_staging').select('*', { count: 'exact', head: true }),
        supabase.from('cars_cache').select('*', { count: 'exact', head: true })
      ]);
      
      console.log('\n📊 Table Status:');
      console.log(`   • cars: ${carsResult.count || 0} records ${carsResult.error ? `(error: ${carsResult.error.message})` : ''}`);
      console.log(`   • cars_staging: ${stagingResult.count || 0} records ${stagingResult.error ? `(error: ${stagingResult.error.message})` : ''}`);
      console.log(`   • cars_cache: ${cacheResult.count || 0} records ${cacheResult.error ? `(error: ${cacheResult.error.message})` : ''}`);
      
    } catch (error) {
      console.log(`   ❌ Database check failed: ${error}`);
    }
    
    // Summary and recommendations
    console.log('\n🎯 Summary & Recommendations:');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (CONCURRENCY < 20) {
      issues.push('Low concurrency setting');
      recommendations.push('Set CONCURRENCY=25 for better throughput');
    }
    
    if (RPS < 30) {
      issues.push('Low RPS setting');
      recommendations.push('Set RPS=40 if API server can handle it');
    }
    
    if (PAGE_SIZE < 200) {
      issues.push('Small page size');
      recommendations.push('Set PAGE_SIZE=250 for fewer API calls');
    }
    
    if (theoreticalPagesPerSec < targetPagesPerSec) {
      issues.push('Theoretical performance below target');
      recommendations.push('Increase CONCURRENCY and/or RPS settings');
    }
    
    if (issues.length === 0) {
      console.log('   🎉 Configuration looks optimal for 20-30 minute sync target!');
      console.log('   📝 Use "npm run sync-cars:monitor" to track real-time performance');
    } else {
      console.log('   ⚠️  Issues found:');
      issues.forEach(issue => console.log(`      • ${issue}`));
      console.log('   💡 Recommendations:');
      recommendations.forEach(rec => console.log(`      • ${rec}`));
    }
    
    console.log('\n🚀 To run optimized sync:');
    console.log('   CONCURRENCY=25 RPS=40 PAGE_SIZE=250 npm run sync-cars');
    console.log('\n📊 To monitor performance:');
    console.log('   npm run sync-cars:monitor');
    
  })();
} else {
  console.log('\n🗄️  Database Status: ❌ Cannot check (missing credentials)');
  console.log('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to check database status');
}