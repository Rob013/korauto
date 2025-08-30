import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogIn, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRememberLogin } from "@/hooks/useRememberLogin";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { rememberedEmail, isRemembered, rememberLogin, forgetLogin, loading: rememberLoading } = useRememberLogin();

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize email field with remembered email if available
  useEffect(() => {
    if (!rememberLoading && isRemembered && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [rememberedEmail, isRemembered, rememberLoading]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) throw error;

      // Send custom confirmation email
      if (data.user && !data.user.email_confirmed_at) {
        try {
          await supabase.functions.invoke('send-confirmation-email', {
            body: {
              email,
              display_name: displayName,
              confirmation_url: `${window.location.origin}/auth/confirm?token=${data.user.id}&type=signup`
            }
          });
          console.log('📧 Confirmation email sent successfully');
        } catch (emailError) {
          console.error('📧 Failed to send confirmation email:', emailError);
          // Don't fail the signup if email sending fails
        }
      }

      toast({
        title: "Llogaria u Krijua! 📧",
        description: "Ju lutemi kontrolloni emailin tuaj për të konfirmuar llogarinë. Kontrolloni edhe dosjen e spam-it.",
      });
    } catch (error: any) {
      toast({
        title: "Regjistimi Dështoi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShowResendConfirmation(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if error is due to email not being confirmed
        if (error.message.includes('email not confirmed') || error.message.includes('signup requires email confirmation')) {
          setShowResendConfirmation(true);
          throw new Error('Ju lutemi konfirmoni emailin tuaj përpara se të hyni. Kontrolloni inbox-in dhe dosjen e spam-it.');
        }
        throw error;
      }

      if (data.user && !data.user.email_confirmed_at) {
        setShowResendConfirmation(true);
        throw new Error('Ju lutemi konfirmoni emailin tuaj përpara se të hyni.');
      }

      toast({
        title: "Mirë se erdhët përsëri!",
        description: "Hyrja u krye me sukses.",
      });
      
      // Save login info if user wants to be remembered
      if (rememberMe) {
        rememberLogin(email, true);
      } else {
        forgetLogin();
      }
      
      // Check if user is admin or specific email and redirect accordingly
      try {
        const { data: adminCheck } = await supabase.rpc('is_admin');
        if (adminCheck || email === '0013rob@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (error) {
        // If role check fails, check email directly
        if (email === '0013rob@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: "Hyrja Dështoi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email i nevojshëm",
        description: "Ju lutemi shkruani emailin tuaj të regjistrimit.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) throw error;

      toast({
        title: "Email konfirmimi u dërgua! 📧",
        description: "Kontrolloni emailin tuaj dhe dosjen e spam-it.",
      });
      
      setShowResendConfirmation(false);
    } catch (error: any) {
      toast({
        title: "Dështoi dërgimi i emailit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Dilni nga llogaria",
      description: "Shihemi sërish së shpejti!",
    });
  };

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Mirë se vini, {user.email}!</CardTitle>
            <p className="text-muted-foreground">Ju jeni të lidhur</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kthehu në Faqen Kryesore
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="w-full"
            >
              Dilni
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Llogaria KORAUTO</CardTitle>
          <p className="text-muted-foreground">
            Hyni ose krijoni një llogari për të ruajtur makinat tuaja të preferuara
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Hyni</TabsTrigger>
              <TabsTrigger value="signup">Regjistrohuni</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email-i"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Fjalëkalimi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me-signin" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label 
                    htmlFor="remember-me-signin" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Më mbaj mend në këtë pajisje
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {loading ? "Po hyni..." : "Hyni"}
                </Button>
                
                {showResendConfirmation && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 mb-2">
                      Nuk keni konfirmuar emailin ende?
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      className="w-full"
                    >
                      Dërgo përsëri emailin e konfirmimit
                    </Button>
                  </div>
                )}
              </form>
              
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Emri për Shfaqje"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email-i"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Fjalëkalimi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? "Po krijohet llogaria..." : "Krijo Llogari"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="text-center mt-4">
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

export default AuthPage;