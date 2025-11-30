/**
 * Quick script to check cache status
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkStatus() {
    // Check last sync
    const { data: lastSync } = await supabase
        .from('encar_sync_status')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(1)
        .single();

    console.log('\n📊 Last Sync Status:');
    console.log(`   Status: ${lastSync?.status}`);
    console.log(`   Started: ${lastSync?.sync_started_at}`);
    console.log(`   Completed: ${lastSync?.sync_completed_at || 'Still running...'}`);
    console.log(`   Cars Processed: ${lastSync?.cars_processed || 0}`);
    console.log(`   Cars Added: ${lastSync?.cars_added || 0}`);
    console.log(`   Cars Updated: ${lastSync?.cars_updated || 0}`);
    console.log(`   Duration: ${lastSync?.duration_seconds || 0}s`);

    // Check total cars in cache
    const { count } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    console.log(`\n📦 Total Active Cars in Cache: ${count || 0}`);

    // Check by manufacturer
    const { data: topManufacturers } = await supabase
        .from('encar_cars_cache')
        .select('manufacturer_name')
        .eq('is_active', true);

    if (topManufacturers) {
        const manufacturerCounts = topManufacturers.reduce((acc: any, car: any) => {
            acc[car.manufacturer_name] = (acc[car.manufacturer_name] || 0) + 1;
            return acc;
        }, {});

        const sorted = Object.entries(manufacturerCounts)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 10);

        console.log('\n🚗 Top 10 Manufacturers:');
        sorted.forEach(([name, count]) => {
            console.log(`   ${name}: ${count} cars`);
        });
    }
}

checkStatus().then(() => process.exit(0)).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
