import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AuthLogin = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login for:', email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Authentication error:', error);
        throw error;
      }

      console.log('Authentication successful, user:', authData.user?.email);

      // Check if user has admin role
      console.log('Checking admin role...');
      const { data: roleData, error: roleError } = await supabase
        .rpc('is_admin');

      console.log('Admin role check result:', { roleData, roleError });

      if (roleError) {
        console.error('Role check error:', roleError);
        
        // Don't immediately sign out on role check error - could be a temporary issue
        toast({
          title: "Role Check Failed",
          description: `Could not verify admin permissions: ${roleError.message}. Please try again or contact support.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!roleData) {
        console.log('User is not an admin, signing out');
        await supabase.auth.signOut();
        throw new Error('Access denied: Admin privileges required. Please contact support if you believe this is an error.');
      }

      console.log('Admin access granted');
      toast({
        title: "Welcome Admin!",
        description: "Successfully logged in to admin dashboard",
      });

      // Call the success callback if provided
      onLoginSuccess();
      
      // Redirect admin users to dashboard
      navigate('/admin');
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      
      // Provide more helpful error messages
      if (errorMessage?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage?.includes('Failed to fetch')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      } else if (errorMessage?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before logging in.';
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <p className="text-muted-foreground">
            Enter your credentials to continue
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Default admin credentials:</p>
            <p className="font-mono">admin@korauto.com</p>
            <p className="font-mono">KorAuto2024!</p>
            <p className="text-xs mt-2">
              Having issues? Check the{" "}
              <a 
                href="https://github.com/Rob013/korauto/blob/main/ADMIN_LOGIN_FIX.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Admin Login Fix Guide
              </a>
            </p>
          </div>
          
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthLogin;