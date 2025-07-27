import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()
    
    if (action === 'sync-manufacturers') {
      return await syncManufacturers(supabase)
    } else if (action === 'sync-all-cars') {
      return await syncAllCars(supabase)
    } else if (action === 'sync-recent') {
      return await syncRecentCars(supabase)
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error in bulk-api-sync:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function syncManufacturers(supabase: any) {
  console.log('Starting manufacturer sync...')
  
  const response = await fetch('https://api.auctionapi.com/api/manufacturers', {
    headers: {
      'Authorization': 'Bearer 8b6c4f5e9a2b1d3c7f8e9a2b1d3c7f8e9a2b1d3c',
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch manufacturers: ${response.statusText}`)
  }

  const manufacturers = await response.json()
  console.log(`Fetched ${manufacturers.length} manufacturers`)

  // Batch insert manufacturers
  const batchSize = 100
  let inserted = 0

  for (let i = 0; i < manufacturers.length; i += batchSize) {
    const batch = manufacturers.slice(i, i + batchSize)
    
    const manufacturerData = batch.map((m: any) => ({
      id: m.id,
      name: m.name,
      logo_url: m.logo_url,
      country: m.country,
      models_count: m.models_count || 0,
      popular_models: m.popular_models || []
    }))

    const { error } = await supabase
      .from('manufacturers')
      .upsert(manufacturerData, { onConflict: 'id' })

    if (error) {
      console.error('Error inserting manufacturer batch:', error)
    } else {
      inserted += batch.length
      console.log(`Inserted ${inserted}/${manufacturers.length} manufacturers`)
    }
  }

  // Update sync status
  await supabase
    .from('api_sync_status')
    .insert({
      sync_type: 'manufacturers',
      status: 'completed',
      records_synced: inserted,
      total_records: manufacturers.length
    })

  return new Response(
    JSON.stringify({ success: true, synced: inserted, total: manufacturers.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function syncAllCars(supabase: any) {
  console.log('Starting full car sync...')
  
  let page = 1
  let totalSynced = 0
  let hasMore = true
  const limit = 1000

  while (hasMore) {
    console.log(`Fetching page ${page} with limit ${limit}...`)
    
    const response = await fetch(`https://api.auctionapi.com/api/cars?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': 'Bearer 8b6c4f5e9a2b1d3c7f8e9a2b1d3c7f8e9a2b1d3c',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch cars page ${page}: ${response.statusText}`)
    }

    const data = await response.json()
    const cars = data.cars || data
    
    if (!cars || cars.length === 0) {
      hasMore = false
      break
    }

    console.log(`Processing ${cars.length} cars from page ${page}`)

    // Transform and batch insert cars
    const carData = cars.map((car: any) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price || car.current_bid || 0,
      mileage: car.mileage,
      vin: car.vin,
      title: car.title,
      transmission: car.transmission,
      fuel: car.fuel,
      color: car.color,
      condition: car.condition,
      lot_number: car.lot_number,
      body_type: car.body_type,
      drive_wheel: car.drive_wheel,
      vehicle_type: car.vehicle_type,
      damage_main: car.damage_main,
      damage_second: car.damage_second,
      location: car.location,
      seller: car.seller,
      seller_type: car.seller_type,
      current_bid: car.current_bid,
      buy_now_price: car.buy_now_price,
      final_bid: car.final_bid,
      is_live: car.is_live || false,
      watchers: car.watchers || 0,
      sale_date: car.sale_date,
      end_time: car.end_time,
      image_url: car.image_url || car.images?.[0],
      images: car.images || [],
      exterior_images: car.exterior_images || [],
      interior_images: car.interior_images || [],
      video_urls: car.video_urls || [],
      keys_available: car.keys_available,
      api_data: car
    }))

    const { error } = await supabase
      .from('api_cars')
      .upsert(carData, { onConflict: 'id' })

    if (error) {
      console.error(`Error inserting cars page ${page}:`, error)
    } else {
      totalSynced += cars.length
      console.log(`Synced ${totalSynced} total cars so far...`)
    }

    // Check if we have more data
    hasMore = cars.length === limit
    page++

    // Add a small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Update sync status
  await supabase
    .from('api_sync_status')
    .insert({
      sync_type: 'full_cars',
      status: 'completed',
      records_synced: totalSynced,
      total_records: totalSynced
    })

  console.log(`Full sync completed. Total cars synced: ${totalSynced}`)

  return new Response(
    JSON.stringify({ success: true, synced: totalSynced }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function syncRecentCars(supabase: any) {
  console.log('Starting recent cars sync...')
  
  // Fetch cars updated in the last minute
  const response = await fetch('https://api.auctionapi.com/api/cars?minutes=1', {
    headers: {
      'Authorization': 'Bearer 8b6c4f5e9a2b1d3c7f8e9a2b1d3c7f8e9a2b1d3c',
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch recent cars: ${response.statusText}`)
  }

  const data = await response.json()
  const cars = data.cars || data

  if (!cars || cars.length === 0) {
    return new Response(
      JSON.stringify({ success: true, synced: 0, message: 'No recent updates' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log(`Processing ${cars.length} recent cars`)

  // Transform and upsert recent cars
  const carData = cars.map((car: any) => ({
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price || car.current_bid || 0,
    mileage: car.mileage,
    vin: car.vin,
    title: car.title,
    transmission: car.transmission,
    fuel: car.fuel,
    color: car.color,
    condition: car.condition,
    lot_number: car.lot_number,
    body_type: car.body_type,
    drive_wheel: car.drive_wheel,
    vehicle_type: car.vehicle_type,
    damage_main: car.damage_main,
    damage_second: car.damage_second,
    location: car.location,
    seller: car.seller,
    seller_type: car.seller_type,
    current_bid: car.current_bid,
    buy_now_price: car.buy_now_price,
    final_bid: car.final_bid,
    is_live: car.is_live || false,
    watchers: car.watchers || 0,
    sale_date: car.sale_date,
    end_time: car.end_time,
    image_url: car.image_url || car.images?.[0],
    images: car.images || [],
    exterior_images: car.exterior_images || [],
    interior_images: car.interior_images || [],
    video_urls: car.video_urls || [],
    keys_available: car.keys_available,
    api_data: car,
    updated_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('api_cars')
    .upsert(carData, { onConflict: 'id' })

  if (error) {
    console.error('Error upserting recent cars:', error)
    throw error
  }

  // Update sync status
  await supabase
    .from('api_sync_status')
    .insert({
      sync_type: 'recent_cars',
      status: 'completed',
      records_synced: cars.length,
      total_records: cars.length
    })

  console.log(`Recent sync completed. Cars updated: ${cars.length}`)

  return new Response(
    JSON.stringify({ success: true, synced: cars.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}