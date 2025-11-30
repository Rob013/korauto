import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function enableRLS() {
    console.log('🔧 Applying RLS policies to encar_cars_cache...\n');

    try {
        // Enable RLS
        const { error: rlsError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.encar_cars_cache ENABLE ROW LEVEL SECURITY;'
        });

        if (rlsError && !rlsError.message.includes('already enabled')) {
            console.error('❌ Error enabling RLS:', rlsError);
        } else {
            console.log('✅ RLS enabled');
        }

        // Create policy for anonymous users
        const { error: policyError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE POLICY IF NOT EXISTS "Allow anonymous read access" 
                ON public.encar_cars_cache 
                FOR SELECT 
                TO anon 
                USING (true);
            `
        });

        if (policyError) {
            console.error('❌ Error creating policy:', policyError);
        } else {
            console.log('✅ Anonymous read policy created');
        }

        console.log('\n✅ RLS configuration complete! Frontend can now access cache.');

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }
}

enableRLS();
