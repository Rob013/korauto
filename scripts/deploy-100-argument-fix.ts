#!/usr/bin/env tsx

/**
 * Deploy the 100-argument limit fix to Supabase
 * This script tries multiple approaches to deploy the fix
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL environment variable');
  process.exit(1);
}

console.log('🚀 Deploying 100-argument limit fix...\n');
console.log(`🔌 Supabase URL: ${SUPABASE_URL}`);

// Read the migration file
const migrationPath = '/home/runner/work/korauto/korauto/supabase/migrations/20250902081700_fix-100-argument-limit.sql';
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log(`📄 Migration loaded: ${migrationSQL.length} characters\n`);

async function testWithServiceKey(): Promise<boolean> {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('⚠️  No service role key available, skipping service key approach');
    return false;
  }

  console.log('🔑 Trying with service role key...');
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Try to execute the SQL directly using a simple query approach
    const { error } = await serviceClient
      .from('_test_sql_execution')  
      .select('*')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('⚠️  Cannot execute raw SQL with service client');
      return false;
    }

    // If we get here, try to use RPC with the SQL
    console.log('💡 Attempting to create and execute the function...');
    
    // Split the migration into function definition
    const functionMatch = migrationSQL.match(/CREATE OR REPLACE FUNCTION[\s\S]+\$\$;/);
    if (!functionMatch) {
      console.log('❌ Could not parse function definition from migration');
      return false;
    }

    const functionSQL = functionMatch[0];
    console.log('✅ Function definition extracted');
    
    // We can't execute raw SQL, but we can test if the function works
    console.log('🧪 Testing current function...');
    const { data, error: testError } = await serviceClient
      .rpc('map_complete_api_data', {
        api_record: {
          id: '13998958',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          price: '25000'
        }
      });

    if (testError) {
      if (testError.message.includes('cannot pass more than 100 arguments')) {
        console.log('💥 Confirmed: function has the 100-argument limit issue');
        console.log('📋 Manual deployment required via Supabase Dashboard');
        return false;
      } else if (testError.message.includes('does not exist')) {
        console.log('❌ Function does not exist - needs to be created');
        console.log('📋 Manual deployment required via Supabase Dashboard');
        return false;
      } else {
        console.log('⚠️  Function test error:', testError.message);
        return false;
      }
    } else {
      console.log('🎉 Function is working! Fix may already be applied.');
      console.log(`✅ Test result has ${Object.keys(data || {}).length} fields`);
      return true;
    }

  } catch (error) {
    console.log('❌ Service key approach failed:', error);
    return false;
  }
}

async function testWithAnonKey(): Promise<boolean> {
  if (!SUPABASE_ANON_KEY) {
    console.log('⚠️  No anon key available, skipping anon key approach');
    return false;
  }

  console.log('🔑 Trying with anon key...');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    console.log('🧪 Testing function with anon client...');
    const { data, error } = await anonClient
      .rpc('map_complete_api_data', {
        api_record: {
          id: '13998958',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          price: '25000'
        }
      });

    if (error) {
      if (error.message.includes('cannot pass more than 100 arguments')) {
        console.log('💥 Confirmed: function has the 100-argument limit issue');
        return false;
      } else if (error.message.includes('does not exist')) {
        console.log('❌ Function does not exist');
        return false;
      } else {
        console.log('⚠️  Function test error:', error.message);
        return false;
      }
    } else {
      console.log('🎉 Function is working with anon key!');
      console.log(`✅ Test result has ${Object.keys(data || {}).length} fields`);
      return true;
    }

  } catch (error) {
    console.log('❌ Anon key approach failed:', error);
    return false;
  }
}

function printManualInstructions(): void {
  console.log('\n📋 MANUAL DEPLOYMENT INSTRUCTIONS:');
  console.log('');
  console.log('Since automated deployment is not possible, please follow these steps:');
  console.log('');
  console.log('1. 🌐 Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log(`2. 📂 Navigate to project: ${SUPABASE_URL.split('.')[0].split('//')[1]}`);
  console.log('3. 🔧 Go to SQL Editor');
  console.log('4. 📄 Copy the migration file content:');
  console.log(`   ${migrationPath}`);
  console.log('5. 📝 Paste and execute the SQL');
  console.log('6. ✅ Verify the fix works by running test scripts');
  console.log('');
  console.log('Alternative: Use Supabase CLI if available:');
  console.log('   supabase db push');
  console.log('');
  console.log('📄 Migration SQL preview:');
  console.log('─'.repeat(50));
  console.log(migrationSQL.substring(0, 300) + '...');
  console.log('─'.repeat(50));
}

async function main(): Promise<void> {
  console.log('🔍 Testing current state...\n');

  // Try service key first
  const serviceSuccess = await testWithServiceKey();
  if (serviceSuccess) {
    console.log('\n🎉 SUCCESS: Function is already working correctly!');
    console.log('✅ The 100-argument limit fix appears to be already deployed.');
    return;
  }

  // Try anon key
  const anonSuccess = await testWithAnonKey();
  if (anonSuccess) {
    console.log('\n🎉 SUCCESS: Function is already working correctly!');
    console.log('✅ The 100-argument limit fix appears to be already deployed.');
    return;
  }

  // Neither worked, need manual deployment
  console.log('\n❌ AUTOMATED DEPLOYMENT FAILED');
  printManualInstructions();
}

if (process.argv[1] && process.argv[1].includes('deploy-100-argument-fix.ts')) {
  main().catch(console.error);
}

export default main;