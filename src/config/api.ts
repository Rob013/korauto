/**
 * API Configuration
 * Controls which API endpoint the application uses
 */

import { SUPABASE_URL } from '@/integrations/supabase/client';

export const API_CONFIG = {
    /**
     * Set to true to use ONLY Supabase data (RECOMMENDED - FAST!)
     * Set to false to use external API proxy (slower, external dependency)
     */
    useSupabaseOnly: true,

    /**
     * Supabase-only endpoint (uses cars_cache table directly)
     * - 5-10x faster than external API
     * - No external dependencies
     * - No rate limiting issues
     */
    supabaseEndpoint: `${SUPABASE_URL}/functions/v1/supabase-cars-api`,

    /**
     * External API proxy endpoint (kept for backward compatibility)
     * - Slower due to external API calls
     * - Subject to rate limiting
     * - External dependency
     */
    externalEndpoint: `${SUPABASE_URL}/functions/v1/secure-cars-api`,

    /**
     * Get the active endpoint based on configuration
     */
    get endpoint() {
        return this.useSupabaseOnly ? this.supabaseEndpoint : this.externalEndpoint;
    },

    /**
     * Get a description of the active configuration
     */
    get description() {
        return this.useSupabaseOnly
            ? 'Using Supabase-only API (Fast & Independent)'
            : 'Using External API Proxy (Slower, External Dependency)';
    }
};

// Log the active configuration on startup
console.log(`🔧 API Configuration: ${API_CONFIG.description}`);
console.log(`📡 Active Endpoint: ${API_CONFIG.endpoint}`);
