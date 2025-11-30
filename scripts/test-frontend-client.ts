import { supabase } from '../src/integrations/supabase/client';

async function testFrontendQuery() {
    console.log('🔍 Testing frontend Supabase query...');
    console.log('Using hardcoded client from src/integrations/supabase/client.ts\n');

    try {
        const { data, error, count } = await supabase
            .from('encar_cars_cache')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .limit(5);

        console.log('✅ Query executed');
        console.log('Count:', count);
        console.log('Error:', error);
        console.log('Data length:', data?.length);

        if (error) {
            console.error('\n❌ Error details:', error);
            if (error.message.includes('permission') || error.message.includes('policy')) {
                console.error('\n⚠️  This looks like a Row Level Security (RLS) issue!');
                console.error('The table might have RLS enabled without a policy for anonymous users.');
            }
        }

        if (data && data.length > 0) {
            console.log('\n✅ Sample car:');
            console.log('  ID:', data[0].vehicle_id);
            console.log('  Make:', data[0].manufacturer_name);
            console.log('  Model:', data[0].model_name);
        }
    } catch (err) {
        console.error('❌ Exception:', err);
    }
}

testFrontendQuery();
