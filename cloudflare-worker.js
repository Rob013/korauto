/**
 * Cloudflare Worker for CIG Shipping Tracking API
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Deploy this worker to Cloudflare Workers
 * 2. Set up route: /api/cig-track* -> this worker
 * 3. Optionally configure AUTH_ENABLED environment variable
 * 
 * ROUTE BINDING:
 * - In Cloudflare Workers dashboard, go to your worker's settings
 * - Add a route pattern: yoursite.com/api/cig-track* -> this worker
 * - Or use wrangler.toml with: route = "/api/cig-track*"
 * 
 * ENDPOINT DISCOVERY:
 * - Open https://cigshipping.com/Home/cargo.html in DevTools
 * - Go to Network tab, search a real VIN/B/L, find the request that returns data
 * - If it's not ?keyword=, update tryAlternateEndpoint(q) with that URL/method/body
 * - Map JSON fields to {date,event,location,vessel}
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
          JSON.stringify({ error: 'Missing q' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const trimmedQuery = query.trim();
      
      // Basic validation for query format
      if (trimmedQuery.length < 5) {
        return new Response(
          JSON.stringify({ error: 'Query too short. Please enter a valid VIN (17 characters) or B/L number (at least 5 characters)' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // If it looks like a VIN, validate VIN format
      if (trimmedQuery.length === 17) {
        if (!isVINLike(trimmedQuery)) {
          return new Response(
            JSON.stringify({ error: 'Invalid VIN format. VIN must be 17 characters (A-Z, 0-9, no I, O, Q)' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }

      // Fetch tracking data from CIG Shipping
      const trackingData = await fetchTrackingData(trimmedQuery);

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
  const cigUrl = `https://cigshipping.com/Home/cargo.html?keyword=${encodeURIComponent(query)}`;
  
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
    
    // If parsing finds zero rows, try alternate endpoint
    let finalRows = rows;
    if (rows.length === 0) {
      const alternateRows = await tryAlternateEndpoint(query);
      finalRows = alternateRows;
    }
    
    // Dedupe near-identical rows
    const deduped = deduplicateRows(finalRows);
    
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

    // Extract additional metadata from the page
    const metadata = extractTrackingMetadata(html);
    
    // If we have metadata, add it as the first "row"
    if (metadata && Object.keys(metadata).length > 0) {
      rows.unshift({
        type: 'metadata',
        ...metadata
      });
    }

  } catch (error) {
    console.error('Error parsing tracking table:', error);
    // Return empty array on parsing errors
  }
  
  return rows;
}

/**
 * Extract comprehensive tracking metadata from HTML page
 */
function extractTrackingMetadata(html) {
  const metadata = {};
  
  try {
    // Extract container number
    const containerPatterns = [
      /<[^>]*>Container\s*(?:No\.?|Number)?[:\s]*([A-Z]{4}\d{7})<\/[^>]*>/gi,
      /Container[:\s]*([A-Z]{4}\d{7})/gi,
      /([A-Z]{4}\d{7})/g // Standard container number format
    ];
    
    for (const pattern of containerPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.containerNumber = match[1];
        break;
      }
    }
    
    // Extract B/L (Bill of Lading) number
    const blPatterns = [
      /<[^>]*>B\/L\s*(?:No\.?|Number)?[:\s]*([A-Z0-9\-]+)<\/[^>]*>/gi,
      /B\/L[:\s]*([A-Z0-9\-]{6,})/gi,
      /Bill\s+of\s+Lading[:\s]*([A-Z0-9\-]+)/gi
    ];
    
    for (const pattern of blPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.billOfLading = match[1];
        break;
      }
    }
    
    // Extract vessel name (more comprehensive)
    const vesselPatterns = [
      /<[^>]*>Vessel[:\s]*([^<]+)<\/[^>]*>/gi,
      /Vessel[:\s]*([A-Z\s\-]+(?:VESSEL|SHIP|EXPRESS|LINE|STAR|OCEAN|SEA))/gi,
      /Ship[:\s]*([^<\n\r]+)/gi
    ];
    
    for (const pattern of vesselPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.vesselName = match[1].trim();
        break;
      }
    }
    
    // Extract voyage number
    const voyagePatterns = [
      /<[^>]*>Voyage[:\s]*([A-Z0-9\-]+)<\/[^>]*>/gi,
      /Voyage[:\s]*([A-Z0-9\-]+)/gi
    ];
    
    for (const pattern of voyagePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.voyageNumber = match[1];
        break;
      }
    }
    
    // Extract port of loading
    const polPatterns = [
      /<[^>]*>Port\s+of\s+Loading[:\s]*([^<]+)<\/[^>]*>/gi,
      /POL[:\s]*([^<\n\r]+)/gi,
      /Loading\s+Port[:\s]*([^<\n\r]+)/gi
    ];
    
    for (const pattern of polPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.portOfLoading = match[1].trim();
        break;
      }
    }
    
    // Extract port of discharge
    const podPatterns = [
      /<[^>]*>Port\s+of\s+Discharge[:\s]*([^<]+)<\/[^>]*>/gi,
      /POD[:\s]*([^<\n\r]+)/gi,
      /Discharge\s+Port[:\s]*([^<\n\r]+)/gi
    ];
    
    for (const pattern of podPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.portOfDischarge = match[1].trim();
        break;
      }
    }
    
    // Extract estimated arrival date
    const etaPatterns = [
      /<[^>]*>ETA[:\s]*([^<]+)<\/[^>]*>/gi,
      /Estimated\s+Arrival[:\s]*([^<\n\r]+)/gi,
      /ETA[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/gi
    ];
    
    for (const pattern of etaPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.estimatedArrival = match[1].trim();
        break;
      }
    }
    
    // Extract shipping line
    const linePatterns = [
      /<[^>]*>Shipping\s+Line[:\s]*([^<]+)<\/[^>]*>/gi,
      /Line[:\s]*([A-Z\s]+(?:LINE|SHIPPING|LOGISTICS))/gi
    ];
    
    for (const pattern of linePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.shippingLine = match[1].trim();
        break;
      }
    }
    
    // Extract shipper information
    const shipperPatterns = [
      /<[^>]*>Shipper[:\s]*([^<]+)<\/[^>]*>/gi,
      /Shipper[:\s]*([^<\n\r]+)/gi,
      /SHIPPER[:\s]*([^<\n\r]+)/gi,
      /발송인[:\s]*([^<\n\r]+)/gi, // Korean for shipper
      /수출자[:\s]*([^<\n\r]+)/gi  // Korean for exporter
    ];
    
    for (const pattern of shipperPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.shipper = match[1].trim();
        break;
      }
    }
    
    // Extract model/year information
    const modelPatterns = [
      /<[^>]*>Model\s*\(Year\)[:\s]*([^<]+)<\/[^>]*>/gi,
      /Model\s*\(Year\)[:\s]*([^<\n\r]+)/gi,
      /MODEL\(YEAR\)[:\s]*([^<\n\r]+)/gi,
      /<[^>]*>Model[:\s]*([^<]+)<\/[^>]*>/gi,
      /Model[:\s]*([A-Z0-9\s\-\(\)]+)/gi
    ];
    
    for (const pattern of modelPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.model = match[1].trim();
        break;
      }
    }
    
    // Extract chassis/VIN number (enhanced for VIN tracking)
    const chassisPatterns = [
      /<[^>]*>Chassis[:\s]*([^<]+)<\/[^>]*>/gi,
      /Chassis[:\s]*([A-Z0-9]+)/gi,
      /CHASSIS[:\s]*([A-Z0-9]+)/gi,
      /VIN[:\s]*([A-HJ-NPR-Z0-9]{17})/gi, // Standard VIN format (no I, O, Q)
      /VIN[:\s]*([A-Z0-9]{17})/gi, // Fallback VIN format
      /Vehicle\s+Identification\s+Number[:\s]*([A-HJ-NPR-Z0-9]{17})/gi,
      /차대번호[:\s]*([A-Z0-9]+)/gi, // Korean for chassis number
      /([A-HJ-NPR-Z0-9]{17})/g // Look for any 17-character VIN pattern in the text
    ];
    
    for (const pattern of chassisPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.chassis = match[1].trim();
        break;
      }
    }
    
    // Extract on board date
    const onBoardPatterns = [
      /<[^>]*>On\s+Board[:\s]*([^<]+)<\/[^>]*>/gi,
      /On\s+Board[:\s]*([^<\n\r]+)/gi,
      /ON\s+BOARD[:\s]*([^<\n\r]+)/gi,
      /선적일[:\s]*([^<\n\r]+)/gi, // Korean for loading date
      /적재일[:\s]*([^<\n\r]+)/gi  // Korean for loading date
    ];
    
    for (const pattern of onBoardPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        metadata.onBoard = match[1].trim();
        break;
      }
    }
    
  } catch (error) {
    console.error('Error extracting metadata:', error);
  }
  
  return metadata;
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
    // Try to identify container numbers
    else if (isContainerNumber(cell)) {
      row.containerNumber = cell;
    }
    // Try to identify VIN numbers
    else if (isVINLike(cell)) {
      row.chassis = cell; // Store VIN as chassis
    }
    // Try to identify vessel/ship names
    else if (isVesselLike(cell)) {
      row.vessel = cell;
    }
    // Try to identify location
    else if (isLocationLike(cell)) {
      row.location = cell;
    }
    // Try to identify status/event descriptions
    else if (isStatusLike(cell)) {
      row.status = cell;
    }
    // Everything else goes to event
    else if (!row.event && cell.length > 0) {
      row.event = cell;
    }
  }
  
  // Only return row if it has some meaningful content
  if (row.date || row.event || row.location || row.vessel || row.status || row.containerNumber) {
    return row;
  }
  
  return null;
}

/**
 * Check if text looks like a VIN (Vehicle Identification Number)
 */
function isVINLike(text) {
  // Standard VIN: 17 characters, no I, O, Q
  const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinPattern.test(text.replace(/\s/g, ''));
}

/**
 * Check if text looks like a container number
 */
function isContainerNumber(text) {
  // Standard container number format: 4 letters + 7 digits
  const containerPattern = /^[A-Z]{4}\d{7}$/;
  return containerPattern.test(text.replace(/\s/g, ''));
}

/**
 * Check if text looks like a status/event description
 */
function isStatusLike(text) {
  const statusPatterns = [
    /arrived/i,
    /departed/i,
    /loaded/i,
    /discharged/i,
    /customs/i,
    /gate\s+(in|out)/i,
    /vessel\s+arrival/i,
    /vessel\s+departure/i,
    /container\s+(loaded|discharged)/i,
    /released/i,
    /cleared/i
  ];
  
  return statusPatterns.some(pattern => pattern.test(text));
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
    /seoul/i,
    /china/i,
    /japan/i,
    /usa/i,
    /europe/i,
    /\w+,\s*\w+/, // City, Country format
    /\w+\s+port/i,
    /\w+\s+terminal/i,
    /pier\s+\d+/i,
    /berth\s+\d+/i
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
 * Try alternate endpoint when main parsing fails
 * Placeholder: if the page actually uses another internal endpoint (JSON or POST), fill this later
 */
async function tryAlternateEndpoint(query) {
  // TODO: Discover the real internal endpoint via DevTools
  // For now, return empty rows as placeholder
  console.log('tryAlternateEndpoint called for query:', query);
  
  // PLACEHOLDER: When you discover the real endpoint via DevTools:
  // 1. Open https://cigshipping.com/Home/cargo.html in browser
  // 2. Open DevTools → Network tab
  // 3. Search a real VIN/B/L number
  // 4. Find the request that returns actual data (might be JSON or POST)
  // 5. Update this function to call that endpoint
  // 6. Map the JSON response fields to {date, event, location, vessel}
  
  return [];
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