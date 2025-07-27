import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, Phone, Car, Euro, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AuthLogin from "@/components/AuthLogin";

interface InspectionRequest {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  car_id?: string;
  car_make?: string;
  car_model?: string;
  car_year?: number;
  inspection_fee: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const [requests, setRequests] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
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
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inspection_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load inspection requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchRequests();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sq-AL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard - Inspection Requests</h1>
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
          <Button onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.payment_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.payment_status === 'processing').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{request.customer_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Request ID: {request.id.substring(0, 8)}...
                  </p>
                </div>
                <Badge className={getStatusColor(request.payment_status)}>
                  {request.payment_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{request.customer_phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">€{request.inspection_fee}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {(request.car_make || request.car_model || request.car_year) ? (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {request.car_year} {request.car_make} {request.car_model}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Car details not provided</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {formatDate(request.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(`mailto:${request.customer_email}`, '_blank')}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${request.customer_phone.replace(/[^0-9]/g, '')}`, '_blank')}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No inspection requests found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;