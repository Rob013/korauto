import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
    console.log('\n🔍 Testing cache query...');

    const { data, error, count } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .limit(5);

    console.log('Count:', count);
    console.log('Error:', error);
    console.log('Data length:', data?.length);

    if (data && data.length > 0) {
        console.log('\n✅ Sample car:');
        console.log('  ID:', data[0].vehicle_id);
        console.log('  Make:', data[0].manufacturer_name);
        console.log('  Model:', data[0].model_name);
        console.log('  Year:', data[0].form_year);
        console.log('  Price:', data[0].buy_now_price);
    }
}

testQuery().catch(console.error);
