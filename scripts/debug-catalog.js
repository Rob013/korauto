#!/usr/bin/env node

/**
 * Debug script to test catalog data fetching
 */

import { supabase } from '../src/integrations/supabase/client.ts';

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('cars')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection error:', error);
      return false;
    }
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Total cars in database: ${data || 'unknown'}`);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    return false;
  }
}

async function testCarsQuery() {
  console.log('🚗 Testing cars query...');
  
  try {
    const { data: cars, error } = await supabase
      .from('cars')
      .select('id, make, model, year, price, status, sale_status')
      .limit(5);
    
    if (error) {
      console.error('❌ Cars query error:', error);
      return false;
    }
    
    console.log('✅ Cars query successful');
    console.log(`📋 Sample cars data:`, cars);
    return true;
  } catch (err) {
    console.error('❌ Cars query failed:', err);
    return false;
  }
}

async function testActiveViewQuery() {
  console.log('👁️ Testing active_cars view...');
  
  try {
    const { data: activeCars, error } = await supabase
      .from('active_cars')
      .select('id, make, model, year, price, status, sale_status')
      .limit(5);
    
    if (error) {
      console.error('❌ Active cars query error:', error);
      return false;
    }
    
    console.log('✅ Active cars query successful');
    console.log(`📋 Sample active cars data:`, activeCars);
    return true;
  } catch (err) {
    console.error('❌ Active cars query failed:', err);
    return false;
  }
}

async function testRPCFunctions() {
  console.log('⚙️ Testing RPC functions...');
  
  try {
    // Test the cars_filtered_count function
    const { data: count, error: countError } = await supabase
      .rpc('cars_filtered_count', { p_filters: {} });
    
    if (countError) {
      console.error('❌ RPC cars_filtered_count error:', countError);
      return false;
    }
    
    console.log('✅ RPC cars_filtered_count successful');
    console.log(`📊 Filtered cars count: ${count}`);
    
    // Test the cars_keyset_page function
    const { data: pageData, error: pageError } = await supabase
      .rpc('cars_keyset_page', {
        p_filters: {},
        p_sort_field: 'price_cents',
        p_sort_dir: 'ASC',
        p_cursor_value: null,
        p_cursor_id: null,
        p_limit: 5
      });
    
    if (pageError) {
      console.error('❌ RPC cars_keyset_page error:', pageError);
      return false;
    }
    
    console.log('✅ RPC cars_keyset_page successful');
    console.log(`📋 Sample page data:`, pageData);
    
    return true;
  } catch (err) {
    console.error('❌ RPC functions test failed:', err);
    return false;
  }
}

async function main() {
  console.log('🐛 Starting catalog debug tests...\n');
  
  const results = {
    connection: await testDatabaseConnection(),
    carsQuery: await testCarsQuery(),
    activeView: await testActiveViewQuery(),
    rpcFunctions: await testRPCFunctions()
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('=======================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log(`\n🎯 Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n💡 Troubleshooting tips:');
    console.log('- Check your .env file for correct Supabase credentials');
    console.log('- Verify that the database schema is properly migrated');
    console.log('- Ensure RPC functions are created in the database');
    console.log('- Check if there is actual data in the cars table');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);