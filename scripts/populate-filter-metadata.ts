/**
 * Populate Encar Filter Metadata
 * 
 * This script calculates precise filter counts from the encar_cars_cache table
 * and populates the encar_filter_metadata table for high-performance filtering.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function populateMetadata() {
    console.log('🚀 Starting filter metadata population...');
    const startTime = Date.now();

    try {
        // 1. Clear existing metadata
        console.log('🧹 Clearing existing metadata...');
        const { error: deleteError } = await supabase
            .from('encar_filter_metadata')
            .delete()
            .neq('id', 0); // Delete all

        if (deleteError) throw deleteError;

        // 2. Fetch all active cars (minimal fields)
        console.log('📥 Fetching active cars from cache...');
        const { data: cars, error: fetchError } = await supabase
            .from('encar_cars_cache')
            .select('manufacturer_id, manufacturer_name, model_id, model_name, generation_id, generation_name, fuel_type, transmission, body_type, color_name, form_year')
            .eq('is_active', true);

        if (fetchError) throw fetchError;
        if (!cars || cars.length === 0) {
            console.log('⚠️ No active cars found in cache.');
            return;
        }

        console.log(`📊 Processing ${cars.length} cars...`);

        // 3. Aggregate counts
        const manufacturers = new Map<string, { id: number, name: string, count: number }>();
        const models = new Map<string, { id: number, name: string, manufacturer_id: number, count: number }>();
        const generations = new Map<string, { id: number, name: string, model_id: number, count: number }>();
        const fuels = new Map<string, number>();
        const transmissions = new Map<string, number>();
        const bodyTypes = new Map<string, number>();
        const colors = new Map<string, number>();
        const years = new Map<string, number>();

        cars.forEach(car => {
            // Manufacturer
            if (car.manufacturer_id && car.manufacturer_name) {
                const key = `${car.manufacturer_id}`;
                const existing = manufacturers.get(key) || { id: car.manufacturer_id, name: car.manufacturer_name, count: 0 };
                existing.count++;
                manufacturers.set(key, existing);
            }

            // Model
            if (car.model_id && car.model_name && car.manufacturer_id) {
                const key = `${car.model_id}`;
                const existing = models.get(key) || { id: car.model_id, name: car.model_name, manufacturer_id: car.manufacturer_id, count: 0 };
                existing.count++;
                models.set(key, existing);
            }

            // Generation
            if (car.generation_id && car.generation_name && car.model_id) {
                const key = `${car.generation_id}`;
                const existing = generations.get(key) || { id: car.generation_id, name: car.generation_name, model_id: car.model_id, count: 0 };
                existing.count++;
                generations.set(key, existing);
            }

            // Other filters
            if (car.fuel_type) fuels.set(car.fuel_type, (fuels.get(car.fuel_type) || 0) + 1);
            if (car.transmission) transmissions.set(car.transmission, (transmissions.get(car.transmission) || 0) + 1);
            if (car.body_type) bodyTypes.set(car.body_type, (bodyTypes.get(car.body_type) || 0) + 1);
            if (car.color_name) colors.set(car.color_name, (colors.get(car.color_name) || 0) + 1);
            if (car.form_year) years.set(car.form_year, (years.get(car.form_year) || 0) + 1);
        });

        // 4. Prepare batch inserts
        const metadataRecords = [];

        // Manufacturers
        for (const [_, m] of manufacturers) {
            metadataRecords.push({
                filter_type: 'manufacturer',
                filter_value: JSON.stringify({ id: m.id, name: m.name }),
                car_count: m.count,
                parent_filter: ''
            });
        }

        // Models
        for (const [_, m] of models) {
            metadataRecords.push({
                filter_type: 'model',
                filter_value: JSON.stringify({ id: m.id, name: m.name }),
                car_count: m.count,
                parent_filter: `${m.manufacturer_id}`
            });
        }

        // Generations
        for (const [_, g] of generations) {
            metadataRecords.push({
                filter_type: 'generation',
                filter_value: JSON.stringify({ id: g.id, name: g.name }),
                car_count: g.count,
                parent_filter: `${g.model_id}`
            });
        }

        // Simple filters
        for (const [val, count] of fuels) metadataRecords.push({ filter_type: 'fuel_type', filter_value: val, car_count: count, parent_filter: '' });
        for (const [val, count] of transmissions) metadataRecords.push({ filter_type: 'transmission', filter_value: val, car_count: count, parent_filter: '' });
        for (const [val, count] of bodyTypes) metadataRecords.push({ filter_type: 'body_type', filter_value: val, car_count: count, parent_filter: '' });
        for (const [val, count] of colors) metadataRecords.push({ filter_type: 'color', filter_value: val, car_count: count, parent_filter: '' });
        for (const [val, count] of years) metadataRecords.push({ filter_type: 'year', filter_value: val, car_count: count, parent_filter: '' });

        // 5. Insert into DB
        console.log(`💾 Inserting ${metadataRecords.length} metadata records...`);

        // Insert in batches of 1000
        const batchSize = 1000;
        for (let i = 0; i < metadataRecords.length; i += batchSize) {
            const batch = metadataRecords.slice(i, i + batchSize);
            const { error: insertError } = await supabase
                .from('encar_filter_metadata')
                .insert(batch);

            if (insertError) {
                console.error('Error inserting batch:', insertError);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Metadata population complete in ${duration}s`);

    } catch (error) {
        console.error('❌ Error populating metadata:', error);
        process.exit(1);
    }
}

populateMetadata().then(() => process.exit(0));
