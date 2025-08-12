import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Config
const RATE_LIMIT_DELAY = 8000 // 8s base delay between pages
const MAX_RETRIES = 3
const BACKOFF_MULTIPLIER = 2
const PAGE_SIZE = 100
const REQUEST_TIMEOUT = 30000
const MAX_PAGES = 500 // safety limit for full syncs

// Util: sleep
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// API request with retry and 429 backoff
async function apiRequest(url: string, headers: Record<string, string>, retry = 0): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    console.log(`📡 API Request: ${url} (attempt ${retry + 1}/${MAX_RETRIES + 1})`)
    const res = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.status === 429) {
      if (retry < MAX_RETRIES) {
        const delay = RATE_LIMIT_DELAY * Math.pow(BACKOFF_MULTIPLIER, retry)
        console.log(`⏰ Rate limited. Waiting ${delay}ms then retry...`)
        await sleep(delay)
        return apiRequest(url, headers, retry + 1)
      }
      throw new Error('Rate limit exceeded after retries')
    }

    if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`)
    const data = await res.json()
    return data
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (retry < MAX_RETRIES && reschedulable(err)) {
      const delay = 1000 * Math.pow(BACKOFF_MULTIPLIER, retry)
      console.log(`⏰ Transient error. Retry in ${delay}ms...`)
      await sleep(delay)
      return apiRequest(url, headers, retry + 1)
    }
    throw err
  }
}

function reschedulable(err: any) {
  const msg = (err?.message || '').toLowerCase()
  return msg.includes('timeout') || msg.includes('network') || msg.includes('abort')
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const AUCTIONS_API_KEY = Deno.env.get('AUCTIONS_API_KEY') ?? ''
  const API_BASE_URL = Deno.env.get('AUCTIONS_API_BASE_URL') ?? 'https://auctionsapi.com/api'

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ success: false, error: 'Missing Supabase env' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  if (!AUCTIONS_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'Missing AUCTIONS_API_KEY secret' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const url = new URL(req.url)
    const syncType = url.searchParams.get('type') || 'full' // full | incremental
    const minutes = parseInt(url.searchParams.get('minutes') || '60')

    console.log(`🚀 Encar sync start | type=${syncType} minutes=${minutes}`)

    // create sync record
    const { data: syncRec, error: syncErr } = await supabase.from('sync_status').insert({
      sync_type: syncType,
      status: 'running',
      started_at: new Date().toISOString(),
      current_page: 1,
      total_pages: 1,
      records_processed: 0,
      cars_processed: 0,
      last_activity_at: new Date().toISOString(),
    }).select().single()
    if (syncErr) throw new Error(`Failed to create sync record: ${syncErr.message}`)

    const headers = {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-api-key': AUCTIONS_API_KEY,
      'user-agent': 'encar-sync/3.0',
    }

    // Build base URL
    const carsBaseParams = new URLSearchParams({ per_page: String(PAGE_SIZE), simple_paginate: '0' })
    if (syncType !== 'full') carsBaseParams.set('minutes', String(minutes))
    const carsBase = `${API_BASE_URL}/cars?${carsBaseParams.toString()}`

    let page = 1
    let totalProcessed = 0
    let totalPagesSeen = 1

    while (page <= MAX_PAGES) {
      const pageUrl = `${carsBase}&page=${page}`
      let json: any
      try {
        json = await apiRequest(pageUrl, headers)
      } catch (e: any) {
        console.error(`❌ Page ${page} failed:`, e?.message || e)
        break
      }

      const cars: any[] = Array.isArray(json?.data) ? json.data : []
      if (cars.length === 0) {
        console.log(`✅ No more cars at page ${page}`)
        break
      }

      // Map to cars_cache rows
      const rows = cars.map((car) => {
        const lot = car?.lots?.[0] || {}
        const images = lot?.images?.normal || lot?.images?.big || []
        const mileageStr = lot?.odometer?.km != null ? `${Number(lot.odometer.km).toLocaleString()} km` : null
        const price = typeof lot?.buy_now === 'number' ? Math.round(lot.buy_now + 2300) : null
        return {
          id: String(car?.id ?? ''),
          api_id: String(car?.id ?? ''),
          make: car?.manufacturer?.name || 'Unknown',
          model: car?.model?.name || 'Unknown',
          year: Number(car?.year) || 2020,
          price,
          vin: car?.vin ?? null,
          fuel: car?.fuel?.name ?? null,
          transmission: car?.transmission?.name ?? null,
          color: car?.color?.name ?? null,
          condition: lot?.condition?.name?.replace('run_and_drives', 'Good') ?? null,
          lot_number: lot?.lot ? String(lot.lot) : null,
          mileage: mileageStr,
          images: JSON.stringify(images || []),
          car_data: car ?? {},
          lot_data: lot ?? {},
          last_api_sync: new Date().toISOString(),
        }
      }).filter((r) => r.id && r.make && r.model)

      // Batch upsert for performance
      const CHUNK = 100
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK)
        const { error: upErr } = await supabase.from('cars_cache').upsert(chunk as any, { onConflict: 'id', ignoreDuplicates: false })
        if (upErr) {
          console.error('❌ Upsert error:', upErr)
        } else {
          totalProcessed += chunk.length
        }
      }

      // Update progress
      totalPagesSeen = Math.max(totalPagesSeen, page)
      await supabase.from('sync_status').update({
        current_page: page,
        total_pages: totalPagesSeen,
        cars_processed: totalProcessed,
        records_processed: totalProcessed,
        last_activity_at: new Date().toISOString(),
        last_cars_sync_at: new Date().toISOString(),
      }).eq('id', syncRec.id)

      // Next page
      page += 1

      // Use meta if available to stop
      const hasNext = json?.meta?.current_page < json?.meta?.last_page
      if (hasNext === false) break

      await sleep(RATE_LIMIT_DELAY)
    }

    // Finish
    await supabase.from('sync_status').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      cars_processed: totalProcessed,
      records_processed: totalProcessed,
    }).eq('id', syncRec.id)

    console.log(`✅ Sync finished. Cars processed: ${totalProcessed}`)
    return new Response(JSON.stringify({ success: true, cars_processed: totalProcessed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('💥 Sync fatal error:', error?.message || error)
    return new Response(JSON.stringify({ success: false, error: error?.message || String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
