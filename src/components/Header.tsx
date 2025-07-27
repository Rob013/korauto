import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Search, 
  Heart, 
  User as UserIcon, 
  LogOut, 
  LogIn,
  Menu,
  X,
  LayoutDashboard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check current user
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you again soon!",
    });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#003087] text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <Car className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">KORAUTO</h1>
              <p className="text-xs text-blue-200 hidden sm:block">Live Car Auctions</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-white hover:text-primary hover:bg-white/10"
            >
              Home
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/catalog')}
              className="text-white hover:text-primary hover:bg-white/10"
            >
              <Search className="h-4 w-4 mr-2" />
              Browse Cars
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/favorites')}
              className="text-white hover:text-primary hover:bg-white/10"
            >
              <Heart className="h-4 w-4 mr-2" />
              Favorites
            </Button>
          </nav>

          {/* Auth & Mobile */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2">
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/dashboard')}
                    className="text-white hover:text-primary hover:bg-white/10"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="text-white hover:text-primary hover:bg-white/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="text-white hover:text-primary hover:bg-white/10"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>

            <ThemeToggle />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-blue-600">
            <div className="flex flex-col space-y-2 pt-4">
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/');
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-white"
              >
                Home
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/catalog');
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Cars
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  navigate('/favorites');
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-white"
              >
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Button>
              
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMenuOpen(false);
                    }}
                    className="w-full justify-start text-white"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="w-full justify-start text-white"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                  className="w-full justify-start text-white"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;