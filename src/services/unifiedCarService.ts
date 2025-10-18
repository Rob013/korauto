import { supabase } from '@/integrations/supabase/client';
import { AuctionsApiService } from './auctionsApiService';

export interface CarSource {
  id: string;
  name: string;
  apiKey?: string;
  enabled: boolean;
  priority: number; // Higher number = higher priority
}

export interface CarSyncStatus {
  source: string;
  lastSync: string | null;
  totalCars: number;
  activeCars: number;
  archivedCars: number;
  status: 'active' | 'error' | 'syncing' | 'disabled';
  error?: string;
}

export class UnifiedCarService {
  private sources: CarSource[] = [
    {
      id: 'auctionapis',
      name: 'Auction APIs',
      enabled: true,
      priority: 1
    },
    {
      id: 'auctions_api',
      name: 'Auctions API',
      enabled: true,
      priority: 2
    },
    {
      id: 'encar',
      name: 'Encar',
      enabled: true,
      priority: 3
    }
  ];

  /**
   * Get all cars from all enabled sources
   */
  async getAllCars(filters: any = {}): Promise<any[]> {
    console.log('🔄 Fetching cars from all sources...');
    
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_archived', false)
      .eq('is_active', true)
      .order('last_synced_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching cars:', error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} cars from database`);
    return data || [];
  }

  /**
   * Get cars by source
   */
  async getCarsBySource(source: string, filters: any = {}): Promise<any[]> {
    console.log(`🔄 Fetching cars from source: ${source}`);
    
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('source_api', source)
      .eq('is_archived', false)
      .eq('is_active', true)
      .order('last_synced_at', { ascending: false });

    if (error) {
      console.error(`❌ Error fetching cars from ${source}:`, error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} cars from ${source}`);
    return data || [];
  }

  /**
   * Get sync status for all sources
   */
  async getSyncStatus(): Promise<CarSyncStatus[]> {
    const statuses: CarSyncStatus[] = [];

    for (const source of this.sources) {
      if (!source.enabled) {
        statuses.push({
          source: source.id,
          lastSync: null,
          totalCars: 0,
          activeCars: 0,
          archivedCars: 0,
          status: 'disabled'
        });
        continue;
      }

      try {
        // Get car counts
        const { data: activeCars, error: activeError } = await supabase
          .from('cars')
          .select('id', { count: 'exact' })
          .eq('source_api', source.id)
          .eq('is_archived', false)
          .eq('is_active', true);

        const { data: archivedCars, error: archivedError } = await supabase
          .from('cars')
          .select('id', { count: 'exact' })
          .eq('source_api', source.id)
          .eq('is_archived', true);

        const { data: lastSyncData, error: lastSyncError } = await supabase
          .from('cars')
          .select('last_synced_at')
          .eq('source_api', source.id)
          .order('last_synced_at', { ascending: false })
          .limit(1)
          .single();

        statuses.push({
          source: source.id,
          lastSync: lastSyncData?.last_synced_at || null,
          totalCars: (activeCars?.length || 0) + (archivedCars?.length || 0),
          activeCars: activeCars?.length || 0,
          archivedCars: archivedCars?.length || 0,
          status: 'active'
        });

      } catch (error: any) {
        statuses.push({
          source: source.id,
          lastSync: null,
          totalCars: 0,
          activeCars: 0,
          archivedCars: 0,
          status: 'error',
          error: error.message
        });
      }
    }

    return statuses;
  }

  /**
   * Sync cars from a specific source
   */
  async syncSource(sourceId: string): Promise<void> {
    const source = this.sources.find(s => s.id === sourceId);
    if (!source || !source.enabled) {
      throw new Error(`Source ${sourceId} not found or disabled`);
    }

    console.log(`🔄 Syncing cars from source: ${source.name}`);

    switch (sourceId) {
      case 'auctions_api':
        await this.syncAuctionsAPI();
        break;
      case 'auctionapis':
        await this.syncAuctionAPIs();
        break;
      case 'encar':
        await this.syncEncar();
        break;
      default:
        throw new Error(`Unknown source: ${sourceId}`);
    }
  }

  /**
   * Sync from Auctions API
   */
  private async syncAuctionsAPI(): Promise<void> {
    const apiKey = process.env.AUCTIONS_API_KEY;
    if (!apiKey) {
      throw new Error('AUCTIONS_API_KEY not configured');
    }

    const auctionsApi = new AuctionsApiService({ apiKey });
    const allCars = await auctionsApi.fetchAllCars();

    // Transform and upsert cars
    const transformedCars = allCars.map(car => ({
      id: car.id,
      external_id: car.id,
      make: car.brand,
      model: car.model,
      year: car.year,
      price: 0,
      mileage: 0,
      title: `${car.brand} ${car.model} ${car.year}`,
      source_api: 'auctions_api',
      domain_name: 'auctionsapi_com',
      status: 'active',
      is_active: true,
      is_archived: false,
      last_synced_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('cars')
      .upsert(transformedCars, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      throw error;
    }

    console.log(`✅ Synced ${transformedCars.length} cars from Auctions API`);
  }

  /**
   * Sync from Auction APIs (existing)
   */
  private async syncAuctionAPIs(): Promise<void> {
    // This would call the existing sync logic
    console.log('🔄 Syncing from Auction APIs...');
    // Implementation would go here
  }

  /**
   * Sync from Encar
   */
  private async syncEncar(): Promise<void> {
    // This would call the existing Encar sync logic
    console.log('🔄 Syncing from Encar...');
    // Implementation would go here
  }

  /**
   * Archive old cars (24-hour rule)
   */
  async archiveOldCars(): Promise<number> {
    console.log('📦 Archiving cars not seen in the last 24 hours...');
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);
    
    const { data, error } = await supabase
      .from('cars')
      .update({ 
        is_archived: true,
        archived_at: new Date().toISOString()
      })
      .lt('last_synced_at', cutoffTime.toISOString())
      .eq('is_archived', false);
    
    if (error) {
      console.error('❌ Error archiving old cars:', error);
      throw error;
    }
    
    console.log(`✅ Archived ${data?.length || 0} old cars`);
    return data?.length || 0;
  }

  /**
   * Get car statistics
   */
  async getCarStatistics(): Promise<{
    totalCars: number;
    activeCars: number;
    archivedCars: number;
    bySource: Record<string, number>;
    byMake: Record<string, number>;
    byYear: Record<string, number>;
  }> {
    // Get total counts
    const { data: totalData } = await supabase
      .from('cars')
      .select('id', { count: 'exact' });

    const { data: activeData } = await supabase
      .from('cars')
      .select('id', { count: 'exact' })
      .eq('is_archived', false)
      .eq('is_active', true);

    const { data: archivedData } = await supabase
      .from('cars')
      .select('id', { count: 'exact' })
      .eq('is_archived', true);

    // Get by source
    const { data: sourceData } = await supabase
      .from('cars')
      .select('source_api')
      .eq('is_archived', false)
      .eq('is_active', true);

    // Get by make
    const { data: makeData } = await supabase
      .from('cars')
      .select('make')
      .eq('is_archived', false)
      .eq('is_active', true);

    // Get by year
    const { data: yearData } = await supabase
      .from('cars')
      .select('year')
      .eq('is_archived', false)
      .eq('is_active', true);

    const bySource = (sourceData || []).reduce((acc, car) => {
      acc[car.source_api] = (acc[car.source_api] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byMake = (makeData || []).reduce((acc, car) => {
      acc[car.make] = (acc[car.make] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byYear = (yearData || []).reduce((acc, car) => {
      acc[car.year?.toString() || 'Unknown'] = (acc[car.year?.toString() || 'Unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCars: totalData?.length || 0,
      activeCars: activeData?.length || 0,
      archivedCars: archivedData?.length || 0,
      bySource,
      byMake,
      byYear
    };
  }

  /**
   * Search cars across all sources
   */
  async searchCars(query: string, filters: any = {}): Promise<any[]> {
    console.log(`🔍 Searching cars with query: ${query}`);
    
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_archived', false)
      .eq('is_active', true)
      .or(`make.ilike.%${query}%,model.ilike.%${query}%,title.ilike.%${query}%,vin.ilike.%${query}%`)
      .order('last_synced_at', { ascending: false });

    if (error) {
      console.error('❌ Error searching cars:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} cars matching "${query}"`);
    return data || [];
  }
}

// Export singleton instance
export const unifiedCarService = new UnifiedCarService();
export default unifiedCarService;
