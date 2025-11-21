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

        const requestBody = await req.json()
        const { endpoint, filters = {}, carId } = requestBody

        console.log('🔍 Standalone API request:', { endpoint, filters, carId })

        // Handle different endpoints using ONLY Supabase data
        switch (endpoint) {
            case 'cars':
            case 'car':
                if (carId) {
                    // Get single car by ID
                    return await getSingleCar(supabaseClient, carId)
                } else {
                    // Get filtered cars list
                    return await getCarsList(supabaseClient, filters)
                }

            case 'manufacturers/cars':
                return await getManufacturers(supabaseClient)

            case 'models':
                return await getModels(supabaseClient, filters)

            case 'generations':
            case 'grades':
                return await getGenerations(supabaseClient, filters)

            default:
                if (endpoint?.startsWith('models/')) {
                    const modelId = endpoint.split('/')[1]
                    return await getCarsByModel(supabaseClient, modelId, filters)
                }

                if (endpoint?.startsWith('cars/')) {
                    const id = endpoint.split('/')[1]
                    return await getSingleCar(supabaseClient, id)
                }

                return new Response(
                    JSON.stringify({ error: 'Endpoint not supported' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
        }

    } catch (error: any) {
        console.error('❌ Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function getSingleCar(client: any, carId: string) {
    const { data, error } = await client
        .from('cars_cache')
        .select('*')
        .or(`id.eq.${carId},api_id.eq.${carId}`)
        .single()

    if (error || !data) {
        return new Response(
            JSON.stringify({ error: 'Car not found', data: null }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Transform to match external API format
    const transformed = {
        data: transformCarData(data)
    }

    return new Response(
        JSON.stringify(transformed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}

async function getCarsList(client: any, filters: any) {
    let query = client
        .from('cars_cache')
        .select('*', { count: 'exact' })
        .neq('sale_status', 'sold')
        .neq('sale_status', 'archived')

    // Apply filters
    if (filters.manufacturer_id) {
        query = query.ilike('make', `%${filters.manufacturer_id}%`)
    }

    if (filters.model_id) {
        query = query.ilike('model', `%${filters.model_id}%`)
    }

    if (filters.grade_iaai) {
        query = query.contains('car_data', { lots: [{ grade_iaai: filters.grade_iaai }] })
    }

    if (filters.from_year) {
        query = query.gte('year', parseInt(filters.from_year))
    }

    if (filters.to_year) {
        query = query.lte('year', parseInt(filters.to_year))
    }

    if (filters.buy_now_price_from) {
        query = query.gte('price', parseInt(filters.buy_now_price_from))
    }

    if (filters.buy_now_price_to) {
        query = query.lte('price', parseInt(filters.buy_now_price_to))
    }

    if (filters.fuel_type) {
        query = query.ilike('fuel', `%${filters.fuel_type}%`)
    }

    if (filters.transmission) {
        query = query.ilike('transmission', `%${filters.transmission}%`)
    }

    if (filters.search) {
        query = query.or(`make.ilike.%${filters.search}%,model.ilike.%${filters.search}%,vin.ilike.%${filters.search}%`)
    }

    // Pagination
    const page = parseInt(filters.page || '1')
    const perPage = parseInt(filters.per_page || '50')
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    query = query.range(from, to)

    // Sorting
    if (filters.sort_by === 'price_low') {
        query = query.order('price', { ascending: true, nullsFirst: false })
    } else if (filters.sort_by === 'price_high') {
        query = query.order('price', { ascending: false, nullsFirst: false })
    } else if (filters.sort_by === 'year_new') {
        query = query.order('year', { ascending: false })
    } else if (filters.sort_by === 'year_old') {
        query = query.order('year', { ascending: true })
    } else {
        query = query.order('updated_at', { ascending: false })
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Query error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const transformed = (data || []).map(transformCarData)
    const totalPages = Math.ceil((count || 0) / perPage)

    return new Response(
        JSON.stringify({
            data: transformed,
            meta: {
                current_page: page,
                last_page: totalPages,
                per_page: perPage,
                total: count || 0,
                from: from + 1,
                to: Math.min(to + 1, count || 0)
            }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}

async function getManufacturers(client: any) {
    const { data, error } = await client
        .from('cars_cache')
        .select('make')
        .neq('sale_status', 'sold')
        .neq('sale_status', 'archived')

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Count cars per manufacturer
    const manufacturerCounts = new Map()
    data.forEach((car: any) => {
        const make = car.make || 'Unknown'
        manufacturerCounts.set(make, (manufacturerCounts.get(make) || 0) + 1)
    })

    const manufacturers = Array.from(manufacturerCounts.entries())
        .map(([name, count]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            cars_qty: count,
            image: `https://auctionsapi.com/images/brands/${name}.svg`
        }))
        .sort((a, b) => b.cars_qty - a.cars_qty)

    return new Response(
        JSON.stringify({ data: manufacturers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}

async function getModels(client: any, filters: any) {
    let query = client
        .from('cars_cache')
        .select('model, make')
        .neq('sale_status', 'sold')
        .neq('sale_status', 'archived')

    if (filters.manufacturer_id) {
        query = query.ilike('make', `%${filters.manufacturer_id}%`)
    }

    const { data, error } = await query

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Count cars per model
    const modelCounts = new Map()
    data.forEach((car: any) => {
        const key = `${car.make}|${car.model}`
        modelCounts.set(key, (modelCounts.get(key) || 0) + 1)
    })

    const models = Array.from(modelCounts.entries())
        .map(([key, count]) => {
            const [make, modelName] = key.split('|')
            return {
                id: modelName.toLowerCase().replace(/\s+/g, '-'),
                name: modelName,
                manufacturer_name: make,
                cars_qty: count
            }
        })
        .sort((a, b) => b.cars_qty - a.cars_qty)

    return new Response(
        JSON.stringify({ data: models }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}

async function getGenerations(client: any, filters: any) {
    let query = client
        .from('cars_cache')
        .select('car_data')
        .neq('sale_status', 'sold')
        .neq('sale_status', 'archived')

    if (filters.manufacturer_id) {
        query = query.ilike('make', `%${filters.manufacturer_id}%`)
    }

    if (filters.model_id) {
        query = query.ilike('model', `%${filters.model_id}%`)
    }

    const { data, error } = await query

    if (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Extract unique grades/generations
    const gradesSet = new Set()
    data.forEach((car: any) => {
        const carData = typeof car.car_data === 'string' ? JSON.parse(car.car_data) : car.car_data
        const grade = carData?.lots?.[0]?.grade_iaai || carData?.generation?.name
        if (grade) gradesSet.add(grade)
    })

    const grades = Array.from(gradesSet).map((grade: any) => ({
        value: grade,
        label: grade
    }))

    return new Response(
        JSON.stringify({ data: grades }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}

async function getCarsByModel(client: any, modelId: string, filters: any) {
    return await getCarsList(client, { ...filters, model_id: modelId })
}

function transformCarData(record: any) {
    const carData = typeof record.car_data === 'string' ? JSON.parse(record.car_data) : (record.car_data || {})
    const lotData = typeof record.lot_data === 'string' ? JSON.parse(record.lot_data) : (record.lot_data || {})

    return {
        id: record.api_id || record.id,
        year: record.year,
        vin: record.vin,
        manufacturer: {
            id: record.manufacturer_id || 0,
            name: record.make
        },
        model: {
            id: record.model_id || 0,
            name: record.model
        },
        fuel: { name: record.fuel },
        transmission: { name: record.transmission },
        color: { name: record.color },
        body_type: { name: record.body_style },
        drive_wheel: record.drive_type,
        engine: { name: record.engine_displacement },
        lots: [{
            ...lotData,
            lot: record.lot_number,
            buy_now: record.price,
            status: record.sale_status === 'active' ? 1 : 3,
            sale_status: record.sale_status,
            images: {
                normal: record.images || [],
                big: record.high_res_images || record.images || []
            },
            odometer: {
                km: parseFloat(record.mileage) || null
            },
            location: {
                city: record.location_city,
                state: record.location_state,
                country: record.location_country
            }
        }],
        ...carData
    }
}
