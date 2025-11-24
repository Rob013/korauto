
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeSSancar() {
    const url = 'https://www.ssancar.com/ajax/ajax_car_list.php';

    try {
        console.log('📡 Fetching SSancar list...');

        // Fetch list
        const params = new URLSearchParams();
        params.append('pages', '0');
        params.append('list', '100'); // Fetch 100 cars
        params.append('weekNo', '1');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.ssancar.com/bbs/board.php?bo_table=list',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: params
        });

        const html = await response.text();
        console.log(`📄 Received list HTML (${html.length} bytes)`);

        const cars = [];

        // Extract basic info and detail URLs
        const carLinkMatches = html.matchAll(/<a\s+href="(https:\/\/www\.ssancar\.com\/page\/car_view\.php\?car_no=(\d+))"[^>]*>([\s\S]*?)<\/a>/g);

        let carCount = 0;
        const MAX_CARS = 20; // Limit for now to avoid timeout/blocking

        for (const linkMatch of carLinkMatches) {
            if (carCount >= MAX_CARS) break;
            carCount++;

            const detailUrl = linkMatch[1];
            const carId = linkMatch[2];
            const content = linkMatch[3];

            console.log(`🚗 Processing car ${carCount}: ID ${carId}`);

            try {
                // Extract basic info from list item first (fallback/quick info)
                const stockMatch = content.match(/<span\s+class="num">\s*(\d+)\s*<\/span>/);
                const nameMatch = content.match(/<span\s+class="name">([^<]+)<\/span>/);
                const priceSection = content.match(/<p\s+class="money">[\s\S]*?<span\s+class="num">([\d,]+)<\/span>/);

                if (!stockMatch || !nameMatch || !priceSection) continue;

                const basicInfo = {
                    id: carId,
                    stock_no: stockMatch[1].padStart(4, '0'),
                    name: nameMatch[1].trim(),
                    price: parseInt(priceSection[1].replace(/,/g, '')),
                    detail_url: detailUrl
                };

                // Fetch detail page
                console.log(`   ...fetching details from ${detailUrl}`);
                const detailResponse = await fetch(detailUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                const detailHtml = await detailResponse.text();

                // Extract Images (Swiper)
                const images = [];
                const imageMatches = detailHtml.matchAll(/<div class="swiper-slide">\s*<img src="([^"]+)"/g);
                for (const imgMatch of imageMatches) {
                    let imgUrl = imgMatch[1];
                    if (!imgUrl.startsWith('http')) {
                        imgUrl = `https://www.ssancar.com${imgUrl}`;
                    }
                    // Filter out placeholders if possible, but keep them if that's all we have
                    if (!imgUrl.includes('no_image')) {
                        images.push(imgUrl);
                    }
                }

                // Extract Specs Table
                const specs = {};
                // This regex is tricky, might need adjustment based on actual HTML structure
                // Looking for <th>Label</th><td>Value</td> pattern
                const tableMatches = detailHtml.matchAll(/<th>(.*?)<\/th>\s*<td>(.*?)<\/td>/g);
                for (const match of tableMatches) {
                    const key = match[1].replace(/<[^>]+>/g, '').trim();
                    const value = match[2].replace(/<[^>]+>/g, '').trim();
                    if (key && value) {
                        specs[key] = value;
                    }
                }

                // Extract Options
                const options = [];
                // Look for option checkboxes or lists. Based on typical structure:
                // <li class="on">Option Name</li> or similar
                const optionMatches = detailHtml.matchAll(/<li\s+class="on"><span>(.*?)<\/span><\/li>/g);
                for (const match of optionMatches) {
                    options.push(match[1].trim());
                }

                // Construct full car object
                const car = {
                    ...basicInfo,
                    make: basicInfo.name.split(' ')[0],
                    model: basicInfo.name,
                    images: images.length > 0 ? images : ['https://www.ssancar.com/img/no_image.png'],
                    specs: specs,
                    options: options,
                    auction_date: new Date().toISOString().split('T')[0]
                };

                cars.push(car);

                // Be nice to the server
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`❌ Error parsing car ${carId}:`, err);
                continue;
            }
        }

        console.log(`✅ Successfully scraped ${cars.length} cars with full details`);

        // Save to JSON file
        const outputPath = path.join(__dirname, '../src/data/auctions.json');
        fs.writeFileSync(outputPath, JSON.stringify(cars, null, 2));
        console.log(`💾 Saved data to ${outputPath}`);

    } catch (error) {
        console.error('❌ Error scraping SSancar:', error);
    }
}

scrapeSSancar();
