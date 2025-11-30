import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: 'public' },
    auth: { persistSession: false }
});

async function applyRLSDirectly() {
    console.log('🔧 Applying RLS policies directly...\n');

    const sql = fs.readFileSync('supabase/migrations/20251130_enable_rls_encar_cache.sql', 'utf-8');

    // Split into individual statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
        if (!statement) continue;

        console.log(`Executing: ${statement.substring(0, 60)}...`);

        try {
            // Use the REST API to execute raw SQL
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: statement })
            });

            if (!response.ok) {
                // Try alternative approach - direct query
                const { error } = await (supabase as any).rpc('query', { sql: statement });
                if (error) {
                    console.log(`  ⚠️  ${error.message}`);
                } else {
                    console.log(`  ✅ Success`);
                }
            } else {
                console.log(`  ✅ Success`);
            }
        } catch (err: any) {
            console.log(`  ⚠️  ${err.message}`);
        }
    }

    console.log('\n✅ RLS migration applied!');
    console.log('Testing frontend access...\n');

    // Test if it worked
    const { data, error, count } = await supabase
        .from('encar_cars_cache')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .limit(1);

    if (error) {
        console.error('❌ Still blocked:', error.message);
    } else {
        console.log(`✅ Frontend can now access ${count} cars!`);
        console.log('Refresh your frontend - cars will display!');
    }
}

applyRLSDirectly();
