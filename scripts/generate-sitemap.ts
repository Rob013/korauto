import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SITE_URL = 'https://korauto.com'; // Replace with actual domain if different

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateSitemap() {
    console.log('🗺️ Generating sitemap...');

    // 1. Static Routes
    const staticRoutes = [
        '/',
        '/catalog',
        '/auctions',
        '/tracking',
        '/contact',
        '/about',
        '/faq'
    ];

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static routes
    staticRoutes.forEach(route => {
        sitemap += `  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;
    });

    // 2. Dynamic Routes (Cars)
    // Fetch active cars from cache
    const { data: cars, error } = await supabase
        .from('encar_cars_cache')
        .select('vehicle_id, updated_at')
        .eq('is_active', true);

    if (error) {
        console.error('❌ Error fetching cars for sitemap:', error);
    } else if (cars) {
        console.log(`🚗 Adding ${cars.length} cars to sitemap...`);
        cars.forEach(car => {
            sitemap += `  <url>
    <loc>${SITE_URL}/car/${car.vehicle_id}</loc>
    <lastmod>${new Date(car.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        });
    }

    sitemap += `</urlset>`;

    // Write to public/sitemap.xml
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
    console.log(`✅ Sitemap generated at ${path.join(publicDir, 'sitemap.xml')}`);
}

generateSitemap().catch(console.error);
