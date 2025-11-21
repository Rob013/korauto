import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('🚀 Starting FULL database population from external API...')

        const API_KEY = 'd00985c77981fe8d26be16735f932ed1'
        const API_BASE_URL = 'https://auctionsapi.com/api'

        // Start a sync log
        const { data: logData } = await supabaseClient
            .from('cars_sync_log')
            .insert({
                sync_type: 'full_migration',
                status: 'running',
                metadata: {
                    action: 'full_database_population',
                    triggered_manually: true,
                    timestamp: new Date().toISOString()
                }
            })
            .select('id')
            .single()

        const syncLogId = logData?.id

        let totalSynced = 0
        let totalPages = 0
        const maxPages = 1000 // Safety limit
        const perPage = 50

        console.log(`📥 Fetching ALL cars from external API (up to ${maxPages} pages)...`)

        for (let page = 1; page <= maxPages; page++) {
            console.log(`📄 Fetching page ${page}...`)

            const response = await fetch(
                `${API_BASE_URL}/cars?per_page=${perPage}&page=${page}&simple_paginate=0`,
                {
                    headers: {
                        'accept': 'application/json',
                        'x-api-key': API_KEY
                    }
                }
            )

            if (!response.ok) {
                console.error(`❌ API request failed on page ${page}: ${response.status}`)
                break
            }

            const data = await response.json()
            const cars = data.data || []

            if (cars.length === 0) {
                console.log(`✅ No more cars on page ${page}. Sync complete!`)
                break
            }

            totalPages = page

            // Process cars in batches of 10
            for (let i = 0; i < cars.length; i += 10) {
                const batch = cars.slice(i, i + 10)

                for (const car of batch) {
                    try {
                        // Fetch detailed car data
                        const detailResponse = await fetch(
                            `${API_BASE_URL}/cars/${car.id}`,
                            {
                                headers: {
                                    'accept': 'application/json',
                                    'x-api-key': API_KEY
                                }
                            }
                        )

                        let detailedCar = car
                        if (detailResponse.ok) {
                            const detailData = await detailResponse.json()
                            detailedCar = detailData.data || car
                        }

                        // Build comprehensive car record
                        const carRecord = buildCarRecord(detailedCar, car)

                        // Upsert to database
                        const { error } = await supabaseClient
                            .from('cars_cache')
                            .upsert(carRecord, { onConflict: 'id', ignoreDuplicates: false })

                        if (!error) {
                            totalSynced++
                            if (totalSynced % 100 === 0) {
                                console.log(`✅ Synced ${totalSynced} cars...`)
                            }
                        } else {
                            console.error(`❌ Error upserting car ${car.id}:`, error.message)
                        }

                        // Small delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 100))
                    } catch (err) {
                        console.error(`❌ Error processing car ${car.id}:`, err)
                    }
                }
            }

            // Delay between pages
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Log progress
            if (page % 10 === 0) {
                console.log(`📊 Progress: ${totalSynced} cars synced from ${page} pages`)
            }
        }

        // Update sync log
        if (syncLogId) {
            await supabaseClient
                .from('cars_sync_log')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    cars_synced: totalSynced,
                    metadata: {
                        action: 'full_database_population',
                        total_pages: totalPages,
                        total_cars: totalSynced
                    }
                })
                .eq('id', syncLogId)
        }

        console.log(`✅ FULL SYNC COMPLETE! Total cars synced: ${totalSynced} from ${totalPages} pages`)

        return new Response(
            JSON.stringify({
                success: true,
                message: `Successfully synced ${totalSynced} cars from ${totalPages} pages`,
                totalSynced,
                totalPages
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Full sync failed:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

function buildCarRecord(detailedCar: any, listCar: any) {
    const car = detailedCar || listCar
    const lot = car.lots?.[0] || {}

    return {
        id: String(car.id),
        api_id: String(car.id),
        make: car.manufacturer?.name || car.make || 'Unknown',
        model: car.model?.name || car.model || 'Unknown',
        year: car.year || car.model_year || 2020,
        vin: car.vin || null,
        fuel: car.fuel?.name || car.fuel || null,
        transmission: car.transmission?.name || car.transmission || null,
        color: car.color?.name || car.color || null,
        body_style: car.body_type?.name || null,
        drive_type: car.drive_wheel || null,
        engine_displacement: car.engine?.name || null,
        price: lot.buy_now || lot.price?.price || null,
        price_usd: lot.buy_now || lot.price?.price || null,
        mileage: lot.odometer?.km ? `${lot.odometer.km} km` : null,
        lot_number: lot.lot || null,
        sale_status: lot.sale_status || 'active',
        thumbnail_url: lot.images?.normal?.[0] || lot.images?.big?.[0] || null,
        image_url: lot.images?.big?.[0] || lot.images?.normal?.[0] || null,
        images: lot.images?.normal || lot.images?.big || [],
        high_res_images: lot.images?.big || null,
        location_city: lot.location?.city || null,
        location_state: lot.location?.state || null,
        location_country: lot.location?.country || 'South Korea',
        source_site: lot.domain?.name || 'external',
        car_data: car,
        lot_data: lot,
        last_api_sync: new Date().toISOString(),
        last_updated_source: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
}
