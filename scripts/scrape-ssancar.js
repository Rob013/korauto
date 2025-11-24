
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeSSancar() {
    const url = 'https://www.ssancar.com/ajax/ajax_car_list.php';

    try {
        console.log('📡 Fetching SSancar page...');

        // We need to fetch multiple pages to get all cars
        // But for now let's fetch a large list
        const params = new URLSearchParams();
        params.append('pages', '0');
        params.append('list', '100'); // Fetch 100 cars
        params.append('weekNo', '1'); // Required parameter

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
        console.log(`📄 Received ${html.length} bytes of HTML`);

        const cars = [];

        // Regex to match car listing blocks
        // The HTML structure is <li><a ...>...</a></li>
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
                    continue;
                }

                // Extract car name
                const nameMatch = content.match(/<span\s+class="name">([^<]+)<\/span>/);
                if (!nameMatch) {
                    continue;
                }

                // Extract detail list items
                const detailSection = content.match(/<ul\s+class="detail">([\s\S]*?)<\/ul>/);
                if (!detailSection) {
                    continue;
                }

                const detailSpans = [...detailSection[1].matchAll(/<span>([^<]+)<\/span>/g)];
                if (detailSpans.length < 5) {
                    continue;
                }

                const year = parseInt(detailSpans[0][1]);
                const mileageText = detailSpans[1][1].replace(/[^\d]/g, '');
                const mileage = parseInt(mileageText) || 0;
                const transmission = detailSpans[2][1].trim();
                const color = detailSpans[3][1].trim();
                const fuel = detailSpans[4][1].trim();

                // Extract price
                const priceSection = content.match(/<p\s+class="money">[\s\S]*?<span\s+class="num">([\d,]+)<\/span>/);
                if (!priceSection) {
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

                const car = {
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
            } catch (err) {
                console.error(`❌ Error parsing car ${carCount}:`, err);
                continue;
            }
        }

        console.log(`✅ Successfully parsed ${cars.length} cars`);

        // Save to JSON file
        const outputPath = path.join(__dirname, '../src/data/auctions.json');
        fs.writeFileSync(outputPath, JSON.stringify(cars, null, 2));
        console.log(`💾 Saved data to ${outputPath}`);

    } catch (error) {
        console.error('❌ Error scraping SSancar:', error);
    }
}

scrapeSSancar();
