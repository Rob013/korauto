#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!, 
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function checkOriginalData() {
  const { data, error } = await supabase
    .from('cars_cache')
    .select('id, original_api_data, sync_metadata')
    .limit(1);
    
  if (error) {
    console.log('❌ Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    const record = data[0];
    console.log('✅ Sample record ID:', record.id);
    console.log('📋 Has original_api_data:', !!record.original_api_data);
    console.log('📋 Has sync_metadata:', !!record.sync_metadata);
    
    if (record.original_api_data) {
      const apiKeys = Object.keys(record.original_api_data);
      console.log('🔍 Original API data keys count:', apiKeys.length);
      console.log('🔑 Sample API keys:', apiKeys.slice(0, 10));
    }
    
    if (record.sync_metadata) {
      console.log('📊 Sync metadata:', record.sync_metadata);
    }
  } else {
    console.log('⚠️  No records found in cars_cache');
  }
}

checkOriginalData();