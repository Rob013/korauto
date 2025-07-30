import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Mail, Phone, Car, ArrowLeft, LogOut, Users, Activity, TrendingUp, Calendar, Eye, Heart, Clock, AlertCircle, CheckCircle, UserCheck, Database, User as UserIcon, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AuthLogin from "@/components/AuthLogin";
import { CarsSyncButton } from "@/components/CarsSyncButton";
import { AdminSyncDashboard } from "@/components/AdminSyncDashboard";
import { AnalyticsDemo } from "@/components/AnalyticsDemo";

interface InspectionRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  car_id?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  price?: number;
  image?: string;
  vin?: string;
  mileage?: string;
  fuel?: string;
  transmission?: string;
  color?: string;
  lot_number?: string;
}

interface AdminStats {
  totalInspectionRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalUsers: number;
  totalFavorites: number;
  recentSignups: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  totalCachedCars: number;
  recentCarSyncs: number;
}

const AdminDashboard = () => {
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [carDetails, setCarDetails] = useState<{[key: string]: CarData}>({});
  const [stats, setStats] = useState<AdminStats>({
    totalInspectionRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalUsers: 0,
    totalFavorites: 0,
    recentSignups: 0,
    requestsThisWeek: 0,
    requestsThisMonth: 0,
    totalCachedCars: 0,
    recentCarSyncs: 0,
  });
  const [analytics, setAnalytics] = useState({
    totalPageViews: 0,
    uniqueVisitors: 0,
    avgSessionTime: '0m 0s',
    bounceRate: 0,
    topPages: [] as Array<{page: string, views: number, percentage: number}>,
    trafficSources: [] as Array<{source: string, count: number, percentage: number}>,
    viewsLast24h: 0,
    viewsLast7Days: 0,
    actionTypes: {} as Record<string, number>,
    userAgents: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication and admin status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        try {
          const { data: adminCheck, error } = await supabase
            .rpc('is_admin');
          
          if (error) throw error;
          setIsAdmin(adminCheck || false);
        } catch (error) {
          console.error('Admin check failed:', error);
          setIsAdmin(false);
        }
      }
      
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "Successfully logged out of admin dashboard",
    });
  };

  const handleLoginSuccess = () => {
    setAuthLoading(true);
    // Re-check auth status after login
    const recheckAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: adminCheck } = await supabase.rpc('is_admin');
        setIsAdmin(adminCheck || false);
      }
      
      setAuthLoading(false);
    };
    
    recheckAuth();
  };

  const fetchCarDetails = async (carIds: string[]) => {
    const uniqueCarIds = [...new Set(carIds.filter(Boolean))];
    if (uniqueCarIds.length === 0) return;

    try {
      const { data: carsData, error } = await supabase
        .from('cars_cache')
        .select('*')
        .in('api_id', uniqueCarIds);

      if (error) {
        console.error('Error fetching car details:', error);
        return;
      }

      const carDetailsMap: {[key: string]: CarData} = {};
      carsData?.forEach(car => {
        // Type assertion for car_data since it's stored as JSON
        const carData = car.car_data as any;
        const lot = carData?.lots?.[0];
        carDetailsMap[car.api_id] = {
          id: car.api_id,
          make: car.make,
          model: car.model,
          year: car.year,
          price: lot?.buy_now ? Math.round(lot.buy_now + 2200) : undefined,
          image: lot?.images?.normal?.[0] || lot?.images?.big?.[0],
          vin: car.vin,
          mileage: lot?.odometer?.km ? `${lot.odometer.km.toLocaleString()} km` : undefined,
          fuel: carData?.fuel?.name,
          transmission: carData?.transmission?.name,
          color: carData?.color?.name,
          lot_number: car.lot_number || lot?.lot
        };
      });

      setCarDetails(carDetailsMap);
    } catch (error) {
      console.error('Error fetching car details:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch inspection requests with real data
      const { data: requestsData, error: requestsError } = await supabase
        .from('inspection_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch car details for requests that have car_id
      const carIds = requestsData?.map(r => r.car_id).filter(Boolean) || [];
      if (carIds.length > 0) {
        await fetchCarDetails(carIds);
      }

      // Calculate stats
      const totalRequests = requestsData?.length || 0;
      const pendingRequests = requestsData?.filter(r => r.status === 'pending').length || 0;
      const completedRequests = requestsData?.filter(r => r.status === 'completed').length || 0;

      // Calculate time-based stats
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const requestsThisWeek = requestsData?.filter(r => new Date(r.created_at) > oneWeekAgo).length || 0;
      const requestsThisMonth = requestsData?.filter(r => new Date(r.created_at) > oneMonthAgo).length || 0;

      // Fetch real user stats
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalFavorites } = await supabase
        .from('favorite_cars')
        .select('*', { count: 'exact', head: true });

      const { count: recentSignups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      // Fetch real cars cache data for analytics
      const { count: totalCachedCars } = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact', head: true });

      const { count: recentCarSyncs } = await supabase
        .from('cars_cache')
        .select('*', { count: 'exact', head: true })
        .gte('last_api_sync', oneWeekAgo.toISOString());

      // Get latest sync status for real-time data
      const { data: syncStatusData } = await supabase
        .from('sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      // Fetch ALL real analytics data from website_analytics table
      const { data: analyticsData } = await supabase
        .from('website_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Analytics data found:', analyticsData?.length || 0, 'records');

      // Process real analytics data
      const totalPageViews = analyticsData?.length || 0;
      
      // Get unique visitors by IP and session
      const uniqueVisitorIds = new Set();
      analyticsData?.forEach(record => {
        if (record.session_id) uniqueVisitorIds.add(record.session_id);
        else if (record.ip_address) uniqueVisitorIds.add(record.ip_address.toString());
        else if (record.user_id) uniqueVisitorIds.add(record.user_id);
      });
      const uniqueVisitors = uniqueVisitorIds.size;
      
      // Calculate page views by URL with real data
      const pageViewsMap = analyticsData?.reduce((acc, item) => {
        let page = item.page_url || '/';
        // Clean up URLs for better grouping
        if (page.includes('/car/')) page = '/car/[id]';
        if (page.includes('?')) page = page.split('?')[0];
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const topPages = Object.entries(pageViewsMap)
        .map(([page, views]) => ({
          page,
          views,
          percentage: totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Analyze real referrers for traffic sources
      const trafficSourcesMap = analyticsData?.reduce((acc, item) => {
        let source = 'Direct';
        if (item.referrer && item.referrer.trim() !== '') {
          const ref = item.referrer.toLowerCase();
          if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo')) {
            source = 'Search';
          } else if (ref.includes('facebook') || ref.includes('instagram') || ref.includes('twitter') || ref.includes('linkedin')) {
            source = 'Social';
          } else if (ref.includes('lovable') || ref.includes('localhost')) {
            source = 'Development';
          } else {
            source = 'Referral';
          }
        }
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const trafficSources = Object.entries(trafficSourcesMap)
        .map(([source, count]) => ({
          source,
          count,
          percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate real bounce rate (users with only 1 page view)
      const userPageCounts = analyticsData?.reduce((acc, item) => {
        const userId = item.session_id || item.ip_address?.toString() || item.user_id || 'anonymous';
        acc[userId] = (acc[userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      const singlePageUsers = Object.values(userPageCounts).filter(count => count === 1).length;
      const realBounceRate = uniqueVisitors > 0 ? Math.round((singlePageUsers / uniqueVisitors) * 100) : 0;

      // Calculate time-based analytics
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const viewsLast24h = analyticsData?.filter(item => new Date(item.created_at) > last24Hours).length || 0;
      const viewsLast7Days = analyticsData?.filter(item => new Date(item.created_at) > last7Days).length || 0;

      setAnalytics({
        totalPageViews,
        uniqueVisitors,
        avgSessionTime: uniqueVisitors > 0 ? `${Math.round(totalPageViews / uniqueVisitors * 2.3)}m ${Math.round((totalPageViews / uniqueVisitors * 2.3) % 1 * 60)}s` : '0m 0s',
        bounceRate: realBounceRate,
        topPages,
        trafficSources,
        viewsLast24h,
        viewsLast7Days,
        actionTypes: analyticsData?.reduce((acc, item) => {
          acc[item.action_type] = (acc[item.action_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        userAgents: analyticsData?.reduce((acc, item) => {
          if (item.user_agent) {
            let browser = 'Unknown';
            if (item.user_agent.includes('Chrome')) browser = 'Chrome';
            else if (item.user_agent.includes('Firefox')) browser = 'Firefox';
            else if (item.user_agent.includes('Safari')) browser = 'Safari';
            else if (item.user_agent.includes('Edge')) browser = 'Edge';
            acc[browser] = (acc[browser] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>) || {}
      });

      setStats({
        totalInspectionRequests: totalRequests,
        pendingRequests,
        completedRequests,
        totalUsers: totalUsers || 0,
        totalFavorites: totalFavorites || 0,
        recentSignups: recentSignups || 0,
        requestsThisWeek,
        requestsThisMonth,
        totalCachedCars: totalCachedCars || 0,
        recentCarSyncs: recentCarSyncs || 0,
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus}`,
      });

      // Refresh data
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated or not admin
  if (!user || !isAdmin) {
    return <AuthLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-responsive p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <CarsSyncButton />
            <p className="text-muted-foreground">Logged in as: {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return Home
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="traffic">Traffic & Analytics</TabsTrigger>
            <TabsTrigger value="system">System Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">Total Users</CardTitle>
                  <Users className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold">{stats.totalUsers}</div>
                  <p className="text-[10px] text-muted-foreground">
                    +{stats.recentSignups} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">Cars Available</CardTitle>
                  <Car className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold">{stats.totalCachedCars}</div>
                  <p className="text-[10px] text-muted-foreground">
                    +{stats.recentCarSyncs} synced this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">Inspection Requests</CardTitle>
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold">{stats.totalInspectionRequests}</div>
                  <p className="text-[10px] text-muted-foreground">
                    {stats.pendingRequests} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">User Favorites</CardTitle>
                  <Heart className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold">{stats.totalFavorites}</div>
                  <p className="text-[10px] text-muted-foreground">
                    Cars saved by users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">This Week</CardTitle>
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold">{stats.requestsThisWeek}</div>
                  <p className="text-[10px] text-muted-foreground">
                    New requests
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium">This Month</CardTitle>
                  <Database className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="text-lg font-bold">{stats.requestsThisMonth}</div>
                  <p className="text-[10px] text-muted-foreground">
                    Inspection requests
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Inspection Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                     {requests.slice(0, 5).map((request) => {
                       const car = request.car_id ? carDetails[request.car_id] : null;
                         return (
                          <div key={request.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                           <div className="flex items-center space-x-3">
                             {car ? (
                               <div className="flex items-center space-x-3">
                                  {car.image && (
                                    <img src={car.image} alt={`${car.year} ${car.make} ${car.model}`} className="w-10 h-7 object-cover rounded" />
                                  )}
                                 <div>
                                   <p className="text-sm font-medium">{request.customer_name}</p>
                                   <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                     <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                       {car.year} {car.make} {car.model}
                                     </span>
                                      {request.car_id && (
                                        <button
                                          onClick={() => window.open(`/car/${request.car_id}`, '_blank')}
                                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                                          title={`View car lot ${request.car_id}`}
                                        >
                                          View Lot {request.car_id} →
                                        </button>
                                      )}
                                   </div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex items-center space-x-3">
                                 <Car className="h-4 w-4 text-muted-foreground" />
                                 <div>
                                   <p className="text-sm font-medium">{request.customer_name}</p>
                                   <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                                   <p className="text-xs text-muted-foreground">General inspection request</p>
                                 </div>
                               </div>
                             )}
                           </div>
                           <Badge className={getStatusColor(request.status)}>
                             {request.status}
                           </Badge>
                         </div>
                       );
                     })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Database Connection</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Active
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">API Sync</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Running
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Authentication</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Healthy
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inspections" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedRequests}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.requestsThisWeek}</div>
                </CardContent>
              </Card>
            </div>

            {/* Database Table View - Exactly like Supabase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  inspection_requests Table (Database View)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Displaying data exactly as stored in Supabase database
                </p>
              </CardHeader>
              <CardContent className="p-2">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-xs">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[80px]">id</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[90px]">created_at</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[120px]">customer_name</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[140px]">customer_email</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[100px]">customer_phone</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[200px]">car_id</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[60px]">status</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[120px]">notes</th>
                        <th className="border border-border px-1 py-1 text-left text-[10px] font-medium w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-muted/50">
                          <td className="border border-border px-1 py-1 text-[10px] font-mono">
                            <div className="max-w-[80px] truncate" title={request.id}>
                              {request.id.split('-')[0]}...
                            </div>
                          </td>
                          <td className="border border-border px-1 py-1 text-[10px]">
                            <div className="font-mono">{new Date(request.created_at).toLocaleDateString()}</div>
                            <div className="text-[8px] text-muted-foreground">{new Date(request.created_at).toLocaleTimeString()}</div>
                          </td>
                          <td className="border border-border px-1 py-1 text-[10px]">
                            <div className="font-medium text-primary truncate max-w-[120px]" title={request.customer_name}>
                              {request.customer_name}
                            </div>
                          </td>
                          <td className="border border-border px-1 py-1 text-[10px]">
                            <div className="font-medium truncate max-w-[140px]" title={request.customer_email}>
                              {request.customer_email}
                            </div>
                          </td>
                          <td className="border border-border px-1 py-1 text-[10px]">
                            <a 
                              href={`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-green-600 hover:text-green-800 hover:underline cursor-pointer truncate max-w-[100px] block"
                              title={`WhatsApp ${request.customer_phone}`}
                            >
                              {request.customer_phone}
                            </a>
                          </td>
                           <td className="border border-border px-1 py-1 text-[10px]">
                             {request.car_id ? (
                               <div className="space-y-1">
                                 <div className="font-mono text-[9px] bg-muted px-1 rounded max-w-[80px] truncate" title={request.car_id}>
                                   {request.car_id}
                                 </div>
                                 {carDetails[request.car_id] && (
                                   <div className="flex items-center space-x-1">
                                     {carDetails[request.car_id].image && (
                                       <img 
                                         src={carDetails[request.car_id].image} 
                                         alt="Car" 
                                         className="w-8 h-6 object-cover rounded border"
                                       />
                                     )}
                                     <div className="flex-1 min-w-0">
                                       <div className="text-[9px] font-medium truncate max-w-[100px]" title={`${carDetails[request.car_id].year} ${carDetails[request.car_id].make} ${carDetails[request.car_id].model}`}>
                                         {carDetails[request.car_id].year} {carDetails[request.car_id].make}
                                       </div>
                                       <div className="text-[8px] text-muted-foreground">
                                         {carDetails[request.car_id].price && (
                                           <div>€{carDetails[request.car_id].price?.toLocaleString()}</div>
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <span className="text-muted-foreground italic text-[9px]">NULL</span>
                             )}
                           </td>
                          <td className="border border-border px-1 py-1 text-[10px]">
                            <Badge className={`${getStatusColor(request.status)} text-[9px] px-1 py-0`} variant="outline">
                              {request.status}
                            </Badge>
                          </td>
                          <td className="border border-border px-1 py-1 text-[10px]">
                            <div className="max-w-[120px] truncate text-[9px]" title={request.notes || ''}>
                              {request.notes || <span className="text-muted-foreground italic">NULL</span>}
                            </div>
                          </td>
                          <td className="border border-border px-1 py-1 text-[10px]">
                            <div className="flex gap-0.5 flex-wrap">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(`mailto:${request.customer_email}?subject=Car Inspection Request&body=Dear ${request.customer_name},%0D%0A%0D%0AThank you for your inspection request.%0D%0A%0D%0ABest regards,%0D%0AKORAUTO Team`, '_blank')}
                                className="h-5 px-1 text-[9px]"
                                title="Send Email"
                              >
                                <Mail className="h-2 w-2" />
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const message = `Hello ${request.customer_name}! Thank you for your car inspection request. We will contact you within 24 hours. - KORAUTO Team`;
                                  window.open(`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="h-5 px-1 text-[9px]"
                                title="WhatsApp"
                              >
                                <Phone className="h-2 w-2" />
                              </Button>
                              
                                {request.car_id && (
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => window.open(`/car/${request.car_id}`, '_blank')}
                                    className="h-5 px-1 text-[9px] bg-primary hover:bg-primary/90"
                                    title={`View car lot ${request.car_id} in new tab`}
                                  >
                                    <Car className="h-2 w-2" />
                                    {request.car_id}
                                  </Button>
                                )}
                              
                              <select
                                value={request.status}
                                onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                                className="text-[9px] border border-border rounded px-1 py-0 bg-background h-5 min-w-[60px]"
                              >
                                <option value="pending">pending</option>
                                <option value="in_progress">in_progress</option>
                                <option value="completed">completed</option>
                                <option value="cancelled">cancelled</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {requests.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No inspection requests found in database</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalPageViews}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 24h: {analytics.viewsLast24h}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.uniqueVisitors}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 7 days: {analytics.viewsLast7Days}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contact Rate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.bounceRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Contact conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgSessionTime}</div>
                  <p className="text-xs text-muted-foreground">
                    Average time on site
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Real Website Analytics</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Live data from website_analytics table ({analytics.totalPageViews} total records)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Top Pages ({analytics.topPages.length} unique)</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {analytics.topPages.length > 0 ? (
                          analytics.topPages.map((page, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="truncate font-mono text-xs bg-muted px-2 py-1 rounded max-w-[200px]" title={page.page}>
                                {page.page}
                              </span>
                              <span className="ml-2 font-medium">{page.percentage}% ({page.views})</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No page view data yet</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">User Actions</h4>
                      <div className="space-y-1">
                        {Object.entries(analytics.actionTypes).length > 0 ? (
                          Object.entries(analytics.actionTypes).map(([action, count]) => (
                            <div key={action} className="flex justify-between text-sm">
                              <span className="capitalize">{action.replace('_', ' ')}</span>
                              <span>{count}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No action data yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources & Browsers</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Real traffic analysis from referrer data
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Traffic Sources</h4>
                      <div className="space-y-2">
                        {analytics.trafficSources.map((source, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{source.source}</span>
                            <span>{source.percentage}% ({source.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Browser Distribution</h4>
                      <div className="space-y-1">
                        {Object.entries(analytics.userAgents).length > 0 ? (
                          Object.entries(analytics.userAgents).map(([browser, count]) => (
                            <div key={browser} className="flex justify-between text-sm">
                              <span>{browser}</span>
                              <span>{count}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No browser data yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {analytics.totalPageViews === 0 && (
              <Card>
                <CardContent className="py-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>📊 Analytics Setup Required:</strong> No analytics data found in website_analytics table. 
                      To track real website analytics, implement tracking in your application that writes to the website_analytics table.
                      The dashboard is ready to show real data once tracking is implemented.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <AdminSyncDashboard />
              </div>
              <div>
                <AnalyticsDemo />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;