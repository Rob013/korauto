import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuctionCar {
  stock_no: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  color: string;
  fuel: string;
  price: number;
  image_url: string;
  detail_url: string;
  auction_date: string;
}

async function scrapeSSancar(): Promise<AuctionCar[]> {
  const url = 'https://www.ssancar.com/bbs/board.php?bo_table=list';
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const cars: AuctionCar[] = [];
    
    // Parse HTML to extract car data
    const carMatches = html.matchAll(/Stock NO\.\s*(\d+).*?href="([^"]+car_view\.php\?car_no=\d+)".*?>(.*?)<\/a>/gs);
    
    for (const match of carMatches) {
      const stockNo = match[1];
      const detailUrl = `https://www.ssancar.com${match[2]}`;
      const content = match[3];
      
      // Extract car details
      const modelMatch = content.match(/([A-Z\s]+)\s+\(([A-Z])\)\s+([\d.]+)/);
      const yearMatch = content.match(/(\d{4})(\d{1,3},?\d{0,3})\s*Km/);
      const priceMatch = content.match(/Bid([\d,]+)\$/);
      const colorMatch = content.match(/>([\w\s\(\)]+)<\/span>.*?>(Gasoline|Diesel|LPG|Electric|GasolineHybrid|Hydrogen)/i);
      const imageMatch = content.match(/src="([^"]+)"/);
      
      if (modelMatch && yearMatch && priceMatch) {
        cars.push({
          stock_no: stockNo.padStart(4, '0'),
          make: modelMatch[1].trim().split(' ')[0],
          model: modelMatch[1].trim(),
          year: parseInt(yearMatch[1]),
          mileage: parseInt(yearMatch[2].replace(/,/g, '')),
          transmission: content.includes('Automatic') ? 'Automatic' : 'Manual',
          color: colorMatch ? colorMatch[1].trim() : 'Unknown',
          fuel: colorMatch ? colorMatch[2] : 'Gasoline',
          price: parseInt(priceMatch[1].replace(/,/g, '')),
          image_url: imageMatch ? `https://www.ssancar.com${imageMatch[1]}` : '',
          detail_url: detailUrl,
          auction_date: new Date().toISOString().split('T')[0]
        });
      }
    }
    
    return cars;
  } catch (error) {
    console.error('Error scraping SSancar:', error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Scraping SSancar auction data...');
    const cars = await scrapeSSancar();
    
    console.log(`✅ Found ${cars.length} auction cars`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        cars,
        count: cars.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SSancar scraper error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
