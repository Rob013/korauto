
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'https://auctionsapi.com/api';
const API_KEY = 'd00985c77981fe8d26be16735f932ed1';

async function checkCount() {
    console.log('🔍 Checking API Total Count...');

    try {
        const url = `${API_BASE_URL}/cars?page=1&per_page=1&simple_paginate=0`;
        const response = await fetch(url, {
            headers: {
                'accept': 'application/json',
                'x-api-key': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const meta = data.meta || {};

        console.log('📊 API Metadata:');
        console.log(JSON.stringify(meta, null, 2));

        if (data.data && data.data.length > 0) {
            const sample = data.data[0];
            const buyNow = sample?.lots?.[0]?.buy_now || sample?.buy_now;
            console.log('\n📋 Sample Car Buy Now Price:', buyNow);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkCount();
