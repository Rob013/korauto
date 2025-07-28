import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request parameters
    const url = new URL(req.url)
    const syncType = url.searchParams.get('type') || 'incremental'
    const minutes = parseInt(url.searchParams.get('minutes') || '60')

    console.log(`🚀 Starting ${syncType} sync with API integration guide implementation`)

    // Check for running sync
    const { data: existingSync } = await supabase
      .from('sync_status')
      .select('id')
      .eq('status', 'running')
      .single()

    if (existingSync) {
      console.log(`⚠️ Sync already running: ${existingSync.id}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Sync already in progress',
          existing_sync_id: existingSync.id 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create new sync record
    const { data: syncRecord, error: syncError } = await supabase
      .from('sync_status')
      .insert({
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString(),
        current_page: 1,
        total_pages: 1,
        records_processed: 0,
        cars_processed: 0,
        archived_lots_processed: 0
      })
      .select()
      .single()

    if (syncError) {
      throw new Error(`Failed to create sync record: ${syncError.message}`)
    }

    console.log(`✅ Created sync record: ${syncRecord.id}`)

    const API_KEY = 'd00985c77981fe8d26be16735f932ed1'
    const BASE_URL = 'https://auctionsapi.com/api'
    
    let totalCarsProcessed = 0
    let totalArchivedProcessed = 0
    let errors: string[] = []

    try {
      // Step 1: Process active cars from /api/cars endpoint
      console.log(`📡 Processing active cars (${syncType === 'full' ? 'full sync' : `last ${minutes} minutes`})`)
      
      let carsUrl = `${BASE_URL}/cars?api_key=${API_KEY}`
      if (syncType !== 'full') {
        carsUrl += `&minutes=${minutes}`
      }

      // Handle pagination for cars
      let currentPage = 1
      let hasMorePages = true
      
      while (hasMorePages) {
        const pageUrl = `${carsUrl}&page=${currentPage}&limit=50`
        console.log(`📡 Fetching cars page ${currentPage}: ${pageUrl}`)

        const carsResponse = await fetch(pageUrl, {
          headers: { 'User-Agent': 'Encar-Sync/1.0' }
        })

        if (!carsResponse.ok) {
          if (carsResponse.status === 429) {
            console.log(`⏳ Rate limited (429), waiting 2 minutes...`)
            await new Promise(resolve => setTimeout(resolve, 120000))
            continue
          }
          throw new Error(`Cars API returned ${carsResponse.status}: ${carsResponse.statusText}`)
        }

        const carsData = await carsResponse.json()
        
        if (!carsData.cars || !Array.isArray(carsData.cars)) {
          console.log(`⚠️ No cars data in response for page ${currentPage}`)
          break
        }

        console.log(`📊 Processing ${carsData.cars.length} cars from page ${currentPage}`)

        // Transform and upsert cars
        for (const apiCar of carsData.cars) {
          try {
            const transformedCar = {
              id: apiCar.id?.toString() || `car-${Date.now()}-${Math.random()}`,
              external_id: apiCar.id?.toString(),
              make: apiCar.make || 'Unknown',
              model: apiCar.model || 'Unknown',
              year: parseInt(apiCar.year) || new Date().getFullYear(),
              price: parseFloat(apiCar.price) || 0,
              mileage: parseInt(apiCar.mileage) || 0,
              title: apiCar.title || `${apiCar.make} ${apiCar.model}`,
              color: apiCar.color,
              fuel: apiCar.fuel,
              transmission: apiCar.transmission,
              condition: apiCar.condition || 'good',
              location: apiCar.location || 'South Korea',
              image_url: apiCar.image_url || apiCar.images?.[0]?.url,
              images: apiCar.images ? JSON.stringify(apiCar.images) : '[]',
              lot_number: apiCar.lot_number,
              vin: apiCar.vin,
              current_bid: parseFloat(apiCar.current_bid) || 0,
              buy_now_price: parseFloat(apiCar.buy_now_price) || 0,
              is_live: Boolean(apiCar.is_live),
              keys_available: apiCar.keys_available !== false,
              status: 'active',
              is_archived: false,
              last_synced_at: new Date().toISOString(),
              source_api: 'auctionapis'
            }

            const { error: upsertError } = await supabase
              .from('cars')
              .upsert(transformedCar, { 
                onConflict: 'id',
                ignoreDuplicates: false 
              })

            if (upsertError) {
              console.error(`❌ Error upserting car ${transformedCar.id}:`, upsertError)
              errors.push(`Car ${transformedCar.id}: ${upsertError.message}`)
            } else {
              totalCarsProcessed++
            }
          } catch (carError) {
            console.error(`❌ Error processing car:`, carError)
            errors.push(`Car processing error: ${carError.message}`)
          }
        }

        // Check for more pages
        hasMorePages = carsData.has_more === true && carsData.cars.length > 0
        currentPage++

        // Update sync progress
        await supabase
          .from('sync_status')
          .update({
            current_page: currentPage,
            cars_processed: totalCarsProcessed,
            last_activity_at: new Date().toISOString(),
            last_cars_sync_at: new Date().toISOString()
          })
          .eq('id', syncRecord.id)

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Step 2: Process archived lots from /api/archived-lots endpoint
      console.log(`🗂️ Processing archived lots (${syncType === 'full' ? 'full sync' : `last ${minutes} minutes`})`)
      
      let archivedUrl = `${BASE_URL}/archived-lots?api_key=${API_KEY}`
      if (syncType !== 'full') {
        archivedUrl += `&minutes=${minutes}`
      }

      const archivedResponse = await fetch(archivedUrl, {
        headers: { 'User-Agent': 'Encar-Sync/1.0' }
      })

      if (archivedResponse.ok) {
        const archivedData = await archivedResponse.json()
        
        if (archivedData.archived_lots && Array.isArray(archivedData.archived_lots)) {
          console.log(`📊 Processing ${archivedData.archived_lots.length} archived lots`)

          for (const archivedLot of archivedData.archived_lots) {
            try {
              const carId = archivedLot.id?.toString()
              if (!carId) continue

              // Archive the car in our database
              const { error: archiveError } = await supabase
                .from('cars')
                .update({
                  is_archived: true,
                  archived_at: new Date().toISOString(),
                  sold_price: parseFloat(archivedLot.final_price) || null,
                  final_bid: parseFloat(archivedLot.final_price) || null,
                  sale_date: archivedLot.sale_date || new Date().toISOString(),
                  archive_reason: 'sold',
                  status: 'sold',
                  last_synced_at: new Date().toISOString()
                })
                .eq('external_id', carId)

              if (archiveError) {
                console.error(`❌ Error archiving car ${carId}:`, archiveError)
                errors.push(`Archive ${carId}: ${archiveError.message}`)
              } else {
                totalArchivedProcessed++
                console.log(`✅ Archived car ${carId} with final price: $${archivedLot.final_price}`)
              }
            } catch (archiveError) {
              console.error(`❌ Error processing archived lot:`, archiveError)
              errors.push(`Archive processing error: ${archiveError.message}`)
            }
          }

          // Update sync progress
          await supabase
            .from('sync_status')
            .update({
              archived_lots_processed: totalArchivedProcessed,
              last_activity_at: new Date().toISOString(),
              last_archived_sync_at: new Date().toISOString()
            })
            .eq('id', syncRecord.id)
        }
      } else {
        console.log(`⚠️ Archived lots API returned ${archivedResponse.status}, skipping archive processing`)
      }

      // Complete sync
      const completedAt = new Date().toISOString()
      await supabase
        .from('sync_status')
        .update({
          status: 'completed',
          completed_at: completedAt,
          records_processed: totalCarsProcessed + totalArchivedProcessed,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed,
          error_message: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
        })
        .eq('id', syncRecord.id)

      console.log(`✅ Sync completed: ${totalCarsProcessed} cars processed, ${totalArchivedProcessed} archived`)

      return new Response(
        JSON.stringify({
          success: true,
          sync_id: syncRecord.id,
          sync_type: syncType,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed,
          total_processed: totalCarsProcessed + totalArchivedProcessed,
          errors_count: errors.length,
          errors: errors.slice(0, 5),
          completed_at: completedAt
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error(`💥 Sync error:`, error)
      
      // Mark sync as failed
      await supabase
        .from('sync_status')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed
        })
        .eq('id', syncRecord.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          sync_id: syncRecord.id,
          cars_processed: totalCarsProcessed,
          archived_lots_processed: totalArchivedProcessed
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error(`💥 Critical sync error:`, error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})