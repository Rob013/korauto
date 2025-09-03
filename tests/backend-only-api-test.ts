#!/usr/bin/env tsx

/**
 * Backend-only Architecture Test Script
 * Tests the new cars-cache based API endpoints and admin functions
 */

import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qtyyiqimkysmjnaocswe.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

async function runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const data = await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ ${name} - ${duration}ms`);
    return { name, success: true, duration, data };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${name} - ${duration}ms - ${error.message}`);
    return { name, success: false, duration, error: error.message };
  }
}

async function testHealthEndpoint(): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (data.status !== 'healthy') {
    throw new Error(`System not healthy: ${JSON.stringify(data)}`);
  }
  return data;
}

async function testSyncStatusEndpoint(): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-api/sync-status`);
  if (!response.ok) {
    throw new Error(`Sync status failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function testCarsApiBasic(): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/cars-api?page=1&pageSize=10&sort=price_asc`);
  if (!response.ok) {
    throw new Error(`Cars API failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  
  // Validate new response format
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error('Response missing items array');
  }
  if (typeof data.total !== 'number') {
    throw new Error('Response missing total count');
  }
  if (typeof data.page !== 'number') {
    throw new Error('Response missing page number');
  }
  if (typeof data.pageSize !== 'number') {
    throw new Error('Response missing pageSize');
  }
  if (typeof data.totalPages !== 'number') {
    throw new Error('Response missing totalPages');
  }
  if (typeof data.hasPrev !== 'boolean') {
    throw new Error('Response missing hasPrev');
  }
  if (typeof data.hasNext !== 'boolean') {
    throw new Error('Response missing hasNext');
  }
  if (!data.facets) {
    throw new Error('Response missing facets');
  }
  
  return data;
}

async function testCarsApiWithFilters(): Promise<any> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/cars-api?page=1&pageSize=5&sort=price_desc&make=Toyota&yearMin=2020`);
  if (!response.ok) {
    throw new Error(`Cars API with filters failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function testCarsApiSorting(): Promise<any> {
  // Test different sort options
  const sortOptions = ['price_asc', 'price_desc', 'year_desc', 'year_asc'];
  const results = [];
  
  for (const sort of sortOptions) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cars-api?page=1&pageSize=3&sort=${sort}`);
    if (!response.ok) {
      throw new Error(`Cars API sorting failed for ${sort}: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    results.push({ sort, count: data.items.length, first_item: data.items[0] });
  }
  
  return results;
}

async function testCarsApiPerformance(): Promise<any> {
  const startTime = Date.now();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/cars-api?page=1&pageSize=24&sort=price_asc`);
  const duration = Date.now() - startTime;
  
  if (!response.ok) {
    throw new Error(`Performance test failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Check if it meets the P95 <300ms target
  const meetsTarget = duration < 300;
  
  return { 
    duration, 
    target: 300, 
    meetsTarget, 
    itemCount: data.items.length,
    cacheControl: response.headers.get('Cache-Control')
  };
}

async function testCarsApiPagination(): Promise<any> {
  // Test pagination consistency
  const page1Response = await fetch(`${SUPABASE_URL}/functions/v1/cars-api?page=1&pageSize=5&sort=price_asc`);
  const page2Response = await fetch(`${SUPABASE_URL}/functions/v1/cars-api?page=2&pageSize=5&sort=price_asc`);
  
  if (!page1Response.ok || !page2Response.ok) {
    throw new Error('Pagination test failed');
  }
  
  const page1Data = await page1Response.json();
  const page2Data = await page2Response.json();
  
  // Validate pagination data
  if (page1Data.page !== 1 || page2Data.page !== 2) {
    throw new Error('Page numbers incorrect');
  }
  
  if (page1Data.total !== page2Data.total) {
    throw new Error('Total count inconsistent between pages');
  }
  
  // Check that no items overlap
  const page1Ids = new Set(page1Data.items.map(item => item.id));
  const page2Ids = new Set(page2Data.items.map(item => item.id));
  const overlap = [...page1Ids].filter(id => page2Ids.has(id));
  
  if (overlap.length > 0) {
    throw new Error(`Page overlap detected: ${overlap.length} duplicate items`);
  }
  
  return {
    page1Count: page1Data.items.length,
    page2Count: page2Data.items.length,
    totalCount: page1Data.total,
    totalPages: page1Data.totalPages,
    page1HasNext: page1Data.hasNext,
    page2HasPrev: page2Data.hasPrev
  };
}

async function main() {
  console.log('🚀 Starting Backend-only Architecture Tests\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthEndpoint },
    { name: 'Sync Status', fn: testSyncStatusEndpoint },
    { name: 'Cars API - Basic Response Format', fn: testCarsApiBasic },
    { name: 'Cars API - Filters', fn: testCarsApiWithFilters },
    { name: 'Cars API - Sorting Options', fn: testCarsApiSorting },
    { name: 'Cars API - Performance (P95 <300ms)', fn: testCarsApiPerformance },
    { name: 'Cars API - Pagination Consistency', fn: testCarsApiPagination },
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ Passed: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  // Performance analysis
  const performanceResult = results.find(r => r.name.includes('Performance'));
  if (performanceResult && performanceResult.success) {
    const { duration, target, meetsTarget } = performanceResult.data;
    console.log(`\n⚡ Performance Analysis:`);
    console.log(`   Response Time: ${duration}ms`);
    console.log(`   Target: <${target}ms`);
    console.log(`   Status: ${meetsTarget ? '✅ Meets Target' : '❌ Exceeds Target'}`);
  }
  
  // Failed tests details
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`   ${test.name}: ${test.error}`);
    });
  }
  
  // Exit with appropriate code
  process.exit(failedTests.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}