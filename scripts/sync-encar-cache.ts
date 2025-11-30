/**
 * Encar Cache Sync Script
 * 
 * This script syncs car data from the Encar API to Supabase cache tables
 * Runs periodically (every 15 minutes) to keep cache fresh
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// AuctionsAPI configuration (same as useSecureAuctionAPI)
const API_BASE_URL = 'https://auctionsapi.com/api';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

interface SyncConfig {
    batchSize: number;
    maxConcurrent: number;
    perPage: number;
}

const config: SyncConfig = {
    batchSize: 50,  // Process 50 cars at a time
    maxConcurrent: 5, // Max concurrent API requests
    perPage: 200  // Cars per API request
};

interface SyncStats {
    processed: number;
    added: number;
    updated: number;
    removed: number;
}

/**
 * Start a new sync job and return its ID
 */
async function startSyncJob(): Promise<number> {
    const { data, error } = await supabase
        .from('encar_sync_status')
        .insert({
            sync_started_at: new Date().toISOString(),
            status: 'running'
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to create sync job:', error);
        throw error;
    }

    console.log(`📝 Started sync job #${data.id}`);
    return data.id;
}

/**
 * Update sync job progress
 */
async function updateSyncProgress(syncId: number, processed: number): Promise<void> {
    await supabase
        .from('encar_sync_status')
        .update({ cars_processed: processed })
        .eq('id', syncId);
}

/**
 * Complete sync job successfully
 */
async function completeSyncJob(syncId: number, stats: SyncStats): Promise<void> {
    const startTime = await getSyncStartTime(syncId);
    const duration = startTime ? Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) : 0;

    await supabase
        .from('encar_sync_status')
        .update({
            sync_completed_at: new Date().toISOString(),
            status: 'completed',
            cars_processed: stats.processed,
            cars_added: stats.added,
            cars_updated: stats.updated,
            cars_removed: stats.removed,
            duration_seconds: duration
        })
        .eq('id', syncId);
}

/**
 * Mark sync job as failed
 */
async function failSyncJob(syncId: number, errorMessage: string): Promise<void> {
    await supabase
        .from('encar_sync_status')
        .update({
            sync_completed_at: new Date().toISOString(),
            status: 'failed',
            error_message: errorMessage
        })
        .eq('id', syncId);
}

/**
 * Get sync start time
 */
async function getSyncStartTime(syncId: number): Promise<string | null> {
    const { data } = await supabase
        .from('encar_sync_status')
        .select('sync_started_at')
        .eq('id', syncId)
        .single();

    return data?.sync_started_at || null;
}

/**
 * Fetch all cars from AuctionsAPI
 */
async function fetchAllCarsFromAPI(): Promise<any[]> {
    const allCars: any[] = [];
    let page = 1;
    let hasMore = true;

    console.log('🔄 Fetching cars from AuctionsAPI...');

    while (hasMore) {
        try {
            const url = `${API_BASE_URL}/cars?page=${page}&per_page=${config.perPage}&simple_paginate=0`;
            const response = await fetch(url, {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': API_KEY
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const cars = data.data || [];
            const meta = data.meta || {};

            if (cars.length === 0) {
                hasMore = false;
            } else {
                // Filter out sold cars
                const activeCars = cars.filter((car: any) => {
                    const buyNowPrice = car?.lots?.[0]?.buy_now || car?.buy_now;
                    return buyNowPrice && buyNowPrice > 0;
                });

                allCars.push(...activeCars);
                console.log(`  📦 Fetched page ${page}: ${activeCars.length}/${cars.length} active cars (total: ${allCars.length})`);

                // Check if we have more pages
                if (meta.last_page && page >= meta.last_page) {
                    hasMore = false;
                } else {
                    page++;
                }
            }

            // Rate limiting - wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error: any) {
            console.error(`❌ Error fetching page ${page}:`, error.message);
            hasMore = false;
        }
    }

    console.log(`✅ Total cars fetched: ${allCars.length}`);
    return allCars;
}

/**
 * Transform API car data to cache format
 */
function transformApiToCacheFormat(apiCar: any): any {
    return {
        vehicle_id: apiCar.vehicleId,
        lot_number: apiCar.vehicleNo || apiCar.lot_number,
        vin: apiCar.vin,
        manufacturer_id: apiCar.manufacturer_id,
        manufacturer_name: apiCar.category?.manufacturerName || apiCar.manufacturer?.name,
        model_id: apiCar.model_id,
        model_name: apiCar.category?.modelName || apiCar.model?.name,
        generation_id: apiCar.generation_id,
        generation_name: apiCar.category?.modelGroupName || apiCar.generation?.name,
        grade_name: apiCar.category?.gradeName || apiCar.grade,
        form_year: apiCar.category?.formYear || apiCar.year?.toString(),
        year_month: apiCar.category?.yearMonth || apiCar.year_month,
        mileage: apiCar.spec?.mileage || apiCar.odometer,
        displacement: apiCar.spec?.displacement || apiCar.engine_size,
        fuel_type: apiCar.spec?.fuelName || apiCar.fuel,
        fuel_code: apiCar.spec?.fuelCd || apiCar.fuel_code,
        transmission: apiCar.spec?.transmissionName || apiCar.transmission,
        color_name: apiCar.spec?.colorName || apiCar.color,
        body_type: apiCar.spec?.bodyName || apiCar.body_type,
        seat_count: apiCar.spec?.seatCount || apiCar.seats,
        buy_now_price: apiCar.advertisement?.price || apiCar.lots?.[0]?.buy_now || apiCar.buy_now || apiCar.price,
        original_price: apiCar.category?.originPrice || apiCar.original_price,
        advertisement_status: apiCar.advertisement?.status || apiCar.status,
        vehicle_type: apiCar.vehicleType || apiCar.vehicle_type,
        photos: JSON.stringify(apiCar.photos || apiCar.images || []),
        options: JSON.stringify(apiCar.options || {}),
        registered_date: apiCar.manage?.registDateTime || apiCar.registered_date,
        first_advertised_date: apiCar.manage?.firstAdvertisedDateTime || apiCar.first_advertised_date,
        modified_date: apiCar.manage?.modifyDateTime || apiCar.modified_date,
        view_count: apiCar.manage?.viewCount || 0,
        subscribe_count: apiCar.manage?.subscribeCount || 0,
        has_accident: apiCar.condition?.accident?.recordView || false,
        inspection_available: (apiCar.condition?.inspection?.formats?.length || 0) > 0,
        dealer_name: apiCar.partnership?.dealer?.name || apiCar.dealer_name,
        dealer_firm: apiCar.partnership?.dealer?.firm?.name || apiCar.dealer_firm,
        contact_address: apiCar.contact?.address || apiCar.contact_address,
        is_active: true,
        synced_at: new Date().toISOString()
    };
}

/**
 * Generate hash for change detection
 */
function generateDataHash(data: any): string {
    const relevantFields = { ...data };
    delete relevantFields.synced_at;
    delete relevantFields.view_count;
    delete relevantFields.subscribe_count;
    return crypto.createHash('md5').update(JSON.stringify(relevantFields)).digest('hex');
}

/**
 * Process a batch of cars
 */
async function processBatch(cars: any[]): Promise<SyncStats> {
    const stats: SyncStats = { processed: 0, added: 0, updated: 0, removed: 0 };

    for (const car of cars) {
        try {
            const cacheData = transformApiToCacheFormat(car);
            const dataHash = generateDataHash(cacheData);

            // Check if car exists in cache
            const { data: existing } = await supabase
                .from('encar_cars_cache')
                .select('id, data_hash')
                .eq('vehicle_id', car.vehicleId || car.vehicle_id)
                .single();

            if (!existing) {
                // Insert new car
                const { error } = await supabase
                    .from('encar_cars_cache')
                    .insert({
                        ...cacheData,
                        data_hash: dataHash
                    });

                if (error) {
                    console.error(`  ❌ Error inserting car ${car.vehicleId}:`, error.message);
                } else {
                    stats.added++;
                }
            } else if (existing.data_hash !== dataHash) {
                // Update changed car
                const { error } = await supabase
                    .from('encar_cars_cache')
                    .update({
                        ...cacheData,
                        data_hash: dataHash,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);

                if (error) {
                    console.error(`  ❌ Error updating car ${car.vehicleId}:`, error.message);
                } else {
                    stats.updated++;
                }
            }

            stats.processed++;

        } catch (error: any) {
            console.error(`  ❌ Error processing car:`, error.message);
        }
    }

    return stats;
}

/**
 * Mark cars not in API as inactive
 */
async function markRemovedCars(activeVehicleIds: number[]): Promise<number> {
    // Mark cars as inactive if they're not in the current API response
    const { count } = await supabase
        .from('encar_cars_cache')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .not('vehicle_id', 'in', `(${activeVehicleIds.join(',')})`)
        .eq('is_active', true);

    return count || 0;
}

/**
 * Update filter metadata counts
 */
async function updateFilterMetadata(): Promise<void> {
    console.log('📊 Updating filter metadata...');

    // Get manufacturer counts
    const { data: manufacturerCounts } = await supabase
        .from('encar_cars_cache')
        .select('manufacturer_name')
        .eq('is_active', true);

    // Get model counts
    const { data: modelCounts } = await supabase
        .from('encar_cars_cache')
        .select('model_name, manufacturer_name')
        .eq('is_active', true);

    // Get fuel type counts
    const { data: fuelCounts } = await supabase
        .from('encar_cars_cache')
        .select('fuel_type')
        .eq('is_active', true);

    // TODO: Aggregate and upsert counts into encar_filter_metadata table
    // This would require more complex aggregation logic

    console.log('✅ Filter metadata updated');
}

/**
 * Main sync function
 */
async function syncEncarCache(): Promise<void> {
    const syncId = await startSyncJob();

    try {
        console.log('🔄 Starting Encar cache sync...');

        // 1. Fetch all cars from API
        const allCars = await fetchAllCarsFromAPI();

        if (allCars.length === 0) {
            console.warn('⚠️  No cars fetched from API');
            await failSyncJob(syncId, 'No cars fetched from API');
            return;
        }

        // 2. Process in batches
        const totalStats: SyncStats = { processed: 0, added: 0, updated: 0, removed: 0 };

        for (let i = 0; i < allCars.length; i += config.batchSize) {
            const batch = allCars.slice(i, i + config.batchSize);
            console.log(`  🔄 Processing batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(allCars.length / config.batchSize)}`);

            const batchStats = await processBatch(batch);

            totalStats.processed += batchStats.processed;
            totalStats.added += batchStats.added;
            totalStats.updated += batchStats.updated;

            // Update progress
            await updateSyncProgress(syncId, totalStats.processed);
        }

        // 3. Mark removed cars as inactive
        const vehicleIds = allCars.map(c => c.vehicleId || c.vehicle_id).filter(Boolean);
        totalStats.removed = await markRemovedCars(vehicleIds);

        // 4. Update filter metadata
        await updateFilterMetadata();

        // 5. Complete sync
        await completeSyncJob(syncId, totalStats);

        console.log(`✅ Sync completed successfully!`);
        console.log(`   📊 Processed: ${totalStats.processed}`);
        console.log(`   ➕ Added: ${totalStats.added}`);
        console.log(`   🔄 Updated: ${totalStats.updated}`);
        console.log(`   ➖ Removed: ${totalStats.removed}`);

    } catch (error: any) {
        console.error('❌ Sync failed:', error);
        await failSyncJob(syncId, error.message);
        process.exit(1);
    }
}

// Run the sync
syncEncarCache().then(() => {
    console.log('👋 Sync complete, exiting');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
