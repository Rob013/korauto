
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeSSancar() {
    const url = 'https://www.ssancar.com/ajax/ajax_car_list.php';
    const mainPageUrl = 'https://www.ssancar.com/bbs/board.php?bo_table=list';

    try {
        console.log('📡 Fetching SSancar main page for auction schedule...');

        // First, get the main page to extract auction schedule
        const mainPageResponse = await fetch(mainPageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        const mainPageHtml = await mainPageResponse.text();

        // Extract week number
        const weekMatch = mainPageHtml.match(/<input type="hidden" id="week_no" value="(\d+)">/);
        const weekNo = weekMatch ? weekMatch[1] : '1';

        // Extract auction schedule
        const uploadMatch = mainPageHtml.match(/Upload\s*:\s*(\d{4}-\d{2}-\d{2}\s+\d+:\d+[AP]M)/i);
        const startMatch = mainPageHtml.match(/Start\s*:\s*(\d{4}-\d{2}-\d{2}\s+\d+:\d+[AP]M)/i);

        // Extract countdown end date
        const endDateMatch = mainPageHtml.match(/new Date\("(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^"]+)"\)/);

        const auctionSchedule = {
            weekNo: weekNo,
            uploadTime: uploadMatch ? uploadMatch[1] : null,
            bidStartTime: startMatch ? startMatch[1] : null,
            bidEndTime: endDateMatch ? endDateMatch[1] : null,
            lastUpdated: new Date().toISOString()
        };

        console.log('📅 Auction Schedule:', auctionSchedule);

        console.log('📡 Fetching SSancar car list...');

        // Fetch ALL cars - start with a large number
        const params = new URLSearchParams();
        params.append('pages', '0');
        params.append('list', '500'); // Fetch up to 500 cars
        params.append('weekNo', weekNo);

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

        for (const linkMatch of carLinkMatches) {
            carCount++;

            const detailUrl = linkMatch[1];
            const carId = linkMatch[2];
            const content = linkMatch[3];

            console.log(`🚗 Processing car ${carCount}: ID ${carId}`);

            try {
                // Extract basic info from list item first
                const stockMatch = content.match(/<span\s+class="num">\s*(\d+)\s*<\/span>/);
                const nameMatch = content.match(/<span\s+class="name">([^<]+)<\/span>/);
                const priceSection = content.match(/<p\s+class="money">[\s\S]*?<span\s+class="num">([\d,]+)<\/span>/);

                if (!stockMatch || !nameMatch || !priceSection) {
                    console.log(`  ⚠️ Skipping car ${carId}: Missing basic info`);
                    continue;
                }

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
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                    }
                });
                const detailHtml = await detailResponse.text();

                // Extract Images (Swiper)
                const images = [];
                const imageMatches = detailHtml.matchAll(/<div class="swiper-slide">\s*<img src="([^"]+)"/g);
                for (const imgMatch of imageMatches) {
                    let imgUrl = imgMatch[1];
                    if (imgUrl && imgUrl.trim()) {
                        if (!imgUrl.startsWith('http')) {
                            imgUrl = `https://www.ssancar.com${imgUrl}`;
                        }
                        if (!imgUrl.includes('no_image') && !imgUrl.includes('car_detail.svg')) {
                            images.push(imgUrl);
                        }
                    }
                }

                // Extract Specs Table
                const specs = {};
                const tableMatches = detailHtml.matchAll(/<th[^>]*>(.*?)<\/th>\s*<td[^>]*>(.*?)<\/td>/gs);
                for (const match of tableMatches) {
                    const key = match[1].replace(/<[^>]+>/g, '').trim();
                    const value = match[2].replace(/<[^>]+>/g, '').trim();
                    if (key && value) {
                        specs[key] = value;
                    }
                }

                // Extract Options
                const options = [];
                const optionMatches = detailHtml.matchAll(/<li\s+class="on"[^>]*><span[^>]*>(.*?)<\/span><\/li>/gs);
                for (const match of optionMatches) {
                    const optionText = match[1].replace(/<[^>]+>/g, '').trim();
                    if (optionText) {
                        options.push(optionText);
                    }
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

                // Be nice to the server - small delay between requests
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (err) {
                console.error(`❌ Error parsing car ${carId}:`, err.message);
                continue;
            }
        }

        console.log(`✅ Successfully scraped ${cars.length} cars with full details`);

        // Prepare output data
        const outputData = {
            auctionSchedule,
            cars,
            totalCars: cars.length,
            lastUpdated: new Date().toISOString()
        };

        // Save to JSON file
        const outputPath = path.join(__dirname, '../src/data/auctions.json');
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
        console.log(`💾 Saved ${cars.length} cars and auction schedule to ${outputPath}`);

    } catch (error) {
        console.error('❌ Error scraping SSancar:', error);
    }
}

scrapeSSancar();
