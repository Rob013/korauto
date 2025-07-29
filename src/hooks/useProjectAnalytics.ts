import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalUsers: number;
  totalCars: number;
  totalFavorites: number;
  totalInspectionRequests: number;
  recentSignups: number;
  recentFavorites: number;
  recentRequests: number;
  topCars: any[];
  userActivity: any[];
  systemHealth: {
    databaseStatus: 'healthy' | 'warning' | 'error';
    apiStatus: 'healthy' | 'warning' | 'error';
    lastSyncTime: string | null;
  };
}

export const useProjectAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalCars: 0,
    totalFavorites: 0,
    totalInspectionRequests: 0,
    recentSignups: 0,
    recentFavorites: 0,
    recentRequests: 0,
    topCars: [],
    userActivity: [],
    systemHealth: {
      databaseStatus: 'healthy',
      apiStatus: 'healthy',
      lastSyncTime: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get time ranges
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [
        { count: totalUsers },
        { count: totalCars },
        { count: totalFavorites },
        { count: totalInspectionRequests },
        { count: recentSignups },
        { count: recentFavorites },
        { count: recentRequests },
        { data: topFavoritedCars },
        { data: recentActivity },
        { data: syncStatus }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('cars_cache').select('*', { count: 'exact', head: true }),
        supabase.from('favorite_cars').select('*', { count: 'exact', head: true }),
        supabase.from('inspection_requests').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('favorite_cars').select('*', { count: 'exact', head: true }).gte('created_at', twentyFourHoursAgo.toISOString()),
        supabase.from('inspection_requests').select('*', { count: 'exact', head: true }).gte('created_at', twentyFourHoursAgo.toISOString()),
        supabase.from('favorite_cars').select('car_id, count(*)', { count: 'exact' }).order('count', { ascending: false }).limit(5),
        supabase.from('inspection_requests').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('sync_status').select('*').order('created_at', { ascending: false }).limit(1)
      ]);

      // Determine system health
      const lastSync = syncStatus?.[0];
      const lastSyncTime = lastSync?.last_activity_at || lastSync?.created_at;
      const isRecentSync = lastSyncTime && new Date(lastSyncTime) > twentyFourHoursAgo;
      
      setAnalytics({
        totalUsers: totalUsers || 0,
        totalCars: totalCars || 0,
        totalFavorites: totalFavorites || 0,
        totalInspectionRequests: totalInspectionRequests || 0,
        recentSignups: recentSignups || 0,
        recentFavorites: recentFavorites || 0,
        recentRequests: recentRequests || 0,
        topCars: topFavoritedCars || [],
        userActivity: recentActivity || [],
        systemHealth: {
          databaseStatus: 'healthy',
          apiStatus: isRecentSync ? 'healthy' : 'warning',
          lastSyncTime: lastSyncTime || null
        }
      });

      setError(null);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics
  };
};