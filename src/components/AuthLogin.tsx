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

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Login request timed out. Please try again.')), 30000); // 30 second timeout
    });

    try {
      // First, attempt to sign in with Supabase with timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { error: signInError } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (signInError) {
        // Handle specific auth errors
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before logging in.');
        } else if (signInError.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.');
        } else {
          throw new Error(`Login failed: ${signInError.message}`);
        }
      }

      // Check if user has admin role
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      try {
        const rpcPromise = supabase.rpc('is_admin');
        const { data: roleData, error: roleError } = await Promise.race([rpcPromise, timeoutPromise]) as any;

        if (roleError) {
          console.error('Role check error:', roleError);
          // Fall back to email-based admin check if RPC fails
          if (authUser?.email === '0013rob@gmail.com') {
            console.log('Fallback admin check successful for:', authUser.email);
          } else {
            await supabase.auth.signOut();
            throw new Error('Failed to verify admin permissions. Please contact support.');
          }
        } else if (!roleData) {
          // Check if this is the known admin email as fallback
          if (authUser?.email === '0013rob@gmail.com') {
            console.log('Admin access granted via email fallback for:', authUser.email);
          } else {
            await supabase.auth.signOut();
            throw new Error('Access denied: Admin privileges required');
          }
        }
      } catch (adminCheckError: any) {
        console.error('Admin check failed:', adminCheckError);
        // Final fallback for known admin email
        if (authUser?.email === '0013rob@gmail.com') {
          console.log('Emergency admin access granted for:', authUser.email);
        } else {
          await supabase.auth.signOut();
          // Check if it's a network error
          if (adminCheckError.message?.includes('Failed to fetch') || 
              adminCheckError.message?.includes('NetworkError') ||
              adminCheckError.message?.includes('timed out')) {
            throw new Error('Network connection error. Please check your internet connection and try again.');
          }
          throw adminCheckError;
        }
      }

      toast({
        title: "Welcome Admin!",
        description: "Successfully logged in to admin dashboard",
      });

      // Call the success callback to update parent component state
      onLoginSuccess();

      // Redirect admin users to dashboard
      navigate('/admin');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message;
      
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') ||
          error.message?.includes('ERR_NETWORK')) {
        errorMessage = 'Network connection error. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorMessage = 'Login request timed out. Please try again.';
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