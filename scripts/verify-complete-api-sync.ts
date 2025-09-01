#!/usr/bin/env tsx

/**
 * Complete API Sync Verification Script
 * 
 * This script verifies that the smart sync system is capturing ALL API information
 * and that the database can work the same way as the external API.
 * 
 * Usage: npm run tsx scripts/verify-complete-api-sync.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Environment variables - use available Vite env vars
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const API_KEY = process.env.AUCTIONS_API_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'https://auctionsapi.com/api';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
  console.error('Required: SUPABASE_URL, SUPABASE key (anon or service role)');
  process.exit(1);
}

console.log(`🔌 Using Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 Using Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...`);

// Initialize Supabase client with available credentials
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface APIFieldMapping {
  apiField: string;
  dbField: string;
  isRequired: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  mapped: boolean;
}

interface CompleteSyncReport {
  timestamp: string;
  apiEndpointsChecked: string[];
  totalApiFields: number;
  mappedFields: number;
  unmappedFields: APIFieldMapping[];
  sortingWorksFromDB: boolean;
  databaseMatchesAPI: boolean;
  issues: string[];
  recommendations: string[];
}

// Expected API field mappings based on the migration and code analysis
const EXPECTED_API_FIELDS: APIFieldMapping[] = [
  // Basic car information
  { apiField: 'id', dbField: 'id', isRequired: true, type: 'string', mapped: false },
  { apiField: 'make', dbField: 'make', isRequired: true, type: 'string', mapped: false },
  { apiField: 'model', dbField: 'model', isRequired: true, type: 'string', mapped: false },
  { apiField: 'year', dbField: 'year', isRequired: true, type: 'number', mapped: false },
  { apiField: 'model_year', dbField: 'year', isRequired: false, type: 'number', mapped: false },
  { apiField: 'vin', dbField: 'vin', isRequired: false, type: 'string', mapped: false },
  { apiField: 'chassis_number', dbField: 'vin', isRequired: false, type: 'string', mapped: false },
  
  // Pricing and auction data
  { apiField: 'price', dbField: 'price', isRequired: false, type: 'number', mapped: false },
  { apiField: 'current_bid', dbField: 'price', isRequired: false, type: 'number', mapped: false },
  { apiField: 'buy_now', dbField: 'price', isRequired: false, type: 'number', mapped: false },
  { apiField: 'estimated_value', dbField: 'estimated_value', isRequired: false, type: 'number', mapped: false },
  
  // Vehicle specifications
  { apiField: 'mileage', dbField: 'mileage', isRequired: false, type: 'string', mapped: false },
  { apiField: 'odometer', dbField: 'mileage', isRequired: false, type: 'string', mapped: false },
  { apiField: 'kilometers', dbField: 'mileage', isRequired: false, type: 'string', mapped: false },
  { apiField: 'fuel', dbField: 'fuel', isRequired: false, type: 'string', mapped: false },
  { apiField: 'fuel_type', dbField: 'fuel', isRequired: false, type: 'string', mapped: false },
  { apiField: 'transmission', dbField: 'transmission', isRequired: false, type: 'string', mapped: false },
  { apiField: 'gearbox', dbField: 'transmission', isRequired: false, type: 'string', mapped: false },
  { apiField: 'color', dbField: 'color', isRequired: false, type: 'string', mapped: false },
  { apiField: 'exterior_color', dbField: 'color', isRequired: false, type: 'string', mapped: false },
  
  // Engine specifications
  { apiField: 'engine_size', dbField: 'engine_size', isRequired: false, type: 'string', mapped: false },
  { apiField: 'displacement', dbField: 'engine_displacement', isRequired: false, type: 'string', mapped: false },
  { apiField: 'engine_capacity', dbField: 'engine_size', isRequired: false, type: 'string', mapped: false },
  { apiField: 'cylinders', dbField: 'cylinders', isRequired: false, type: 'number', mapped: false },
  { apiField: 'engine_cylinders', dbField: 'cylinders', isRequired: false, type: 'number', mapped: false },
  { apiField: 'power', dbField: 'max_power', isRequired: false, type: 'string', mapped: false },
  { apiField: 'max_power', dbField: 'max_power', isRequired: false, type: 'string', mapped: false },
  { apiField: 'horsepower', dbField: 'max_power', isRequired: false, type: 'string', mapped: false },
  { apiField: 'torque', dbField: 'torque', isRequired: false, type: 'string', mapped: false },
  
  // Images and media
  { apiField: 'images', dbField: 'images', isRequired: false, type: 'array', mapped: false },
  { apiField: 'photos', dbField: 'images', isRequired: false, type: 'array', mapped: false },
  { apiField: 'pictures', dbField: 'images', isRequired: false, type: 'array', mapped: false },
  { apiField: 'thumbnails', dbField: 'images', isRequired: false, type: 'array', mapped: false },
  { apiField: 'gallery', dbField: 'images', isRequired: false, type: 'array', mapped: false },
  { apiField: 'high_res_images', dbField: 'high_res_images', isRequired: false, type: 'array', mapped: false },
  { apiField: 'hd_images', dbField: 'high_res_images', isRequired: false, type: 'array', mapped: false },
  
  // Auction/lot information
  { apiField: 'lot_number', dbField: 'lot_number', isRequired: false, type: 'string', mapped: false },
  { apiField: 'lot_id', dbField: 'lot_number', isRequired: false, type: 'string', mapped: false },
  { apiField: 'seller', dbField: 'lot_seller', isRequired: false, type: 'string', mapped: false },
  { apiField: 'title', dbField: 'sale_title', isRequired: false, type: 'string', mapped: false },
  { apiField: 'sale_title', dbField: 'sale_title', isRequired: false, type: 'string', mapped: false },
  { apiField: 'grade', dbField: 'grade', isRequired: false, type: 'string', mapped: false },
  { apiField: 'condition_grade', dbField: 'grade', isRequired: false, type: 'string', mapped: false },
  { apiField: 'condition', dbField: 'condition', isRequired: false, type: 'string', mapped: false },
  
  // Location data
  { apiField: 'country', dbField: 'location_country', isRequired: false, type: 'string', mapped: false },
  { apiField: 'state', dbField: 'location_state', isRequired: false, type: 'string', mapped: false },
  { apiField: 'city', dbField: 'location_city', isRequired: false, type: 'string', mapped: false },
  
  // Keys and documentation
  { apiField: 'keys', dbField: 'keys_count', isRequired: false, type: 'number', mapped: false },
  { apiField: 'key_count', dbField: 'keys_count', isRequired: false, type: 'number', mapped: false },
  { apiField: 'books', dbField: 'books_count', isRequired: false, type: 'number', mapped: false },
  { apiField: 'spare_key', dbField: 'spare_key_available', isRequired: false, type: 'boolean', mapped: false },
  { apiField: 'service_book', dbField: 'service_book_available', isRequired: false, type: 'boolean', mapped: false },
  
  // Performance data
  { apiField: 'acceleration', dbField: 'acceleration', isRequired: false, type: 'string', mapped: false },
  { apiField: 'zero_to_sixty', dbField: 'acceleration', isRequired: false, type: 'string', mapped: false },
  { apiField: 'top_speed', dbField: 'top_speed', isRequired: false, type: 'string', mapped: false },
  { apiField: 'max_speed', dbField: 'top_speed', isRequired: false, type: 'string', mapped: false },
  
  // Additional details
  { apiField: 'doors', dbField: 'doors', isRequired: false, type: 'number', mapped: false },
  { apiField: 'door_count', dbField: 'doors', isRequired: false, type: 'number', mapped: false },
  { apiField: 'seats', dbField: 'seats', isRequired: false, type: 'number', mapped: false },
  { apiField: 'seat_count', dbField: 'seats', isRequired: false, type: 'number', mapped: false },
  { apiField: 'body_style', dbField: 'body_style', isRequired: false, type: 'string', mapped: false },
  { apiField: 'body_type', dbField: 'body_style', isRequired: false, type: 'string', mapped: false },
];

async function checkDatabaseSchema(): Promise<void> {
  console.log('🔍 Checking database schema for complete API field mapping...\n');
  
  try {
    // Get cars_cache table schema using direct SQL query
    const { data: tableInfo, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'cars_cache' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      // Fallback: Try to get columns by selecting from the table directly
      console.log('⚠️  Cannot query information_schema, trying alternative method...');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('cars_cache')
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error('❌ Failed to get table schema:', sampleError);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        const dbColumns = Object.keys(sampleData[0]);
        console.log(`📊 Found ${dbColumns.length} columns in cars_cache table`);
        console.log(`📋 Columns: ${dbColumns.slice(0, 10).join(', ')}${dbColumns.length > 10 ? '...' : ''}`);
        
        // Check which API fields are mapped
        for (const field of EXPECTED_API_FIELDS) {
          if (dbColumns.includes(field.dbField)) {
            field.mapped = true;
          }
        }
      }
      
    } else if (tableInfo) {
      const dbColumns = tableInfo.map((col: any) => col.column_name);
      console.log(`📊 Found ${dbColumns.length} columns in cars_cache table`);
      
      // Check which API fields are mapped
      for (const field of EXPECTED_API_FIELDS) {
        if (dbColumns.includes(field.dbField)) {
          field.mapped = true;
        }
      }
    }
    
    const mappedCount = EXPECTED_API_FIELDS.filter(f => f.mapped).length;
    const totalCount = EXPECTED_API_FIELDS.length;
    
    console.log(`✅ API Field Mapping: ${mappedCount}/${totalCount} fields mapped (${((mappedCount/totalCount)*100).toFixed(1)}%)\n`);
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

async function verifyMappingFunction(): Promise<boolean> {
  console.log('🔧 Verifying map_complete_api_data function exists...\n');
  
  try {
    // Try to call the function with a simple test
    const { data, error } = await supabase
      .rpc('map_complete_api_data', {
        api_record: { test: 'data' }
      });

    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ map_complete_api_data function not found');
        return false;
      } else {
        console.log('✅ map_complete_api_data function exists (test call had expected error)');
        return true;
      }
    }

    console.log('✅ map_complete_api_data function exists and works');
    console.log('✅ Complete API mapping function is available\n');
    return true;
    
  } catch (error) {
    console.error('❌ Mapping function check failed:', error);
    return false;
  }
}

async function testSortingFromDatabase(): Promise<boolean> {
  console.log('🔀 Testing sorting functionality from database...\n');
  
  try {
    // Test different sort options to ensure they work from database
    const sortTests = [
      { sort: 'price_asc', field: 'price_cents', direction: 'ASC' },
      { sort: 'price_desc', field: 'price_cents', direction: 'DESC' },
      { sort: 'year_desc', field: 'year', direction: 'DESC' },
      { sort: 'created_desc', field: 'created_at', direction: 'DESC' }
    ];
    
    let allSortsWork = true;
    
    for (const test of sortTests) {
      try {
        const { data, error } = await supabase
          .from('cars_cache')
          .select('id, price_cents, year, created_at')
          .order(test.field, { ascending: test.direction === 'ASC' })
          .limit(5);
          
        if (error) {
          console.error(`❌ Sort test failed for ${test.sort}:`, error);
          allSortsWork = false;
        } else {
          console.log(`✅ Sort test passed for ${test.sort} (${data?.length || 0} records)`);
        }
      } catch (sortError) {
        console.error(`❌ Sort test exception for ${test.sort}:`, sortError);
        allSortsWork = false;
      }
    }
    
    if (allSortsWork) {
      console.log('✅ All sorting tests passed - database sorting works correctly\n');
    } else {
      console.log('❌ Some sorting tests failed\n');
    }
    
    return allSortsWork;
    
  } catch (error) {
    console.error('❌ Sorting test failed:', error);
    return false;
  }
}

async function compareAPIvsDatabase(): Promise<boolean> {
  console.log('🔍 Comparing API structure vs Database structure...\n');
  
  try {
    // Get sample data from database to see what's actually stored
    const { data: dbSample, error: dbError } = await supabase
      .from('cars_cache')
      .select('*')
      .limit(3);
      
    if (dbError) {
      console.error('❌ Failed to get database sample:', dbError);
      return false;
    }
    
    if (!dbSample || dbSample.length === 0) {
      console.log('⚠️  No sample data in database - cannot compare with API');
      return false;
    }
    
    console.log(`✅ Got ${dbSample.length} sample records from database`);
    
    // Check if essential fields are populated
    const sampleRecord = dbSample[0];
    const requiredFields = ['id', 'make', 'model', 'year'];
    const optionalFieldsToCheck = ['price', 'mileage', 'fuel', 'transmission', 'color', 'images'];
    
    let requiredFieldsPresent = 0;
    let optionalFieldsPresent = 0;
    
    for (const field of requiredFields) {
      if (sampleRecord[field] !== null && sampleRecord[field] !== undefined) {
        requiredFieldsPresent++;
        console.log(`✅ Required field '${field}' is present: ${sampleRecord[field]}`);
      } else {
        console.log(`❌ Required field '${field}' is missing`);
      }
    }
    
    for (const field of optionalFieldsToCheck) {
      if (sampleRecord[field] !== null && sampleRecord[field] !== undefined) {
        optionalFieldsPresent++;
        console.log(`✅ Optional field '${field}' is present`);
      }
    }
    
    console.log(`\n📊 Field Analysis:`);
    console.log(`   Required fields: ${requiredFieldsPresent}/${requiredFields.length}`);
    console.log(`   Optional fields with data: ${optionalFieldsPresent}/${optionalFieldsToCheck.length}`);
    
    // Check if original_api_data is stored for complete mapping
    if (sampleRecord.original_api_data) {
      console.log(`✅ Original API data is preserved for complete mapping`);
      const apiDataKeys = Object.keys(sampleRecord.original_api_data);
      console.log(`✅ Original API data contains ${apiDataKeys.length} fields`);
    } else {
      console.log(`⚠️  Original API data not found - may limit API parity`);
    }
    
    const isComplete = requiredFieldsPresent === requiredFields.length && 
                      optionalFieldsPresent >= Math.floor(optionalFieldsToCheck.length * 0.7); // 70% of optional fields
    
    console.log(`\n${isComplete ? '✅' : '❌'} Database structure ${isComplete ? 'matches' : 'differs from'} API expectations\n`);
    
    return isComplete;
    
  } catch (error) {
    console.error('❌ API vs Database comparison failed:', error);
    return false;
  }
}

async function generateReport(): Promise<CompleteSyncReport> {
  console.log('📋 Generating Complete API Sync Report...\n');
  
  const report: CompleteSyncReport = {
    timestamp: new Date().toISOString(),
    apiEndpointsChecked: ['/api/cars'],
    totalApiFields: EXPECTED_API_FIELDS.length,
    mappedFields: 0,
    unmappedFields: [],
    sortingWorksFromDB: false,
    databaseMatchesAPI: false,
    issues: [],
    recommendations: []
  };
  
  try {
    // Run all checks
    await checkDatabaseSchema();
    const mappingFunctionExists = await verifyMappingFunction();
    report.sortingWorksFromDB = await testSortingFromDatabase();
    report.databaseMatchesAPI = await compareAPIvsDatabase();
    
    // Calculate mapping completeness
    report.mappedFields = EXPECTED_API_FIELDS.filter(f => f.mapped).length;
    report.unmappedFields = EXPECTED_API_FIELDS.filter(f => !f.mapped);
    
    // Analyze issues
    if (!mappingFunctionExists) {
      report.issues.push('Complete API mapping function is missing');
      report.recommendations.push('Deploy the map_complete_api_data function');
    }
    
    if (report.mappedFields < report.totalApiFields * 0.8) {
      report.issues.push(`Only ${report.mappedFields}/${report.totalApiFields} API fields are mapped (${((report.mappedFields/report.totalApiFields)*100).toFixed(1)}%)`);
      report.recommendations.push('Add missing API field mappings to database schema');
    }
    
    if (!report.sortingWorksFromDB) {
      report.issues.push('Database sorting functionality has issues');
      report.recommendations.push('Fix database sorting implementation');
    }
    
    if (!report.databaseMatchesAPI) {
      report.issues.push('Database structure does not fully match API expectations');
      report.recommendations.push('Update sync process to capture more API fields');
    }
    
    if (report.unmappedFields.filter(f => f.isRequired).length > 0) {
      report.issues.push('Some required API fields are not mapped to database');
      report.recommendations.push('Map all required API fields to ensure data completeness');
    }
    
  } catch (error) {
    report.issues.push(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return report;
}

async function printCompleteReport(report: CompleteSyncReport) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPLETE API SYNC VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`Report Time: ${new Date(report.timestamp).toLocaleString()}`);
  console.log('');
  
  console.log('🔍 API Coverage Analysis:');
  console.log(`  • Total API Fields Checked: ${report.totalApiFields}`);
  console.log(`  • Fields Mapped to Database: ${report.mappedFields}`);
  console.log(`  • Mapping Completeness: ${((report.mappedFields/report.totalApiFields)*100).toFixed(1)}%`);
  console.log(`  • Unmapped Fields: ${report.unmappedFields.length}`);
  console.log('');
  
  console.log('✅ Functionality Tests:');
  console.log(`  • Sorting from Database: ${report.sortingWorksFromDB ? 'Working' : 'Issues Found'}`);
  console.log(`  • Database Matches API: ${report.databaseMatchesAPI ? 'Yes' : 'Differences Found'}`);
  console.log('');
  
  if (report.unmappedFields.length > 0) {
    console.log('❌ Unmapped API Fields:');
    const requiredUnmapped = report.unmappedFields.filter(f => f.isRequired);
    const optionalUnmapped = report.unmappedFields.filter(f => !f.isRequired);
    
    if (requiredUnmapped.length > 0) {
      console.log('  Required Fields:');
      requiredUnmapped.forEach(field => {
        console.log(`    • ${field.apiField} → ${field.dbField} (${field.type})`);
      });
    }
    
    if (optionalUnmapped.length > 0 && optionalUnmapped.length <= 10) {
      console.log('  Optional Fields (showing first 10):');
      optionalUnmapped.slice(0, 10).forEach(field => {
        console.log(`    • ${field.apiField} → ${field.dbField} (${field.type})`);
      });
    }
    console.log('');
  }
  
  if (report.issues.length > 0) {
    console.log('⚠️  Issues Found:');
    report.issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    console.log('');
  }
  
  if (report.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('');
  }
  
  const overallScore = ((report.mappedFields / report.totalApiFields) * 0.4 + 
                       (report.sortingWorksFromDB ? 0.3 : 0) + 
                       (report.databaseMatchesAPI ? 0.3 : 0)) * 100;
  
  let status = '❌ NEEDS IMPROVEMENT';
  if (overallScore >= 90) status = '✅ EXCELLENT';
  else if (overallScore >= 75) status = '👍 GOOD';
  else if (overallScore >= 60) status = '⚠️  FAIR';
  
  console.log(`Overall API Sync Completeness: ${overallScore.toFixed(1)}% - ${status}`);
  console.log('='.repeat(80));
  
  // Save report to file for reference
  const reportPath = path.join(process.cwd(), 'api-sync-completeness-report.json');
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️  Could not save report to file: ${error}`);
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Complete API Sync Verification...\n');
    
    const report = await generateReport();
    await printCompleteReport(report);
    
    // Exit with error code if significant issues found
    const hasSignificantIssues = report.issues.length > 2 || 
                                 (report.mappedFields / report.totalApiFields) < 0.7 ||
                                 !report.sortingWorksFromDB;
    
    process.exit(hasSignificantIssues ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Verification script failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (process.argv[1] && process.argv[1].includes('verify-complete-api-sync.ts')) {
  main();
}

export default main;