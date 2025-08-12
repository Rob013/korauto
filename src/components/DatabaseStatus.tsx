import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Database, Search } from 'lucide-react';

interface DatabaseStats {
  totalCars: number;
  activeCars: number;
  inactiveCars: number;
  externalCars: number;
  recentlySynced: number;
  lastSyncTime: string | null;
}

interface SearchTest {
  working: boolean;
  totalAvailable: number;
  error?: string;
}

const DatabaseStatus = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [searchTest, setSearchTest] = useState<SearchTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDatabaseStats();
    testSearchFunctionality();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
      
      // Get total cars
      const { count: totalCars, error: totalError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;

      // Get active cars
      const { count: activeCars, error: activeError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (activeError) throw activeError;

      // Get inactive cars
      const { count: inactiveCars, error: inactiveError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);
      
      if (inactiveError) throw inactiveError;

      // Get external API cars
      const { count: externalCars, error: externalError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('source_api', 'external');
      
      if (externalError) throw externalError;

      // Get recently synced cars (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: recentlySynced, error: recentError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .gte('last_synced_at', yesterday);
      
      if (recentError) throw recentError;

      // Get last sync time
      const { data: lastSyncData, error: lastSyncError } = await supabase
        .from('cars')
        .select('last_synced_at')
        .order('last_synced_at', { ascending: false })
        .limit(1);
      
      if (lastSyncError) throw lastSyncError;

      setStats({
        totalCars: totalCars || 0,
        activeCars: activeCars || 0,
        inactiveCars: inactiveCars || 0,
        externalCars: externalCars || 0,
        recentlySynced: recentlySynced || 0,
        lastSyncTime: lastSyncData?.[0]?.last_synced_at || null
      });

    } catch (err: any) {
      console.error('Error loading database stats:', err);
      setError(err.message || 'Failed to load database statistics');
    } finally {
      setLoading(false);
    }
  };

  const testSearchFunctionality = async () => {
    try {
      const { data: searchResult, error: searchError } = await supabase
        .rpc('cars_search_sorted', {
          req: {
            q: '',
            filters: {},
            sort: { field: 'year', dir: 'desc' },
            page: 1,
            pageSize: 5,
            mode: 'results'
          }
        });

      if (searchError) {
        setSearchTest({
          working: false,
          totalAvailable: 0,
          error: searchError.message
        });
      } else {
        setSearchTest({
          working: true,
          totalAvailable: searchResult?.total || 0
        });
      }
    } catch (err: any) {
      setSearchTest({
        working: false,
        totalAvailable: 0,
        error: err.message || 'Search test failed'
      });
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (condition: boolean, text: string) => {
    return (
      <Badge variant={condition ? 'default' : 'destructive'}>
        {text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">Loading database statistics...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Database Status - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const targetMet = stats.totalCars >= 190000;
  const searchWorking = searchTest?.working === true;
  const recentSync = stats.recentlySynced > 0;
  
  const lastSyncTime = stats.lastSyncTime ? new Date(stats.lastSyncTime) : null;
  const hoursAgo = lastSyncTime ? Math.round((Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60)) : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            KorAuto Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span>190k+ Cars Target</span>
              {getStatusBadge(targetMet, targetMet ? 'MET' : 'BELOW TARGET')}
            </div>
            <div className="flex items-center justify-between">
              <span>Search Functionality</span>
              {getStatusBadge(searchWorking, searchWorking ? 'WORKING' : 'BROKEN')}
            </div>
            <div className="flex items-center justify-between">
              <span>Recent Sync Activity</span>
              {getStatusBadge(recentSync, recentSync ? 'ACTIVE' : 'STALE')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Car Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Car Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalCars.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Cars</div>
              <div className="mt-1">
                {getStatusIcon(stats.totalCars >= 190000)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.activeCars.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Active Cars</div>
              <div className="text-xs text-gray-500">
                {Math.round((stats.activeCars / stats.totalCars) * 100)}%
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.inactiveCars.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Inactive Cars</div>
              <div className="text-xs text-gray-500">Sold/Removed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.externalCars.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">External API</div>
              <div className="text-xs text-gray-500">From API Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Functionality Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          {searchTest ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(searchTest.working)}
                <span>
                  Search function is {searchTest.working ? 'working correctly' : 'not working'}
                </span>
              </div>
              {searchTest.working ? (
                <div className="text-sm text-gray-600">
                  Cars available through search: {searchTest.totalAvailable.toLocaleString()}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Error: {searchTest.error}
                </div>
              )}
            </div>
          ) : (
            <div>Testing search functionality...</div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Recently Synced Cars (24h)</span>
              <span className="font-mono">{stats.recentlySynced.toLocaleString()}</span>
            </div>
            {lastSyncTime && hoursAgo !== null && (
              <div className="flex items-center justify-between">
                <span>Last Sync Time</span>
                <span className="text-sm">
                  {lastSyncTime.toLocaleDateString()} {lastSyncTime.toLocaleTimeString()}
                  <span className="text-gray-500 ml-2">({hoursAgo}h ago)</span>
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseStatus;