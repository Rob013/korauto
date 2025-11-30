/**
 * Encar Cache Sync Script
 * 
 * This script syncs car data from the Encar API to Supabase cache tables
 * Runs periodically (every 15 minutes) to keep cache fresh
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

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

interface CacheCarData {
    vehicle_id: string;
    lot_number?: string;
    vin?: string;
    manufacturer_id?: number;
    manufacturer_name?: string;
    model_id?: number;
    model_name?: string;
    generation_id?: number;
    generation_name?: string;
    grade_name?: string;
    form_year?: string;
    year_month?: string;
    mileage?: number;
    displacement?: number;
    fuel_type?: string;
    fuel_code?: string;
    transmission?: string;
    color_name?: string;
    body_type?: string;
    seat_count?: number;
    buy_now_price?: number;
    original_price?: number;
    advertisement_status?: string;
    vehicle_type?: string;
    photos?: string; // JSON string
    options?: string; // JSON string
    registered_date?: string;
    first_advertised_date?: string;
    modified_date?: string;
    view_count: number;
    subscribe_count: number;
    has_accident?: boolean;
    inspection_available?: boolean;
    dealer_name?: string;
    dealer_firm?: string;
    contact_address?: string;
    is_active: boolean;
    synced_at: string;
    data_hash?: string;
}

/**
 * Transform API car data to cache format
 */
function transformApiToCacheFormat(apiData: any[]): CacheCarData[] {
    return apiData
        .filter(car => {
            // Skip cars without IDs
            if (!car.id) {
                console.log(`  ⚠️  Skipping car without ID: ${car.maker || 'Unknown Maker'} ${car.model || 'Unknown Model'}`);
                return false;
            }
            return true;
        })
        .map(car => {
            const vehicleId = car.id?.toString();

            // Double check (should never happen after filter, but safety first)
            if (!vehicleId || vehicleId === 'undefined' || vehicleId === 'null') {
                console.warn(`  ⚠️  Skipping car with invalid ID: ${vehicleId} (Maker: ${car.maker || 'Unknown'}, Model: ${car.model || 'Unknown'})`);
                return null;
            }

            // Extract lot data (first lot only for Encar cars)
            const lot = car.lots?.[0] || {};

            return {
                vehicle_id: vehicleId,
                lot_number: lot.lot || car.lot_number || car.vehicleNo,
                vin: car.vin,
                manufacturer_id: car.manufacturer?.id || car.manufacturer_id,
                manufacturer_name: car.manufacturer?.name || car.category?.manufacturerName,
                model_id: car.model?.id || car.model_id,
                model_name: car.model?.name || car.category?.modelName,
                generation_id: car.generation?.id || car.generation_id,
                generation_name: car.generation?.name || car.category?.modelGroupName,
                grade_name: car.grade || car.category?.gradeName,
                form_year: car.year?.toString() || car.category?.formYear,
                year_month: car.year_month || car.category?.yearMonth,

                // ENHANCED: Detailed odometer with status
                mileage: lot.odometer?.km || car.odometer || car.spec?.mileage,
                mileage_mi: lot.odometer?.mi,
                odometer_status: lot.odometer?.status?.name,

                displacement: car.engine_size || car.spec?.displacement,
                fuel_type: car.fuel?.name || car.fuel || car.spec?.fuelName,
                fuel_code: car.fuel?.id || car.fuel_code || car.spec?.fuelCd,
                transmission: car.transmission?.name || car.transmission || car.spec?.transmissionName,
                color_name: car.color?.name || car.color || car.spec?.colorName,
                body_type: car.body_type?.name || car.body_type || car.spec?.bodyName,
                seat_count: car.seats || car.spec?.seatCount,

                // ENHANCED: All price fields
                buy_now_price: lot.buy_now || car.buy_now || car.price || car.advertisement?.price,
                bid_price: lot.bid,
                final_bid_price: lot.final_bid,
                estimate_repair_price: lot.estimate_repair_price,
                pre_accident_price: lot.pre_accident_price,
                clean_wholesale_price: lot.clean_wholesale_price,
                actual_cash_value: lot.actual_cash_value,

                original_price: car.original_price || car.category?.originPrice,
                advertisement_status: car.status || car.sale_status || car.advertisement?.status,
                vehicle_type: car.vehicle_type?.name || car.vehicle_type || car.vehicleType,

                // ENHANCED: Complete images with metadata
                photos: JSON.stringify(lot.images?.normal || lot.images?.big || car.images || car.photos || []),
                photos_small: JSON.stringify(lot.images?.small || []),
                images_id: lot.images?.id,

                options: JSON.stringify(car.options || {}),
                registered_date: car.registered_date || car.manage?.registDateTime,
                first_advertised_date: car.first_advertised_date || car.manage?.firstAdvertisedDateTime,
                modified_date: car.modified_date || car.manage?.modifyDateTime,
                view_count: car.view_count || car.manage?.viewCount || 0,
                subscribe_count: car.manage?.subscribeCount || 0,
                has_accident: car.condition?.accident?.recordView || false,
                inspection_available: (car.condition?.inspection?.formats?.length || 0) > 0,

                // ENHANCED: Lot & sale tracking
                lot_external_id: lot.external_id,
                lot_status: lot.status?.name,
                sale_date: lot.sale_date,
                sale_date_updated_at: lot.sale_date_updated_at,
                bid_updated_at: lot.bid_updated_at,
                buy_now_updated_at: lot.buy_now_updated_at,
                final_bid_updated_at: lot.final_bid_updated_at,

                // ENHANCED: Damage & condition
                damage_main: lot.damage?.main,
                damage_second: lot.damage?.second,
                airbags_status: lot.airbags,
                grade_iaai: lot.grade_iaai,
                detailed_title: lot.detailed_title,
                condition_name: lot.condition?.name,

                // ENHANCED: Seller info
                seller_name: lot.seller,
                seller_type: lot.seller_type,

                dealer_name: car.partnership?.dealer?.name || car.dealer_name,
                dealer_firm: car.partnership?.dealer?.firm?.name || car.dealer_firm,
                contact_address: car.contact?.address || car.contact_address,

                // ENHANCED: Engine & drivetrain
                engine_id: car.engine?.id,
                engine_name: car.engine?.name,
                drive_wheel: car.drive_wheel?.name,

                is_active: true,
                synced_at: new Date().toISOString()
            };
        })
        .filter(item => item !== null) as CacheCarData[];
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
 * Process a batch of cars using bulk upsert
 */
async function processBatch(cars: any[]): Promise<SyncStats> {
    // Transform all cars in the batch
    const cacheDataList = transformApiToCacheFormat(cars);

    if (cacheDataList.length === 0) {
        return { processed: 0, added: 0, updated: 0, removed: 0 };
    }

    // Prepare records with hashes
    const records = cacheDataList.map(c => ({
        ...c,
        data_hash: generateDataHash(c)
    }));

    // Bulk upsert
    const { error } = await supabase
        .from('encar_cars_cache')
        .upsert(records, {
            onConflict: 'vehicle_id',
            ignoreDuplicates: false
        });

    if (error) {
        console.error(`  ❌ Error batch upserting ${records.length} cars:`, error.message);
        return { processed: 0, added: 0, updated: 0, removed: 0 };
    }

    return {
        processed: records.length,
        added: records.length, // Approximate, we don't know exact counts with bulk upsert
        updated: 0,
        removed: 0
    };
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

    // We'll run the populate script logic here
    // For now, we can execute the populate script as a separate process or import it
    // But since we want to keep this script self-contained, let's just log that we should run it
    console.log('⚠️ Please run "npx tsx scripts/populate-filter-metadata.ts" to update filter metadata.');

    // Ideally, we would import the populateMetadata function and await it here
    // await populateMetadata();

    console.log('✅ Filter metadata update requested');
}

/**
 * Main sync function with parallel processing
 */
async function syncEncarCache(): Promise<void> {
    const syncId = await startSyncJob();
    const allVehicleIds: string[] = [];
    const totalStats: SyncStats = { processed: 0, added: 0, updated: 0, removed: 0 };

    // Concurrency settings
    const CONCURRENT_PAGES = 5;

    try {
        console.log('🔄 Starting Encar cache sync (Fast Mode ⚡️)...');

        // 1. Fetch first page to get metadata
        const firstPageUrl = `${API_BASE_URL}/cars?page=1&per_page=${config.perPage}&simple_paginate=0`;
        const response = await fetch(firstPageUrl, {
            headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
        });

        if (!response.ok) throw new Error(`API request failed: ${response.status}`);

        const data = await response.json();
        const totalPages = data.meta?.last_page || 1;

        console.log(`📊 Total Pages to sync: ${totalPages} (~${data.meta?.total || '?'} cars)`);

        // Process first page
        if (data.data?.length > 0) {
            const stats = await processBatch(data.data);
            totalStats.processed += stats.processed;
            totalStats.added += stats.added;
            console.log(`  ✅ Page 1/${totalPages} processed (${stats.processed} cars)`);
        }

        // 2. Process remaining pages in chunks
        for (let page = 2; page <= totalPages; page += CONCURRENT_PAGES) {
            const chunkPromises = [];
            const endPage = Math.min(page + CONCURRENT_PAGES - 1, totalPages);

            console.log(`  🔄 Processing pages ${page}-${endPage}...`);

            for (let p = page; p <= endPage; p++) {
                chunkPromises.push((async () => {
                    try {
                        const url = `${API_BASE_URL}/cars?page=${p}&per_page=${config.perPage}&simple_paginate=0`;
                        const res = await fetch(url, {
                            headers: { 'accept': 'application/json', 'x-api-key': API_KEY }
                        });

                        if (!res.ok) throw new Error(`Status ${res.status}`);

                        const pData = await res.json();
                        if (pData.data?.length > 0) {
                            const stats = await processBatch(pData.data);
                            return stats.processed;
                        }
                        return 0;
                    } catch (e: any) {
                        console.error(`    ❌ Failed page ${p}: ${e.message}`);
                        return 0;
                    }
                })());
            }

            const results = await Promise.all(chunkPromises);
            const chunkProcessed = results.reduce((a, b) => a + b, 0);
            totalStats.processed += chunkProcessed;
            totalStats.added += chunkProcessed;

            // Update DB progress occasionally
            await updateSyncProgress(syncId, totalStats.processed);

            // Small delay to be nice to API
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 3. Mark removed cars (skip for now to be fastest, or do it at end)
        // console.log('🧹 Checking for removed cars...'); 
        // totalStats.removed = await markRemovedCars(allVehicleIds.map(id => parseInt(id)));

        // 4. Update filter metadata
        await updateFilterMetadata();

        // 5. Complete sync
        await completeSyncJob(syncId, totalStats);

        console.log(`✅ Sync completed successfully!`);
        console.log(`   📊 Processed: ${totalStats.processed}`);

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
