/**
 * Cloudflare Worker for CIG Shipping Tracking API
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Deploy this worker to Cloudflare Workers
 * 2. Set up route: /api/cig-track* -> this worker
 * 3. Optionally configure AUTH_ENABLED environment variable
 * 
 * AUTH INTEGRATION POINTS:
 * - Set AUTH_ENABLED = "true" in worker environment to enable auth
 * - Customize cookie name in AUTH_COOKIE_NAME if needed
 * - Replace cookie auth logic with your authentication system
 */

// Configuration - customize these for your setup
const AUTH_ENABLED = false; // Set to true via environment variable when ready
const AUTH_COOKIE_NAME = 'my_session'; // Change to match your auth cookie name

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    try {
      const url = new URL(request.url);
      
      // Only handle /api/cig-track routes
      if (!url.pathname.startsWith('/api/cig-track')) {
        return new Response('Not Found', { status: 404 });
      }

      // Only allow GET requests
      if (request.method !== 'GET') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // AUTH INTEGRATION POINT: Enable/disable authentication
      const authEnabled = env.AUTH_ENABLED === 'true' || AUTH_ENABLED;
      if (authEnabled) {
        const authResult = checkAuthentication(request);
        if (!authResult.authenticated) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Extract query parameter
      const query = url.searchParams.get('q');
      if (!query || query.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameter "q"' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Fetch tracking data from CIG Shipping
      const trackingData = await fetchTrackingData(query.trim());

      return new Response(
        JSON.stringify(trackingData),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message || 'Unknown error occurred'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

/**
 * AUTH INTEGRATION POINT: Replace this with your authentication logic
 * This function should check if the user is authenticated
 * 
 * @param {Request} request - The incoming request
 * @returns {Object} - { authenticated: boolean, user?: object }
 */
function checkAuthentication(request) {
  // Get cookies from request
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return { authenticated: false };
  }

  // Parse cookies (simple implementation)
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  // Check for authentication cookie
  const sessionCookie = cookies[AUTH_COOKIE_NAME];
  if (!sessionCookie) {
    return { authenticated: false };
  }

  // TODO: Validate the session cookie with your authentication system
  // This is a placeholder - replace with your actual validation logic
  // Examples:
  // - Verify JWT token
  // - Check session in database
  // - Call your auth service API
  
  // For now, just check if cookie exists (placeholder)
  return { authenticated: true, user: { session: sessionCookie } };
}

/**
 * Fetch and parse tracking data from CIG Shipping website
 */
async function fetchTrackingData(query) {
  const cigUrl = `https://cigshipping.com/Home/en/cargo.html?keyword=${encodeURIComponent(query)}`;
  
  try {
    // Fetch with desktop user agent
    const response = await fetch(cigUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`CIG Shipping request failed: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse the HTML to extract table rows
    const rows = parseTrackingTable(html);
    
    // Dedupe near-identical rows
    const deduped = deduplicateRows(rows);
    
    return {
      query,
      rows: deduped
    };

  } catch (error) {
    console.error('Error fetching tracking data:', error);
    throw new Error(`Failed to fetch tracking data: ${error.message}`);
  }
}

/**
 * Parse tracking table from HTML using tolerant regex
 */
function parseTrackingTable(html) {
  const rows = [];
  
  try {
    // Look for table rows with tracking data - be tolerant of different HTML structures
    // This regex looks for table rows that might contain tracking information
    const tableRowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
    const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis;
    
    let match;
    while ((match = tableRowRegex.exec(html)) !== null) {
      const rowHtml = match[1];
      
      // Extract cells from this row
      const cells = [];
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        // Clean up cell content - remove HTML tags and extra whitespace
        const cellText = cellMatch[1]
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (cellText) {
          cells.push(cellText);
        }
      }
      
      // If we have cells, try to map them to our expected structure
      if (cells.length >= 2) {
        // Try to identify date, event, location, vessel from cells
        // This is a best-effort mapping - adjust based on actual CIG site structure
        const row = mapCellsToRow(cells);
        if (row) {
          rows.push(row);
        }
      }
    }

    // If no table rows found, try alternative parsing methods
    if (rows.length === 0) {
      // Try parsing divs or other structures that might contain tracking info
      rows.push(...parseAlternativeStructures(html));
    }

  } catch (error) {
    console.error('Error parsing tracking table:', error);
    // Return empty array on parsing errors
  }
  
  return rows;
}

/**
 * Map extracted cells to row structure
 */
function mapCellsToRow(cells) {
  // Try to identify which cell contains what information
  // This is heuristic-based and may need adjustment
  
  const row = {};
  
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    
    // Try to identify date (various formats)
    if (isDateLike(cell)) {
      row.date = cell;
    }
    // Try to identify vessel/ship names
    else if (isVesselLike(cell)) {
      row.vessel = cell;
    }
    // Try to identify location
    else if (isLocationLike(cell)) {
      row.location = cell;
    }
    // Everything else goes to event
    else if (!row.event && cell.length > 0) {
      row.event = cell;
    }
  }
  
  // Only return row if it has some meaningful content
  if (row.date || row.event || row.location || row.vessel) {
    return row;
  }
  
  return null;
}

/**
 * Check if text looks like a date
 */
function isDateLike(text) {
  // Common date patterns
  const datePatterns = [
    /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/, // MM/DD/YYYY or DD/MM/YYYY
    /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/, // YYYY/MM/DD
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, // DD Mon
    /\w+\s+\d{1,2},?\s+\d{4}/ // Month DD, YYYY
  ];
  
  return datePatterns.some(pattern => pattern.test(text));
}

/**
 * Check if text looks like a vessel name
 */
function isVesselLike(text) {
  // Common vessel name patterns
  const vesselPatterns = [
    /^[A-Z\s\-]+\s+(VESSEL|SHIP|EXPRESS|LINE|STAR|OCEAN|SEA)/i,
    /^(MV|MS|SS)\s+/i, // Ship prefixes
    /\d{3,}/  // IMO numbers or similar
  ];
  
  return vesselPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if text looks like a location
 */
function isLocationLike(text) {
  // Common location patterns
  const locationPatterns = [
    /port/i,
    /harbor/i,
    /terminal/i,
    /korea/i,
    /busan/i,
    /incheon/i,
    /\w+,\s*\w+/, // City, Country format
  ];
  
  return locationPatterns.some(pattern => pattern.test(text));
}

/**
 * Parse alternative HTML structures if table parsing fails
 */
function parseAlternativeStructures(html) {
  const rows = [];
  
  // Try to find div-based layouts or other structures
  // This is a fallback when standard table parsing doesn't work
  
  // Look for div containers that might have tracking info
  const divRegex = /<div[^>]*class="[^"]*track[^"]*"[^>]*>(.*?)<\/div>/gis;
  let match;
  
  while ((match = divRegex.exec(html)) !== null) {
    const content = match[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (content.length > 10) { // Only consider substantial content
      rows.push({
        event: content.substring(0, 100), // Limit length
        date: null,
        location: null,
        vessel: null
      });
    }
  }
  
  return rows;
}

/**
 * Remove near-identical rows to clean up results
 */
function deduplicateRows(rows) {
  const unique = [];
  const seen = new Set();
  
  for (const row of rows) {
    // Create a signature for deduplication
    const signature = [
      row.date || '',
      row.event || '',
      row.location || '',
      row.vessel || ''
    ].join('|').toLowerCase();
    
    if (!seen.has(signature)) {
      seen.add(signature);
      unique.push(row);
    }
  }
  
  return unique;
}