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

        // Extract auction schedule with exact SSancar format
        const uploadMatch = mainPageHtml.match(/Upload\s*:\s*(\d{4}-\d{2}-\d{2}\s+[AP]M\s+\d+)/i);
        const startMatch = mainPageHtml.match(/Start\s*:\s*(\d{4}-\d{2}-\d{2}\s+[AP]M\s+\d+)/i);

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

        // Fetch ALL cars
        const params = new URLSearchParams();
        params.append('pages', '0');
        params.append('list', '500');
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

        // Extract car items - each car is in an <li> tag
        const carItems = html.matchAll(/<li>\s*<a[^>]*href="(https:\/\/www\.ssancar\.com\/page\/car_view\.php\?car_no=(\d+))"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/g);

        let carCount = 0;

        for (const carItem of carItems) {
            carCount++;

            const detailUrl = carItem[1];
            const carId = carItem[2];
            const content = carItem[3];

            console.log(`🚗 Processing car ${carCount}: ID ${carId}`);

            try {
                // Extract stock number and name
                const stockMatch = content.match(/<span\s+class="num">\s*(\d+)\s*<\/span>/);
                const nameMatch = content.match(/<span\s+class="name">([^<]+)<\/span>/);

                // Extract price
                const priceMatch = content.match(/<p\s+class="money">[\s\S]*?<span\s+class="num">([\d,]+)<\/span>/);

                if (!stockMatch || !nameMatch || !priceMatch) {
                    console.log(`  ⚠️ Skipping car ${carId}: Missing basic info`);
                    continue;
                }

                // Extract thumbnail image
                const imageMatch = content.match(/<img\s+src="([^"]+)"/);
                let thumbnailUrl = imageMatch ? imageMatch[1] : 'https://www.ssancar.com/img/no_image.png';
                if (thumbnailUrl && !thumbnailUrl.startsWith('http')) {
                    thumbnailUrl = `https://www.ssancar.com${thumbnailUrl}`;
                }

                // Extract specs from the detail list
                const detailSection = content.match(/<ul\s+class="detail">[\s\S]*?<\/ul>/);
                const specs = {};

                if (detailSection) {
                    const detailHtml = detailSection[0];
                    const spans = [...detailHtml.matchAll(/<span>([^<]+)<\/span>/g)];

                    if (spans.length >= 3) {
                        specs['Year'] = spans[0][1].trim();
                        specs['Mileage'] = spans[1][1].trim();
                        specs['Transmission'] = spans[2][1].trim();

                        if (spans.length >= 5) {
                            specs['Color'] = spans[3][1].trim();
                            specs['Fuel'] = spans[4][1].trim();
                        }
                        if (spans.length >= 6) {
                            specs['Grade'] = spans[5][1].trim();
                        }
                    }
                }

                // Now fetch the detail page to get ALL images
                console.log(`   ...fetching images from detail page`);
                const detailResponse = await fetch(detailUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                    }
                });
                const detailHtml = await detailResponse.text();

                // Extract all images from swiper
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

                // If no images found in detail, use thumbnail
                if (images.length === 0) {
                    images.push(thumbnailUrl);
                }

                const basicInfo = {
                    id: carId,
                    stock_no: stockMatch[1].padStart(4, '0'),
                    name: nameMatch[1].trim(),
                    price: parseInt(priceMatch[1].replace(/,/g, '')),
                    detail_url: detailUrl,
                    make: nameMatch[1].split(' ')[0],
                    model: nameMatch[1].trim(),
                    images: images,
                    specs: specs,
                    options: [],
                    auction_date: new Date().toISOString().split('T')[0]
                };

                console.log(`   ✓ Extracted: ${images.length} images, Year=${specs['Year']}, Mileage=${specs['Mileage']}, Fuel=${specs['Fuel']}`);

                cars.push(basicInfo);

                // Small delay to be respectful to server
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (err) {
                console.error(`❌ Error parsing car ${carId}:`, err.message);
                continue;
            }
        }

        console.log(`✅ Successfully scraped ${cars.length} cars with full images and specs`);

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
        console.log(`💾 Saved ${cars.length} cars with images to ${outputPath}`);

    } catch (error) {
        console.error('❌ Error scraping SSancar:', error);
    }
}

scrapeSSancar();
