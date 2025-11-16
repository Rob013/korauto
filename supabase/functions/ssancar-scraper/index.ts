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
    console.log('📡 Fetching SSancar page...');
    const response = await fetch(url);
    const html = await response.text();
    console.log(`📄 Received ${html.length} bytes of HTML`);
    
    const cars: AuctionCar[] = [];
    
    // More flexible regex to match car listing blocks
    const carLinkMatches = html.matchAll(/<a\s+href="(https:\/\/www\.ssancar\.com\/page\/car_view\.php\?car_no=\d+)"[^>]*>([\s\S]*?)<\/a>/g);
    
    let carCount = 0;
    for (const linkMatch of carLinkMatches) {
      carCount++;
      const detailUrl = linkMatch[1];
      const content = linkMatch[2];
      
      try {
        // Extract stock number
        const stockMatch = content.match(/<span\s+class="num">\s*(\d+)\s*<\/span>/);
        if (!stockMatch) {
          console.log(`⚠️ Car ${carCount}: No stock number found`);
          continue;
        }
        
        // Extract car name
        const nameMatch = content.match(/<span\s+class="name">([^<]+)<\/span>/);
        if (!nameMatch) {
          console.log(`⚠️ Car ${carCount}: No car name found`);
          continue;
        }
        
        // Extract detail list items - find all spans within the detail ul
        const detailSection = content.match(/<ul\s+class="detail">([\s\S]*?)<\/ul>/);
        if (!detailSection) {
          console.log(`⚠️ Car ${carCount}: No detail section found`);
          continue;
        }
        
        const detailSpans = [...detailSection[1].matchAll(/<span>([^<]+)<\/span>/g)];
        if (detailSpans.length < 5) {
          console.log(`⚠️ Car ${carCount}: Insufficient detail spans (${detailSpans.length})`);
          continue;
        }
        
        const year = parseInt(detailSpans[0][1]);
        const mileageText = detailSpans[1][1].replace(/[^\d]/g, '');
        const mileage = parseInt(mileageText) || 0;
        const transmission = detailSpans[2][1].trim();
        const color = detailSpans[3][1].trim();
        const fuel = detailSpans[4][1].trim();
        
        // Extract price from money section
        const priceSection = content.match(/<p\s+class="money">[\s\S]*?<span\s+class="num">([\d,]+)<\/span>/);
        if (!priceSection) {
          console.log(`⚠️ Car ${carCount}: No price found`);
          continue;
        }
        
        const price = parseInt(priceSection[1].replace(/,/g, ''));
        
        // Extract image
        const imageMatch = content.match(/<img\s+src="([^"]+)"/);
        let imageUrl = 'https://www.ssancar.com/img/no_image.png';
        if (imageMatch) {
          imageUrl = imageMatch[1].startsWith('http') ? imageMatch[1] : `https://www.ssancar.com${imageMatch[1]}`;
        }
        
        // Parse make from car name
        const carName = nameMatch[1].trim();
        const nameParts = carName.split(/\s+/);
        const make = nameParts[0];
        
        const car: AuctionCar = {
          stock_no: stockMatch[1].padStart(4, '0'),
          make: make,
          model: carName,
          year: year,
          mileage: mileage,
          transmission: transmission,
          color: color,
          fuel: fuel,
          price: price,
          image_url: imageUrl,
          detail_url: detailUrl,
          auction_date: new Date().toISOString().split('T')[0]
        };
        
        cars.push(car);
        console.log(`✅ Car ${carCount}: ${car.stock_no} - ${car.model}`);
      } catch (err) {
        console.error(`❌ Error parsing car ${carCount}:`, err);
        continue;
      }
    }
    
    console.log(`✅ Successfully parsed ${cars.length} cars from SSancar (checked ${carCount} car blocks)`);
    return cars;
  } catch (error) {
    console.error('❌ Error scraping SSancar:', error);
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
