import { Button } from "@/components/ui/button";
import { Car, Heart, Menu, X, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check authentication state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthClick = () => {
    if (user) {
      navigate('/account');
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-sm border-b border-border sticky top-0 z-50">
      {/* Main header */}
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hidden sm:block">
              KORAUTO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-foreground hover:text-primary font-medium transition-colors hover:scale-105 duration-200"
            >
              Kryefaqja
            </Link>
            <Link 
              to="/catalog" 
              className="text-foreground hover:text-primary font-medium transition-colors hover:scale-105 duration-200"
            >
              Katalogu
            </Link>
            <Link 
              to="/inspections" 
              className="text-foreground hover:text-primary font-medium transition-colors hover:scale-105 duration-200"
            >
              Inspektimet
            </Link>
            <Link 
              to="/favorites" 
              className="text-foreground hover:text-primary font-medium transition-colors hover:scale-105 duration-200 flex items-center gap-1"
            >
              <Heart className="h-4 w-4" />
              Favorites
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden focus-enhanced"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAuthClick}
                className="btn-enhanced focus-enhanced flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {user ? 'Llogaria Ime' : 'Llogaria Ime'}
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Kryefaqja
              </Link>
              <Link 
                to="/catalog" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Katalogu
              </Link>
              <Link 
                to="/inspections" 
                className="text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inspektimet
              </Link>

              {/* Contact Info for Mobile */}
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span>📞</span>
                    <span>+38348181116</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span>✉️</span>
                    <span>INFO.RGSHPK@gmail.com</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span>📍</span>
                    <span>Rr. Ilaz Kodra 70, Prishtinë</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <span>🕒</span>
                    <span>9:00-18:00</span>
                  </div>
                </div>
              </div>

              <Link 
                to="/favorites" 
                className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart className="h-4 w-4" />
                Favorites
              </Link>
              <button 
                className="flex items-center gap-2 text-foreground hover:text-primary font-medium transition-colors py-2 px-3 rounded-md hover:bg-primary/10 w-full text-left"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleAuthClick();
                }}
              >
                <User className="h-4 w-4" />
                {user ? 'Llogaria Ime' : 'Llogaria Ime'}
              </button>
              
              {/* Mobile CTA Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/catalog");
                  }}
                >
                  Shiko Makinat
                </Button>
                <Button 
                  size="sm" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.open('https://wa.me/38348181116', '_blank');
                  }}
                >
                  Kontakto WhatsApp
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;