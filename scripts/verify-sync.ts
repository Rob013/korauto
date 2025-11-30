
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifySync() {
    console.log('🔍 Verifying Encar Cache Sync...');

    // Check sync status
    const { data: syncStatus, error: syncError } = await supabase
        .from('encar_sync_status')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(1);

    if (syncError) {
        console.error('❌ Error fetching sync status:', syncError.message);
    } else if (syncStatus && syncStatus.length > 0) {
        const status = syncStatus[0];
        console.log(`📋 Last Sync Job:`);
        console.log(`   ID: ${status.id}`);
        console.log(`   Status: ${status.status}`);
        console.log(`   Started: ${new Date(status.sync_started_at).toLocaleString()}`);
        console.log(`   Processed: ${status.cars_processed}`);
        console.log(`   Added: ${status.cars_added}`);
        console.log(`   Updated: ${status.cars_updated}`);

        if (status.error_message) {
            console.log(`   ⚠️ Error: ${status.error_message}`);
        }
    } else {
        console.log('⚠️ No sync jobs found in encar_sync_status');
    }

    // Check cache table
    const { count, error: countError } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Error checking cache table:', countError.message);
    } else {
        console.log(`\n📊 Cache Table Stats:`);
        console.log(`   Total Cars: ${count}`);
    }

    // Check active cars
    const { count: activeCount } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    console.log(`   Active Cars: ${activeCount}`);

    // Check recent updates
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact', head: true })
        .gt('synced_at', oneHourAgo);

    console.log(`   Synced in last hour: ${recentCount}`);

    if (count && count > 0) {
        console.log('\n✅ Verification Successful: Data exists in cache table');
    } else {
        console.log('\n⚠️ Verification Warning: Cache table is empty');
    }
}

verifySync().catch(console.error);
