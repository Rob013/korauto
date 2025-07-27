import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, 
  Heart, 
  Search, 
  TrendingUp, 
  Eye, 
  Star,
  Settings,
  LogOut,
  Home,
  Bell,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FavoriteCar {
  id: string;
  car_id: string;
  car_make: string;
  car_model: string;
  car_year: number;
  car_price: number;
  car_image: string;
  created_at: string;
}

interface CarView {
  car_id: string;
  viewed_at: string;
}

interface DashboardSettings {
  preferred_makes: string[];
  preferred_price_range: [number, number];
  preferred_year_range: [number, number];
  email_notifications: boolean;
  favorite_searches: any[];
}

const UserDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteCars, setFavoriteCars] = useState<FavoriteCar[]>([]);
  const [recentViews, setRecentViews] = useState<CarView[]>([]);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
    preferred_makes: [],
    preferred_price_range: [0, 100000],
    preferred_year_range: [2000, 2024],
    email_notifications: true,
    favorite_searches: []
  });
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      await loadDashboardData(user.id);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/');
      } else if (session?.user) {
        setUser(session.user);
        loadDashboardData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDashboardData = async (userId: string) => {
    setLoading(true);
    try {
      // Load favorite cars
      const { data: favorites } = await supabase
        .from('favorite_cars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Load recent car views
      const { data: views } = await supabase
        .from('car_views')
        .select('car_id, viewed_at')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(10);

      // Load dashboard settings
      const { data: settings } = await supabase
        .from('user_dashboard_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Load manufacturers for filters
      const { data: manufacturersData } = await supabase
        .from('manufacturers')
        .select('id, name')
        .order('name');

      setFavoriteCars(favorites || []);
      setRecentViews(views || []);
      setManufacturers(manufacturersData || []);
      
      if (settings) {
        const priceRange = settings.preferred_price_range as any;
        const yearRange = settings.preferred_year_range as any;
        
        setDashboardSettings({
          preferred_makes: (settings.preferred_makes as string[]) || [],
          preferred_price_range: priceRange ? [priceRange.lower || 0, priceRange.upper || 100000] : [0, 100000],
          preferred_year_range: yearRange ? [yearRange.lower || 2000, yearRange.upper || 2024] : [2000, 2024],
          email_notifications: settings.email_notifications ?? true,
          favorite_searches: (settings.favorite_searches as any[]) || []
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDashboardSettings = async () => {
    if (!user) return;

    try {
      const settingsData = {
        user_id: user.id,
        preferred_makes: dashboardSettings.preferred_makes,
        preferred_price_range: `[${dashboardSettings.preferred_price_range[0]},${dashboardSettings.preferred_price_range[1]})`,
        preferred_year_range: `[${dashboardSettings.preferred_year_range[0]},${dashboardSettings.preferred_year_range[1]})`,
        email_notifications: dashboardSettings.email_notifications,
        favorite_searches: dashboardSettings.favorite_searches
      };

      const { error } = await supabase
        .from('user_dashboard_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your dashboard preferences have been updated",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Car className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">KORAUTO Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button variant="ghost" onClick={() => navigate('/catalog')}>
                <Search className="h-4 w-4 mr-2" />
                Browse Cars
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Favorite Cars</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{favoriteCars.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Cars saved to favorites
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentViews.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Cars viewed recently
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Saved Searches</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardSettings.favorite_searches.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active search alerts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Price Range</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboardSettings.preferred_price_range[0].toLocaleString()}-${dashboardSettings.preferred_price_range[1].toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your preferred range
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => navigate('/catalog')} className="h-auto flex-col p-6">
                  <Search className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Browse All Cars</span>
                  <span className="text-sm text-muted-foreground">Explore our inventory</span>
                </Button>
                
                <Button variant="outline" onClick={() => navigate('/favorites')} className="h-auto flex-col p-6">
                  <Heart className="h-8 w-8 mb-2" />
                  <span className="font-semibold">My Favorites</span>
                  <span className="text-sm text-muted-foreground">View saved cars</span>
                </Button>
                
                <Button variant="outline" className="h-auto flex-col p-6">
                  <Bell className="h-8 w-8 mb-2" />
                  <span className="font-semibold">Set Alert</span>
                  <span className="text-sm text-muted-foreground">Get notified of new cars</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Favorite Cars ({favoriteCars.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {favoriteCars.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No favorite cars yet</p>
                    <Button onClick={() => navigate('/catalog')} className="mt-4">
                      Browse Cars
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteCars.map((car) => (
                      <Card key={car.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <img
                            src={car.car_image || '/placeholder.svg'}
                            alt={`${car.car_year} ${car.car_make} ${car.car_model}`}
                            className="w-full h-40 object-cover rounded-md mb-3"
                          />
                          <h3 className="font-semibold text-lg">
                            {car.car_year} {car.car_make} {car.car_model}
                          </h3>
                          <p className="text-primary font-bold text-xl">
                            ${car.car_price?.toLocaleString() || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Added {new Date(car.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentViews.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentViews.map((view, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Eye className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Viewed car #{view.car_id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(view.viewed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          View Again
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notifications"
                      checked={dashboardSettings.email_notifications}
                      onCheckedChange={(checked) =>
                        setDashboardSettings(prev => ({ ...prev, email_notifications: checked }))
                      }
                    />
                    <Label htmlFor="notifications" className="text-sm text-muted-foreground">
                      Receive email alerts for new cars matching your preferences
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Car Makes</Label>
                  <Select
                    onValueChange={(value) => {
                      const currentMakes = dashboardSettings.preferred_makes;
                      if (!currentMakes.includes(value)) {
                        setDashboardSettings(prev => ({
                          ...prev,
                          preferred_makes: [...currentMakes, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add preferred makes" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.name}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dashboardSettings.preferred_makes.map((make) => (
                      <Badge key={make} variant="secondary" className="cursor-pointer" onClick={() => {
                        setDashboardSettings(prev => ({
                          ...prev,
                          preferred_makes: prev.preferred_makes.filter(m => m !== make)
                        }));
                      }}>
                        {make} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Price</Label>
                    <Input
                      type="number"
                      value={dashboardSettings.preferred_price_range[0]}
                      onChange={(e) => setDashboardSettings(prev => ({
                        ...prev,
                        preferred_price_range: [parseInt(e.target.value) || 0, prev.preferred_price_range[1]]
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Price</Label>
                    <Input
                      type="number"
                      value={dashboardSettings.preferred_price_range[1]}
                      onChange={(e) => setDashboardSettings(prev => ({
                        ...prev,
                        preferred_price_range: [prev.preferred_price_range[0], parseInt(e.target.value) || 100000]
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Year</Label>
                    <Input
                      type="number"
                      value={dashboardSettings.preferred_year_range[0]}
                      onChange={(e) => setDashboardSettings(prev => ({
                        ...prev,
                        preferred_year_range: [parseInt(e.target.value) || 2000, prev.preferred_year_range[1]]
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Year</Label>
                    <Input
                      type="number"
                      value={dashboardSettings.preferred_year_range[1]}
                      onChange={(e) => setDashboardSettings(prev => ({
                        ...prev,
                        preferred_year_range: [prev.preferred_year_range[0], parseInt(e.target.value) || 2024]
                      }))}
                    />
                  </div>
                </div>

                <Button onClick={saveDashboardSettings} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;