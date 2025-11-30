
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugCache() {
    console.log('🔍 Debugging Cache Status...');

    // 1. Check total cars in cache
    const { count, error: countError } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('❌ Error counting cars:', countError);
    else console.log(`📊 Total cars in cache: ${count}`);

    // 2. Check active cars
    const { count: activeCount, error: activeError } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    if (activeError) console.error('❌ Error counting active cars:', activeError);
    else console.log(`✅ Active cars in cache: ${activeCount}`);

    // 3. Check last 5 sync jobs
    console.log('\n📝 Last 5 Sync Jobs:');
    const { data: syncs, error: syncError } = await supabase
        .from('encar_sync_status')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(5);

    if (syncError) console.error('❌ Error fetching sync status:', syncError);
    else {
        syncs?.forEach(job => {
            console.log(`  - ID: ${job.id} | Status: ${job.status} | Processed: ${job.cars_processed} | Added: ${job.cars_added} | Time: ${job.sync_started_at}`);
            if (job.error_message) console.log(`    ⚠️ Error: ${job.error_message}`);
        });
    }
}

debugCache();
