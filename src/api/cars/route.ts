// HTTP API endpoint for cars with global database sorting
// Endpoint: GET /api/cars
// 
// Query Parameters:
// - sort: price_asc, price_desc, year_asc, year_desc, mileage_asc, mileage_desc, etc.
// - page: Page number (1-based)
// - pageSize: Number of items per page (1-100, default 24)
// - make, model, yearMin, yearMax, priceMin, priceMax, fuel, search: Filter parameters
// - useLimitOffset: true to use LIMIT/OFFSET pagination (default), false for cursor-based
// - cursor: For cursor-based pagination (ignored if useLimitOffset=true)
//
// Response Format (as requested in problem statement):
// {
//   "items": [...],
//   "total": number,
//   "page": number, 
//   "pageSize": number,
//   "hasNext": boolean,
//   "hasPrev": boolean,
//   "nextCursor"?: string // Only for cursor-based pagination
// }

import { fetchCarsApi } from '@/services/carsApi';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Set default to use LIMIT/OFFSET as requested in problem statement
    if (!searchParams.has('useLimitOffset')) {
      searchParams.set('useLimitOffset', 'true');
    }

    const result = await fetchCarsApi(searchParams);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in /api/cars:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch cars',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}