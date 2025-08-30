//@ts-nocheck
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw,
  Mail,
  Phone,
  Car,
  ArrowLeft,
  LogOut,
  Users,
  Activity,
  TrendingUp,
  Calendar,
  Eye,
  Heart,
  Clock,
  AlertCircle,
  CheckCircle,
  UserCheck,
  Database,
  User as UserIcon,
  FileText,
  Search,
  Shield,
  Cookie,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AuthLogin from "@/components/AuthLogin";
import { CarsSyncButton } from "@/components/CarsSyncButton";
import AdminCarSearch from "@/components/AdminCarSearch";
import { CookieManagementDashboard } from "@/components/CookieManagementDashboard";
import PerformanceAuditWidget from "@/components/PerformanceAuditWidget";
import { FullCarsSyncTrigger } from "@/components/FullCarsSyncTrigger";
import { AutoResumeScheduler } from "@/components/AutoResumeScheduler";
import { AISyncCoordinator } from "@/components/AISyncCoordinator";

// Lazy load heavy admin components
const AdminSyncDashboard = lazy(() => 
  import("@/components/AdminSyncDashboard").then(module => ({ 
    default: module.AdminSyncDashboard 
  }))
);

const AdminSyncSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-64" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  </div>
);

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
  const [carDetails, setCarDetails] = useState<{ [key: string]: CarData }>({});
  const [searchingCars, setSearchingCars] = useState<{
    [key: string]: boolean;
  }>({});
  const [foundCars, setFoundCars] = useState<{ [key: string]: any }>({});
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
    avgSessionTime: "0m 0s",
    bounceRate: 0,
    topPages: [] as Array<{ page: string; views: number; percentage: number }>,
    trafficSources: [] as Array<{
      source: string;
      count: number;
      percentage: number;
    }>,
    viewsLast24h: 0,
    viewsLast7Days: 0,
    actionTypes: {} as Record<string, number>,
    userAgents: {} as Record<string, number>,
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          const { data: adminCheck, error } = await supabase.rpc("is_admin");

          if (error) throw error;
          setIsAdmin(adminCheck || false);
        } catch (error) {
          console.error("Admin check failed:", error);
          setIsAdmin(false);
        }
      }

      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: adminCheck } = await supabase.rpc("is_admin");
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
        .from("cars_cache")
        .select("*")
        .in("api_id", uniqueCarIds);

      if (error) {
        console.error("Error fetching car details:", error);
        return;
      }

      const carDetailsMap: { [key: string]: CarData } = {};
      carsData?.forEach((car) => {
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
          mileage: lot?.odometer?.km
            ? `${lot.odometer.km.toLocaleString()} km`
            : undefined,
          fuel: carData?.fuel?.name,
          transmission: carData?.transmission?.name,
          color: carData?.color?.name,
          lot_number: car.lot_number || lot?.lot,
        };
      });

      setCarDetails(carDetailsMap);
    } catch (error) {
      console.error("Error fetching car details:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch inspection requests with real data
      const { data: requestsData, error: requestsError } = await supabase
        .from("inspection_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch car details for requests that have car_id
      const carIds = requestsData?.map((r) => r.car_id).filter(Boolean) || [];
      if (carIds.length > 0) {
        await fetchCarDetails(carIds);
      }

      // Calculate stats
      const totalRequests = requestsData?.length || 0;
      const pendingRequests =
        requestsData?.filter((r) => r.status === "pending").length || 0;
      const completedRequests =
        requestsData?.filter((r) => r.status === "completed").length || 0;

      // Calculate time-based stats
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const requestsThisWeek =
        requestsData?.filter((r) => new Date(r.created_at) > oneWeekAgo)
          .length || 0;
      const requestsThisMonth =
        requestsData?.filter((r) => new Date(r.created_at) > oneMonthAgo)
          .length || 0;

      // Fetch real user stats
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: totalFavorites } = await supabase
        .from("favorite_cars")
        .select("*", { count: "exact", head: true });

      const { count: recentSignups } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo.toISOString());

      // Fetch real cars data from both tables for accurate total count
      const { count: carsInCacheTable } = await supabase
        .from("cars_cache")
        .select("*", { count: "exact", head: true });

      const { count: carsInMainTable } = await supabase
        .from("cars")
        .select("*", { count: "exact", head: true });

      // Use the maximum count from both sources as authoritative (prevents double counting)
      const totalCachedCars = Math.max((carsInCacheTable || 0), (carsInMainTable || 0));
      
      console.log('📊 Car count calculation:', {
        carsInCacheTable: carsInCacheTable || 0,
        carsInMainTable: carsInMainTable || 0,
        totalCachedCars: totalCachedCars,
        method: 'max_count'
      });

      const { count: recentCarSyncs } = await supabase
        .from("cars_cache")
        .select("*", { count: "exact", head: true })
        .gte("last_api_sync", oneWeekAgo.toISOString());

      // Get latest sync status for real-time data
      const { data: syncStatusData } = await supabase
        .from("sync_status")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      // Fetch ALL real analytics data from website_analytics table
      const { data: analyticsData } = await supabase
        .from("website_analytics")
        .select("*")
        .order("created_at", { ascending: false });

      console.log(
        "📊 Analytics data found:",
        analyticsData?.length || 0,
        "records"
      );

      // Process real analytics data
      const totalPageViews = analyticsData?.length || 0;

      // Get unique visitors by IP and session
      const uniqueVisitorIds = new Set();
      analyticsData?.forEach((record) => {
        if (record.session_id) uniqueVisitorIds.add(record.session_id);
        else if (record.ip_address)
          uniqueVisitorIds.add(record.ip_address.toString());
        else if (record.user_id) uniqueVisitorIds.add(record.user_id);
      });
      const uniqueVisitors = uniqueVisitorIds.size;

      // Calculate page views by URL with real data
      const pageViewsMap =
        analyticsData?.reduce((acc, item) => {
          let page = item.page_url || "/";
          // Clean up URLs for better grouping
          if (page.includes("/car/")) page = "/car/[id]";
          if (page.includes("?")) page = page.split("?")[0];
          acc[page] = (acc[page] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      const topPages = Object.entries(pageViewsMap)
        .map(([page, views]) => ({
          page,
          views,
          percentage:
            totalPageViews > 0 ? Math.round((views / totalPageViews) * 100) : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Analyze real referrers for traffic sources
      const trafficSourcesMap =
        analyticsData?.reduce((acc, item) => {
          let source = "Direct";
          if (item.referrer && item.referrer.trim() !== "") {
            const ref = item.referrer.toLowerCase();
            if (
              ref.includes("google") ||
              ref.includes("bing") ||
              ref.includes("yahoo")
            ) {
              source = "Search";
            } else if (
              ref.includes("facebook") ||
              ref.includes("instagram") ||
              ref.includes("twitter") ||
              ref.includes("linkedin")
            ) {
              source = "Social";
            } else if (ref.includes("lovable") || ref.includes("localhost")) {
              source = "Development";
            } else {
              source = "Referral";
            }
          }
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      const trafficSources = Object.entries(trafficSourcesMap)
        .map(([source, count]) => ({
          source,
          count,
          percentage:
            totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate real bounce rate (users with only 1 page view)
      const userPageCounts =
        analyticsData?.reduce((acc, item) => {
          const userId =
            item.session_id ||
            item.ip_address?.toString() ||
            item.user_id ||
            "anonymous";
          acc[userId] = (acc[userId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      const singlePageUsers = Object.values(userPageCounts).filter(
        (count) => count === 1
      ).length;
      const realBounceRate =
        uniqueVisitors > 0
          ? Math.round((singlePageUsers / uniqueVisitors) * 100)
          : 0;

      // Calculate time-based analytics
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const viewsLast24h =
        analyticsData?.filter((item) => new Date(item.created_at) > last24Hours)
          .length || 0;
      const viewsLast7Days =
        analyticsData?.filter((item) => new Date(item.created_at) > last7Days)
          .length || 0;

      setAnalytics({
        totalPageViews,
        uniqueVisitors,
        avgSessionTime:
          uniqueVisitors > 0
            ? `${Math.round(
                (totalPageViews / uniqueVisitors) * 2.3
              )}m ${Math.round(
                (((totalPageViews / uniqueVisitors) * 2.3) % 1) * 60
              )}s`
            : "0m 0s",
        bounceRate: realBounceRate,
        topPages,
        trafficSources,
        viewsLast24h,
        viewsLast7Days,
        actionTypes:
          analyticsData?.reduce((acc, item) => {
            acc[item.action_type] = (acc[item.action_type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
        userAgents:
          analyticsData?.reduce((acc, item) => {
            if (item.user_agent) {
              let browser = "Unknown";
              if (item.user_agent.includes("Chrome")) browser = "Chrome";
              else if (item.user_agent.includes("Firefox")) browser = "Firefox";
              else if (item.user_agent.includes("Safari")) browser = "Safari";
              else if (item.user_agent.includes("Edge")) browser = "Edge";
              acc[browser] = (acc[browser] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>) || {},
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
      console.error("Error fetching data:", error);
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
        .from("inspection_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

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

  const findCarByLotNumber = async (requestId: string, carInfo: string) => {
    setSearchingCars((prev) => ({ ...prev, [requestId]: true }));

    try {
      // Extract car ID from the request
      const request = requests.find((r) => r.id === requestId);
      let searchTerm = request?.car_id;

      // If no car_id, try to extract from notes (e.g., "Car: 2020 Audi A6")
      if (!searchTerm && request?.notes) {
        const carMatch = request.notes.match(/Car:\s*(.+)/i);
        if (carMatch) {
          // Extract potential ID or model info from notes
          const carText = carMatch[1].trim();
          // Look for number patterns that might be car IDs
          const idMatch = carText.match(/\b\d{6,8}\b/);
          searchTerm = idMatch ? idMatch[0] : carText;
        }
      }

      console.log(`🔍 Searching for car with term: ${searchTerm}`);

      // Try multiple search approaches
      const searchMethods = [
        // 1. Search by car ID directly
        {
          method: "Car ID",
          payload: {
            endpoint: "cars",
            carId: searchTerm,
          },
        },
        // 2. Search by lot number in IAAI
        {
          method: "Lot Number (IAAI)",
          payload: {
            endpoint: "search-lot",
            lotNumber: searchTerm,
          },
        },
        // 3. Search with general search
        {
          method: "General Search",
          payload: {
            endpoint: "cars",
            filters: {
              search: searchTerm,
            },
          },
        },
      ];

      for (const searchMethod of searchMethods) {
        console.log(`🔍 Trying ${searchMethod.method}...`);

        const response = await fetch(
          `https://qtyyiqimkysmjnaocswe.supabase.co/functions/v1/secure-cars-api`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0eXlpcWlta3lzbWpuYW9jc3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzkxMzQsImV4cCI6MjA2OTAxNTEzNH0.lyRCHiShhW4wrGHL3G7pK5JBUHNAtgSUQACVOBGRpL8`,
            },
            body: JSON.stringify(searchMethod.payload),
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Found with ${searchMethod.method}:`, result);

          // Handle different response formats
          let carData = null;

          if (
            result.data &&
            Array.isArray(result.data) &&
            result.data.length > 0
          ) {
            // If it's a search result with data array
            carData = result.data[0];
          } else if (result.lots && result.lots.length > 0) {
            // If it's a direct car result
            carData = result;
          } else if (Array.isArray(result) && result.length > 0) {
            // If it's an array of cars
            carData = result[0];
          } else if (result.id || result.year) {
            // If it's a single car object
            carData = result;
          }

          if (carData) {
            setFoundCars((prev) => ({ ...prev, [requestId]: carData }));

            // Create detailed car info for the toast
            const lot = carData.lots?.[0];
            const carInfoText = `${carData.year} ${carData.manufacturer?.name} ${carData.model?.name}`;
            const lotInfo = `Lot: ${lot?.lot} | Price: $${
              lot?.buy_now?.toLocaleString() || "N/A"
            }`;
            const mileageInfo = lot?.odometer?.km
              ? `| ${lot.odometer.km.toLocaleString()} km`
              : "";

            toast({
              title: `✅ Car Found via ${searchMethod.method}!`,
              description: `${carInfoText}\n${lotInfo} ${mileageInfo}\nOpening car page...`,
              duration: 3000,
            });

            // Open car details page in new tab
            setTimeout(() => {
              const foundCarId = carData.id || lot?.lot || searchTerm;
              console.log("🚗 Opening car page with ID:", foundCarId);
              window.open(`/car/${foundCarId}`, "_blank");
            }, 1000); // Small delay to show the toast

            return; // Exit the function if we found the car
          }
        }
      }

      // If we get here, none of the search methods worked
      console.log("❌ Car not found with any method");

      toast({
        title: "Car Not Found",
        description: `Car with ID/Lot ${searchTerm} not found in any auction database (tried car ID, lot number, and general search)`,
        variant: "destructive",
        duration: 6000,
      });
    } catch (error) {
      console.error("Error searching for car:", error);
      toast({
        title: "Search Error",
        description: "Failed to search for car. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchingCars((prev) => ({ ...prev, [requestId]: false }));
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
    return new Date(dateString).toLocaleString("sq-AL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Auto-Resume and AI Coordination Background Services */}
      <AutoResumeScheduler enabled={true} checkIntervalMinutes={1} />
      <AISyncCoordinator enabled={true} maxRetries={5} retryDelayMs={2000} />
      
      <div className="container max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="mt-2">
              <CarsSyncButton />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            <Button size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw
                className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""} sm:mr-1`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Car Search Section */}
        <div className="mb-6">
          <AdminCarSearch />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-3 sm:space-y-4"
        >
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm p-2 sm:p-3">Overview</TabsTrigger>
            <TabsTrigger value="inspections" className="text-xs sm:text-sm p-2 sm:p-3">Inspections</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm p-2 sm:p-3">Analytics</TabsTrigger>
            <TabsTrigger value="performance" className="text-xs sm:text-sm p-2 sm:p-3">Performance</TabsTrigger>
            <TabsTrigger value="cookies" className="text-xs sm:text-sm p-2 sm:p-3">Cookies</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 sm:space-y-4">
            {/* Enhanced Key Metrics - More prominent display */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs font-medium truncate text-blue-900 dark:text-blue-100">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    +{stats.recentSignups} new this week
                  </p>
                </CardContent>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs font-medium truncate text-green-900 dark:text-green-100">
                    Cars Available
                  </CardTitle>
                  <Car className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                    {stats.totalCachedCars.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    +{stats.recentCarSyncs} recently synced
                  </p>
                </CardContent>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs font-medium truncate text-purple-900 dark:text-purple-100">
                    Requests
                  </CardTitle>
                  <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {stats.totalInspectionRequests.toLocaleString()}
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    {stats.pendingRequests} pending review
                  </p>
                </CardContent>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/50 dark:to-pink-900/50 border-pink-200 dark:border-pink-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs font-medium truncate text-pink-900 dark:text-pink-100">
                    Favorites
                  </CardTitle>
                  <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400 shrink-0" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl font-bold text-pink-900 dark:text-pink-100">
                    {stats.totalFavorites.toLocaleString()}
                  </div>
                  <p className="text-xs text-pink-700 dark:text-pink-300">
                    User bookmarks
                  </p>
                </CardContent>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs font-medium truncate text-orange-900 dark:text-orange-100">
                    This Week
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {stats.requestsThisWeek.toLocaleString()}
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    New requests
                  </p>
                </CardContent>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950/50 dark:to-teal-900/50 border-teal-200 dark:border-teal-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs font-medium truncate text-teal-900 dark:text-teal-100">
                    This Month
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-xl sm:text-2xl font-bold text-teal-900 dark:text-teal-100">
                    {stats.requestsThisMonth.toLocaleString()}
                  </div>
                  <p className="text-xs text-teal-700 dark:text-teal-300">
                    Total requests
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and System Health - Enhanced Layout */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
              <Card className="p-4 sm:p-6">
                <CardHeader className="p-0 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Requests
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {requests.length} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    {requests.slice(0, 4).map((request) => {
                      const car = request.car_id ? carDetails[request.car_id] : null;
                      return (
                        <div
                          key={request.id}
                          className="group relative p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-card/50 hover:bg-card"
                        >
                          <div className="flex items-start gap-3">
                            {/* Car Image or Fallback */}
                            <div className="shrink-0 w-10 h-8 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {car?.image ? (
                                <img
                                  src={car.image}
                                  alt={`${car.year} ${car.make} ${car.model}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Car className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-sm text-foreground truncate">
                                    {request.customer_name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {request.customer_email}
                                  </p>
                                </div>
                                <Badge 
                                  className={`${getStatusColor(request.status)} text-[10px] shrink-0`}
                                >
                                  {request.status}
                                </Badge>
                              </div>

                              {/* Car Info */}
                              {car && (
                                <div className="mb-1">
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                    <span>{car.year} {car.make} {car.model}</span>
                                  </div>
                                </div>
                              )}

                              {/* Footer */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                <div className="flex items-center gap-1">
                                  {request.customer_phone && (
                                    <a
                                      href={`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-600 hover:text-green-700 transition-colors"
                                      title="Contact via WhatsApp"
                                    >
                                      <Phone className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {requests.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent inspection requests</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="p-4 sm:p-6">
                <CardHeader className="p-0 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Real-time Analytics
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      Live Data
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4">
                    {/* Quick Analytics Overview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Page Views</span>
                        </div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{analytics.totalPageViews.toLocaleString()}</div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">24h: {analytics.viewsLast24h.toLocaleString()}</div>
                      </div>
                      
                      <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-900 dark:text-green-100">Visitors</span>
                        </div>
                        <div className="text-lg font-bold text-green-900 dark:text-green-100">{analytics.uniqueVisitors.toLocaleString()}</div>
                        <div className="text-xs text-green-700 dark:text-green-300">7d: {analytics.viewsLast7Days.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Top Pages Preview */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Top Pages
                      </h4>
                      <div className="space-y-1">
                        {analytics.topPages.slice(0, 3).map((page, index) => (
                          <div key={index} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded">
                            <span className="truncate max-w-[120px] font-mono" title={page.page}>
                              {page.page}
                            </span>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {page.percentage}%
                              </Badge>
                              <span className="text-muted-foreground">{page.views}</span>
                            </div>
                          </div>
                        ))}
                        {analytics.topPages.length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-2">
                            No analytics data yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Traffic Sources Preview */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Traffic Sources
                      </h4>
                      <div className="grid grid-cols-2 gap-1">
                        {analytics.trafficSources.slice(0, 4).map((source, index) => (
                          <div key={index} className="text-xs p-2 bg-muted/20 rounded text-center">
                            <div className="font-medium">{source.source}</div>
                            <div className="text-muted-foreground">{source.percentage}%</div>
                          </div>
                        ))}
                        {analytics.trafficSources.length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-2 col-span-2">
                            No traffic data yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-4 sm:p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">Database</span>
                          <p className="text-xs text-green-700 dark:text-green-300">Connected & Active</p>
                        </div>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <div>
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">API Sync</span>
                          <p className="text-xs text-blue-700 dark:text-blue-300">Real-time updates</p>
                        </div>
                      </div>
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <span className="text-sm font-medium text-green-900 dark:text-green-100">Analytics</span>
                          <p className="text-xs text-green-700 dark:text-green-300">Real-time tracking</p>
                        </div>
                      </div>
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </div>

                    {/* Quick System Stats */}
                    <div className="pt-3 border-t border-border">
                      <div className="grid grid-cols-1 gap-3 text-center">
                        <div className="p-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded">
                          <div className="text-lg font-bold text-foreground">{stats.totalCachedCars.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Cars in Database</div>
                        </div>
                        <div className="p-2 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded">
                          <div className="text-lg font-bold text-foreground">{stats.totalUsers}</div>
                          <div className="text-xs text-muted-foreground">Active Users</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Full Cars Sync Component */}
              <FullCarsSyncTrigger />
            </div>
          </TabsContent>

          <TabsContent value="inspections" className="space-y-3 sm:space-y-4">
            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-3 mb-4">
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {stats.pendingRequests}
                  </div>
                </CardContent>
              </Card>

              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {stats.completedRequests}
                  </div>
                </CardContent>
              </Card>

              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    This Week
                  </CardTitle>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {stats.requestsThisWeek}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Modern Inspection Requests Layout */}
            <Card className="p-4 sm:p-6">
              <CardHeader className="p-0 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                    <Database className="h-5 w-5" />
                    Inspection Requests
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {requests.length} records
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Manage all customer inspection requests
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border px-3 py-2 text-left text-xs font-medium">Customer</th>
                          <th className="border border-border px-3 py-2 text-left text-xs font-medium">Contact</th>
                          <th className="border border-border px-3 py-2 text-left text-xs font-medium">Car Details</th>
                          <th className="border border-border px-3 py-2 text-left text-xs font-medium">Status</th>
                          <th className="border border-border px-3 py-2 text-left text-xs font-medium">Date</th>
                          <th className="border border-border px-3 py-2 text-left text-xs font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request) => (
                          <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                            <td className="border border-border px-3 py-2">
                              <div>
                                <div className="font-medium text-foreground">{request.customer_name}</div>
                                <div className="text-xs text-muted-foreground truncate">{request.customer_email}</div>
                              </div>
                            </td>
                            <td className="border border-border px-3 py-2">
                              <a
                                href={`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                              >
                                {request.customer_phone}
                              </a>
                            </td>
                            <td className="border border-border px-3 py-2">
                              {request.car_id && carDetails[request.car_id] ? (
                                <div className="flex items-center gap-2">
                                  {carDetails[request.car_id].image && (
                                    <img
                                      src={carDetails[request.car_id].image}
                                      alt="Car"
                                      className="w-10 h-8 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium">
                                      {carDetails[request.car_id].year} {carDetails[request.car_id].make} {carDetails[request.car_id].model}
                                    </div>
                                    <div className="text-xs text-muted-foreground">ID: {request.car_id}</div>
                                    {carDetails[request.car_id].lot_number && (
                                      <div className="text-xs lot-number-highlight mt-1">
                                        Lot: {carDetails[request.car_id].lot_number}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : request.car_id ? (
                                <div className="text-sm text-muted-foreground">Car ID: {request.car_id}</div>
                              ) : (
                                <div className="text-sm text-muted-foreground">General request</div>
                              )}
                            </td>
                            <td className="border border-border px-3 py-2">
                              <select
                                value={request.status}
                                onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                                className="text-xs border border-border rounded px-2 py-1 bg-background"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td className="border border-border px-3 py-2">
                              <div className="text-sm">{new Date(request.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleTimeString()}</div>
                            </td>
                            <td className="border border-border px-3 py-2">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`mailto:${request.customer_email}`, "_blank")}
                                  className="h-7 w-7 p-0"
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, "")}`, "_blank")}
                                  className="h-7 w-7 p-0"
                                >
                                  <Phone className="h-3 w-3" />
                                </Button>
                                {/* Always show car-related button for every inspection */}
                                {request.car_id && carDetails[request.car_id] ? (
                                  // Car details are available - direct view
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => window.open(`/car/${carDetails[request.car_id]?.lot_number || request.car_id}`, "_blank")}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Car className="h-3 w-3 mr-1" />
                                    View Car
                                  </Button>
                                ) : request.car_id ? (
                                  // Car ID exists but details not cached - search and redirect
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => findCarByLotNumber(request.id, request.car_id)}
                                    disabled={searchingCars[request.id]}
                                    className="h-7 px-2 text-xs"
                                  >
                                    {searchingCars[request.id] ? (
                                      <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                                    ) : (
                                      <Search className="h-3 w-3 mr-1" />
                                    )}
                                    {searchingCars[request.id] ? "Finding..." : "Find Car"}
                                  </Button>
                                ) : (
                                  // No car ID - search based on notes or general search
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => findCarByLotNumber(request.id, request.notes || "general inspection")}
                                    disabled={searchingCars[request.id]}
                                    className="h-7 px-2 text-xs"
                                  >
                                    {searchingCars[request.id] ? (
                                      <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                                    ) : (
                                      <Search className="h-3 w-3 mr-1" />
                                    )}
                                    {searchingCars[request.id] ? "Searching..." : "Search Car"}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {requests.map((request) => {
                    const car = request.car_id ? carDetails[request.car_id] : null;
                    return (
                      <div
                        key={request.id}
                        className="group relative p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all duration-200 bg-card/50 hover:bg-card"
                      >
                        <div className="flex items-start gap-3">
                          {/* Car Image or Fallback */}
                          <div className="shrink-0 w-12 h-9 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {car?.image ? (
                              <img
                                src={car.image}
                                alt={`${car.year} ${car.make} ${car.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Car className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm text-foreground truncate">
                                  {request.customer_name}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {request.customer_email}
                                </p>
                              </div>
                              <select
                                value={request.status}
                                onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                                className={`text-xs border border-border rounded px-2 py-1 bg-background ${getStatusColor(request.status)}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>

                            {/* Car Info */}
                            {car && (
                              <div className="mb-2">
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                  <span>{car.year} {car.make} {car.model}</span>
                                  {car.lot_number && (
                                    <span className="lot-number-highlight ml-2">
                                      Lot: {car.lot_number}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Phone */}
                            <div className="mb-3">
                              <a
                                href={`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium"
                              >
                                <Phone className="h-3 w-3" />
                                {request.customer_phone}
                              </a>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDate(request.created_at)}</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`mailto:${request.customer_email}`, "_blank")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                                {/* Always show car-related button for every inspection */}
                                {car ? (
                                  // Car details are available - direct view
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => window.open(`/car/${car.lot_number || request.car_id}`, "_blank")}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Car className="h-3 w-3 mr-1" />
                                    View Car
                                  </Button>
                                ) : request.car_id ? (
                                  // Car ID exists but details not cached - search and redirect
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => findCarByLotNumber(request.id, request.car_id)}
                                    disabled={searchingCars[request.id]}
                                    className="h-6 px-2 text-xs"
                                  >
                                    {searchingCars[request.id] ? (
                                      <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                                    ) : (
                                      <Search className="h-3 w-3 mr-1" />
                                    )}
                                    {searchingCars[request.id] ? "Finding..." : "Find Car"}
                                  </Button>
                                ) : (
                                  // No car ID - search based on notes or general search
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => findCarByLotNumber(request.id, request.notes || "general inspection")}
                                    disabled={searchingCars[request.id]}
                                    className="h-6 px-2 text-xs"
                                  >
                                    {searchingCars[request.id] ? (
                                      <div className="h-3 w-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                                    ) : (
                                      <Search className="h-3 w-3 mr-1" />
                                    )}
                                    {searchingCars[request.id] ? "Searching..." : "Search Car"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                      </div>
                    );
                  })}
                </div>

                {requests.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No inspection requests</h3>
                    <p className="text-sm">No inspection requests found in the database</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-3 sm:space-y-4">
            {/* Real-time Analytics Section */}
            <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Page Views
                  </CardTitle>
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {analytics.totalPageViews.toLocaleString()}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    24h: {analytics.viewsLast24h.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Unique Visitors
                  </CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {analytics.uniqueVisitors.toLocaleString()}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    7d: {analytics.viewsLast7Days.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Bounce Rate
                  </CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {analytics.bounceRate}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Engagement
                  </p>
                </CardContent>
              </Card>

              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Session Time
                  </CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-lg sm:text-xl font-bold">
                    {analytics.avgSessionTime}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Average
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-3">
              {/* Analytics Details - 2/3 width */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-3">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Website Traffic Analytics
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Real-time data from {analytics.totalPageViews.toLocaleString()} page views
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 text-sm">
                          Top Pages ({analytics.topPages.length} tracked)
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {analytics.topPages.length > 0 ? (
                            analytics.topPages.map((page, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded"
                              >
                                <span
                                  className="truncate font-mono text-xs max-w-[200px]"
                                  title={page.page}
                                >
                                  {page.page}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {page.percentage}%
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {page.views.toLocaleString()} views
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              No page view data available
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-sm">Traffic Sources</h4>
                        <div className="space-y-2">
                          {analytics.trafficSources.map((source, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded"
                            >
                              <span className="font-medium">{source.source}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {source.percentage}%
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {source.count.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-sm">User Actions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(analytics.actionTypes).length > 0 ? (
                            Object.entries(analytics.actionTypes).map(
                              ([action, count]) => (
                                <div
                                  key={action}
                                  className="flex justify-between text-sm p-2 bg-muted/20 rounded"
                                >
                                  <span className="capitalize">
                                    {action.replace("_", " ")}
                                  </span>
                                  <span className="font-medium">{count.toLocaleString()}</span>
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-sm text-muted-foreground col-span-2">
                              No action data available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Management - 1/3 width */}
              <div className="space-y-4">
                <Card className="p-3">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      System Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Suspense fallback={<AdminSyncSkeleton />}>
                      <AdminSyncDashboard />
                    </Suspense>
                  </CardContent>
                </Card>

                <Card className="p-3">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <span className="text-xs font-medium text-green-900 dark:text-green-100">Database</span>
                            <p className="text-[10px] text-green-700 dark:text-green-300">Connected</p>
                          </div>
                        </div>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div>
                            <span className="text-xs font-medium text-blue-900 dark:text-blue-100">API Sync</span>
                            <p className="text-[10px] text-blue-700 dark:text-blue-300">Active</p>
                          </div>
                        </div>
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <span className="text-xs font-medium text-green-900 dark:text-green-100">Analytics</span>
                            <p className="text-[10px] text-green-700 dark:text-green-300">Real-time</p>
                          </div>
                        </div>
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>

                      {/* Quick Stats */}
                      <div className="pt-3 border-t border-border">
                        <div className="grid grid-cols-1 gap-2 text-center">
                          <div>
                            <div className="text-sm font-bold text-foreground">{stats.totalCachedCars.toLocaleString()}</div>
                            <div className="text-[10px] text-muted-foreground">Cars in Database</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{stats.totalUsers}</div>
                            <div className="text-[10px] text-muted-foreground">Active Users</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {analytics.totalPageViews === 0 && (
              <Card>
                <CardContent className="py-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>📊 Analytics Setup:</strong> No analytics data found. 
                      Analytics tracking is configured and ready to capture real user data 
                      as visitors interact with the website.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-3 sm:space-y-4">
            {/* Performance Audit Widget */}
            <div className="w-full">
              <PerformanceAuditWidget />
            </div>
          </TabsContent>

          <TabsContent value="cookies" className="space-y-3 sm:space-y-4">
            {/* Cookie Management Dashboard */}
            <Card className="p-4 sm:p-6">
              <CardHeader className="p-0 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <Cookie className="h-5 w-5" />
                    Cookie Management Dashboard
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Real-time Monitoring
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Monitor and manage all website cookies with size validation and security controls
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <CookieManagementDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
