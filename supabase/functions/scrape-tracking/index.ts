// @deno-types="https://deno.land/std@0.168.0/http/server.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @deno-types="https://deno.land/x/deno_dom/deno-dom-wasm.ts"
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrackingData {
    shipper: string;
    modelYear: string;
    chassis: string;
    vessel: string;
    pol: string;
    onBoard: string;
    port: string;
    eta: string;
}

async function scrapeTracking(chassis: string): Promise<TrackingData | null> {
    try {
        // First, try the ShipGo API approach
        const apiResponse = await fetch(
            `https://api-shipgo.tradlinx.com/shipgo/plugin/api/tracking/${encodeURIComponent(chassis)}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'shipgo-plugin-key': 'NTdhMjcxYzQtMjBjZS0zNTY5LWE0YWYtMmU5MTFjYWM3MDMy',
                    'Accept-Language': 'en',
                },
            }
        );

        if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            console.log('API Response:', apiData);

            // Parse API response if successful
            if (apiData && apiData.data) {
                return {
                    shipper: apiData.data.shipper || 'N/A',
                    modelYear: apiData.data.cargoDescription || 'N/A',
                    chassis: chassis,
                    vessel: apiData.data.vesselName || 'N/A',
                    pol: apiData.data.portOfLoading || 'N/A',
                    onBoard: apiData.data.onBoardDate || 'N/A',
                    port: apiData.data.portOfDischarge || 'N/A',
                    eta: apiData.data.eta || 'N/A',
                };
            }
        }

        // Fallback: Scrape the CIG Shipping website HTML
        console.log('API failed, attempting HTML scraping...');

        const pageResponse = await fetch('https://cigshipping.com/Home/cargo.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!pageResponse.ok) {
            throw new Error(`Failed to load page: ${pageResponse.status}`);
        }

        const html = await pageResponse.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        if (!doc) {
            throw new Error('Failed to parse HTML');
        }

        // Note: This is a placeholder - actual parsing logic depends on the HTML structure
        // We would need to inspect the page to find the correct selectors
        console.log('HTML loaded, would need to parse tracking data from page structure');

        return null;
    } catch (error) {
        console.error('Scraping error:', error);
        return null;
    }
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { chassis } = await req.json();

        if (!chassis || typeof chassis !== 'string') {
            return new Response(
                JSON.stringify({ success: false, error: 'Chassis number is required' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log(`Fetching tracking data for chassis: ${chassis}`);

        const trackingData = await scrapeTracking(chassis);

        if (trackingData) {
            return new Response(
                JSON.stringify({ success: true, data: trackingData }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        } else {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'No tracking data found for this chassis number',
                    message: 'The shipment may not exist or has not been registered in the system yet.'
                }),
                {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }
    } catch (error) {
        console.error('Function error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
