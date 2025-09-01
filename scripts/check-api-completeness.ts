#!/usr/bin/env tsx

/**
 * API Endpoint Discovery and Sync Completeness Test
 * 
 * This script discovers all available API endpoints and verifies that
 * the sync system is capturing data from all of them.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!, 
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

// Mock API discovery - in real implementation, this would query the actual API
const POTENTIAL_API_ENDPOINTS = [
  '/api/cars',
  '/api/cars/featured',
  '/api/cars/recent',
  '/api/cars/sold',
  '/api/auctions',
  '/api/auctions/live',
  '/api/auctions/upcoming',
  '/api/manufacturers',
  '/api/models',
  '/api/categories',
  '/api/locations',
  '/api/stats'
];

interface EndpointAnalysis {
  endpoint: string;
  isBeingSynced: boolean;
  hasData: boolean;
  estimatedRecords: number;
  lastSync?: string;
  syncStatus: 'complete' | 'partial' | 'missing' | 'unknown';
}

async function analyzeAPIEndpoints(): Promise<EndpointAnalysis[]> {
  console.log('🔍 Analyzing API endpoint coverage...\n');
  
  const analyses: EndpointAnalysis[] = [];
  
  for (const endpoint of POTENTIAL_API_ENDPOINTS) {
    const analysis: EndpointAnalysis = {
      endpoint,
      isBeingSynced: false,
      hasData: false,
      estimatedRecords: 0,
      syncStatus: 'unknown'
    };
    
    try {
      // Check if this endpoint's data is being synced based on database content
      if (endpoint === '/api/cars') {
        // Main cars endpoint - check cars_cache table
        const { count, error } = await supabase
          .from('cars_cache')
          .select('*', { count: 'exact', head: true });
          
        if (!error && count !== null) {
          analysis.isBeingSynced = true;
          analysis.hasData = count > 0;
          analysis.estimatedRecords = count;
          analysis.syncStatus = count > 0 ? 'complete' : 'partial';
          
          // Get last sync time
          const { data: recentSync } = await supabase
            .from('cars_cache')
            .select('last_api_sync')
            .order('last_api_sync', { ascending: false })
            .limit(1);
            
          if (recentSync && recentSync.length > 0) {
            analysis.lastSync = recentSync[0].last_api_sync;
          }
        }
        
      } else if (endpoint.includes('manufacturers')) {
        // Check if manufacturer data is being captured
        const { data, error } = await supabase
          .from('cars_cache')
          .select('make')
          .not('make', 'is', null)
          .not('make', 'eq', '')
          .limit(1);
          
        analysis.isBeingSynced = !error && data && data.length > 0;
        analysis.hasData = analysis.isBeingSynced;
        analysis.syncStatus = analysis.isBeingSynced ? 'complete' : 'missing';
        
      } else if (endpoint.includes('models')) {
        // Check if model data is being captured
        const { data, error } = await supabase
          .from('cars_cache')
          .select('model')
          .not('model', 'is', null)
          .not('model', 'eq', '')
          .limit(1);
          
        analysis.isBeingSynced = !error && data && data.length > 0;
        analysis.hasData = analysis.isBeingSynced;
        analysis.syncStatus = analysis.isBeingSynced ? 'complete' : 'missing';
        
      } else {
        // For other endpoints, check if dedicated tables exist or if data is embedded
        analysis.syncStatus = 'unknown';
      }
      
    } catch (error) {
      console.error(`❌ Error analyzing ${endpoint}:`, error);
      analysis.syncStatus = 'unknown';
    }
    
    analyses.push(analysis);
  }
  
  return analyses;
}

async function generateAPICompleteness(): Promise<void> {
  console.log('📊 Generating API Completeness Report...\n');
  
  const analyses = await analyzeAPIEndpoints();
  
  console.log('================================================================================');
  console.log('📡 API ENDPOINT SYNC COMPLETENESS REPORT');
  console.log('================================================================================\n');
  
  const syncedEndpoints = analyses.filter(a => a.isBeingSynced);
  const unsyncedEndpoints = analyses.filter(a => !a.isBeingSynced);
  
  console.log('✅ Synced Endpoints:');
  syncedEndpoints.forEach(analysis => {
    const status = analysis.syncStatus === 'complete' ? '✅' : 
                  analysis.syncStatus === 'partial' ? '⚠️' : '❌';
    console.log(`  ${status} ${analysis.endpoint}`);
    console.log(`     Records: ${analysis.estimatedRecords.toLocaleString()}`);
    if (analysis.lastSync) {
      const lastSyncDate = new Date(analysis.lastSync);
      const hoursAgo = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);
      console.log(`     Last sync: ${hoursAgo.toFixed(1)} hours ago`);
    }
    console.log('');
  });
  
  if (unsyncedEndpoints.length > 0) {
    console.log('❌ Missing/Unsynced Endpoints:');
    unsyncedEndpoints.forEach(analysis => {
      console.log(`  ❌ ${analysis.endpoint} (${analysis.syncStatus})`);
    });
    console.log('');
  }
  
  // Calculate completeness score
  const totalEndpoints = analyses.length;
  const completeEndpoints = analyses.filter(a => a.syncStatus === 'complete').length;
  const partialEndpoints = analyses.filter(a => a.syncStatus === 'partial').length;
  
  const completenessScore = ((completeEndpoints + partialEndpoints * 0.5) / totalEndpoints) * 100;
  
  console.log('📈 Summary:');
  console.log(`  Total API Endpoints: ${totalEndpoints}`);
  console.log(`  Fully Synced: ${completeEndpoints}`);
  console.log(`  Partially Synced: ${partialEndpoints}`);
  console.log(`  Not Synced: ${totalEndpoints - completeEndpoints - partialEndpoints}`);
  console.log(`  Completeness Score: ${completenessScore.toFixed(1)}%`);
  console.log('');
  
  // Recommendations
  console.log('💡 Recommendations:');
  
  if (completenessScore < 80) {
    console.log('  • Implement sync for missing API endpoints');
    console.log('  • Consider if all endpoints are needed for the application');
  }
  
  const mainCarsEndpoint = analyses.find(a => a.endpoint === '/api/cars');
  if (mainCarsEndpoint && mainCarsEndpoint.syncStatus !== 'complete') {
    console.log('  • Fix main cars endpoint sync - this is critical');
  }
  
  if (unsyncedEndpoints.some(a => a.endpoint.includes('manufacturers') || a.endpoint.includes('models'))) {
    console.log('  • Ensure manufacturer and model data is being captured from car records');
  }
  
  console.log('  • Consider implementing incremental sync for live/recent endpoints');
  console.log('  • Monitor sync frequency to ensure data freshness');
  
  console.log('\n================================================================================');
}

// Main execution
async function main() {
  try {
    await generateAPICompleteness();
    
  } catch (error) {
    console.error('💥 API completeness check failed:', error);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes('check-api-completeness.ts')) {
  main();
}