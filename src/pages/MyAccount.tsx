import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Shield, LogOut, Home, ArrowLeft } from "lucide-react";

const MyAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // Check if user is admin using server-side validation
      try {
        const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');
        if (!adminError) {
          setIsAdmin(adminCheck || false);
        } else {
          console.error('Admin check error:', adminError);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin check failed:', error);
        setIsAdmin(false);
      }

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name || '');
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "U Dolët",
      description: "U dolët me sukses nga llogaria juaj",
    });
    navigate('/');
  };

  const updateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName,
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Profili u përditësua",
        description: "Profili juaj u përditësua me sukses",
      });
    } catch (error) {
      toast({
        title: "Gabim",
        description: "Dështoi përditësimi i profilit",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Po ngarkohet llogaria juaj...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-responsive py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Llogaria Ime</h1>
            <p className="text-muted-foreground">Menaxhoni informacionet e llogarisë suaj</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Kryefaqja
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Dilni
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informacionet e Profilit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={user.email} 
                  disabled 
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="displayName">Emri për Shfaqje</Label>
                <Input 
                  id="displayName" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Shkruani emrin tuaj për shfaqje"
                />
              </div>

              <Button onClick={updateProfile} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Përditëso Profilin
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Veprimet e Llogarisë
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Admin Dashboard Button - Only for admins */}
              {isAdmin && (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                  <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Administratori
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ju keni privilegje administratori për këtë aplikacion.
                  </p>
                  <Button 
                    onClick={() => navigate('/admin')} 
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Paneli i Administratorit
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Veprime të Shpejta</h3>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/favorites')} 
                  className="w-full"
                >
                  Shikoni Makinat e Preferuara
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/catalog')} 
                  className="w-full"
                >
                  Shfletoni Makinat
                </Button>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold text-foreground mb-3">Informacionet e Llogarisë</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Krijuar: {new Date(user.created_at).toLocaleDateString()}</p>
                  <p>Kyçja e Fundit: {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString()}</p>
                  {profile && (
                    <p>Profili u Përditësua: {new Date(profile.updated_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;