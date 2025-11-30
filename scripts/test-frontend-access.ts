import { supabase } from '../src/integrations/supabase/client';

async function testFrontendAccess() {
    console.log('🧪 Testing frontend access to encar_cars_cache...\n');

    try {
        // Test 1: Simple count query
        console.log('Test 1: Counting active cars...');
        const { count, error: countError } = await supabase
            .from('encar_cars_cache')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        if (countError) {
            console.error('❌ Count query failed:', countError.message);
            if (countError.message.includes('permission') || countError.message.includes('policy')) {
                console.error('\n⚠️  RLS policy not applied yet! Run the migration SQL.');
            }
            return;
        }

        console.log(`✅ Count successful: ${count} cars\n`);

        // Test 2: Fetch actual data
        console.log('Test 2: Fetching sample cars...');
        const { data, error } = await supabase
            .from('encar_cars_cache')
            .select('vehicle_id, manufacturer_name, model_name, form_year, buy_now_price')
            .eq('is_active', true)
            .limit(3);

        if (error) {
            console.error('❌ Data query failed:', error.message);
            return;
        }

        console.log(`✅ Fetched ${data?.length} cars successfully!\n`);

        if (data && data.length > 0) {
            console.log('Sample cars:');
            data.forEach((car, i) => {
                console.log(`  ${i + 1}. ${car.form_year} ${car.manufacturer_name} ${car.model_name} - ${car.buy_now_price} KRW`);
            });
        }

        console.log('\n✅ Frontend can access cache! Cars should display now.');

    } catch (err: any) {
        console.error('❌ Exception:', err.message);
    }
}

testFrontendAccess();
